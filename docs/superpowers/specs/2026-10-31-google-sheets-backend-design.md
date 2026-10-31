# AYDA Hoca Paneli — Google Sheets Backend Tasarımı

## Karar

Supabase kaldırılacak. Kalıcı kayıtlar kullanıcının Google Drive hesabındaki `AYDA Hoca Paneli Verileri` adlı Google Sheet'te tutulacak. React paneli Google Apps Script HTML Service içinde yayınlanacak ve sunucu fonksiyonlarına `google.script.run` ile erişecek.

## Veri Yapısı

- `Hocalar`: öğretmen kartları ve güncel grup/özel ücretleri.
- `Ders_Kayitlari`: ücret snapshot'ı, miktar, tür, ay ve kaynak referansı.
- `Odemeler`: kısmi/tam ödeme satırları.
- `Denetim`: ekleme, güncelleme, silme/pasife alma olayları.
- `Ayarlar`: ders birimi etiketi ve API kurulum bilgileri.

## Erişim

Apps Script Web App yalnızca izin verilen Google e-posta adreslerinden gelen istekleri kabul eder. Silme işlemleri fiziksel silme yerine kayıt durumu/audit ile korunur. Sheet kimliği ilk `setup()` çalıştırmasında Script Properties'e kaydedilir.

## Yaklaşımlar

- Seçilen: Google Sheets + Apps Script içinde barındırılan mevcut React arayüzü. CORS, ayrı OAuth istemcisi ve Vercel bağlantısı gerektirmez.
- Elenen: Tarayıcıdan doğrudan Google Sheets API; OAuth token yönetimi ve istemci gizliliği daha karmaşık.
- Elenen: Vercel servis hesabı; ek Google Cloud anahtarı ve sunucu API katmanı gerektiriyor.

## Sınırlar

- Google Apps Script projesini oluşturma ve ilk Web App yetkilendirmesi Google'ın kullanıcı onayı gerektirebilir.
- Apps Script dağıtımı Google'ın kullanıcı onayı nedeniyle dosya sahibi tarafından bir kez yapılmalıdır.
- HOCA.xlsx henüz sağlanmadığı için gerçek satırlar aktarılmaz; hazır Sheet şeması boş başlar.

