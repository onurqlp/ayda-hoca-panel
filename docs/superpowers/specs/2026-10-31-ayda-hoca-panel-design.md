# AYDA Hoca Paneli — Tasarım Özeti

## Amaç

AYDA yöneticilerinin öğretmen kartlarını, aylık ders/ek iş hakedişlerini ve kısmi/tam ödemeleri telefondan veya bilgisayardan az tıklamayla yönetebildiği, Supabase üzerinde kalıcı ve yetkisiz erişime kapalı bir panel.

## Kapsam

- Dört ana menü: Panel, Ders Girişi, Hocalar, Ödemeler.
- E-posta/şifre ile Supabase Auth; herkese açık kayıt yok.
- Öğretmen ücretlerinde geçmiş kayıtları değiştirmeyen anlık ücret kopyası.
- Ondalıklı ders birimi, ek işler, bir ayda birden fazla kayıt, kısmi ödeme ve otomatik ödeme durumu.
- Mobil kartlar, masaüstü tablolar, Türkçe/TL biçimi.
- HOCA.xlsx için istemci tarafında ön izleme, eşleşme/belirsizlik kontrolü ve onaylı içe aktarma.

## Kapsam Dışı

- Öğretmen hesabı/portal, CRM, takvim, grafik ağırlıklı raporlama.
- Service-role anahtarının tarayıcıda kullanılması.
- Excel'de yıl belli değilken otomatik yıl seçimi.

## Mimari

Vite + React + TypeScript arayüzü Supabase JS istemcisiyle doğrudan Postgres'e bağlanır. RLS politikaları yalnızca giriş yapmış kullanıcılara erişim verir. `work_entries` satırları uygulanan birim ücreti ve toplamı sakladığı için öğretmen kartındaki sonraki ücret değişiklikleri geçmişi etkilemez. Para hesabı kuruş bazında güvenli yardımcılarla yapılır.

## Yaklaşım Kararı

- Seçilen: Supabase istemci erişimi + RLS; en az altyapıyla cihazlar arası kalıcılık.
- Elenen: Ayrı API katmanı; ilk sürüm için gereksiz işletim yükü.
- Elenen: localStorage/GitHub Pages; kalıcılık ve gizlilik şartını karşılamıyor.

## Kısıtlar ve Varsayımlar

- Repo boş başladı; ana dala doğrudan ilk sürüm gönderimi kullanıcı tarafından “tam yetki, GO” ile onaylandı.
- HOCA.xlsx sağlanmadığı için gerçek kayıtlar taşınmayacak; içe aktarma aracı hazır olacak.
- Supabase proje URL'si ve publishable/anon key verilmediği için migration ve kurulum yönergesi teslim edilecek; canlı veri bağlantısı anahtarlar eklenince açılacak.
- Repo private olmalı; mevcut repo public olduğu için GitHub ayarında ayrıca private yapılması zorunlu.

