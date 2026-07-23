# 🤖 Melikgazi Belediyesi - Yapay Zeka Toplayıcı & Çoklu Oturum Yönetim Sistemi

Bu proje; ChatGPT, Google Gemini, Microsoft Copilot, Stability AI, Replicate ve HuggingFace gibi önde gelen yapay zeka servislerini ve otomatik çoklu Chrome profil otomasyonlarını tek bir platformda birleştiren gelişmiş bir **Yapay Zeka Aggregator ve Yönetim Portalı**'dır.

---

## 🌟 Öne Çıkan Özellikler

- **Çoklu AI Entegrasyonu:** ChatGPT (GPT-4o/DALL-E 3), Google Gemini, Copilot ve Görsel Üretim motorları tek bir paneller arası geçişle kullanılabilir.
- **Otomatik Profil & Oturum Yönetimi:** Selenium WebDriver ile yönetilen bağımsız Chrome profilleri sayesinde hesap çıkışları ve oturum sonlanmaları otomatik olarak yönetilir.
- **Özel Otomatik Hesap Üretim Robotu:** Taban Gmail hesapları (`tygotr001`, `tygotr002` vb.) üzerinden otomatik e-posta kod doğrulama ve şifreleme ile sonsuz döngüde otomatik ChatGPT hesabı oluşturur.
- **Kullanıcı Dostu Glassmorphism Arayüz:** Modern, responsive ve hızlı kullanıcı arayüzü.

---

## 🛠️ Mimari ve Teknolojiler

- **Backend:** ASP.NET Core 10.0 (C#) MVC
- **Database:** SQL Server (Entity Framework Core 10)
- **Otomasyon:** Selenium WebDriver, ChromeDriver
- **Frontend:** HTML5, CSS3 (Modern Glassmorphism Design System), JavaScript (ES6+)

---

## 🚀 Sistemi Sıfırdan Ayağa Kaldırma Rehberi

Projeyi kendi bilgisayarınızda veya sunucunuzda çalıştırmak için aşağıdaki adımları sırasıyla uygulayabilirsiniz:

### 1. Ön Gereksinimler

- [.NET 10.0 SDK](https://dotnet.microsoft.com/download/dotnet/10.0) kurulu olmalıdır.
- [Google Chrome](https://www.google.com/chrome/) güncel sürümü yüklü olmalıdır.
- SQL Server (Yerel MS SQL veya Uzak MSSQL Veritabanı Server).

### 2. Projeyi Klonlayın

```bash
git clone https://github.com/gonulomer01/AI-agreggator-Melikgazi-Belediyesi.git
cd AI-agreggator-Melikgazi-Belediyesi
```

### 3. Veritabanı Konfigürasyonu (`appsettings.Local.json`)

Güvenlik sebebiyle veritabanı şifreleri GitHub üzerinde saklanmaz. Proje ana dizininde (`yz/` klasörü içinde) **`appsettings.Local.json`** adında yeni bir dosya oluşturun ve kendi veritabanı bağlantı bilginizi ekleyin:

```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=localhost;Database=yz_db;Trusted_Connection=True;TrustServerCertificate=True;Encrypt=False;MultipleActiveResultSets=true"
  }
}
```

> 💡 **Not:** Uzak bir MSSQL kullanıyorsanız `Server`, `User Id` ve `Password` alanlarını kendi sunucu bilgilerinizle doldurun.

### 4. Yapay Zeka Kimlik Dosyası (`ai_credentials.json`)

Proje ana dizininde bulunan `ai_credentials.template.json` dosyasının bir kopyasını alarak **`ai_credentials.json`** ismiyle kaydedin ve kullanmak istediğiniz API anahtarlarını veya varsayılan profil bilgilerini tanımlayın:

```bash
cp ai_credentials.template.json ai_credentials.json
```

### 5. Projeyi Derleyin ve Çalıştırın

Proje dizininde aşağıdaki komutları çalıştırarak bağımlılıkları yükleyin ve uygulamayı başlatın:

```bash
dotnet restore
dotnet run
```

Başarılı bir şekilde başladıktan sonra tarayıcınızdan şu adrese gidin:

👉 **`http://localhost:5000`**

---

## 🔒 Güvenlik Notları

- `appsettings.Local.json` ve `ai_credentials.json` dosyaları `.gitignore` içerisinde tanımlanmıştır ve asla Git depolarına push edilmez.
- Veritabanı şifrenizi veya API anahtarlarınızı değiştirdiğinizde sadece kendi yerel `appsettings.Local.json` / `ai_credentials.json` dosyanızı güncellemeniz yeterlidir.

---

## 📄 Lisans & Katkı

Bu proje Melikgazi Belediyesi bünyesinde geliştirilmiştir. All rights reserved.
