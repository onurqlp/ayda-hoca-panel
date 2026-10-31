const SHEETS = {
  teachers: 'Hocalar',
  entries: 'Ders_Kayitlari',
  payments: 'Odemeler',
  audit: 'Denetim',
  settings: 'Ayarlar',
};

const HEADERS = {
  Hocalar: ['id', 'ad_soyad', 'telefon', 'iban', 'hesap_sahibi', 'grup_birim_ucreti', 'ozel_birim_ucreti', 'notlar', 'aktif', 'created_at', 'updated_at'],
  Ders_Kayitlari: ['id', 'teacher_id', 'work_month', 'entry_type', 'description', 'quantity', 'unit_rate_snapshot', 'total_amount', 'rate_override_reason', 'source_type', 'source_reference', 'requires_review', 'created_at', 'updated_at', 'durum', 'request_id'],
  Odemeler: ['id', 'teacher_id', 'payment_month', 'amount', 'paid_at', 'note', 'created_at', 'updated_at', 'durum', 'request_id'],
  Denetim: ['id', 'tablo', 'kayit_id', 'islem', 'kullanici', 'eski_veri', 'yeni_veri', 'tarih'],
  Ayarlar: ['anahtar', 'deger', 'aciklama'],
};

function doGet() {
  return HtmlService.createHtmlOutputFromFile('Index')
    .setTitle('AYDA | Hoca Paneli')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}

function setup() {
  const active = SpreadsheetApp.getActiveSpreadsheet();
  if (!active) throw new Error('Bu kodu AYDA Google Sheet içinden açılan Apps Script projesinde çalıştırın.');
  PropertiesService.getScriptProperties().setProperty('SPREADSHEET_ID', active.getId());
  Object.keys(HEADERS).forEach(function (name) {
    const sheet = active.getSheetByName(name);
    if (!sheet) throw new Error('Eksik sekme: ' + name);
    const actual = sheet.getRange(1, 1, 1, HEADERS[name].length).getDisplayValues()[0];
    if (actual.join('|') !== HEADERS[name].join('|')) throw new Error(name + ' başlıkları beklenen yapıda değil.');
  });
  return 'Kurulum tamamlandı: ' + active.getName();
}

function api(requestJson) {
  const request = JSON.parse(requestJson || '{}');
  const user = authorize_();
  const action = request.action;
  const payload = request.payload || {};
  const actions = {
    listTeachers: function () { return listTeachers_(payload); },
    saveTeacher: function () { return saveTeacher_(payload, user); },
    listMonthEntries: function () { return listMonthEntries_(payload); },
    saveWorkEntry: function () { return saveWorkEntry_(payload, user); },
    deleteWorkEntry: function () { return cancelRow_(SHEETS.entries, payload.id, user); },
    listMonthPayments: function () { return listMonthPayments_(payload); },
    savePayment: function () { return savePayment_(payload, user); },
    deletePayment: function () { return cancelRow_(SHEETS.payments, payload.id, user); },
    sourceReferencesExist: function () { return sourceReferencesExist_(payload); },
  };
  if (!actions[action]) throw new Error('Bilinmeyen işlem: ' + action);
  return actions[action]();
}

function spreadsheet_() {
  const id = PropertiesService.getScriptProperties().getProperty('SPREADSHEET_ID');
  if (!id) throw new Error('Önce Apps Script editöründe setup() fonksiyonunu çalıştırın.');
  return SpreadsheetApp.openById(id);
}

function authorize_() {
  const email = Session.getActiveUser().getEmail();
  if (!email) throw new Error('Google hesabı doğrulanamadı. Web App dağıtımını “Kullanıcı erişiyor” seçeneğiyle yeniden yapın.');
  const settings = rows_(SHEETS.settings);
  const allowedRow = settings.find(function (row) { return row.anahtar === 'ALLOWED_EMAILS'; });
  const allowed = String(allowedRow && allowedRow.deger || '').split(',').map(function (item) { return item.trim().toLowerCase(); }).filter(Boolean);
  if (!allowed.length) {
    const owner = DriveApp.getFileById(spreadsheet_().getId()).getOwner().getEmail().toLowerCase();
    if (email.toLowerCase() !== owner) throw new Error('Ayarlar sekmesindeki ALLOWED_EMAILS alanına bu hesabı ekleyin.');
  } else if (allowed.indexOf(email.toLowerCase()) === -1) {
    throw new Error('Bu Google hesabının panele erişim izni yok.');
  }
  return email;
}

