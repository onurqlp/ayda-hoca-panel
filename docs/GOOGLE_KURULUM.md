# Google Apps Script: GitHub arayüzü bağlantısı

Bu projede **arayüz (Index.html) GitHub'da**, **Code.gs Google Apps Script'te** bulunur.
Google Apps Script'teki mevcut `Code.gs` dosyasını SİLMEYİN. Yalnızca en üstteki
`doGet()` fonksiyonunun tamamını aşağıdakiyle değiştirin:

```javascript
function doGet() {
  const url = 'https://raw.githubusercontent.com/onurqlp/ayda-hoca-panel/main/apps-script/Index.html';
  const response = UrlFetchApp.fetch(url, { muteHttpExceptions: true });
  if (response.getResponseCode() !== 200) {
    throw new Error('GitHub arayüzü yüklenemedi (HTTP ' + response.getResponseCode() + ')');
  }
  return HtmlService.createHtmlOutput(response.getContentText('UTF-8'))
    .setTitle('AYDA | Hoca Paneli')
    .addMetaTag('viewport', 'width=device-width, initial-scale=1');
}
```

Ardından: **Dağıt > Dağıtımları yönet > Kalem simgesi > Sürüm: Yeni sürüm > Dağıt**.

**Sonrası:** `src/` içindeki değişiklikler GitHub `main` dalına kaydedildiğinde
GitHub Actions, `apps-script/Index.html` dosyasını otomatik paketler.
Apps Script sayfa yenilemede GitHub'daki güncel HTML'yi getirir.
Arayüz için yeniden Apps Script dağıtımı veya HTML kopyalama gerekmez.
(GitHub CDN önbelleği nedeniyle güncelleme birkaç dakika gecikebilir.)

**Dikkat:** `Code.gs` içindeki `setup`, `api`, `saveWorkEntry_`, `listMonthEntries_`
ve diğer fonksiyonları silmeyin veya değiştirmeyin. Yalnızca `doGet` değişir.
`Index.html` Google Apps Script'te bulunmaya devam edebilir ancak artık kullanılmaz.

## Neden kayıt görünmüyordu?

Google Sheets, `Ders_Kayitlari!C` sütunundaki `2026-10` ay değerini
tarihe çevirip sayısal seri olarak kaydetmişti. Panelde `2026-10` metni
aranınca sonuç çıkmıyordu. **2026-10** mevcut dört kayıtta tekrar metne
çevrildi ve `Ders_Kayitlari!C2:C1000` ile `Odemeler!C2:C1000`
sütunları metin olarak biçimlendirildi. Gelecekte aynı hata oluşmamalı.
