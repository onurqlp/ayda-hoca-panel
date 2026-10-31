# AYDA | Hoca Paneli

AYDA yöneticileri için öğretmen, aylık ders hakedişi ve ödeme yönetim paneli. React/Vite arayüzü Supabase Auth ve RLS korumalı Postgres tablolarına bağlanır.

## Kurulum

1. Supabase'te yeni bir proje oluşturun.
2. SQL Editor'da [`supabase/migrations/001_initial.sql`](supabase/migrations/001_initial.sql) dosyasını çalıştırın.
3. Authentication > Users bölümünden yönetici kullanıcılarını davet edin/oluşturun. Uygulamada herkese açık kayıt ekranı yoktur; Supabase'te **Allow new users to sign up** ayarını kapatın.
4. Oluşturduğunuz kullanıcının UUID'sini SQL Editor'da izin listesine ekleyin: `insert into public.app_users (user_id) values ('KULLANICI_UUID');`
5. `.env.example` dosyasını `.env.local` olarak kopyalayıp proje URL'sini ve **publishable/anon** anahtarını girin. `service_role` anahtarını asla tarayıcıya veya GitHub'a koymayın.
6. `npm install && npm run dev` ile yerelde çalıştırın.

## Vercel

- Repoyu Vercel'e bağlayın; framework Vite olarak otomatik algılanır.
- `VITE_SUPABASE_URL` ve `VITE_SUPABASE_ANON_KEY` değişkenlerini Production, Preview ve Development ortamlarına ekleyin.
- Build: `npm run build`, output: `dist`.
- Supabase Authentication > URL Configuration bölümüne Vercel alan adını ekleyin.

## Excel aktarımı

Hocalar > Excel'den Aktar bölümünde dosya yılı zorunlu olarak seçilir. Dosya GitHub'a gönderilmez; tarayıcıda ön izlenir. Kaynak dosya parmak izi + sekme + satır ile mükerrer aktarım engellenir. `1`/boş ödeme işaretleri ve hesap farkları “Kontrol gerekli” olarak korunur.

## Veri ve güvenlik notu

Tüm uygulama tablolarında RLS açıktır; yalnızca Supabase'te oturum açmış ve `app_users` izin listesinde aktif olan kullanıcılar okuyup yazabilir. İlk sürümde tüm yetkili kullanıcılar aynı kurum verisini görür.
