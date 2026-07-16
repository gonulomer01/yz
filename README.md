# Melikgazi Belediyesi — Yapay Zeka Görsel Üretim ve Yönetim Platformu

**Melikgazi Belediyesi YZ Platformu**, modern **.NET 10 ASP.NET Core MVC** altyapısıyla geliştirilmiş, çoklu yapay zeka motorunu tek bir merkezi arayüz üzerinden yöneten, yarı şeffaf (*Glassmorphism*) şık bir tasarıma ve çift yönlü dosya-veritabanı senkronizasyonuna sahip gelişmiş bir kurumsal görsel otomasyon sistemidir.

---

## 🌟 Öne Çıkan Özellikler ve Mimari

### 1. 🤖 Üç Katmanlı Yapay Zeka Üretim Motoru
Platform, farklı ihtiyaç ve bütçe senaryolarına uygun 3 temel yapay zeka motorunu destekler:

- **💳 Stability AI (Kredili Modeller):**
  - `SDXL 1.0 (~1 Kredi)`: Yüksek stabilite ve düşük maliyetli kurumsal görsel üretimi.
  - `Stable Image Core (3 Kredi)`: Gelişmiş detay, aydınlatma ve kompozisyon desteği.
  - *Not:* Güvenlik veya kredi yetersizliği nedeniyle hata üretebilen eski/pahalı modeller sistemden temizlenmiştir.
- **🤖 Google Gemini Web Otomasyonu (Selenium Çoklu Hesap Rotasyonu):**
  - Arka planda Chrome tarayıcı profillerini (`GeminiChromeProfile_1`, `2`, `3`) yöneterek Google Gemini'nin web arayüzü üzerinden görsel üretir.
  - Bir hesabın günlük kotası dolduğunda sistem otomatik olarak sıradaki aktif Google hesabına geçiş yapar (Akıllı Rotasyon).
- **🌟 Ücretsiz & Sınırsız FLUX.1 / SDXL Turbo:**
  - Pollinations AI altyapısı üzerinden **FLUX.1 Realism**, **FLUX.1 Schnell** ve **SDXL Turbo** modellerini sınırsız ve ücretsiz kullanabilme olanağı.

### 2. 🔄 Çift Yönlü Klasör & Veritabanı Senkronizasyonu (`SyncDatabaseWithFilesystem`)
Uygulama, fiziksel dosya sistemi ile veritabanını (`GeneratedImages` tablosu) gerçek zamanlı olarak senkronize eder:
- **Otomatik Temizleme (`Orphan Cleanup`):** Bilgisayarınızdan veya sunucudan fiziksel bir görsel dosyasını sildiğinizde, arayüzdeki veritabanı kaydı da otomatik olarak silinir; arayüzde resimsiz, kırık kalıntılar kalmaz.
- **Otomatik Tanıma (`File Discovery`):** Dışarıdan `wwwroot/generated-stability/`, `wwwroot/generated-gemini/`, `wwwroot/generated-free/` veya `wwwroot/generated/` klasörlerine yeni bir `.png`, `.jpg` veya `.webp` dosyası eklediğinizde, sistem bunu anında algılar, veritabanına kaydeder ve arayüzde listeler.

### 3. 🖼️ Görsel Arşivi Sekmeleri & Dikey Akış (`Studio Feed`)
- **Görsel Arşivi Paneli:** `Tümü`, `Stability AI`, `Gemini Web` ve `Ücretsiz` sekmelerine ayrılmıştır. Panel üstündeki **"Klasörleri Tara & Senkronize Et"** butonuyla manuel tarama tetiklenebilir.
- **Dikey Akış (`Feed`) ve Kendi Boyutunda Kartlar:** Stüdyo ekranında üretilen veya arşivden seçilen görseller, kendi boyutlarında (`inline-flex`) alt alta scroll edilebilir dikey akışa eklenir. Oturum boyunca üretilen tüm görsellere kaydırarak erişilebilir ve anında indirilebilir.

