# Melikgazi Belediyesi — Yapay Zeka Görsel Üretim ve Yönetim Platformu

**Melikgazi Belediyesi YZ Platformu**, modern **.NET 10 ASP.NET Core MVC** altyapısıyla geliştirilmiş, çoklu yapay zeka motorunu tek bir merkezi arayüz üzerinden yöneten, yarı şeffaf (*Glassmorphism*) şık bir tasarıma ve çift yönlü dosya-veritabanı senkronizasyonuna sahip gelişmiş bir kurumsal görsel otomasyon sistemidir.

---

## 🌟 Öne Çıkan Özellikler ve Mimari

### 1. 🤖 Çok Katmanlı Yapay Zeka Üretim Motoru
Platform, farklı ihtiyaç ve bütçe senaryolarına uygun çoklu yapay zeka motorunu destekler:

- **💳 Stability AI (Kredili Modeller):**
  - `SDXL 1.0 (~1 Kredi)`: Yüksek stabilite ve düşük maliyetli kurumsal görsel üretimi.
  - `Stable Image Core (3 Kredi)`: Gelişmiş detay, aydınlatma ve kompozisyon desteği.
  - *Not:* Güvenlik veya kredi yetersizliği nedeniyle hata üretebilen eski/pahalı modeller sistemden temizlenmiştir.
- **🤖 Google Gemini, ChatGPT, Copilot ve Grok Web Otomasyonu (Selenium Çoklu Hesap Rotasyonu):**
  - Arka planda Chrome tarayıcı profillerini (`GeminiChromeProfile_1` (1-16), `ChatGptChromeProfile_1` (1-6), `CopilotChromeProfile_1` (1-6) vb.) yöneterek yapay zeka platformlarının web arayüzleri üzerinden görsel üretir.
  - Bir hesabın günlük kotası dolduğunda sistem otomatik olarak sıradaki aktif hesaba geçiş yapar (Akıllı Rotasyon).
- **🌟 Ücretsiz & Sınırsız FLUX.1 / SDXL Turbo:**
  - Pollinations AI altyapısı üzerinden **FLUX.1 Realism**, **FLUX.1 Schnell** ve **SDXL Turbo** modellerini sınırsız ve ücretsiz kullanabilme olanağı.

### 2. 🔄 Çift Yönlü Klasör & Veritabanı Senkronizasyonu (`SyncDatabaseWithFilesystem`)
Uygulama, fiziksel dosya sistemi ile veritabanını (`GeneratedImages` tablosu) gerçek zamanlı olarak senkronize eder:
- **Otomatik Temizleme (`Orphan Cleanup`):** Bilgisayarınızdan veya sunucudan fiziksel bir görsel dosyasını sildiğinizde, arayüzdeki veritabanı kaydı da otomatik olarak silinir; arayüzde resimsiz, kırık kalıntılar kalmaz.
- **Otomatik Tanıma (`File Discovery`):** Dışarıdan `wwwroot/generated-stability/`, `wwwroot/generated-gemini/`, `wwwroot/generated-chatgpt/`, `wwwroot/generated-copilot/`, `wwwroot/generated-grok/`, `wwwroot/generated-free/` veya `wwwroot/generated/` klasörlerine yeni bir `.png`, `.jpg` veya `.webp` dosyası eklediğinizde, sistem bunu anında algılar, veritabanına kaydeder ve arayüzde listeler.

### 3. 🖼️ Görsel Arşivi Sekmeleri & Dikey Akış (`Studio Feed`)
- **Görsel Arşivi Paneli:** `Tümü`, `Stability AI`, `Gemini`, `ChatGPT`, `Copilot`, `Grok` ve `Ücretsiz` sekmelerine ayrılmıştır. Panel üstündeki **"Klasörleri Tara & Senkronize Et"** butonuyla manuel tarama tetiklenebilir.
- **Dikey Akış (`Feed`) ve Kendi Boyutunda Kartlar:** Stüdyo ekranında üretilen veya arşivden seçilen görseller, kendi boyutlarında (`inline-flex`) alt alta scroll edilebilir dikey akışa eklenir. Oturum boyunca üretilen tüm görsellere kaydırarak erişilebilir ve anında indirilebilir.

