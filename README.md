# AYDA Hoca Paneli

Sade öğretmen, ders saati ve ödeme takip uygulaması.

- **Canlı panel:** https://script.google.com/macros/s/AKfycbwH8o3rzmtFgV8FrtEkoor2O9lYdF7nXh02Y44f5aycB3ZWDSktrK5Owne8Ojc1etgfag/exec
- **Veriler:** [Google Sheets](https://docs.google.com/spreadsheets/d/1pgSX6ffuXmBn9mmMjXEcPa1n_O3Vt6XWOJrm99QDRKI/edit)
- **Kurulum:** [Google Apps Script ↔ GitHub bağlantısı](docs/GOOGLE_KURULUM.md)

## Çalışma biçimi

- `src/`: React, TypeScript, arayüz ve hesaplama.
- `apps-script/Index.html`: GitHub Actions tarafından otomatik paketlenmiş arayüz.
- `Code.gs`: **yalnızca Google Apps Script projesinde** bulunur. GitHub'a yüklenmez.
- Hocalar, ücretler, dersler, ödemeler: **yalnızca yetkili Google Sheet'te** tutulur.

GitHub `main` dalına yapılan değişikliklerden sonra paketleme otomatik çalışır.
Google'daki `doGet()` fonksiyonu GitHub'dan son paketlenmiş HTML'yi yüklediği için
arayüz güncellemeleri için tekrar HTML kopyalamak gerekmez.

## Özellikler

- Aktif / pasif öğretmen, öğretmen düzenleme ve ücret tarifeleri
- Grup veya özel ders saati girişi, otomatik hesaplanan aylık hakediş
- Ödeme ekleme, kısmi ödeme, ödenen ve kalan tutarlar
- Öğretmen bazında aylık özet ve toplamlar
- Geçmiş ayı seçme, kayıt düzenleme, CSV dışa aktarma

## Önemli

`HOCA.xlsx` içindeki kişisel bilgiler **GitHub'a yüklenmez**. Ders ayları
Google Sheets'te `YYYY-AA` biçiminde metin tutulmalıdır. Hatalı dönüştürülmüş
2026-10 ay kayıtları 31.10.2026 tarihinde düzeltildi.
