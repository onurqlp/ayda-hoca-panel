# Google Sheets Backend Migration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** AYDA Hoca Paneli'nin Supabase bağımlılığını kaldırıp Google Sheets + Apps Script kalıcı veri katmanına geçirmek.

**Architecture:** React istemcisi Apps Script HTML Service içinde çalışır ve `google.script.run` üzerinden sunucu fonksiyonlarına ulaşır. Apps Script, bağlı Google Sheet sekmelerinde CRUD, audit ve izin kontrolü uygular.

**Tech Stack:** Vite, React, TypeScript, Google Sheets, Google Apps Script.

**Spec:** `docs/superpowers/specs/2026-10-31-google-sheets-backend-design.md`

## Global Constraints

- Dört ana menü ve mevcut mobil/masaüstü UX korunur.
- Geçmiş ücret snapshot'ları korunur.
- Sheet ID Script Properties'e, izinli e-postalar Sheet'in `Ayarlar` sekmesine kaydedilir.
- HOCA.xlsx gerçek verileri olmadan demo kişi oluşturulmaz.

## Review Focus

- API yanıtları mevcut `Teacher`, `WorkEntry`, `Payment` tipleriyle aynı şekli üretmeli.
- Güncelleme geçmiş satırların ücretini değiştirmemeli.
- Tekrarlanan `source_reference` yeni satır oluşturmamalı.
- Yetkisiz e-posta tüm okuma/yazma eylemlerinde reddedilmeli.
- Çift tıklama aynı istemci istek kimliğiyle mükerrer kayıt oluşturmamalı.

### Task 1: Google Sheet veri deposu

- [x] Beş sekmeli, başlıkları ve veri türleri tanımlı yerel `.xlsx` oluştur.
- [x] Görsel ve yapısal doğrulamadan sonra native Google Sheets'e dönüştür.

### Task 2: Apps Script API

- [x] CRUD, audit, izin kontrolü ve mükerrer istek koruması için Apps Script kodu ekle.
- [x] Kurulum fonksiyonu ile başlık/ayar doğrulamasını sağla.

### Task 3: React veri katmanı geçişi

- [x] Apps Script istemcisini oluştur.
- [x] Supabase Auth ve SDK bağımlılığını kaldır; Google kimlikli Web App yapısına geçir.
- [x] Dört ekranın mevcut veri servislerini yeni API'ye bağla.

### Task 4: Doğrulama ve yayın hazırlığı

- [x] Test ve production build çalıştır.
- [x] README dosyasını Google kurulumu için güncelle.
- [ ] GitHub `main` dalına gönder; kullanıcının yapması gereken Google onaylarını kısa listele.

