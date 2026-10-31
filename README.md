# AYDA | Hoca Paneli

AYDA yöneticileri için öğretmen, aylık ders hakedişi ve ödeme yönetim paneli. React/Vite arayüzü Google Apps Script içinde çalışır; kayıtlar özel Google Sheet'te tutulur.

## Kurulum

Hazır veri dosyası: [AYDA Hoca Paneli Verileri](https://docs.google.com/spreadsheets/d/1pgSX6ffuXmBn9mmMjXEcPa1n_O3Vt6XWOJrm99QDRKI/edit)

1. `npm install && npm run build:apps-script` çalıştırın.
2. Google Sheet'i açıp **Uzantılar → Apps Script** seçin.
3. Editördeki `Code.gs` içeriğini [`apps-script/Code.gs`](apps-script/Code.gs) ile değiştirin.
4. Yeni bir HTML dosyasını `Index` adıyla ekleyip [`apps-script/Index.html`](apps-script/Index.html) içeriğini yapıştırın.
5. Fonksiyon listesinden `setup` seçip **Çalıştır** deyin ve Google izinlerini onaylayın.
6. **Dağıt → Yeni dağıtım → Web uygulaması** seçin. Yürütme türünü **Web uygulamasına erişen kullanıcı**, erişimi **Google hesabı olan herkes** yapın.
7. Dağıtım sonunda verilen `/exec` bağlantısı panel adresidir.

Başka kullanıcı eklemek için Google Sheet'i o kişiyle paylaşın ve `Ayarlar` sekmesindeki `ALLOWED_EMAILS` değerine e-posta adreslerini virgülle ayırarak yazın. Alan boşsa yalnızca dosya sahibi kabul edilir.

## Excel aktarımı

Hocalar → Excel'den Aktar bölümünde dosya yılı zorunlu olarak seçilir. Dosya GitHub'a gönderilmez; tarayıcıda ön izlenir. Kaynak dosya parmak izi + sekme + satır ile mükerrer aktarım engellenir. `1`/boş ödeme işaretleri ve hesap farkları “Kontrol gerekli” olarak korunur.

## Veri ve güvenlik notu

Apps Script Google hesabını ve `ALLOWED_EMAILS` listesini denetler. Silinen ders/ödemeler fiziksel olarak yok edilmez; `cancelled` durumuna alınır ve her değişiklik `Denetim` sekmesine yazılır.
