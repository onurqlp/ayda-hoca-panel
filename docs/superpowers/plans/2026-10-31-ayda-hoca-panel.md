# AYDA Hoca Paneli Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Supabase tabanlı, dört ekranlı, mobil uyumlu öğretmen hakediş ve ödeme panelini oluşturup GitHub/Vercel yayınına hazır hale getirmek.

**Architecture:** React istemcisi Supabase Auth ve RLS korumalı tablolara doğrudan bağlanır. İş kuralları saf TypeScript yardımcılarında, veri erişimi tek servis modülünde, ekranlar odaklı bileşenlerde tutulur.

**Tech Stack:** Vite, React, TypeScript, Tailwind CSS, Supabase JS, SheetJS, Vitest.

**Spec:** `docs/superpowers/specs/2026-10-31-ayda-hoca-panel-design.md`

## Global Constraints

- Sadece dört ana menü.
- localStorage ana veri kaynağı değildir.
- Service-role anahtarı istemciye girmez.
- Geçmiş ücret snapshot'ları öğretmen ücret güncellemelerinden etkilenmez.
- Ondalıklı ders birimleri korunur; TL hesapları kuruş hassasiyetindedir.
- Gerçek kişisel/finansal veri repoya girmez.

## Review Focus

- Eksik ücretle ders kaydı engellenmeli.
- Ondalıklı miktar ve TL yuvarlama doğru olmalı.
- Ödemeler hakedişi aşarsa uyarı verilmeli.
- Excel yılı kullanıcı onayı olmadan varsayılmamalı.
- Oturumsuz erişimde hiçbir veri sorgulanmamalı.

---

### Task 1: Proje temeli ve kritik iş kuralları

**Files:** `package.json`, Vite/Tailwind yapılandırması, `src/lib/calculations.ts`, `src/lib/validation.ts`, testleri.

- [ ] Para, ödeme durumu, IBAN ve benzer isim davranışları için önce başarısız testleri yaz ve çalıştır.
- [ ] Yardımcıları uygulayıp testleri yeşile getir.
- [ ] Vite/React/TypeScript temelini kur.

### Task 2: Supabase veri modeli ve erişim katmanı

**Files:** `supabase/migrations/001_initial.sql`, `src/lib/supabase.ts`, `src/lib/api.ts`, `src/types.ts`.

- [ ] Auth zorunlu RLS, tablolar, constraint/index ve audit trigger migration'ını ekle.
- [ ] Öğretmen, iş kaydı ve ödeme CRUD servislerini ekle.
- [ ] Ortam değişkeni yokken kurulum ekranına yönlendiren güvenli yapılandırma kontrolü ekle.

### Task 3: Oturum ve dört ana ekran

**Files:** `src/App.tsx`, `src/components/*`, `src/pages/*`, `src/index.css`.

- [ ] Giriş ve yapılandırma ekranlarını oluştur.
- [ ] Panel özetini, mobil kart/masaüstü tablo görünümünü oluştur.
- [ ] Ders girişi, ücret override açıklaması, düzenleme/silme akışını oluştur.
- [ ] Hoca ekleme/düzenleme/pasife alma, IBAN kopyalama ve benzer isim uyarısını oluştur.
- [ ] Kısmi/tam ödeme, aşım uyarısı, düzenleme/iptal ve CSV dışa aktarmayı oluştur.

### Task 4: Excel içe aktarma ve dokümantasyon

**Files:** `src/lib/importExcel.ts`, `src/components/ExcelImporter.tsx`, `README.md`, `.env.example`, `.gitignore`.

- [ ] SheetJS ile sekmeleri ön izleyen, yıl seçtiren ve belirsiz satırları işaretleyen akışı ekle.
- [ ] Dosya parmak izi/source_reference ile yinelenen yüklemeyi engelle.
- [ ] Kurulum, Supabase admin oluşturma, migration ve Vercel env adımlarını belgele.

### Task 5: Doğrulama ve yayın

- [ ] Kritik testleri ve production build'i çalıştır.
- [ ] Repo dosyalarını tek commit halinde GitHub `main` dalına gönder.
- [ ] Vercel Git bağlantısı ve env kurulumu mümkünse tamamla; eksik yetki/anahtar varsa somut blocker olarak bildir.