### 4. 💎 Yarı Şeffaf Tasarım & Filigran Görünürlüğü
Tüm arayüz panelleri (`.glass-card`, `.gallery-panel`, header) yarı şeffaf (*backdrop-filter blur*) tasarlanmıştır. Bu sayede Stüdyo veya Görsel Arşivi açıkken bile arka planda yer alan **Melikgazi Belediyesi Logosu** kapanmaz, şık bir derinlik hissiyle görünür kalır.

---

## 🚀 Sıfırdan Kurulum ve Çalıştırma Rehberi

GitHub deposunu yeni klonlayan / indiren bir kullanıcının sistemi ayağa kaldırması için gereken tüm adımlar aşağıdadır. **Proje, hiçbir önceden kurulu veritabanı veya gizli API anahtarı gerektirmez; her şey ilk açılışta otomatik yapılandırılır.**

### 1. Sistem Gereksinimleri
- [.NET 10 SDK](https://dotnet.microsoft.com/download) veya üzeri
- Google Chrome (Gemini Selenium otomasyonu kullanılacaksa)

### 2. Projeyi Klonlama ve Çalıştırma
Terminal (`PowerShell` veya `CMD`) açarak aşağıdaki komutları sırasıyla çalıştırın:

```bash
# 1. Projeyi bilgisayarınıza klonlayın
git clone https://github.com/gonulomer01/yz.git

# 2. Proje klasörüne girin
cd yz

# 3. Uygulamayı derleyin ve başlatın
dotnet run
```

Uygulama başladığında terminalde `Now listening on: http://localhost:5000` (veya `https://localhost:5001`) benzeri bir adres göreceksiniz. Tarayıcınızla bu adrese gidin.

---

## 🗄️ Otomatik Veritabanı ve İlk Yönetici (Admin) Hesabı Kurulumu

Projeyi ilk defa çalıştıran bilgisayarda veritabanı (`yz.db` veya SQL Server LocalDB) doğal olarak **bulunmaz**.

Ancak uygulama `dotnet run` ile ilk kez başlatıldığında arkada çalışan **`DatabaseInitializationService`** servisi devreye girer:
1. **Veritabanı ve Tabloların Yaratılması:** Veritabanı yoksa sıfırdan oluşturulur (`EnsureCreated()`). `Users`, `GeneratedImages`, `ApiKeys` ve `AppSettings` tabloları ile gerekli indeksler otomatik inşa edilir.
2. **İlk Yönetici (Admin) Hesabının Oluşturulması:** Sistemde hiçbir kullanıcı bulunmadığı tespit edildiğinde, tam yetkili **Sistem Yöneticisi (Admin)** hesabı şifresi kriptolanarak (`BCrypt`) otomatik olarak veritabanına eklenir.

### 🔐 İlk Giriş Bilgileri (Varsayılan Yönetici)

Tarayıcınızdan uygulamaya girdiğinizde sağ üst menüden veya `http://localhost:5000/Account/Login` adresinden sisteme giriş yapabilirsiniz:

- **Kullanıcı Adı:** `admin`
- **Şifre:** `admin123`

> [!IMPORTANT]
> **Güvenlik Tavsiyesi:** Sisteme ilk kez `admin / admin123` bilgileriyle giriş yaptıktan sonra, **Yönetim Paneli** üzerinden yeni yöneticiler veya kullanıcılar tanımlayabilir ve varsayılan yönetici şifresini değiştirebilirsiniz.

---

## 🔑 API Anahtarları ve Google Oturumlarının Yapılandırılması

Proje depodan ilk indirildiğinde içerisinde aktif hiçbir API anahtarı veya tarayıcı çerezi bulunmaz.

### A. Şablon (`ai_credentials.template.json`) ve Güvenlik Mekanizması
- Uygulama ilk kez açıldığında, depoda yer alan şablon dosyasını (`ai_credentials.template.json`) referans alarak bilgisayarınızda **`ai_credentials.json`** adında yerel bir çalışma dosyası oluşturur.
- **Güvenlik Garantisi:** `ai_credentials.json` dosyası ve Google Chrome oturum klasörleri (`GeminiChromeProfile_*`), projenin `.gitignore` dosyasında özel olarak engellenmiştir. Böylece anahtarlarınızı girip projeyi sonradan kendi Git deponuza yükleseniz bile kimlik bilgileriniz **asla sızmaz**.

### B. Stability AI Anahtarı Ekleme
1. [platform.stability.ai](https://platform.stability.ai/) adresinden kopyaladığınız `sk-...` ile başlayan anahtarınızı alın.
2. Uygulamaya `admin` olarak giriş yaptıktan sonra üst menüden **Yönetim Paneli**'ne (`#section-dashboard`) geçin.
3. **"Yeni Anahtar Yuvası Ekle"** butonuna basarak `sk-...` anahtarınızı yapıştırıp kaydedin. Sistem anahtarı yerel `ai_credentials.json` dosyasına güvenle kaydeder ve üretime hazır hale getirir.
4. *(Alternatif Yöntem)* Doğrudan proje ana dizininde oluşan `ai_credentials.json` dosyasını bir metin editörüyle açıp `StabilityApiKeys` dizisindeki yuvalardan birine anahtarınızı yapıştırabilirsiniz.

### C. Google Gemini Web Chrome Profilleri Kurulumu
1. Arayüzden **Google Gemini Web Otomasyonu** motorunu seçip bir görsel üretmek istediğinizde, arka planda Google Chrome tarayıcısı otomatik olarak açılır.
2. Açılan tarayıcı penceresinde Google hesabınızla (`Gmail`) bir kez giriş yapmanız yeterlidir.
3. Oturum çerezleri yerel `GeminiChromeProfile_1` klasörüne kaydedileceği için, sonraki tüm görsel üretimleri arka planda otomatik olarak ve müdahale gerektirmeden gerçekleşir.

---

## 📁 Dosya ve Klasör Yapısı

```text
yz/
│
├── Controllers/
│   ├── AccountController.cs     # Kullanıcı girişi, kayıt ve oturum yönetimi endpointleri
│   ├── ApiController.cs         # Görsel listeleme, silme, key ekleme ve senkronizasyon endpointleri
│   └── HomeController.cs        # Ana sayfa yönlendirmeleri
├── Services/
│   ├── AiGenerationService.cs   # 3 Katmanlı yapay zeka üretim servis motoru
│   ├── AiCredentialsService.cs  # Şifreli/yerel API anahtar okuma ve yazma servisi
│   ├── ImageSyncService.cs      # Çift yönlü dosya-veritabanı senkronizasyon servisi
│   ├── GeminiSeleniumService.cs # Chrome/Selenium tabanlı Google Gemini otomasyonu
│   └── DatabaseInitializationService.cs # Veritabanı ve ilk admin oluşturma servisi
├── Models/                      # Entity Framework modelleri (User, GeneratedImage, ApiKey vb.)
├── Views/                       # Glassmorphism arayüz ve kullanıcı giriş ekranları
├── wwwroot/
│   ├── css/style.css            # Yarı şeffaf tasarım, rozetler ve filigran ayarları
│   ├── js/app.js                # Dinamik sekme filtreleme, akış ve API haberleşmesi
│   ├── generated-stability/     # Stability AI ile üretilen resimler (.gitkeep)
│   ├── generated-gemini/        # Google Gemini ile üretilen resimler (.gitkeep)
│   └── generated-free/          # Ücretsiz FLUX.1 modelleri ile üretilen resimler (.gitkeep)
└── ai_credentials.template.json # İlk kurulum için şablon anahtar yapısı
```