function sheet_(name) {
  const sheet = spreadsheet_().getSheetByName(name);
  if (!sheet) throw new Error('Eksik sekme: ' + name);
  return sheet;
}

function rows_(name) {
  const sheet = sheet_(name);
  if (sheet.getLastRow() < 2) return [];
  const values = sheet.getRange(1, 1, sheet.getLastRow(), sheet.getLastColumn()).getValues();
  const headers = values.shift();
  return values.filter(function (row) { return row.some(function (value) { return value !== ''; }); }).map(function (row, offset) {
    const item = { _row: offset + 2 };
    headers.forEach(function (header, index) { item[header] = serializable_(row[index]); });
    return item;
  });
}

function serializable_(value) {
  return value instanceof Date ? value.toISOString() : value;
}

function appendOrUpdate_(name, data, id) {
  const sheet = sheet_(name);
  const headers = HEADERS[name];
  const existing = id ? rows_(name).find(function (row) { return row.id === id; }) : null;
  const row = headers.map(function (header) { return data[header] === undefined ? '' : data[header]; });
  if (existing) sheet.getRange(existing._row, 1, 1, headers.length).setValues([row]);
  else sheet.appendRow(row);
  return existing || null;
}

function withLock_(callback) {
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try { return callback(); } finally { lock.releaseLock(); }
}

function now_() { return new Date().toISOString(); }

function teacherOut_(row) {
  return {
    id: row.id, name: row.ad_soyad, phone: row.telefon || null, iban: row.iban || null,
    account_holder: row.hesap_sahibi || null, group_rate: numberOrNull_(row.grup_birim_ucreti),
    private_rate: numberOrNull_(row.ozel_birim_ucreti), notes: row.notlar || null,
    active: row.aktif === true || String(row.aktif).toLowerCase() === 'true',
    created_at: row.created_at, updated_at: row.updated_at,
  };
}

function numberOrNull_(value) { return value === '' || value === null ? null : Number(value); }

function listTeachers_(payload) {
  return rows_(SHEETS.teachers).filter(function (row) {
    return payload.includeInactive !== false || row.aktif === true || String(row.aktif).toLowerCase() === 'true';
  }).map(teacherOut_).sort(function (a, b) { return a.name.localeCompare(b.name, 'tr'); });
}

function saveTeacher_(payload, user) {
  if (!String(payload.name || '').trim()) throw new Error('Hoca adı zorunludur.');
  return withLock_(function () {
    const old = payload.id ? rows_(SHEETS.teachers).find(function (row) { return row.id === payload.id; }) : null;
    const timestamp = now_();
    const row = {
      id: payload.id || Utilities.getUuid(), ad_soyad: String(payload.name).trim(), telefon: payload.phone || '',
      iban: payload.iban || '', hesap_sahibi: payload.account_holder || '', grup_birim_ucreti: payload.group_rate === null ? '' : Number(payload.group_rate || 0),
      ozel_birim_ucreti: payload.private_rate === null ? '' : Number(payload.private_rate || 0), notlar: payload.notes || '',
      aktif: payload.active !== false, created_at: old ? old.created_at : timestamp, updated_at: timestamp,
    };
    appendOrUpdate_(SHEETS.teachers, row, payload.id);
    audit_(SHEETS.teachers, row.id, old ? 'guncelle' : 'ekle', user, old, row);
    return teacherOut_(row);
  });
}

function entryOut_(row) {
  return {
    id: row.id, teacher_id: row.teacher_id, work_month: row.work_month, entry_type: row.entry_type,
    description: row.description || null, quantity: Number(row.quantity), unit_rate_snapshot: Number(row.unit_rate_snapshot),
    total_amount: Number(row.total_amount), rate_override_reason: row.rate_override_reason || null,
    source_type: row.source_type || 'manual', source_reference: row.source_reference || null,
    requires_review: row.requires_review === true || String(row.requires_review).toLowerCase() === 'true',
    created_at: row.created_at, updated_at: row.updated_at,
  };
}

