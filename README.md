# Mega Image Studio — Yapay Zeka Görsel Üretim ve Yönetim Platformu

**Mega Image Studio**, modern **.NET 10 ASP.NET Core MVC** altyapısıyla geliştirilmiş, çoklu yapay zeka motorunu tek bir merkezi arayüz üzerinden yöneten, yarı şeffaf (*Glassmorphism*) şık bir tasarıma, canlı akışlı (SSE) üçlü üretime, tam ekran görsel inceleyicisine (Lightbox) ve çift yönlü dosya-veritabanı senkronizasyonuna sahip gelişmiş bir kurumsal görsel otomasyon sistemidir.

---

## 🌟 Öne Çıkan Özellikler ve Mimari

### 1. 🚀 Çoklu AI Üretimi, Web Otomasyonu ve Canlı Akış (Gemini + ChatGPT + Copilot)
Platform, farklı ihtiyaç ve bütçe senaryolarına uygun çoklu yapay zeka motorunu destekler:

- **⚡ Canlı Akışlı Üçlü AI Üretim Modu (Gemini + ChatGPT + Copilot):**
  - Tek bir prompt ile aynı anda 3 farklı AI platformundan (**Google Gemini Web**, **ChatGPT DALL-E**, **Microsoft Copilot DALL-E 3**) eşzamanlı görsel üretilir.
  - **Server-Sent Events (SSE) Canlı Akışı:** Görseller üretildikçe canlı olarak stüdyo panelinde belirir; tüm platformların bitmesi beklenmez.
  - **Toplu ZIP & Prompt TXT İndirme:** Üçlü üretim tamamlandığında görseller model isimleriyle (`1_Google_Gemini.png`, `2_ChatGPT_DALLE.png`, `3_Microsoft_Copilot.png`) ve orijinal prompt metnini içeren `prompt.txt` dosyasıyla tek tıkla zip formatında indirilebilir.
- **🤖 Selenium Çoklu Hesap Rotasyon Modu & Otomatik Kapatma:**
  - Arka planda gizli Chrome profillerini (`GeminiChromeProfile_*`, `ChatGptChromeProfile_*`, `CopilotChromeProfile_*`) yöneterek yapay zeka platformlarının web arayüzleri üzerinden görsel üretir.
  - Bir hesabın günlük kotası dolduğunda veya uyarı/limit penceresi belirdiğinde tarayıcı **anında kapatılır** ve sıradaki aktif hesaba otomatik geçiş yapılır (Akıllı Otomatik Rotasyon).
  - *Sınırsız Anlık İptal ("Durdur"):* "İptal Et" butonuna basıldığında arka planda çalışan Chrome sürücüleri anında sonlandırılır.
- **🖼️ Tam Ekran İnceleme & Tekli İndirme (Lightbox):**
  - Stüdyo kartlarında, Görsel Arşivi'nde, Yönetici Kullanıcı Paneli'nde görsellere tıklandığında yüksek çözünürlüklü tam ekran görüntüleyici açılır ve tek tıkla resmi indirme imkanı sunar.
- **💳 Stability AI (Kredili Modeller):**
  - `SDXL 1.0 (~1 Kredi)`, `Stable Image Core (3 Kredi)`, `SD 3.5 Medium/Large` ve `Stable Image Ultra (8 Kredi)` modelleri.
- **🌟 Ücretsiz & Sınırsız FLUX.1 / SDXL Turbo:**
  - Pollinations AI altyapısı üzerinden **FLUX.1 Realism** ve **SDXL Turbo** modellerini sınırsız ve ücretsiz kullanabilme olanağı.

### 2. 🎛️ Bütünleşik Sağ İçerik Alanı & Sekme Yönetimi
Arayüz modal açılır pencereler yerine bütünleşik, tam ekran sağ içerik sekmeleriyle çalışır:
1. **Stüdyo (`#section-studio`):** Prompt girişi, stil/oran seçimi, canlı akışlı üretim ve dikey görsel beslemesi.
2. **Yönetim Paneli (`#section-dashboard` - Sadece Yöneticiler):**
   - **Hesap Yönetimi:** Google Gemini, ChatGPT ve Copilot Chrome hesap profilleri listeleme ve durum sıfırlama.
   - **Key Yönetimi:** Stability AI API anahtar havuzu listeleme, ekleme ve düzenleme.
   - **Kullanıcı Yönetimi:** Kullanıcı ekleme, yetkilendirme (Yönetici/Kullanıcı) ve kullanıcı görsellerini inceleme.
