using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.Extensions.DependencyInjection;
using OpenQA.Selenium;
using OpenQA.Selenium.Chrome;
using yz.Data;
using yz.Models;
namespace yz.Services
{
    public class SiteGenerationResult
    {
        public bool Success { get; set; }
        public string? ImagePath { get; set; }
        public string? ModelUsed { get; set; }
        public string? KeyUsedLabel { get; set; }
        public int ImageId { get; set; }
        public string SourceSite { get; set; } = "";
        public string? Error { get; set; }
    }
    public class MultiAiSeleniumService
    {
        private readonly ApplicationDbContext _context;
        private readonly ImageSyncService _imageSyncService;
        private readonly AiCredentialsService _credentialsService;
        private readonly IServiceScopeFactory _scopeFactory;
        private readonly Microsoft.Extensions.Configuration.IConfiguration? _configuration;

        private static readonly List<IWebDriver> _activeDrivers = new();
        private static readonly object _driverLock = new();
        private static volatile bool _isCancelRequested = false;
        private static readonly SemaphoreSlim _concurrencySemaphore = new(3, 3);

        public static bool IsCancelRequested => _isCancelRequested;
        public static int ActiveDriversCount
        {
            get
            {
                lock (_driverLock)
                {
                    return _activeDrivers.Count;
                }
            }
        }

        public static void ResetCancelState()
        {
            _isCancelRequested = false;
        }

        public static void RegisterDriver(IWebDriver driver)
        {
            lock (_driverLock)
            {
                if (!_activeDrivers.Contains(driver))
                    _activeDrivers.Add(driver);
            }
        }

        public static void UnregisterDriver(IWebDriver? driver)
        {
            if (driver == null) return;
            lock (_driverLock)
            {
                if (_activeDrivers.Remove(driver))
                {
                    try { _concurrencySemaphore.Release(); } catch { }
                }
            }
        }

        public void CancelAllSessions()
        {
            Console.WriteLine("[MultiAiSeleniumService] Tüm aktif tarayıcı oturumları ve işlemler iptal ediliyor...");
            _isCancelRequested = true;

            List<IWebDriver> driversToClose;
            lock (_driverLock)
            {
                driversToClose = _activeDrivers.ToList();
                _activeDrivers.Clear();
            }

            foreach (var driver in driversToClose)
            {
                try
                {
                    driver.Quit();
                    driver.Dispose();
                    try { _concurrencySemaphore.Release(); } catch { }
                }
                catch { }
            }

            try
            {
                foreach (var proc in System.Diagnostics.Process.GetProcessesByName("chromedriver"))
                {
                    try { proc.Kill(); } catch { }
                }
            }
            catch { }
        }

