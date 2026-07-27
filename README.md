# 🤖 Melikgazi Belediyesi - Yapay Zeka Toplayıcı & Çoklu Oturum Yönetim Sistemi

Bu proje; ChatGPT, Google Gemini, Microsoft Copilot, Stability AI, Replicate ve HuggingFace gibi önde gelen yapay zeka servislerini ve otomatik çoklu Chrome profil otomasyonlarını tek bir platformda birleştiren gelişmiş bir **Yapay Zeka Aggregator ve Yönetim Portalı**'dır.

---

## 🌟 Öne Çıkan Özellikler

- **Çoklu AI Entegrasyonu:** ChatGPT (GPT-4o/DALL-E 3), Google Gemini, Copilot ve Görsel Üretim motorları tek bir paneller arası geçişle kullanılabilir.
- **Akıllı İş Kuyruğu (Job Queue):** Sunucu kaynaklarını korumak amacıyla aynı anda belirli sayıda eşzamanlı işleme izin verir. Limit aşıldığında istekler otomatik olarak sıraya alınır (Beklemede) ve sırası geldiğinde işlenir.
- **Kişisel Görsel Arşivi & Koleksiyonlar:** Her kullanıcı kendi ürettiği görselleri görebilir, favorilere ekleyebilir ve özel klasörler (koleksiyonlar) oluşturarak organize edebilir.
- **Çoklu Kullanıcı & Gelişmiş Yönetici Paneli:** Standart ve Yönetici (Admin) rolleri. Yöneticiler diğer kullanıcıların ürettiği tüm görselleri, klasörlerini ve favorilerini görüntüleyip yönetebilir.
- **Otomatik Profil & Oturum Yönetimi:** Selenium WebDriver ile yönetilen bağımsız Chrome profilleri sayesinde hesap çıkışları ve oturum sonlanmaları otomatik olarak yönetilir.
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

`ash
git clone https://github.com/ozgersln/AI-agreggator-Melikgazi-Belediyesi.git
cd AI-agreggator-Melikgazi-Belediyesi
`

### 3. Veritabanı Konfigürasyonu (ppsettings.json)

Proje ana dizininde bulunan **ppsettings.json** dosyasını herhangi bir metin editörüyle açın. ConnectionStrings:DefaultConnection alanını kendi veritabanı bilgilerinizle güncelleyin:

`json
{
  "ConnectionStrings": {
    "DefaultConnection": "Server=YOUR_SERVER;Database=yz_db;User Id=YOUR_USER;Password=YOUR_PASSWORD;TrustServerCertificate=True;Encrypt=False;MultipleActiveResultSets=true"
  }
}
`

### 4. Projeyi Derleyin ve Çalıştırın

Proje dizininde aşağıdaki komutları çalıştırarak bağımlılıkları yükleyin ve uygulamayı başlatın:

`ash
dotnet restore
dotnet run
`

Başarılı bir şekilde başladıktan sonra tarayıcınızdan şu adrese gidin:

👉 **http://localhost:5000**

---

## 🔒 Güvenlik & Gizlilik İlkeleri

- Kodların içerisinde hiçbir şekilde hardcoded veritabanı şifresi veya api key barındırılmaz.
- Veritabanı bağlantı bilgilerini ppsettings.json içinden okur, değişiklikler sadece oradan yapılır.
- Yapay Zeka API anahtarları ve Chrome profilleri doğrudan yönetim paneli (Web Arayüzü) üzerinden güvenle veritabanına kaydedilir.

---

## 📄 Lisans & Katkı

Bu proje Melikgazi Belediyesi bünyesinde geliştirilmiştir. Tüm hakları saklıdır.