### 4. 💎 Yarı Şeffaf Tasarım & Filigran Görünürlüğü
Tüm arayüz panelleri (`.glass-card`, `.gallery-panel`, header) yarı şeffaf (*backdrop-filter blur*) tasarlanmıştır. Bu sayede Stüdyo veya Görsel Arşivi açıkken bile arka planda yer alan **Melikgazi Belediyesi Logosu** kapanmaz, şık bir derinlik hissiyle görünür kalır.

---

## 🚀 Sıfırdan Kurulum ve Çalıştırma Rehberi

GitHub deposunu yeni klonlayan / indiren bir kullanıcının sistemi ayağa kaldırması için gereken tüm adımlar aşağıdadır. **Proje, hiçbir önceden kurulu veritabanı veya gizli API anahtarı gerektirmez; her şey ilk açılışta otomatik yapılandırılır.**

### 1. Sistem Gereksinimleri
- [.NET 10 SDK](https://dotnet.microsoft.com/download) veya üzeri
- Google Chrome (Gemini, ChatGPT, Copilot Selenium otomasyonu kullanılacaksa)

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
- **Güvenlik Garantisi:** `ai_credentials.json` dosyası ve Google Chrome oturum klasörleri (`GeminiChromeProfile_*`, `ChatGptChromeProfile_*`, vb.), projenin `.gitignore` dosyasında özel olarak engellenmiştir. Böylece anahtarlarınızı girip projeyi sonradan kendi Git deponuza yükleseniz bile kimlik bilgileriniz **asla sızmaz**.

### B. Stability AI Anahtarı Ekleme
1. [platform.stability.ai](https://platform.stability.ai/) adresinden kopyaladığınız `sk-...` ile başlayan anahtarınızı alın.
2. Uygulamaya `admin` olarak giriş yaptıktan sonra üst menüden **Yönetim Paneli**'ne (`#section-dashboard`) geçin.
3. **"Yeni Anahtar Yuvası Ekle"** butonuna basarak `sk-...` anahtarınızı yapıştırıp kaydedin. Sistem anahtarı yerel `ai_credentials.json` dosyasına güvenle kaydeder ve üretime hazır hale getirir.
4. *(Alternatif Yöntem)* Doğrudan proje ana dizininde oluşan `ai_credentials.json` dosyasını bir metin editörüyle açıp `StabilityApiKeys` dizisindeki yuvalardan birine anahtarınızı yapıştırabilirsiniz.

### C. Google Gemini, ChatGPT ve Copilot Chrome Profilleri Kurulumu
1. Arayüzden **Web Otomasyonu** (Gemini, ChatGPT veya Copilot) motorunu seçip bir görsel üretmek istediğinizde, arka planda Google Chrome tarayıcısı otomatik olarak açılır.
2. Açılan tarayıcı penceresinde hesabınızla bir kez giriş yapmanız yeterlidir.
3. Oturum çerezleri yerel `*ChromeProfile_*` klasörüne kaydedileceği için, sonraki tüm görsel üretimleri arka planda otomatik olarak ve müdahale gerektirmeden gerçekleşir.

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
│   ├── MultiAiSeleniumService.cs # Çoklu yapay zeka (ChatGPT, Copilot, Grok vb.) web otomasyonu
│   └── DatabaseInitializationService.cs # Veritabanı ve ilk admin oluşturma servisi
├── Models/                      # Entity Framework modelleri (User, GeneratedImage, ApiKey vb.)
├── Views/                       # Glassmorphism arayüz ve kullanıcı giriş ekranları
├── wwwroot/
│   ├── css/style.css            # Yarı şeffaf tasarım, rozetler ve filigran ayarları
│   ├── js/app.js                # Dinamik sekme filtreleme, akış ve API haberleşmesi
│   ├── generated-stability/     # Stability AI ile üretilen resimler (.gitkeep)
│   ├── generated-gemini/        # Google Gemini ile üretilen resimler (.gitkeep)
│   ├── generated-chatgpt/       # ChatGPT ile üretilen resimler (.gitkeep)
│   ├── generated-copilot/       # Copilot ile üretilen resimler (.gitkeep)
│   ├── generated-grok/          # Grok ile üretilen resimler (.gitkeep)
│   ├── generated-free/          # Ücretsiz FLUX.1 modelleri ile üretilen resimler (.gitkeep)
├── ai_credentials.template.json # İlk kurulum için şablon anahtar yapısı
└── Temiz-Paketle.ps1            # Projeyi temizleyerek paylaşım paketi (ZIP) oluşturan betik
```

---

## 🧹 Proje Temizleme ve Paylaşım Paketi Aracı (`Temiz-Paketle.ps1`)

Projenizi başka bir geliştiriciyle paylaşmak, GitHub veya sunucu ortamına aktarmak ya da temiz bir arşiv kopyası almak istediğinizde, yerel çalışma ortamınızdaki **API anahtarlarınızın**, **oturum çerezlerinizin (`*ChromeProfile_*`)**, **üretilmiş görsel arşivinizin** ve **derleme dosyanızın (`bin`, `obj`)** kazara dışarı sızmasını önlemek hayati önem taşır.

Bu amaçla projenin ana dizininde **`Temiz-Paketle.ps1`** adında özel bir PowerShell güvenlik ve paketleme otomasyonu bulunmaktadır.

### ⚙️ Betiğin Çalışma Prensibi (5 Adımlı Temizlik)
Betik çalıştırıldığında, mevcut ana projenize veya yerel ayarlarınıza **hiçbir zarar vermeden** bir üst klasörde tamamen temiz bir kopya ve ZIP arşivi oluşturur:

1. **Önceki Temizlik:** Varsa eski temiz kopya klasörünü (`ai_automation_project_Temiz_Kopya`) ve arşiv dosyasını (`ai_automation_project_Paylasim.zip`) temizler.
2. **Kodu Ayıklayarak Kopyalama:** Derleme çıktılarını (`bin`, `obj`), IDE önbelleklerini (`.vs`), Git geçmişini (`.git`), veritabanı dosyalarını (`*.db`, `*.db-shm`, `*.db-wal`) ve tarayıcı profillerini (`*ChromeProfile_*`) hariç tutarak sadece kaynak kodları yeni klasöre kopyalar.
3. **Görsel Arşivi Temizliği:** `wwwroot/generated/`, `generated-free/`, `generated-gemini/`, `generated-chatgpt/`, `generated-copilot/`, `generated-grok/` ve `generated-stability/` klasörleri içindeki tüm resimleri silerek yalnızca klasör yapısının bozulmasını önleyen `.gitkeep` dosyalarını bırakır.
4. **API Anahtarlarının Sıfırlanması:** Kopyalanan projedeki `ai_credentials.json` ve `ai_credentials.template.json` dosyalarını varsayılan boş şablonla ezerek, girilmiş olan tüm **Stability AI** anahtarlarını ve **Web Otomasyonu (Gemini, ChatGPT, vb.) oturum kayıtlarını** tamamen sıfırlar.
5. **ZIP Paketlenmesi:** Temizlenen projeyi, paylaşıma hazır tek bir sıkıştırılmış dosya (**`ai_automation_project_Paylasim.zip`**) haline getirir.

### 💻 Nasıl Çalıştırılır?
Terminal veya PowerShell üzerinden proje klasöründeyken aşağıdaki komutu çalıştırmanız yeterlidir:

```powershell
.\Temiz-Paketle.ps1
```

İşlem tamamlandığında, projenizin bulunduğu dizinin bir üst klasöründe **hiçbir gizli bilgi içermeyen, tertemiz `ai_automation_project_Paylasim.zip`** dosyası paylaşımınıza hazır hale gelecektir.

