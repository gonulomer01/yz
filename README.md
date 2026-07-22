# Mega Image Studio — Melikgazi Belediyesi Çoklu Yapay Zeka Görsel Üretim ve Yönetim Platformu

**Mega Image Studio**, modern **.NET 10 ASP.NET Core MVC** ve **MS SQL Server** altyapısıyla geliştirilmiş, çoklu yapay zeka motorunu (Google Gemini Web, ChatGPT DALL-E, Microsoft Copilot ve Stability AI / Pollinations AI) tek bir merkezi arayüz üzerinden yöneten, canlı akışlı (SSE) üçlü üretime, tam ekran görsel inceleme (Lightbox) ve çift yönlü dosya-veritabanı senkronizasyonuna sahip kurumsal bir görsel üretim platformudur.

---

## 🌟 Öne Çıkan Özellikler

### 1. 🚀 Çoklu AI Üretimi ve Canlı Akış (Gemini + ChatGPT + Copilot)
- **⚡ Canlı Akışlı Üçlü AI Üretim Modu:** Tek bir prompt ile aynı anda 3 farklı AI platformundan (**Google Gemini Web**, **ChatGPT DALL-E**, **Microsoft Copilot DALL-E 3**) eşzamanlı görsel üretilir.
- **📡 Server-Sent Events (SSE) Akışı:** Görseller üretildikçe canlı olarak stüdyo panelinde belirir.
- **📦 Toplu ZIP & Prompt TXT İndirme:** Üçlü üretim tamamlandığında görseller ve orijinal prompt metnini içeren `prompt.txt` dosyası tek tıkla zip formatında indirilebilir.
- **🤖 Akıllı Selenium Rotasyonu & Otomatik Kapatma:** Arka planda gizli Chrome profillerini (`GeminiChromeProfile_*`, `ChatGptChromeProfile_*`, `CopilotChromeProfile_*`) yöneterek görsel üretir. Kota dolduğunda sıradaki aktif hesaba otomatik geçiş yapılır.
- **💳 Stability AI & Ücretsiz Modeller:** SDXL 1.0, Stable Image Core, SD 3.5 ve Pollinations AI (FLUX.1 / SDXL Turbo) desteği.

### 2. 🎛️ Yönetim ve Profil Modülleri
1. **Stüdyo Panel:** Prompt girişi, stil/oran seçimi, canlı akışlı üretim ve görsel beslemesi.
2. **Yönetici Paneli (Admin):**
   - **Hesap Yönetimi:** Google Gemini, ChatGPT ve Copilot Chrome hesap profilleri listeleme ve durum sıfırlama.
   - **API Key Yönetimi:** Stability AI API anahtar havuzu yönetimi.
   - **Kullanıcı Yönetimi:** Kullanıcı ekleme, silme, yetkilendirme (Yönetici/Kullanıcı) ve kullanıcı görsellerini inceleme.
3. **Görsel Arşivi:** `Tümü`, `Üçlü Üretimler`, `Stability AI`, `Gemini Web`, `ChatGPT`, `Copilot` ve `Ücretsiz` kategorili filtreleme.

---

## 🚀 Sıfırdan Kurulum Rehberi

### 1. Sistem Gereksinimleri
- **[.NET 10 SDK](https://dotnet.microsoft.com/download)** veya üzeri
- **MS SQL Server** (LocalDB veya MSSQLSERVER varsayılan örneği `Server=.`)
- **Google Chrome** (Selenium Web Otomasyonu için)

### 2. Kurulum Adımları

```bash
# 1. Projeyi bilgisayarınıza klonlayın
git clone https://github.com/gonulomer01/yz.git

# 2. Proje klasörüne girin
cd yz

# 3. Uygulamayı derleyin ve çalıştırın
dotnet run
```

> **Not:** Uygulama çalıştırıldığında SQL Server üzerinde `SegmindNexusDb` veritabanı ve gerekli tablolar otomatik olarak oluşturulur.

---

## 🔑 İlk Yönetici (Admin) Giriş Bilgileri

Uygulama ilk kez çalıştırıldığında varsayılan yönetici hesabı otomatik tanımlanır:

- **Web Arayüzü Adresi:** `http://localhost:5000`
- **Kullanıcı Adı:** `admin`
- **Şifre:** `admin123`

---

## ⚙️ Yapılandırma (`appsettings.json`)

Veritabanı bağlantı cümlesi `appsettings.json` ve `appsettings.Production.json` içerisinde tanımlıdır:

```json
"ConnectionStrings": {
  "DefaultConnection": "Server=.;Database=SegmindNexusDb;Trusted_Connection=True;TrustServerCertificate=True;Encrypt=False;MultipleActiveResultSets=true"
}
```

---

## 📁 Klasör Yapısı

```text
yz/
├── Controllers/         # MVC ve API Endpointleri (Account, Api, Home)
├── Data/                # ApplicationDbContext (EF Core MS SQL Server)
├── Models/              # Entity ve Veri Modelleri (User, GeneratedImage, ApiKey, AppSetting)
├── Services/            # AI Üretim Orkestratörü, Database Init, Selenium MultiAI Service
├── Views/               # Razor View HTML Şablonları & Modern Glassmorphism Arayüz
├── wwwroot/             # Statik dosyalar, CSS, JS (app.js) ve üretilen görseller
├── appsettings.json     # Uygulama ve Veritabanı Konfigürasyonu
├── ai_credentials.template.json # AI Hesap Yapılandırma Şablonu
├── Program.cs           # Web Uygulaması Başlangıç Mantığı
└── yz.csproj            # .NET 10 Proje Yapılandırması
```
