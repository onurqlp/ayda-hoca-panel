# AYDA | Hoca Paneli

Öğretmen kartları, saatlik ücret, aylık ders birimi, ek iş/prim ve ödeme takibi için basit yönetim paneli.

- **Veriler:** [Google Sheets - AYDA Hoca Paneli Verileri](https://docs.google.com/spreadsheets/d/1pgSX6ffuXmBn9mmMjXEcPa1n_O3Vt6XWOJrm99QDRKI/edit)
- **Arayüz:** React + Vite + TypeScript, Google Apps Script HTML olarak yayınlanır.
- **Kaynak kodu:** Bu GitHub deposu. **GitHub Pages / Vercel doğrudan veri kaydetmez.** Gerçek site adresi Apps Script'in oluşturduğu \`/exec\` bağlantısıdır.
- **Gizlilik:** GitHub'a öğretmen telefonları, IBAN'ları, gerçek ödeme kayıtları veya Excel dosyaları eklenmez. Bunlar yalnızca yetkili Google Sheets dosyasında tutulur.

## Kurulum - 5 adım

GitHub Actions her kod değişikliğinde \`apps-script/Index.html\` dosyasını otomatik yeniden oluşturur. **Bilgisayarda npm/node kurmanıza gerek yok.**

1. [Hazır Google Sheet'i açın](https://docs.google.com/spreadsheets/d/1pgSX6ffuXmBn9mmMjXEcPa1n_O3Vt6XWOJrm99QDRKI/edit). İçinde \`Hocalar\` (22 kişi: ana listeden 18, ek çizelgelerden 4), \`Ders_Kayitlari\`, \`Odemeler\`, \`Denetim\`, \`Ayarlar\` sekmeleri var.
2. Google Sheet üzerinden **Uzantılar → Apps Script** açın. Önce var olan \`Code.gs\` metninin tamamını [apps-script/Code.gs](apps-script/Code.gs) ile değiştirin.
3. Apps Script editöründe **+ → HTML** oluşturup adını **Index** koyun. Tam içeriğini [apps-script/Index.html](apps-script/Index.html) dosyasından yapıştırın. GitHub Actions \`Paketle - Google Apps Script\` işleminin yeşil/başarılı olmasını beklemiş olun.
4. Üstte fonksiyon \`setup\` seçilip **Çalıştır** deyin; Google izinlerini onaylayın. Bu fonksiyon Apps Script'i yukarıdaki tabloya bağlar ve sütunları doğrular.
5. **Dağıt → Yeni dağıtım → Tür: Web uygulaması** seçin. **Yürütme: Web uygulamasına erişen kullanıcı**; **Erişim: Google hesabı olan herkes** (hesap sahipliği ve izinler backend'de ayrıca kontrol edilir). Dağıtın. Size verilen \`/exec\` URL'si çalışan paneldir.

**Hoca veya yönetici eklemek:** Google Sheet'i yetkili Google hesabı ile paylaşın. \`Ayarlar\` sekmesindeki \`ALLOWED_EMAILS\` satırına e-posta adresini virgülle ekleyin. Bu kişilerin Google Sheet'e erişmesi de gerekir. İlk kurulumda sadece kayıtlı yetkili adres kullanılabilir.

## Önceden hazırlanan veriler

- 18 öğretmen orijinal \`HOCA.xlsx\` kartından; aylık çizelgelerde görülüp ana listede olmayan 4 isim kontrol notuyla pasif eklendi.
- Telefonlar, banka hesap sahibi ve IBAN'lar **yalnızca Google Sheets'te**, güvenli tarafta tutuldu.
- Bazı hocaların ana listedeki saatlik tarifeleriyle aylık tutarları farklı. İlgili kartların **Notlar** alanına kontrol uyarıları yazıldı. İşlem yapmadan önce birim fiyatları onaylayın.
- Kaynak Mayıs-Kasım sekmelerinin **yılı belli değil**. Bu nedenle **Ders_Kayitlari** ve **Odemeler** içine geçmiş ayları otomatik 2026 diye eklemedik.
- Site açıldıktan sonra **Hocalar → Excel'den Aktar** ekranında kaynak yılı seçin, \`HOCA.xlsx\` dosyasını seçin, ön izleme/uyaşımazlıkları inceleyip aktarın. Kaynak öğretmenler mevcutsa ücretleri otomatik ezilmez. Tekrar yüklenirse aynı kaynak satırı atlanır.
- Kaynaktaki 1/boş ödeme durumu kesin ödeme sayılmaz; **ödendi** kaydı ancak gerçek ödeme girildiğinde oluşur.

## Site menüleri

1. **Panel:** Aylık toplam hakediş, ödenen, kalan, öğretmen bazında durum.
2. **Saat / Ders Girişi:** Grup/özel ders birimi, uygulanan birim ücret, özel fiyat düzeltme gerekçesi, ek ödeme. Geçmiş ücretler değişmez.
3. **Hocalar:** Hoca ekleme/düzenleme, telefon, IBAN, grup/özel ders fiyatı, aktif/pasif, Excel aktarımı.
4. **Ödemeler:** Tam/kısmi ödeme, kayıt düzeltme, Excel/CSV dışa aktarma.

## Sonraki kod güncellemeleri

\`src/\` içindeki React dosyaları düzenlenip \`main\` dalına kaydedildiğinde, GitHub Actions \`Index.html\` paketini yeniden üretir. Sitenin güncellenmesi için Apps Script'teki **Index** dosyasını yenisiyle değiştirip **Dağıtımları yönet → Düzenle → Yeni sürüm** şeklinde tekrar yayınlamak gerekir. \`Code.gs\` değiştiyse onu da güncelleyin.

İsteğe bağlı yerel geliştirme: \`npm ci && npm run build:apps-script\`.

## Notlar

- Ders miktarı henüz kesin 60 dakika varsayılmaz; arayüzde **ders birimi** denir.
- Ek iş, video ve primler ayrı girilebilir; ay içinde bir öğretmen için çok sayıda kayıt olabilir.
- Eski çalışma ve ödemeler silinmez; iptal edilir ve \`Denetim\` sekmesinde değişiklik izi bulunur.
- İnceleme gerektiren eski kayıtlar açık biçimde işaretlenir.