3. **Görsel Arşivi (`#section-gallery`):** `Tümü`, `Üçlü Üretimler`, `Stability AI`, `Gemini Web`, `ChatGPT`, `Copilot` ve `Ücretsiz` sekmeleri.
4. **Bilgileri Güncelle (`#section-profile` - Standart Kullanıcılar):** Kullanıcının ad soyad ve şifre bilgilerini güncellediği entegre profil alanı.

### 3. 🔄 Çift Yönlü Klasör & Veritabanı Senkronizasyonu (`SyncDatabaseWithFilesystem`)
Uygulama, fiziksel dosya sistemi ile veritabanını (`GeneratedImages` tablosu) gerçek zamanlı olarak senkronize eder:
- **Otomatik Temizleme (`Orphan Cleanup`):** Bilgisayardan bir görsel silindiğinde veritabanı kaydı da otomatik silinir; arayüzde kırık görsel kalmaz.
- **Otomatik Tanıma & Akıllı Gruplama (`AutoGroupTripleImages`):** Klasörlere eklenen yeni görseller otomatik algılanır. Aynı zaman diliminde üretilmiş 3'lü üretim görselleri otomatik tespit edilerek Görsel Arşivi'nde gruplandırılır.

---

## 🚀 Sıfırdan Kurulum ve Çalıştırma Rehberi

### 1. Sistem Gereksinimleri
- [.NET 10 SDK](https://dotnet.microsoft.com/download) veya üzeri
- Google Chrome (Gemini, ChatGPT, Copilot otomasyonu için)

### 2. Projeyi Klonlama ve Çalıştırma
Terminal (`PowerShell` veya `CMD`) açarak aşağıdaki komutları çalıştırın:

```bash
# 1. Projeyi bilgisayarınıza klonlayın
git clone https://github.com/gonulomer01/yz.git

# 2. Proje klasörüne girin
cd yz

# 3. Uygulamayı derleyin ve başlatın
dotnet run
```

Uygulama başladığında tarayıcınızdan `http://localhost:5000` (veya gösterilen yerel port) adresine gidin.

---

## 🗄️ Otomatik Veritabanı ve İlk Yönetici (Admin) Hesabı

Projeyi ilk defa çalıştırdığınızda veritabanı ve ilk yönetici hesabı otomatik oluşturulur:

### 🔐 İlk Giriş Bilgileri (Varsayılan Yönetici)
- **Kullanıcı Adı:** `admin`
- **Şifre:** `admin123`

---

## 🔑 API Anahtarları ve Yapılandırma

- Uygulama ilk açılışta `ai_credentials.template.json` şablonundan `ai_credentials.json` dosyasını oluşturur.
- `ai_credentials.json` ve Chrome oturum profilleri `.gitignore` dosyasında korumaya alınmıştır.

---

## 📁 Dosya ve Klasör Yapısı

```text
yz/
│
├── Controllers/
│   ├── AccountController.cs     # Oturum açma, kayıt ve çıkış endpointleri
│   ├── ApiController.cs         # Görsel, anahtar, hesap, SSE canlı akış, profil ve senkronizasyon endpointleri
│   └── HomeController.cs        # Ana sayfa görünüm yönlendiricisi
├── Services/
│   ├── AiGenerationService.cs   # Yapay zeka servis orkestratörü
│   ├── AppServices.cs           # Database, ImageSync ve Credentials servisleri
│   └── MultiAiSeleniumService.cs # Gemini, ChatGPT, Copilot Selenium otomasyonu
├── Models/
│   └── AppModels.cs             # User, GeneratedImage, ApiKey, AppSetting veri modelleri
├── Views/
│   ├── Account/                 # Login ve Register ekranları
│   └── Home/Index.cshtml        # Stüdyo, Yönetim Paneli, Arşiv ve Lightbox ekranları
├── wwwroot/
│   ├── css/style.css            # Glassmorphism stil, canlı kartlar ve duyarlı tasarım ayarları
│   ├── js/app.js                # Dinamik sekme yönetimi, SSE canlı akış, galeri ve Lightbox işlemleri
│   ├── generated-gemini/        # Gemini görselleri (.gitkeep)
│   ├── generated-chatgpt/       # ChatGPT görselleri (.gitkeep)
│   ├── generated-copilot/       # Copilot görselleri (.gitkeep)
│   ├── generated-stability/     # Stability AI görselleri (.gitkeep)
│   └── generated-free/          # Ücretsiz modellerin görselleri (.gitkeep)
├── ai_credentials.template.json # Şablon kimlik yapılandırması
└── Scripts/                     # Paketleme ve senkronizasyon betikleri
```
