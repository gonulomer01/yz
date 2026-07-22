# Melikgazi Belediyesi — Yapay Zeka Görsel Üretim ve Yönetim Platformu

**Melikgazi Belediyesi YZ Platformu**, modern **.NET 10 ASP.NET Core MVC** altyapısıyla geliştirilmiş, çoklu yapay zeka motorunu tek bir merkezi arayüz üzerinden yöneten, yarı şeffaf (*Glassmorphism*) şık bir tasarıma ve çift yönlü dosya-veritabanı senkronizasyonuna sahip gelişmiş bir kurumsal görsel otomasyon sistemidir.

---

## 🌟 Öne Çıkan Özellikler ve Mimari

### 1. 🚀 Çoklu AI Üretimi ve Web Otomasyonu (Gemini + ChatGPT + Copilot)
Platform, farklı ihtiyaç ve bütçe senaryolarına uygun çoklu yapay zeka motorunu destekler:

- **🚀 Üçlü AI Üretim Modu (Gemini + ChatGPT + Copilot):**
  - Tek bir prompt ile aynı anda 3 farklı AI platformundan (**Google Gemini Web**, **ChatGPT DALL-E**, **Microsoft Copilot DALL-E 3**) paralel görsel üretilir.
  - Sonuçlar 3'lü karşılaştırma kartı olarak sunulur, tek tıkla toplu olarak indirilebilir ve Görsel Arşivi'nde gruplandırılarak saklanır.
- **🤖 Selenium Çoklu Hesap Rotasyon Modu:**
  - Arka planda gizli Chrome profillerini (`GeminiChromeProfile_*`, `ChatGptChromeProfile_*`, `CopilotChromeProfile_*`) yöneterek yapay zeka platformlarının web arayüzleri üzerinden görsel üretir.
  - Bir hesabın günlük kotası dolduğunda sistem otomatik olarak sıradaki aktif hesaba geçiş yapar (Akıllı Rotasyon).
  - *Sınırsız Anlık İptal ("Durdur"):* "Oluştur" butonuna tekrar basıldığında arka planda çalışan ve sıradaki tüm Chrome sürücüleri ile arka plan işlemleri anında engellenir ve kapatılır.
- **💳 Stability AI (Kredili Modeller):**
  - `SDXL 1.0 (~1 Kredi)`, `Stable Image Core (3 Kredi)`, `SD 3.5 Medium/Large` ve `Stable Image Ultra (8 Kredi)` modelleri.
  - API anahtar havuzu yönetimi ve tek tıkla kısıtlanan anahtarları aktif konuma getirme.
- **🌟 Ücretsiz & Sınırsız FLUX.1 / SDXL Turbo:**
  - Pollinations AI altyapısı üzerinden **FLUX.1 Realism** ve **SDXL Turbo** modellerini sınırsız ve ücretsiz kullanabilme olanağı.

### 2. 🎛️ Bütünleşik Sağ İçerik Alanı & Sekme Yönetimi
Arayüz modal açılır pencereler yerine bütünleşik, tam ekran sağ içerik sekmeleriyle çalışır:
1. **Stüdyo (`#section-studio`):** Prompt girişi, stil/oran seçimi, model tercihleri ve dikey görsel akışı.
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
│   ├── ApiController.cs         # Görsel, anahtar, hesap, profil ve senkronizasyon endpointleri
│   └── HomeController.cs        # Ana sayfa görünüm yönlendiricisi
├── Services/
│   ├── AiGenerationService.cs   # Yapay zeka servis orkestratörü
│   ├── AppServices.cs           # Database, ImageSync ve Credentials servisleri
│   └── MultiAiSeleniumService.cs # Gemini, ChatGPT, Copilot Selenium otomasyonu
├── Models/
│   └── AppModels.cs             # User, GeneratedImage, ApiKey, AppSetting veri modelleri
├── Views/
│   ├── Account/                 # Login ve Register ekranları
│   └── Home/Index.cshtml        # Stüdyo, Yönetim Paneli, Arşiv ve Profil ana ekranı
├── wwwroot/
│   ├── css/style.css            # Glassmorphism stil ve duyarlı tasarım ayarları
│   ├── js/app.js                # Dinamik sekme yönetimi, akış, galeri ve API işlemleri
│   ├── generated-gemini/        # Gemini görselleri (.gitkeep)
│   ├── generated-chatgpt/       # ChatGPT görselleri (.gitkeep)
│   ├── generated-copilot/       # Copilot görselleri (.gitkeep)
│   ├── generated-stability/     # Stability AI görselleri (.gitkeep)
│   └── generated-free/          # Ücretsiz modellerin görselleri (.gitkeep)
├── ai_credentials.template.json # Şablon kimlik yapılandırması
└── Scripts/                     # Paketleme ve senkronizasyon betikleri
```