        public MultiAiSeleniumService(ApplicationDbContext context, ImageSyncService imageSyncService, AiCredentialsService credentialsService, IServiceScopeFactory scopeFactory, Microsoft.Extensions.Configuration.IConfiguration? configuration = null)
        {
            _context = context;
            _imageSyncService = imageSyncService;
            _credentialsService = credentialsService;
            _scopeFactory = scopeFactory;
            _configuration = configuration;
        }
        public async Task<(int StatusCode, object Response)> GenerateFromGeminiAsync(string prompt, string aspectRatio, int userId = 0, bool isAdmin = false)
        {
            ResetCancelState();
            var creds = await _credentialsService.GetCredentialsAsync();
            foreach (var acc in creds.GeminiAccounts) { if (acc.Status == "Exhausted") acc.Status = "Active"; }
            await _credentialsService.SaveCredentialsAsync(creds);
            var profiles = creds.GeminiAccounts.OrderBy(a => a.Id).ToList();
            int currentIdx = 0;
            if (!profiles.Any())
                return (400, new { error = "Panel'den en az bir Gemini hesap profili ekleyin." });
            int totalProfiles = profiles.Count;
            for (int attempt = 0; attempt < totalProfiles; attempt++)
            {
                if (IsCancelRequested) return (400, new { error = "İşlem durduruldu." });
                int evalIdx = (currentIdx + attempt) % totalProfiles;
                var accountObj = profiles[evalIdx];
                if (accountObj.Status == "Exhausted") continue;
                var result = await RunGeminiSession(accountObj, prompt, aspectRatio, userId, isAdmin);
                if (result.Success)
                {
                    accountObj.LastUsed = DateTime.Now.ToString("g");
                    creds.CurrentGeminiProfileIndex = evalIdx;
                    await _credentialsService.SaveCredentialsAsync(creds);
                    return (200, new
                    {
                        success = true,
                        image = result.ImagePath,
                        modelUsed = result.ModelUsed,
                        keyUsedId = 0,
                        keyUsedLabel = result.KeyUsedLabel,
                        imageId = result.ImageId,
                        userId = userId,
                        sourceSite = "gemini"
                    });
                }
                if (result.Error == "login_required" && attempt == totalProfiles - 1)
                {
                    return (401, new { error = $"'{accountObj.AccountLabel}' profilinde oturum açılmadığı için Google giriş ekranı belirdi. Lütfen paneldeki Gemini hesapları bölümünden 'Oturum Aç' butonuna basarak giriş yapın." });
                }
                if (result.Error != "login_required")
                {
                    accountObj.Status = "Exhausted";
                    creds.CurrentGeminiProfileIndex = (evalIdx + 1) % totalProfiles;
                    await _credentialsService.SaveCredentialsAsync(creds);
                }
            }
            return (503, new { error = "Tüm Google Gemini hesap profillerinin kotası dolmuş veya oturumları açık değil." });
        }
        public async Task<(int StatusCode, object Response)> GenerateFromChatGptAsync(string prompt, string aspectRatio, int userId = 0, bool isAdmin = false)
        {
            ResetCancelState();
            var creds = await _credentialsService.GetCredentialsAsync();
            foreach (var acc in (creds.ChatGptAccounts ?? new List<ChatGptAccountItem>())) { if (acc.Status == "Exhausted") acc.Status = "Active"; }
            await _credentialsService.SaveCredentialsAsync(creds);
            var profiles = (creds.ChatGptAccounts ?? new List<ChatGptAccountItem>()).OrderBy(a => a.Id).ToList();
            int currentIdx = 0;
            if (!profiles.Any())
                return (400, new { error = "Panel'den en az bir ChatGPT hesap profili ekleyin." });
            int totalProfiles = profiles.Count;
            for (int attempt = 0; attempt < totalProfiles; attempt++)
            {
                if (IsCancelRequested) return (400, new { error = "İşlem durduruldu." });
                int evalIdx = (currentIdx + attempt) % totalProfiles;
                var accountObj = profiles[evalIdx];
                if (accountObj.Status == "Exhausted") continue;
                var result = await RunChatGptSession(accountObj, prompt, aspectRatio, userId, isAdmin);
                if (result.Success)
                {
                    accountObj.LastUsed = DateTime.Now.ToString("g");
                    creds.CurrentChatGptProfileIndex = evalIdx;
                    await _credentialsService.SaveCredentialsAsync(creds);
                    return (200, new
                    {
                        success = true,
                        image = result.ImagePath,
                        modelUsed = result.ModelUsed,
                        keyUsedId = 0,
                        keyUsedLabel = result.KeyUsedLabel,
                        imageId = result.ImageId,
                        userId = userId,
                        sourceSite = "chatgpt"
                    });
                }
                if (result.Error == "login_required" && attempt == totalProfiles - 1)
                {
                    return (401, new { error = $"'{accountObj.AccountLabel}' profilinde oturum açılmadığı için giriş ekranı belirdi. Lütfen paneldeki ChatGPT hesapları bölümünden 'Oturum Aç' butonuna basarak giriş yapın." });
                }
                if (result.Error == "exhausted" || result.Error == "generation_failed")
                {
                    accountObj.Status = "Exhausted";
                    creds.CurrentChatGptProfileIndex = (evalIdx + 1) % totalProfiles;
                    await _credentialsService.SaveCredentialsAsync(creds);
                }
            }
            return (503, new { error = "Tüm ChatGPT hesap profillerinin kotası dolmuş veya oturumları açık değil." });
        }
        public async Task<(int StatusCode, object Response)> GenerateFromCopilotAsync(string prompt, string aspectRatio, int userId = 0, bool isAdmin = false)
        {
            ResetCancelState();
            var creds = await _credentialsService.GetCredentialsAsync();
            foreach (var acc in (creds.CopilotAccounts ?? new List<CopilotAccountItem>())) { if (acc.Status == "Exhausted") acc.Status = "Active"; }
            await _credentialsService.SaveCredentialsAsync(creds);
            var profiles = (creds.CopilotAccounts ?? new List<CopilotAccountItem>()).OrderBy(a => a.Id).ToList();
            int currentIdx = 0;
            if (!profiles.Any())
                return (400, new { error = "Panel'den en az bir Copilot hesap profili ekleyin." });
            int totalProfiles = profiles.Count;
            for (int attempt = 0; attempt < totalProfiles; attempt++)
            {
                if (IsCancelRequested) return (400, new { error = "İşlem durduruldu." });
                int evalIdx = (currentIdx + attempt) % totalProfiles;
                var accountObj = profiles[evalIdx];
                if (accountObj.Status == "Exhausted") continue;
                var result = await RunCopilotSession(accountObj, prompt, aspectRatio, userId, isAdmin);
                if (result.Success)
                {
                    accountObj.LastUsed = DateTime.Now.ToString("g");
                    creds.CurrentCopilotProfileIndex = evalIdx;
                    await _credentialsService.SaveCredentialsAsync(creds);
                    return (200, new
                    {
                        success = true,
                        image = result.ImagePath,
                        modelUsed = result.ModelUsed,
                        keyUsedId = 0,
                        keyUsedLabel = result.KeyUsedLabel,
                        imageId = result.ImageId,
                        userId = userId,
                        sourceSite = "copilot"
                    });
                }
                if (result.Error == "login_required" && attempt == totalProfiles - 1)
                {
                    return (401, new { error = $"'{accountObj.AccountLabel}' profilinde oturum açılmadığı için Microsoft giriş ekranı belirdi. Lütfen paneldeki Copilot hesapları bölümünden 'Oturum Aç' butonuna basarak giriş yapın." });
                }
                if (result.Error != "login_required")
                {
                    accountObj.Status = "Exhausted";
                    creds.CurrentCopilotProfileIndex = (evalIdx + 1) % totalProfiles;
                    await _credentialsService.SaveCredentialsAsync(creds);
                }
            }
            return (503, new { error = "Tüm Copilot hesap profillerinin kotası dolmuş veya oturumları açık değil." });
        }
        public async Task<(int StatusCode, object Response)> GenerateTripleAsync(string prompt, string aspectRatio, int userId = 0, bool isAdmin = false)
        {
            ResetCancelState();
            string groupId = Guid.NewGuid().ToString("N")[..12];
            var geminiTask = GenerateSiteForTripleAsync("gemini", prompt, aspectRatio, userId, isAdmin, groupId);
            var chatgptTask = GenerateSiteForTripleAsync("chatgpt", prompt, aspectRatio, userId, isAdmin, groupId);
            var copilotTask = GenerateSiteForTripleAsync("copilot", prompt, aspectRatio, userId, isAdmin, groupId);
            var results = await Task.WhenAll(geminiTask, chatgptTask, copilotTask);
            var successResults = results.Where(r => r.Success).ToList();
            var failedResults = results.Where(r => !r.Success).ToList();
            if (!successResults.Any())
            {
                return (503, new { error = "Hiçbir AI platformundan görsel üretilemedi. Hesap kotalarını ve oturumlarını kontrol edin.", details = failedResults.Select(f => new { site = f.SourceSite, error = f.Error }) });
            }
            return (200, new
            {
                success = true,
                multiMode = true,
                groupId = groupId,
                results = successResults.Select(r => new
                {
                    image = r.ImagePath,
                    modelUsed = r.ModelUsed,
                    keyUsedLabel = r.KeyUsedLabel,
                    imageId = r.ImageId,
                    sourceSite = r.SourceSite
                }).ToList(),
                failures = failedResults.Select(f => new {
                    sourceSite = f.SourceSite,
                    error = f.Error
                }).ToList(),
                userId = userId
            });
        }
        public async Task<SiteGenerationResult> GenerateSiteForTripleAsync(string site, string prompt, string aspectRatio, int userId, bool isAdmin, string groupId)
        {
            try
            {
                if (IsCancelRequested) return new SiteGenerationResult { Success = false, SourceSite = site, Error = "cancelled" };
                var creds = await _credentialsService.GetCredentialsAsync();
                foreach (var a in creds.GeminiAccounts) { if (a.Status == "Exhausted") a.Status = "Active"; }
                foreach (var a in (creds.ChatGptAccounts ?? new List<ChatGptAccountItem>())) { if (a.Status == "Exhausted") a.Status = "Active"; }
                foreach (var a in (creds.CopilotAccounts ?? new List<CopilotAccountItem>())) { if (a.Status == "Exhausted") a.Status = "Active"; }
                await _credentialsService.SaveCredentialsAsync(creds);
                if (site == "gemini")
                {
                    var profiles = creds.GeminiAccounts.OrderBy(a => a.Id).ToList();
                    foreach (var acc in profiles)
                    {
                        if (IsCancelRequested) return new SiteGenerationResult { Success = false, SourceSite = site, Error = "cancelled" };
                        if (acc.Status == "Exhausted") continue;
                        var result = await RunGeminiSession(acc, prompt, aspectRatio, userId, isAdmin, groupId);
                        if (result.Success) { acc.LastUsed = DateTime.Now.ToString("g"); await _credentialsService.SaveCredentialsAsync(creds); return result; }
                        if (result.Error == "exhausted" || result.Error == "generation_failed") { acc.Status = "Exhausted"; await _credentialsService.SaveCredentialsAsync(creds); }
                        else { return result; }
                    }
                }
                else if (site == "chatgpt")
                {
                    var profiles = (creds.ChatGptAccounts ?? new List<ChatGptAccountItem>()).OrderBy(a => a.Id).ToList();
                    foreach (var acc in profiles)
                    {
                        if (IsCancelRequested) return new SiteGenerationResult { Success = false, SourceSite = site, Error = "cancelled" };
                        if (acc.Status == "Exhausted") continue;
                        var result = await RunChatGptSession(acc, prompt, aspectRatio, userId, isAdmin, groupId);
                        if (result.Success) { acc.LastUsed = DateTime.Now.ToString("g"); await _credentialsService.SaveCredentialsAsync(creds); return result; }
                        if (result.Error == "exhausted" || result.Error == "generation_failed") { acc.Status = "Exhausted"; await _credentialsService.SaveCredentialsAsync(creds); }
                        else { return result; }
                    }
                }
                else if (site == "copilot")
                {
                    var profiles = (creds.CopilotAccounts ?? new List<CopilotAccountItem>()).OrderBy(a => a.Id).ToList();
                    foreach (var acc in profiles)
                    {
                        if (IsCancelRequested) return new SiteGenerationResult { Success = false, SourceSite = site, Error = "cancelled" };
                        if (acc.Status == "Exhausted") continue;
                        var result = await RunCopilotSession(acc, prompt, aspectRatio, userId, isAdmin, groupId);
                        if (result.Success) { acc.LastUsed = DateTime.Now.ToString("g"); await _credentialsService.SaveCredentialsAsync(creds); return result; }
                        if (result.Error != "login_required") { acc.Status = "Exhausted"; await _credentialsService.SaveCredentialsAsync(creds); }
                        else { return result; }
                    }
                }
                return new SiteGenerationResult { Success = false, SourceSite = site, Error = "all_exhausted" };
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[Triple Mode - {site}] Hata: {ex.Message}");
                return new SiteGenerationResult { Success = false, SourceSite = site, Error = ex.Message };
            }
        }
        private ChromeDriver CreateDriver(string profileName, bool isAdmin)
        {
            if (_isCancelRequested)
                throw new OperationCanceledException("İptal isteği sebebiyle Chrome sürücüsü başlatılmadı.");

            bool acquired = _concurrencySemaphore.Wait(TimeSpan.FromSeconds(120));
            if (!acquired)
                throw new TimeoutException("Sunucu üzerindeki maksimum eşzamanlı Chrome kapasitesine ulaşıldı. Lütfen birkaç saniye sonra tekrar deneyin.");

            try
            {
                var options = new ChromeOptions();
                string profileDir = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, profileName);
                Directory.CreateDirectory(profileDir);
                options.AddArgument($"--user-data-dir={profileDir}");
                options.AddArgument("--disable-blink-features=AutomationControlled");
                options.AddExcludedArgument("enable-automation");
                options.AddArgument("--no-sandbox");
                options.AddArgument("--disable-dev-shm-usage");
                options.AddArgument("--disable-gpu");
                options.AddArgument("--remote-allow-origins=*");
                options.AddArgument("--user-agent=Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36");

                bool isHeadless = _configuration?.GetValue<bool>("SeleniumSettings:HeadlessMode") ?? false;
                if (isHeadless)
                {
                    options.AddArgument("--headless=new");
                }

                string downloadDir = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "temp_downloads");
                Directory.CreateDirectory(downloadDir);
                options.AddUserProfilePreference("download.default_directory", downloadDir);
                options.AddUserProfilePreference("download.prompt_for_download", false);
                options.AddUserProfilePreference("download.directory_upgrade", true);
                options.AddUserProfilePreference("safebrowsing.enabled", true);
                if (!isAdmin && !isHeadless)
                {
                    options.AddArgument("--window-position=-4000,-4000");
                    options.AddArgument("--window-size=1400,900");
                }
                else
                {
                    options.AddArgument("--window-size=1400,900");
                }

