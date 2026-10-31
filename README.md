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
- Hoca silme ve geri getirme; geçmiş hakediş/ödemeler korunur.
- Verileri Yenile düğmesi ve son başarılı Google Sheets okuma saati.
- Grup veya özel ders saati girişi, otomatik hesaplanan aylık hakediş
- **Bir ay sonra ödeme:** Ekim dersleri Kasım ödemesine, Kasım dersleri Aralık ödemesine bağlanır.
- Ödeme ekleme, kısmi ödeme, ödenen ve kalan tutarlar
- Ödemeler sayfasında hoca bazında **Ödendi İşaretle**: kalan tutarın tamamı için işlem oluşturma; kısmi ödemede yalnızca kalan kapatılır. Tarih alanı isteğe bağlıdır ve ödeme ayıyla eşleşmek zorunda değildir.
- Öğretmen bazında aylık özet ve toplamlar
- Panel ve Ödemeler sayfasındaki ay seçimi **ödeme ayıdır**; Ders Girişi'nde **ders ayı** seçilir.
- Sayısal/tarihe dönüşmüş ay değerleri panel tarafından alternatif biçimleriyle okunur.
- Ödendi kaydı yalnızca kullanıcı onay verdiğinde oluşur. Tarih belirtilmezse bugünün tarihi kullanılır; ödeme tarihi ile ödeme dönemi bağımsızdır.
- Geçmiş ayı seçme, kayıt düzenleme, CSV dışa aktarma

## Önemli

`HOCA.xlsx` içindeki kişisel bilgiler **GitHub'a yüklenmez**. Ders ayları
Google Sheets'te `YYYY-AA` biçiminde metin tutulmalıdır. Hatalı dönüştürülmüş
2026-10 ay kayıtları 31.10.2026 tarihinde düzeltildi.

## Ekim arşivi

- [Ekim_Arsiv sekmesi - Google Sheets](https://docs.google.com/spreadsheets/d/1pgSX6ffuXmBn9mmMjXEcPa1n_O3Vt6XWOJrm99QDRKI/edit) kaynak dosyadaki 15 öğretmen satırını içerir.
- Ekim kaynak dosyasının yılı kendi içinde belirtilmiyordu; kullanıcının talimatıyla Ekim **2026** olarak canlı panelde işlendi.
- Kaynak toplam: **37.700 TL ders + 1.050 TL video + 200 TL prim = 38.950 TL**.
- Önceki 4 deneme kaydı (**24.450 TL**) iptal durumuna alındı. Sonradan yeni ders kayıtları ve düzenlemeler yapıldığından **güncel hakediş toplamı sabit değildir**; gerçek güncel tutar panelin son başarılı Google Sheets yenilemesinde görülür.
- Kaynaktaki ödeme işareti `1` gerçek ödeme olarak aktarılmaz.
- Excel kaynak dosyaları, telefon ve banka verileri GitHub'da tutulmaz.