function listMonthEntries_(payload) {
  return rows_(SHEETS.entries).filter(function (row) { return row.work_month === payload.month && row.durum !== 'cancelled'; }).map(entryOut_);
}

function saveWorkEntry_(payload, user) {
  return withLock_(function () {
    const all = rows_(SHEETS.entries);
    const duplicate = payload.request_id && all.find(function (row) { return row.request_id === payload.request_id; });
    if (duplicate) return entryOut_(duplicate);
    if (payload.source_reference) {
      const sourceDuplicate = all.find(function (row) { return row.source_reference === payload.source_reference && row.durum !== 'cancelled' && row.id !== payload.id; });
      if (sourceDuplicate) return entryOut_(sourceDuplicate);
    }
    const old = payload.id ? all.find(function (row) { return row.id === payload.id; }) : null;
    const timestamp = now_();
    const row = {
      id: payload.id || Utilities.getUuid(), teacher_id: payload.teacher_id, work_month: payload.work_month,
      entry_type: payload.entry_type, description: payload.description || '', quantity: Number(payload.quantity),
      unit_rate_snapshot: Number(payload.unit_rate_snapshot), total_amount: Number(payload.total_amount),
      rate_override_reason: payload.rate_override_reason || '', source_type: payload.source_type || 'manual',
      source_reference: payload.source_reference || '', requires_review: Boolean(payload.requires_review),
      created_at: old ? old.created_at : timestamp, updated_at: timestamp, durum: 'active', request_id: payload.request_id || '',
    };
    appendOrUpdate_(SHEETS.entries, row, payload.id);
    audit_(SHEETS.entries, row.id, old ? 'guncelle' : 'ekle', user, old, row);
    return entryOut_(row);
  });
}

function paymentOut_(row) {
  return { id: row.id, teacher_id: row.teacher_id, payment_month: row.payment_month, amount: Number(row.amount), paid_at: row.paid_at, note: row.note || null, created_at: row.created_at, updated_at: row.updated_at };
}

function listMonthPayments_(payload) {
  return rows_(SHEETS.payments).filter(function (row) { return row.payment_month === payload.month && row.durum !== 'cancelled'; }).map(paymentOut_);
}

function savePayment_(payload, user) {
  return withLock_(function () {
    const all = rows_(SHEETS.payments);
    const duplicate = payload.request_id && all.find(function (row) { return row.request_id === payload.request_id; });
    if (duplicate) return paymentOut_(duplicate);
    const old = payload.id ? all.find(function (row) { return row.id === payload.id; }) : null;
    const timestamp = now_();
    const row = {
      id: payload.id || Utilities.getUuid(), teacher_id: payload.teacher_id, payment_month: payload.payment_month,
      amount: Number(payload.amount), paid_at: payload.paid_at, note: payload.note || '',
      created_at: old ? old.created_at : timestamp, updated_at: timestamp, durum: 'active', request_id: payload.request_id || '',
    };
    appendOrUpdate_(SHEETS.payments, row, payload.id);
    audit_(SHEETS.payments, row.id, old ? 'guncelle' : 'ekle', user, old, row);
    return paymentOut_(row);
  });
}

function cancelRow_(name, id, user) {
  if (!id) throw new Error('Kayıt kimliği eksik.');
  return withLock_(function () {
    const old = rows_(name).find(function (row) { return row.id === id; });
    if (!old) throw new Error('Kayıt bulunamadı.');
    const updated = Object.assign({}, old, { durum: 'cancelled', updated_at: now_() });
    delete updated._row;
    appendOrUpdate_(name, updated, id);
    audit_(name, id, 'iptal', user, old, updated);
    return true;
  });
}

function sourceReferencesExist_(payload) {
  const wanted = payload.refs || [];
  return rows_(SHEETS.entries).filter(function (row) { return row.durum !== 'cancelled' && wanted.indexOf(row.source_reference) !== -1; }).map(function (row) { return row.source_reference; });
}

function audit_(table, recordId, action, user, oldValue, newValue) {
  sheet_(SHEETS.audit).appendRow([Utilities.getUuid(), table, recordId, action, user, JSON.stringify(oldValue || null), JSON.stringify(newValue || null), now_()]);
}