                if (_isCancelRequested)
                    throw new OperationCanceledException("İptal isteği sebebiyle Chrome sürücüsü başlatılmadı.");

                var driver = new ChromeDriver(options);
                driver.Manage().Timeouts().AsynchronousJavaScript = TimeSpan.FromSeconds(60);
                if (!isAdmin && !isHeadless)
                {
                    try { driver.Manage().Window.Position = new System.Drawing.Point(-4000, -4000); } catch { }
                }

                if (_isCancelRequested)
                {
                    try { driver.Quit(); driver.Dispose(); } catch { }
                    throw new OperationCanceledException("İptal isteği sebebiyle Chrome sürücüsü kapatıldı.");
                }

                RegisterDriver(driver);
                return driver;
            }
            catch
            {
                try { _concurrencySemaphore.Release(); } catch { }
                throw;
            }
        }
        private string BuildRatioInstruction(string aspectRatio)
        {
            if (string.IsNullOrEmpty(aspectRatio)) return "";
            return aspectRatio switch
            {
                "1:1" => " The image MUST be strictly 1:1 square aspect ratio.",
                "16:9" => " The image MUST be strictly 16:9 landscape widescreen aspect ratio.",
                "9:16" => " The image MUST be strictly 9:16 portrait vertical aspect ratio.",
                _ => $" The image MUST be in {aspectRatio} aspect ratio."
            };
        }
        private async Task<byte[]?> ExtractImageViaCanvasAsync(IWebDriver driver, IWebElement imgElement)
        {
            try
            {
                var js = (IJavaScriptExecutor)driver;
                for (int w = 0; w < 10; w++)
                {
                    var complete = (bool?)js.ExecuteScript("return arguments[0].complete && arguments[0].naturalWidth > 0;", imgElement) ?? false;
                    if (complete) break;
                    await Task.Delay(500);
                }
                string canvasScript = @"
                    var img = arguments[0];
                    try {
                        var canvas = document.createElement('canvas');
                        canvas.width = img.naturalWidth || img.width;
                        canvas.height = img.naturalHeight || img.height;
                        var ctx = canvas.getContext('2d');
                        ctx.drawImage(img, 0, 0);
                        return canvas.toDataURL('image/png');
                    } catch(e) {
                        return 'ERROR: ' + e.message;
                    }
                ";
                var result = js.ExecuteScript(canvasScript, imgElement);
                string dataUrl = result?.ToString() ?? "";
                if (dataUrl.StartsWith("data:image"))
                {
                    string base64Data = dataUrl.Substring(dataUrl.IndexOf(',') + 1);
                    var bytes = Convert.FromBase64String(base64Data);
                    Console.WriteLine($"[Selenium] Canvas extraction başarılı. Boyut: {bytes.Length} byte.");
                    return bytes;
                }
                Console.WriteLine($"[Selenium] Canvas extraction başarısız: {dataUrl}");
                return null;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[Selenium] Canvas extraction failed: {ex.Message}");
                return null;
            }
        }
        private async Task<byte[]?> DownloadOriginalImageAsync(IWebDriver driver, string src)
        {
            try
            {
                if (src.Contains("googleusercontent.com") && src.Contains("="))
                {
                    int equalIndex = src.LastIndexOf('=');
                    if (equalIndex > src.LastIndexOf('/'))
                        src = src.Substring(0, equalIndex) + "=s0";
                }
                else if (src.Contains("googleusercontent.com") && !src.Contains("="))
                {
                    src += "=s0";
                }
                Console.WriteLine($"[Selenium] İndirilecek orijinal görsel URL'si: {src}");
                if (src.StartsWith("blob:", StringComparison.OrdinalIgnoreCase))
                {
                    Console.WriteLine("[Selenium] blob: URL tespit edildi, canvas yöntemi kullanılacak (DownloadOriginalImageAsync'den null dönüyor).");
                    return null; 
                }
                try
                {
                    Console.WriteLine($"[Selenium] HttpClient ile indirme deneniyor...");
                    using var client = new System.Net.Http.HttpClient();
                    client.Timeout = TimeSpan.FromSeconds(30);
                    client.DefaultRequestHeaders.Add("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36");
                    var bytes = await client.GetByteArrayAsync(src);
                    if (bytes.Length > 1000)
                    {
                        Console.WriteLine($"[Selenium] HttpClient ile görsel başarıyla indirildi. Boyut: {bytes.Length} byte.");
                        return bytes;
                    }
                }
                catch (Exception httpEx)
                {
                    Console.WriteLine($"[Selenium] HttpClient başarısız: {httpEx.Message}, JS fetch deneniyor...");
                }
                var js = (IJavaScriptExecutor)driver;
                driver.Manage().Timeouts().AsynchronousJavaScript = TimeSpan.FromSeconds(30);
                string script = @"
                    var done = arguments[0];
                    var src = arguments[1];
                    fetch(src, {mode:'cors'})
                        .then(response => response.blob())
                        .then(blob => {
                            var reader = new FileReader();
                            reader.onloadend = function() { done(reader.result); };
                            reader.readAsDataURL(blob);
                        })
                        .catch(err => {
                            done('ERROR: ' + err.message);
                        });
                ";
                var result = js.ExecuteAsyncScript(script, src);
                string dataUrl = result?.ToString() ?? "";
                if (dataUrl.StartsWith("data:image"))
                {
                    string base64Data = dataUrl.Substring(dataUrl.IndexOf(',') + 1);
                    var fetchBytes = Convert.FromBase64String(base64Data);
                    Console.WriteLine($"[Selenium] JS fetch ile görsel indirildi. Boyut: {fetchBytes.Length} byte.");
                    return fetchBytes;
                }
                Console.WriteLine($"[Selenium] Tüm indirme yöntemleri başarısız: {dataUrl}");
                return null;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[Selenium] Image download failed: {ex.Message}");
                return null;
            }
        }
        private string DetectFileExtension(string dataUrl)
        {
            if (dataUrl.StartsWith("data:image/jpeg")) return ".jpg";
            if (dataUrl.StartsWith("data:image/webp")) return ".webp";
            if (dataUrl.StartsWith("data:image/gif")) return ".gif";
            return ".png";
        }
        private async Task<byte[]?> DownloadImageViaButtonAsync(IWebDriver driver, By downloadButtonSelector)
        {
            try
            {
                string downloadDir = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "temp_downloads");
                if (Directory.Exists(downloadDir))
                {
                    foreach (var file in Directory.GetFiles(downloadDir))
                    {
                        try { File.Delete(file); } catch { }
                    }
                }
                else
                {
                    Directory.CreateDirectory(downloadDir);
                }
                var btn = driver.FindElement(downloadButtonSelector);
                var js = (IJavaScriptExecutor)driver;
                js.ExecuteScript("arguments[0].scrollIntoView(true);", btn);
                await Task.Delay(500);
                try { btn.Click(); }
                catch { js.ExecuteScript("arguments[0].click();", btn); }
                string? downloadedFile = null;
                for (int i = 0; i < 30; i++)
                {
                    await Task.Delay(1000);
                    var files = Directory.GetFiles(downloadDir);
                    var file = files.FirstOrDefault(f => !f.EndsWith(".crdownload") && !f.EndsWith(".tmp"));
                    if (file != null)
                    {
                        await Task.Delay(500);
                        downloadedFile = file;
                        break;
                    }
                }
                if (downloadedFile != null)
                {
                    byte[] bytes = await File.ReadAllBytesAsync(downloadedFile);
                    try { File.Delete(downloadedFile); } catch { }
                    return bytes;
                }
                return null;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[Selenium] Native download failed: {ex.Message}");
                return null;
            }
        }
        private async Task<int> SaveImageToDb(byte[] imageBytes, string fileName, string category, string prompt, string modelUsed, string keyLabel, int userId, string sourceSite = "gemini", string? groupId = null, bool isSelected = true)
        {
            await _imageSyncService.SaveImageToAllDirectoriesAsync(imageBytes, fileName, category);
            string relPath = $"/generated-{category}/{fileName}";
            var savedImage = new GeneratedImage
            {
                Prompt = prompt,
                ImagePath = relPath,
                ModelUsed = modelUsed,
                KeyUsedLabel = keyLabel,
                ApiKeyId = 0,
                UserId = userId,
                CreatedAt = DateTime.Now,
                GroupId = groupId,
                IsSelected = isSelected,
                SourceSite = sourceSite
            };
            try
            {
                using var scope = _scopeFactory.CreateScope();
                var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
                db.GeneratedImages.Add(savedImage);
                await db.SaveChangesAsync();
            }
            catch (Exception dbEx)
            {
                Console.WriteLine($"[DB Save Warning] {dbEx.Message}");
            }
            return savedImage.Id;
        }
        private async Task<SiteGenerationResult> RunGeminiSession(GeminiAccountItem account, string prompt, string aspectRatio, int userId, bool isAdmin, string? groupId = null)
        {
            if (IsCancelRequested) return new SiteGenerationResult { Success = false, SourceSite = "gemini", Error = "cancelled" };
            IWebDriver? driver = null;
            try
            {
                Console.WriteLine($"[Gemini] Denenen Profil: #{account.Id} - {account.AccountLabel}");
                driver = await Task.Run(() => CreateDriver(account.ProfileName, isAdmin));
                driver.Navigate().GoToUrl("https://gemini.google.com/app");
                IWebElement? promptBox = null;
                for (int i = 0; i < 12; i++)
                {
                    if (IsCancelRequested) { try { driver?.Quit(); driver?.Dispose(); } catch { } return new SiteGenerationResult { Success = false, SourceSite = "gemini", Error = "cancelled" }; }
                    await Task.Delay(1000);
                    try
                    {
                        var elements = driver.FindElements(By.CssSelector("rich-textarea [contenteditable='true'], div[role='textbox'], textarea"));
                        foreach (var el in elements)
                        {
                            if (el.Displayed && el.Enabled) { promptBox = el; break; }
                        }
                        if (promptBox != null) break;
                    }
                    catch { }
                }
                if (promptBox == null)
                {
                    string currentUrl = driver.Url;
                    if (currentUrl.Contains("accounts.google.com") || currentUrl.Contains("signin"))
                        return new SiteGenerationResult { Success = false, SourceSite = "gemini", Error = "login_required" };
                    return new SiteGenerationResult { Success = false, SourceSite = "gemini", Error = "prompt_not_found" };
                }
                string ratioInstr = BuildRatioInstruction(aspectRatio);
                string imagePrompt = $"Generate a high quality photo/image of: {prompt}.{ratioInstr} Do not write any text explanation, just output the generated image.";
                promptBox.Click();
                promptBox.SendKeys(imagePrompt);
                await Task.Delay(500);
                try
                {
                    var sendButtons = driver.FindElements(By.CssSelector("button[aria-label*='Send'], button[aria-label*='Gönder'], button.send-button, button[mattooltip*='Send']"));
                    bool clicked = false;
                    foreach (var btn in sendButtons)
                    {
                        if (btn.Displayed && btn.Enabled) { btn.Click(); clicked = true; break; }
                    }
                    if (!clicked) promptBox.SendKeys(Keys.Enter);
                }
                catch { promptBox.SendKeys(Keys.Enter); }
                Console.WriteLine($"[Gemini] Prompt Gönderildi, görsel bekleniyor...");
                IWebElement? generatedImg = null;
                bool errorFound = false;
                for (int i = 0; i < 45; i++)
                {
                    await Task.Delay(1000);
                    try
                    {
                        var msgContents = driver.FindElements(By.CssSelector("message-content, model-response"));
                        var lastMsg = msgContents.LastOrDefault();
                        if (lastMsg != null)
                        {
                            string text = lastMsg.Text.ToLower();
                            if (text.Contains("üretilemedi") || text.Contains("oluşturamıyorum") || text.Contains("can't generate") || text.Contains("cannot generate") || text.Contains("could not create"))
                            {
                                errorFound = true;
                                Console.WriteLine("[Gemini] Hata metni algılandı: Görsel üretilemedi.");
                                break;
                            }
                        }
                        var imgs = driver.FindElements(By.CssSelector("model-response img, message-content img, .chat-window img, img[src*='googleusercontent.com'], img[src*='ggpht.com']"));
                        foreach (var img in imgs.Reverse())
                        {
                            if (img.Displayed && img.Size.Width > 150 && img.Size.Height > 150) { generatedImg = img; break; }
                        }
                        if (generatedImg != null) break;
                    }
                    catch { }
                }
                if (errorFound)
                    return new SiteGenerationResult { Success = false, SourceSite = "gemini", Error = "generation_failed" };
                if (generatedImg == null)
                    return new SiteGenerationResult { Success = false, SourceSite = "gemini", Error = "exhausted" };
                byte[]? imageBytes = null;
                Console.WriteLine("[Gemini] Canvas ile orijinal görsel çekiliyor...");
                imageBytes = await ExtractImageViaCanvasAsync(driver, generatedImg);
                if (imageBytes == null || imageBytes.Length < 1000)
                {
                    Console.WriteLine("[Gemini] Canvas başarısız. URL tabanlı indirme deneniyor...");
                    string? src = generatedImg.GetAttribute("src");
                    if (!string.IsNullOrEmpty(src))
                    {
                        imageBytes = await DownloadOriginalImageAsync(driver, src);
                    }
                }
                if (imageBytes == null || imageBytes.Length < 1000)
                {
                    Console.WriteLine("[Gemini] Tüm yöntemler başarısız, screenshot fallback deneniyor...");
                    for (int retry = 0; retry < 3; retry++)
                    {
                        try
                        {
                            IWebElement? freshImg = null;
                            var imgs = driver.FindElements(By.CssSelector("model-response img, message-content img, .chat-window img, img[src*='googleusercontent.com'], img[src*='ggpht.com']"));
                            foreach (var img in imgs.Reverse()) {
                                try { if (img.Displayed && img.Size.Width > 150 && img.Size.Height > 150) { freshImg = img; break; } } catch {}
                            }
                            var elementToCapture = freshImg;
                            if (elementToCapture == null) {
                                var allImgs = driver.FindElements(By.TagName("img"));
                                elementToCapture = allImgs.LastOrDefault(i => { try { return i.Displayed && i.Size.Width > 150; } catch { return false; } });
                            }
                            if (elementToCapture == null) throw new Exception("No image found for screenshot");
                            var jsExecutor = (IJavaScriptExecutor)driver;
                            jsExecutor.ExecuteScript("arguments[0].scrollIntoView(true);", elementToCapture);
                            await Task.Delay(500);
                            var screenshot = ((ITakesScreenshot)elementToCapture).GetScreenshot();
                            imageBytes = screenshot.AsByteArray;
                            break;
                        }
                        catch (Exception ex)
                        {
                            Console.WriteLine($"[Gemini] Screenshot fallback attempt {retry + 1} failed: {ex.Message}");
                            await Task.Delay(1000);
                        }
                    }
                }
                if (imageBytes == null || imageBytes.Length < 1000)
                    return new SiteGenerationResult { Success = false, SourceSite = "gemini", Error = "download_failed" };
                string groupPrefix = !string.IsNullOrEmpty(groupId) ? $"triple_{groupId}_" : "";
                string fileName = $"mega-image-studio-u{userId}-{groupPrefix}gemini-web-{DateTime.Now:yyyyMMdd-HHmmss}-{Guid.NewGuid().ToString()[..6]}.png";
                string keyLabel = $"{account.AccountLabel} ({account.ProfileName})";
                int imageId = await SaveImageToDb(imageBytes, fileName, "gemini", prompt, "Google Gemini Web", keyLabel, userId, "gemini", groupId, true);
                Console.WriteLine($"[Gemini] Başarılı! ImageId={imageId}");
                return new SiteGenerationResult
                {
                    Success = true, SourceSite = "gemini",
                    ImagePath = $"/generated-gemini/{fileName}",
                    ModelUsed = "Google Gemini Web",
                    KeyUsedLabel = keyLabel,
                    ImageId = imageId
                };
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[Gemini Error] {ex.Message}");
                return new SiteGenerationResult { Success = false, SourceSite = "gemini", Error = ex.Message };
            }
            finally
            {
                UnregisterDriver(driver);
                if (driver != null) { try { driver.Quit(); driver.Dispose(); } catch { } }
            }
        }
        private bool CheckForChatGptWarningOrLimit(IWebDriver driver, out string warningMsg)
        {
            warningMsg = "";
            try
            {
                var popups = driver.FindElements(By.CssSelector("[role='dialog'], [role='alert'], .modal, div[class*='dialog'], div[class*='modal'], div[class*='toast'], div[class*='banner'], [id*='radix']"));
                foreach (var popup in popups)
                {
                    try
                    {
                        if (popup.Displayed)
                        {
                            string text = popup.Text.ToLowerInvariant();
                            if (text.Contains("limit") || text.Contains("too many") || text.Contains("try again") ||
                                text.Contains("rate") || text.Contains("upgrade") || text.Contains("bekleyin") ||
                                text.Contains("ulaştınız") || text.Contains("error") || text.Contains("hata") ||
                                text.Contains("cap") || text.Contains("quota") || text.Contains("exceeded") ||
                                text.Contains("dall-e") || text.Contains("message limit"))
                            {
                                warningMsg = $"Açılır Pencere/Modal Uyarısı: {popup.Text.Trim().Replace("\n", " ")}";
                                return true;
                            }
                        }
                    }
                    catch { }
                }

                var messages = driver.FindElements(By.CssSelector("[data-message-author-role='assistant'], .markdown, .result-streaming, .text-message, div[class*='danger'], div[class*='error'], div[class*='warning']"));
                foreach (var msg in messages.Reverse())
                {
                    try
                    {
                        if (msg.Displayed)
                        {
                            string text = msg.Text.ToLowerInvariant();
                            if (text.Contains("can't generate") || text.Contains("cannot create") || text.Contains("unable to generate") ||
                                text.Contains("i'm not able") || text.Contains("couldn't generate") || text.Contains("reached your limit") ||
                                text.Contains("rate limit") || text.Contains("too many requests") || text.Contains("try again later") ||
                                text.Contains("limitinize ulaştınız") || text.Contains("günlük limit") || text.Contains("saatlik limit") ||
                                text.Contains("hızlı istek"))
                            {
                                warningMsg = $"Sayfa İçi Uyarı Metni: {msg.Text.Trim().Replace("\n", " ")}";
                                return true;
                            }
                        }
                    }
                    catch { }
                }
            }
            catch { }
            return false;
        }

        private async Task<SiteGenerationResult> RunChatGptSession(ChatGptAccountItem account, string prompt, string aspectRatio, int userId, bool isAdmin, string? groupId = null)
        {
            if (IsCancelRequested) return new SiteGenerationResult { Success = false, SourceSite = "chatgpt", Error = "cancelled" };
            IWebDriver? driver = null;
            try
            {
                Console.WriteLine($"[ChatGPT] Denenen Profil: #{account.Id} - {account.AccountLabel}");
                driver = await Task.Run(() => CreateDriver(account.ProfileName, isAdmin));
                driver.Navigate().GoToUrl("https://chatgpt.com/");
                IWebElement? promptBox = null;
                for (int i = 0; i < 15; i++)
                {
                    if (IsCancelRequested) { try { driver?.Quit(); driver?.Dispose(); } catch { } return new SiteGenerationResult { Success = false, SourceSite = "chatgpt", Error = "cancelled" }; }
                    await Task.Delay(1000);
                    if (CheckForChatGptWarningOrLimit(driver, out var initWarn))
                    {
                        Console.WriteLine($"[ChatGPT] Oturum açılışında limit/uyarı algılandı ({initWarn}). Pencere kapatılıp sıradaki hesaba geçiliyor...");
                        return new SiteGenerationResult { Success = false, SourceSite = "chatgpt", Error = "exhausted" };
                    }
                    try
                    {
                        var elements = driver.FindElements(By.CssSelector("#prompt-textarea, div[contenteditable='true'][id='prompt-textarea'], textarea[placeholder], div[role='textbox']"));
                        foreach (var el in elements)
                        {
                            if (el.Displayed && el.Enabled) { promptBox = el; break; }
                        }
                        if (promptBox != null) break;
                    }
                    catch { }
                }
                if (promptBox == null)
                {
                    string currentUrl = driver.Url;
                    ((ITakesScreenshot)driver).GetScreenshot().SaveAsFile(Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "chatgpt_fail.png"));
                    if (currentUrl.Contains("auth") || currentUrl.Contains("login"))
                        return new SiteGenerationResult { Success = false, SourceSite = "chatgpt", Error = "login_required" };
                    return new SiteGenerationResult { Success = false, SourceSite = "chatgpt", Error = "prompt_not_found" };
                }
                string ratioInstr = BuildRatioInstruction(aspectRatio);
                string imagePrompt = $"Generate a high quality image of: {prompt}.{ratioInstr} Just create and show the image, no text explanation.";
                var js = (IJavaScriptExecutor)driver;
                try { promptBox.Click(); } catch { js.ExecuteScript("arguments[0].click();", promptBox); }
                try { promptBox.SendKeys(Keys.Control + "a"); promptBox.SendKeys(Keys.Delete); } catch { }
                try { promptBox.SendKeys(imagePrompt); } 
                catch { 
                    js.ExecuteScript("arguments[0].innerText = arguments[1]; arguments[0].dispatchEvent(new Event('input', { bubbles: true }));", promptBox, imagePrompt); 
                }
                await Task.Delay(1000);
                try
                {
                    var sendButtons = driver.FindElements(By.CssSelector("button[data-testid='send-button'], button[aria-label='Send message'], button[aria-label='Send prompt'], button[aria-label*='Send'], button[aria-label*='Gönder']"));
                    bool clicked = false;
                    foreach (var btn in sendButtons)
                    {
                        if (btn.Displayed && btn.Enabled) 
                        { 
                            try { btn.Click(); } catch { js.ExecuteScript("arguments[0].click();", btn); }
                            clicked = true; 
                            break; 
                        }
                    }
                    if (!clicked) {
                        try { promptBox.SendKeys(Keys.Enter); } catch { }
                    }
                }
                catch { try { promptBox.SendKeys(Keys.Enter); } catch { } }
                Console.WriteLine("[ChatGPT] Prompt gönderildi, görsel bekleniyor...");
                IWebElement? generatedImg = null;
                bool errorFound = false;
                for (int i = 0; i < 90; i++)
                {
                    await Task.Delay(1000);
                    if (CheckForChatGptWarningOrLimit(driver, out var warnMsg))
                    {
                        Console.WriteLine($"[ChatGPT] Üretim beklemesinde limit/uyarı algılandı ({warnMsg}). Pencere derhal kapatılıp sonraki hesaba geçiliyor...");
                        errorFound = true;
                        break;
                    }
                    try
                    {
                        var isStreaming = driver.FindElements(By.CssSelector(".result-streaming")).Any();
                        if (isStreaming)
                        {
                            continue; 
                        }
                        var imgs = driver.FindElements(By.CssSelector("[data-message-author-role='assistant'] img, .markdown img, img[src*='oaidalleapiprodscus'], img[src*='openai'], img[alt*='Generated'], article img, .agent-turn img"));
                        foreach (var img in imgs.Reverse())
                        {
                            try { if (img.Displayed && img.Size.Width > 250 && img.Size.Height > 250) { generatedImg = img; break; } } catch {}
                        }
                        if (generatedImg != null)
                        {
                            Console.WriteLine($"[ChatGPT] Görsel bulundu! ({generatedImg.TagName})");
                            await Task.Delay(3000); 
                            break;
                        }
                    }
                    catch { }
                }
                if (errorFound)
                    return new SiteGenerationResult { Success = false, SourceSite = "chatgpt", Error = "exhausted" };
                if (generatedImg == null)
                {
                    Console.WriteLine("[ChatGPT] Görsel 90 saniye içinde bulunamadı. Debug screenshot kaydediliyor...");
                    try { ((ITakesScreenshot)driver).GetScreenshot().SaveAsFile(Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "chatgpt_exhausted_debug.png")); } catch { }
                    return new SiteGenerationResult { Success = false, SourceSite = "chatgpt", Error = "exhausted" };
                }
                byte[]? imageBytes = null;
                Console.WriteLine("[ChatGPT] Canvas ile orijinal görsel çekiliyor...");
                imageBytes = await ExtractImageViaCanvasAsync(driver, generatedImg);
                if (imageBytes == null || imageBytes.Length < 1000)
                {
                    Console.WriteLine("[ChatGPT] Canvas başarısız. URL tabanlı indirme deneniyor...");
                    string? src = generatedImg.GetAttribute("src");
                    if (!string.IsNullOrEmpty(src) && !src.StartsWith("blob:"))
                    {
                        try
                        {
                            using var client = new System.Net.Http.HttpClient();
                            client.Timeout = TimeSpan.FromSeconds(30);
                            client.DefaultRequestHeaders.Add("User-Agent", "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36");
                            imageBytes = await client.GetByteArrayAsync(src);
                            Console.WriteLine($"[ChatGPT] HttpClient ile görsel indirildi. Boyut: {imageBytes.Length} byte.");
                        }
                        catch (Exception httpEx)
                        {
                            Console.WriteLine($"[ChatGPT] HttpClient başarısız: {httpEx.Message}");
                        }
                    }
                }
                if (imageBytes == null || imageBytes.Length < 1000)
                {
                    Console.WriteLine("[ChatGPT] Tüm yöntemler başarısız, screenshot fallback deneniyor...");
                    for (int retry = 0; retry < 3; retry++)
                    {
                        try
                        {
                            IWebElement? freshImg = null;
                            var imgs = driver.FindElements(By.CssSelector("[data-message-author-role='assistant'] img, .markdown img, img[src*='oaidalleapiprodscus'], img[src*='openai'], img[alt*='Generated']"));
                            foreach (var img in imgs.Reverse()) {
                                try { if (img.Displayed && img.Size.Width > 100 && img.Size.Height > 100) { freshImg = img; break; } } catch {}
                            }
                            var elementToCapture = freshImg;
                            if (elementToCapture == null) {
                                var allImgs = driver.FindElements(By.TagName("img"));
                                elementToCapture = allImgs.LastOrDefault(i => { try { return i.Displayed && i.Size.Width > 100; } catch { return false; } });
                            }
                            if (elementToCapture == null) throw new Exception("No image found for screenshot");
                            var jsExecutor = (IJavaScriptExecutor)driver;
                            jsExecutor.ExecuteScript("arguments[0].scrollIntoView(true);", elementToCapture);
                            await Task.Delay(500);
                            var screenshot = ((ITakesScreenshot)elementToCapture).GetScreenshot();
                            imageBytes = screenshot.AsByteArray;
                            break;
                        }
                        catch (Exception ex)
                        {
                            Console.WriteLine($"[ChatGPT] Screenshot fallback attempt {retry + 1} failed: {ex.Message}");
                            await Task.Delay(1000);
                        }
                    }
                }
                if (imageBytes == null || imageBytes.Length < 1000)
                    return new SiteGenerationResult { Success = false, SourceSite = "chatgpt", Error = "download_failed" };
                string groupPrefix = !string.IsNullOrEmpty(groupId) ? $"triple_{groupId}_" : "";
                string fileName = $"mega-image-studio-u{userId}-{groupPrefix}chatgpt-web-{DateTime.Now:yyyyMMdd-HHmmss}-{Guid.NewGuid().ToString()[..6]}.png";
                string keyLabel = $"{account.AccountLabel} ({account.ProfileName})";
                int imageId = await SaveImageToDb(imageBytes, fileName, "chatgpt", prompt, "ChatGPT Web (DALL-E)", keyLabel, userId, "chatgpt", groupId, true);
                Console.WriteLine($"[ChatGPT] Başarılı! ImageId={imageId}");
                return new SiteGenerationResult
                {
                    Success = true, SourceSite = "chatgpt",
                    ImagePath = $"/generated-chatgpt/{fileName}",
                    ModelUsed = "ChatGPT Web (DALL-E)",
                    KeyUsedLabel = keyLabel,
                    ImageId = imageId
                };
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[ChatGPT Error] {ex.Message}");
                return new SiteGenerationResult { Success = false, SourceSite = "chatgpt", Error = ex.Message };
            }
            finally
            {
                UnregisterDriver(driver);
                if (driver != null) { try { driver.Quit(); driver.Dispose(); } catch { } }
            }
        }
        private async Task<SiteGenerationResult> RunCopilotSession(CopilotAccountItem account, string prompt, string aspectRatio, int userId, bool isAdmin, string? groupId = null)
        {
            if (IsCancelRequested) return new SiteGenerationResult { Success = false, SourceSite = "copilot", Error = "cancelled" };
            IWebDriver? driver = null;
            try
            {
                Console.WriteLine($"[Copilot] Denenen Profil: #{account.Id} - {account.AccountLabel}");
                driver = await Task.Run(() => CreateDriver(account.ProfileName, isAdmin));
                driver.Navigate().GoToUrl("https://copilot.microsoft.com/images/create");
                IWebElement? promptBox = null;
                for (int i = 0; i < 15; i++)
                {
                    if (IsCancelRequested) { try { driver?.Quit(); driver?.Dispose(); } catch { } return new SiteGenerationResult { Success = false, SourceSite = "copilot", Error = "cancelled" }; }
                    await Task.Delay(1000);
                    try
                    {
                        var elements = driver.FindElements(By.CssSelector("#sbox textarea, #sbox input, form textarea, form input[type='text'], textarea[id='userInput'], textarea[id='sb_form_q'], input[id='sb_form_q'], #searchbox, [data-testid='chat-input-textarea'], textarea"));
                        foreach (var el in elements)
                        {
                            if (el.Displayed && el.Enabled) { promptBox = el; break; }
                        }
                        if (promptBox != null) break;
                    }
                    catch { }
                }
                if (promptBox == null)
                {
                    string currentUrl = driver.Url;
                    Console.WriteLine($"[Copilot Error] Prompt kutusu bulunamadı. URL: {currentUrl}");
                    try { ((ITakesScreenshot)driver).GetScreenshot().SaveAsFile(Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "copilot_fail.png")); } catch { }
                    if (currentUrl.Contains("login") || currentUrl.Contains("auth") || currentUrl.Contains("bing.com/images/create/ai-image-generator"))
                        return new SiteGenerationResult { Success = false, SourceSite = "copilot", Error = "login_required" };
                    return new SiteGenerationResult { Success = false, SourceSite = "copilot", Error = "prompt_not_found" };
                }
                string ratioInstr = BuildRatioInstruction(aspectRatio);
                string imagePrompt = $"{prompt}{ratioInstr}";
                var js = (IJavaScriptExecutor)driver;
                try { promptBox.Click(); } catch { js.ExecuteScript("arguments[0].click();", promptBox); }
                try { promptBox.SendKeys(Keys.Control + "a"); promptBox.SendKeys(Keys.Delete); } catch { }
                try { promptBox.SendKeys(imagePrompt); } 
                catch { 
                    js.ExecuteScript("arguments[0].value = arguments[1]; arguments[0].dispatchEvent(new Event('input', { bubbles: true })); arguments[0].dispatchEvent(new Event('change', { bubbles: true }));", promptBox, imagePrompt); 
                }
                await Task.Delay(1500);
                bool submitClicked = false;
                try
                {
                    var createBtn = driver.FindElements(By.CssSelector("#create_btn_c, .create-btn, [data-testid='chat-send-button'], button[aria-label='Submit'], button[aria-label='Gönder']")).FirstOrDefault(b => { try { return b.Displayed && b.Enabled; } catch { return false; } });
                    if (createBtn != null)
                    {
                        Console.WriteLine($"[Copilot] Gönder butonu bulundu: {createBtn.TagName}");
                        try { createBtn.Click(); } catch { js.ExecuteScript("arguments[0].click();", createBtn); }
                        submitClicked = true;
                    }
                }
                catch { }
                if (!submitClicked)
                {
                    Console.WriteLine("[Copilot] Buton bulunamadı veya tıklanamadı, Enter tuşu ile gönderiliyor...");
                    try { promptBox.SendKeys(Keys.Enter); submitClicked = true; } catch { }
                }
                Console.WriteLine("[Copilot] Prompt gönderildi, görsel bekleniyor...");
                string startUrl = driver.Url;
                bool urlChanged = false;
                for (int w = 0; w < 15; w++)
                {
                    await Task.Delay(1000);
                    string currentUrl = driver.Url;
                    if (currentUrl != startUrl)
                    {
                        Console.WriteLine($"[Copilot] URL değişti: {currentUrl}");
                        urlChanged = true;
                        break;
                    }
                }
                if (!urlChanged)
                {
                    Console.WriteLine("[Copilot] URL değişmedi, güvenli buton tıklama ile tekrar deneniyor...");
                    try
                    {
                        js.ExecuteScript(@"
                            var btn = document.getElementById('create_btn_c') || document.querySelector('.create-btn');
                            if (btn) btn.click();
                        ");
                        await Task.Delay(2000);
                        var newPromptBox = driver.FindElements(By.CssSelector("textarea[id='userInput'], [data-testid='chat-input-textarea']")).FirstOrDefault(e => { try { return e.Displayed && e.Enabled; } catch { return false; } });
                        if (newPromptBox != null)
                        {
                            newPromptBox.SendKeys(Keys.Enter);
                            await Task.Delay(3000);
                        }
                    }
                    catch { }
                    for (int w = 0; w < 10; w++)
                    {
                        await Task.Delay(1000);
                        if (driver.Url != startUrl)
                        {
                            Console.WriteLine($"[Copilot] URL sonunda değişti: {driver.Url}");
                            break;
                        }
                    }
                    if (driver.Url == startUrl)
                    {
                        Console.WriteLine("[Copilot] URL hala değişmedi! Screenshot kaydediliyor...");
                        try { ((ITakesScreenshot)driver).GetScreenshot().SaveAsFile(Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "copilot_submit_fail.png")); } catch { }
                    }
                }
                byte[]? imageBytes = null;
                bool errorFound = false;
                for (int i = 0; i < 90; i++)
                {
                    await Task.Delay(1000);
                    try
                    {
                        var errMsgs = driver.FindElements(By.CssSelector(".gil_err_mt, .text-danger, .error-message, #gilen_ban"));
                        if (errMsgs.Any(e => { try { return e.Displayed; } catch { return false; } }))
                        {
                            errorFound = true;
                            Console.WriteLine("[Copilot] Hata metni veya engellenmiş prompt algılandı.");
                            break;
                        }
                        var loading = driver.FindElements(By.CssSelector(".gir_mmimg.lodcnt, .giloader, #gir_async, .loading"));
                        bool stillLoading = loading.Any(l => { try { return l.Displayed; } catch { return false; } });
                        if (stillLoading && i < 80)
                        {
                            if (i % 10 == 0) Console.WriteLine($"[Copilot] Hala üretiliyor... ({i}s)");
                            continue;
                        }
                        var allImgs = driver.FindElements(By.TagName("img"));
                        var firstImg = allImgs.FirstOrDefault(i => {
                            try {
                                return i.Displayed && i.Size.Width > 150 && i.Size.Height > 150 && 
                                       ((i.GetAttribute("src") ?? "").Contains("OIG") || (i.GetAttribute("alt") ?? "").Contains("Image generated"));
                            } catch { return false; }
                        });
                        if (firstImg == null) {
                            firstImg = allImgs.FirstOrDefault(i => {
                                try {
                                    var src = i.GetAttribute("src") ?? "";
                                    return i.Displayed && i.Size.Width > 250 && i.Size.Height > 250 && !src.Contains("logo") && !src.Contains("icon");
                                } catch { return false; }
                            });
                        }
                        if (firstImg != null)
                        {
                            Console.WriteLine($"[Copilot] Görsel bulundu! (Tag: {firstImg.TagName}, W: {firstImg.Size.Width}). Çekiliyor...");
                            var downloadBtn = driver.FindElements(By.CssSelector("a#downl, a[download], [data-testid='download-button'], a[aria-label='Download'], a[aria-label='İndir']")).FirstOrDefault(b => { try { return b.Displayed && b.Enabled; } catch { return false; } });
                            if (downloadBtn != null)
                            {
                                Console.WriteLine("[Copilot] İndir (Download) butonu bulundu. Dosya sistemine indiriliyor...");
                                try { downloadBtn.Click(); } catch { js.ExecuteScript("arguments[0].click();", downloadBtn); }
                                await Task.Delay(2000);
                                imageBytes = await ExtractImageViaCanvasAsync(driver, firstImg); 
                            }
                            try { firstImg.Click(); } catch { js.ExecuteScript("arguments[0].click();", firstImg); }
                            await Task.Delay(2000);
                            var largeImg = driver.FindElements(By.TagName("img")).FirstOrDefault(i2 => { try { return i2.Displayed && i2.Size.Width > 300 && ((i2.GetAttribute("src") ?? "").Contains("OIG") || (i2.GetAttribute("alt") ?? "").Contains("Image generated")); } catch { return false; } });
                            if (largeImg == null) largeImg = firstImg; 
                            if (imageBytes == null || imageBytes.Length < 1000)
                            {
                                Console.WriteLine("[Copilot] Büyük resim bulundu, Canvas ile çekiliyor...");
                                imageBytes = await ExtractImageViaCanvasAsync(driver, largeImg);
                            }
                            if (imageBytes == null || imageBytes.Length < 1000)
                            {
                                string? largeSrc = largeImg.GetAttribute("src");
                                if (!string.IsNullOrEmpty(largeSrc))
                                {
                                    if (largeSrc.Contains("th?id=OIG"))
                                    {
                                        int qIndex = largeSrc.IndexOf('?');
                                        if (qIndex > 0) largeSrc = largeSrc.Substring(0, qIndex); 
                                    }
                                    Console.WriteLine($"[Copilot] Canvas başarısız, orijinal URL indiriliyor: {largeSrc}");
                                    imageBytes = await DownloadOriginalImageAsync(driver, largeSrc);
                                }
                            }
                            if (imageBytes == null || imageBytes.Length < 1000)
                            {
                                Console.WriteLine("[Copilot] Tüm indirme yöntemleri başarısız, screenshot fallback deneniyor...");
                                try
                                {
                                    var jsExecutor = (IJavaScriptExecutor)driver;
                                    jsExecutor.ExecuteScript("arguments[0].scrollIntoView(true);", largeImg);
                                    await Task.Delay(500);
                                    var screenshot = ((ITakesScreenshot)largeImg).GetScreenshot();
                                    imageBytes = screenshot.AsByteArray;
                                }
                                catch (Exception ex)
                                {
                                    Console.WriteLine($"[Copilot] Screenshot fallback failed: {ex.Message}");
                                }
                            }
                            if (imageBytes != null && imageBytes.Length > 1000) break;
                        }
                    }
                    catch { }
                }
                if (errorFound)
                    return new SiteGenerationResult { Success = false, SourceSite = "copilot", Error = "generation_failed" };
                if (imageBytes == null || imageBytes.Length < 1000)
                    return new SiteGenerationResult { Success = false, SourceSite = "copilot", Error = "download_failed_or_exhausted" };
                string groupPrefix = !string.IsNullOrEmpty(groupId) ? $"triple_{groupId}_" : "";
                string fileName = $"mega-image-studio-u{userId}-{groupPrefix}copilot-web-{DateTime.Now:yyyyMMdd-HHmmss}-{Guid.NewGuid().ToString()[..6]}.png";
                string keyLabel = $"{account.AccountLabel} ({account.ProfileName})";
                int imageId = await SaveImageToDb(imageBytes, fileName, "copilot", prompt, "Microsoft Copilot (DALL-E 3)", keyLabel, userId, "copilot", groupId, true);
                Console.WriteLine($"[Copilot] BaÅŸarÄ±lÄ±! ImageId={imageId}");
                return new SiteGenerationResult
                {
                    Success = true, SourceSite = "copilot",
                    ImagePath = $"/generated-copilot/{fileName}",
                    ModelUsed = "Microsoft Copilot (DALL-E 3)",
                    KeyUsedLabel = keyLabel,
                    ImageId = imageId
                };
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[Copilot Error] {ex.Message}");
                return new SiteGenerationResult { Success = false, SourceSite = "copilot", Error = ex.Message };
            }
            finally
            {
                UnregisterDriver(driver);
                if (driver != null) { try { driver.Quit(); driver.Dispose(); } catch { } }
            }
        }
        private static string ExtractEmailFromAccountLabel(string label)
        {
            try
            {
                if (string.IsNullOrWhiteSpace(label)) return "";
                if (label.Contains("(") && label.Contains(")"))
                {
                    int start = label.IndexOf("(") + 1;
                    int end = label.IndexOf(")", start);
                    if (end > start)
                    {
                        string candidate = label.Substring(start, end - start).Trim();
                        if (candidate.Contains("@")) return candidate;
                    }
                }
            }
            catch { }
            return "";
        }

        public async Task<bool> OpenBrowserForLoginAsync(string site, int profileId = 1)
        {
            try
            {
                var creds = await _credentialsService.GetCredentialsAsync();
                string profName;
                string targetUrl;
                string email = "";

                if (site == "chatgpt")
                {
                    var acc = creds.ChatGptAccounts?.FirstOrDefault(a => a.Id == profileId);
                    profName = acc?.ProfileName ?? $"ChatGptChromeProfile_{profileId}";
                    email = ExtractEmailFromAccountLabel(acc?.AccountLabel ?? "");
                    targetUrl = !string.IsNullOrEmpty(email) 
                        ? $"https://chatgpt.com/auth/login" 
                        : "https://chatgpt.com/";
                }
                else if (site == "copilot")
                {
                    var acc = creds.CopilotAccounts?.FirstOrDefault(a => a.Id == profileId);
                    profName = acc?.ProfileName ?? $"CopilotChromeProfile_{profileId}";
                    email = ExtractEmailFromAccountLabel(acc?.AccountLabel ?? "");
                    targetUrl = !string.IsNullOrEmpty(email) 
                        ? $"https://login.live.com/login.srf?username={Uri.EscapeDataString(email)}" 
                        : "https://copilot.microsoft.com/images/create";
                }
                else 
                {
                    var acc = creds.GeminiAccounts?.FirstOrDefault(a => a.Id == profileId);
                    profName = acc?.ProfileName ?? $"GeminiChromeProfile_{profileId}";
                    email = ExtractEmailFromAccountLabel(acc?.AccountLabel ?? "");
                    targetUrl = !string.IsNullOrEmpty(email) 
                        ? $"https://accounts.google.com/ServiceLogin?Email={Uri.EscapeDataString(email)}&continue=https%3A%2F%2Fgemini.google.com%2Fapp" 
                        : "https://gemini.google.com/app";
                }

                string profileDir = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, profName);
                Directory.CreateDirectory(profileDir);

                try
                {
                    string lock1 = Path.Combine(profileDir, "SingletonLock");
                    if (File.Exists(lock1)) File.Delete(lock1);
                    string lock2 = Path.Combine(profileDir, "SingletonSocket");
                    if (File.Exists(lock2)) File.Delete(lock2);
                    string lock3 = Path.Combine(profileDir, "SingletonCookie");
                    if (File.Exists(lock3)) File.Delete(lock3);
                }
                catch { }

                string chromePath = @"C:\Program Files\Google\Chrome\Application\chrome.exe";
                if (!File.Exists(chromePath))
                {
                    chromePath = @"C:\Program Files (x86)\Google\Chrome\Application\chrome.exe";
                }

                if (File.Exists(chromePath))
                {
                    var psi = new System.Diagnostics.ProcessStartInfo
                    {
                        FileName = chromePath,
                        Arguments = $"\"{targetUrl}\" --user-data-dir=\"{profileDir}\" --start-maximized --disable-blink-features=AutomationControlled",
                        UseShellExecute = true
                    };
                    System.Diagnostics.Process.Start(psi);
                    Console.WriteLine($"[{site} Login] Process.Start ile Chrome doğrudan masaüstünde açıldı ({profName}).");
                    return true;
                }

                var options = new ChromeOptions();
                options.AddArgument($"--user-data-dir={profileDir}");
                options.AddArgument("--disable-blink-features=AutomationControlled");
                options.AddExcludedArgument("enable-automation");
                options.AddArgument("--start-maximized");
                options.AddArgument("--remote-allow-origins=*");

                var driver = await Task.Run(() => new ChromeDriver(options));
                RegisterDriver(driver);
                driver.Navigate().GoToUrl(targetUrl);
                Console.WriteLine($"[{site} Login] Chrome ekranda tam ekran açıldı ({profName}). Yönetici oturum açabilir.");
                return true;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[{site} Login Error] {ex.Message}");
                return false;
            }
        }
    }
}