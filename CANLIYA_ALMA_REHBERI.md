# Mega Image Studio — Canlıya Alma ve Sunucu Kurulum Rehberi

Bu rehber, **Melikgazi Belediyesi Çoklu Yapay Zeka Görsel Üretim Platformu'nun** canlı (Production) sunucuya kurulması, IIS yapılandırması, SQL Server bağlantısı, Chrome otomasyon ayarları ve güvenlik adımlarını eksiksiz olarak açıklamaktadır.

---

## 🌐 1. Genel Çalışma Mantığı: Dışarıdan Giren Kullanıcılar Nasıl Üretim Yapar?

### ❓ Soru: Dışarıdan biri kaydolup girdiğinde görsel nerede üretilir?
- **Yanıt:** Görsel üretimi tamamen **sizin sunucunuzda** gerçekleşir. Dışarıdaki bir kullanıcı tarayıcısından sitenize girip "Görsel Üret" butonuna bastığında, istek sizin sunucunuza (ASP.NET Core Web Servisi) iletilir.

### ❓ Soru: Geliştirme aşamasında kullanıcı hesabıyla girildiğinde Chrome penceresi görünüyordu. Canlıda sunucuda Chrome pencereleri açılacak mı?
- **Yanıt: HAYIR, hiç bir pencere açılmaz.**
  - Geliştirme modunda yönetici olmayan kullanıcılar için Chrome penceresi `--window-position=-4000,-4000` (ekran dışı) modunda çalışıyordu.
  - Canlı sunucuda (`appsettings.Production.json`) **`HeadlessMode: true`** olarak yapılandırılmıştır.
  - **Headless (Gizli/Sessiz) Mod:** Chrome sunucu hafızasında tamamen görünmez (ekransız) çalışır. Ne kullanıcıların ekranında ne de sunucu masaüstünde herhangi bir Chrome penceresi açılmaz. Aynı anda birden fazla kullanıcı istek attığında sunucu arka planında sessizce görseller üretilir ve kullanıcıya iletilir.

---

## 💻 2. Sunucu Sistem Gereksinimleri

