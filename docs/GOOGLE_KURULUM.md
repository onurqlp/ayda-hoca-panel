# AYDA Hoca Paneli — Google tarafını güncelleme

**GitHub arayüzü güncel.** Yeni sürümün Google Apps Script bağlantısında görünmemesi,
Google'ın eski `Index.html` dosyasını sunmasından kaynaklanır.

## Google Apps Script'te yapacağınız tek işlem

1. [AYDA Google Sheets](https://docs.google.com/spreadsheets/d/1pgSX6ffuXmBn9mmMjXEcPa1n_O3Vt6XWOJrm99QDRKI/edit) → **Uzantılar → Apps Script**.
2. `Code.gs` içindeki mevcut **`function doGet()`** fonksiyonunu bulun.
3. **Yalnızca bu fonksiyonun tamamını** aşağıdakiyle değiştirin. `Code.gs` içindeki `api`, `setup`, `saveTeacher_`, `saveWorkEntry_` vb. fonksiyonları **silMEYİN**.
4. **Kaydet → Dağıt → Dağıtımları yönet → Mevcut dağıtımda düzenle (kalem) → Yeni sürüm → Dağıt**.
5. Eski canlı bağlantıyı açın; gerekirse **Ctrl+F5**. Sayfanın üstünde **Verileri Yenile** ve **Arayüz sürümü: [7 karakter]** yazmalıdır. **Hocalar** ekranında çöp kutusu ve **Silinenler** (silinmiş hoca varsa) görünür.

```javascript
function doGet() {
  // GitHub'ın güncel derlemesini her açılışta al; Code.gs yalnızca Google'da kalır.
  const base = 'https://raw.githubusercontent.com/onurqlp/ayda-hoca-panel/main/apps-script/Index.html';
  const url = base + '?fresh=' + Date.now();
  const response = UrlFetchApp.fetch(url, {
    muteHttpExceptions: true,
    followRedirects: true
  });

  if (response.getResponseCode() !== 200) {
    throw new Error('AYDA arayüzü GitHub üzerinden yüklenemedi: HTTP ' + response.getResponseCode());
  }

  return HtmlService.createHtmlOutput(response.getContentText('UTF-8'))
    .setTitle('AYDA | Hoca Paneli')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}
```

**Not:** Bu adımlar mevcut dağıtımı **yeni sürümle günceller**; yeni bir dağıtım
oluşturmanız gerekmez. Kod değişiklikleri GitHub'a `main` olarak gönderilince
GitHub Actions `apps-script/Index.html` dosyasını otomatik derler. Google
`doGet` de sayfa açılışında en güncel sürümü çektiği için her arayüz
değişikliğinde tekrar Google düzenlemesi gerekmez.

## Kontrol

- Üst kısım: **Google Sheets'ten güncellendi · HH:MM:SS**, **Arayüz sürümü: XXXXXXX**, **Verileri Yenile**.
- Hocalar kartlarında: **Düzenle** ve **Sil** simgeleri.
- Hoca silme: geçmiş muhasebe kayıtlarını korur; **Silinenler** bölümünden geri getirilebilir.
- **Ekim dersleri, Kasım ödemelerinde** görünür.
- Mevcut iki **Aylin Sarar** ayrı kayıttır; uygun olanı kullanıcı kontrol edip silebilir.

`Index.html` artık Google projesinde dursa da **kullanılmaz**; `Code.gs`
sadece Google Apps Script'te kalır, GitHub'a yüklenmez.