- **İşletim Sistemi:** Windows Server 2019 / 2022 (veya Windows 10/11 Pro)
- **Web Sunucusu:** IIS (Internet Information Services) + **[.NET 10 Hosting Bundle](https://dotnet.microsoft.com/download)**
- **Veritabanı:** MS SQL Server (Express, Standard veya Enterprise)
- **Tarayıcı:** Google Chrome (En güncel sürüm)
- **Önerilen Donanım:** En az 8 GB RAM ve 4 vCPU (Eşzamanlı Selenium oturumları için)

---

## 🗄️ 3. Adım 1: SQL Server Canlı Veritabanı Yapılandırması

### A. SQL Server Kullanıcısı Oluşturma
1. SSMS (SQL Server Management Studio) ile SQL Server sunucunuza bağlanın.
2. `Security -> Logins` sağ tıklayıp **New Login** deyin:
   - Login Name: `segmind_app`
   - Authentication: **SQL Server Authentication**
   - Password: `GüçlüBirŞifre123!` (Password Policy'ye uygun)
   - `Server Roles`: `dbcreator` işaretleyin (Uygulamanın veritabanını otomatik kurabilmesi için).

### B. Proje Bağlantı Cümlesini Güncelleme
Projenizdeki `appsettings.Production.json` dosyasını canlı SQL Server bilgilerinize göre düzenleyin:

```json
{
  "Logging": {
    "LogLevel": {
      "Default": "Warning",
      "Microsoft.AspNetCore": "Warning"
    }
  },
  "ConnectionStrings": {
    "DefaultConnection": "Server=CANLI_SQL_SUNUCU_IP_VEYA_localhost;Database=SegmindNexusDb;User Id=segmind_app;Password=GüçlüBirŞifre123!;TrustServerCertificate=True;Encrypt=True;MultipleActiveResultSets=true"
  },
  "SeleniumSettings": {
    "MaxConcurrentSessions": 2,
    "HeadlessMode": true
  },
  "AllowedHosts": "*"
}
```

---

## 🌐 4. Adım 2: IIS (Internet Information Services) Kurulumu ve Ayarları

### A. IIS ve .NET 10 Hosting Bundle Kurulumu
1. Sunucuda PowerShell'i yönetici olarak açıp IIS özelliklerini yükleyin:
   ```powershell
   Install-WindowsFeature -name Web-Server -IncludeManagementTools
   ```
2. **[.NET 10 Hosting Bundle](https://dotnet.microsoft.com/download)** indirip yükleyin. Yükleme sonrası IIS'i yeniden başlatın:
   ```powershell
   net stop was /y
   net start w3svc
   ```

### B. Proje Dosyalarını Sunucuya Yayınlama (Publish)
Geliştirme bilgisayarınızdan yayın çıktısı alın:
```bash
dotnet publish -c Release -o C:\inetpub\wwwroot\yz
```
Çıkan dosyaları sunucudaki `C:\inetpub\wwwroot\yz` klasörüne kopyalayın.

### C. IIS Üzerinde Site Oluşturma
1. IIS Manager'ı açın. `Sites` sağ tık -> **Add Website**:
   - Site Name: `Melikgazi_AI_Studio`
   - Physical Path: `C:\inetpub\wwwroot\yz`
   - Binding: `http` / Port: `80` (veya HTTPS / Port `443`)

### D. KRİTİK: IIS Application Pool (Uygulama Havuzu) Ayarları
Selenium otomasyonunun ve Chrome profil klasörlerinin sunucuda sorunsuz çalışması için şu 2 ayar **MUTLAKA** yapılmalıdır:

1. IIS Manager -> **Application Pools** bölümüne gelin.
2. `Melikgazi_AI_Studio` havuzuna sağ tıklayıp **Advanced Settings (Gelişmiş Ayarlar)** seçin:
   - **`.NET CLR Version`**: `No Managed Code` yapın.
   - **`Load User Profile`**: **`True`** yapın *(Bu ayar Chrome'un kullanıcı profili oluşturabilmesi için şarttır)*.

### E. Klasör İzinleri (Yazma Yetkisi)
1. `C:\inetpub\wwwroot\yz` klasörüne sağ tıklayın -> `Properties -> Security -> Edit`.
2. **`IIS_IUSRS`** kullanıcısını ekleyin ve **`Full Control` (Tam Yetki)** verin.

---

## 🤖 5. Adım 3: AI Chrome Oturumlarının Sunucuda Kurulması

Google Gemini, ChatGPT ve Copilot otomasyonunun sunucuda sorunsuz çalışması için hesap oturumlarının 1 defaya mahsus kaydedilmesi gerekir:

1. Sunucuda projenin `appsettings.Production.json` dosyasındaki `HeadlessMode` seçeneğini **geçici olarak `false`** yapın.
2. Sunucu masaüstünden tarayıcı ile uygulamayı açın (`http://localhost`).
3. Admin hesabıyla (`admin / admin123`) girip Yönetim Paneli -> **Hesap Yönetimi** bölümüne gelin.
4. Gemini, ChatGPT ve Copilot hesap profilleri için **"Oturum Aç"** butonuna basarak sunucuda açılan Chrome penceresinde ilgili Google/OpenAI/Microsoft hesaplarınıza 1 defalık giriş yapın.
5. Oturum açma işlemi tamamlandıktan sonra `appsettings.Production.json` içindeki `HeadlessMode` seçeneğini tekrar **`true`** yapın.

---

## 🔒 6. Adım 4: SSL (HTTPS) ve Güvenlik Sertifikası

Canlı ortamda kullanıcı parolalarının şifrelenmesi için sitenize SSL sertifikası bağlayın:

1. IIS Binding ayarlarında `https` / Port `443` tanımlayın.
2. İsterseniz ücretsiz **Certify The Web (Let's Encrypt)** veya belediyenizin kurumsal SSL sertifikasını IIS'e bağlayın.
3. İlk girişte varsayılan admin şifresini (`admin123`) Yönetici Paneli -> Kullanıcı Yönetimi kısmından **mutlaka değiştirin**.

---

## 🩺 7. Adım 5: Canlı Sistem Doğrulaması (Health Check)

Sunucudaki sistemin sağlıklı çalıştığını doğrulamak için dışarıdan veya sunucu içinden şu adrese gidin:

`http://SITENIZIN_ADRESI/api/health`

Çıktı şu şekilde görünmelidir:
```json
{
  "status": "Healthy",
  "timestamp": "2026-07-22T21:35:00Z",
  "database": "Connected",
  "dbError": null,
  "activeSeleniumDrivers": 0
}
```

- **`status: Healthy`** ve **`database: Connected`** yazıyorsa platform canlıda %100 sorunsuz çalışıyor demektir! 🚀
