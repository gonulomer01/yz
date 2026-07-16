using System;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using OpenQA.Selenium;
using OpenQA.Selenium.Chrome;
using yz.Data;
using yz.Models;

namespace yz.Services
{
    public class GeminiSeleniumService
    {
        private readonly ApplicationDbContext _context;
        private readonly ImageSyncService _imageSyncService;
        private readonly AiCredentialsService _credentialsService;

        public GeminiSeleniumService(ApplicationDbContext context, ImageSyncService imageSyncService, AiCredentialsService credentialsService)
        {
            _context = context;
            _imageSyncService = imageSyncService;
            _credentialsService = credentialsService;
        }

        public async Task<(int StatusCode, object Response)> GenerateImageAsync(string prompt, string aspectRatio, int userId = 0, bool isAdmin = false, bool useIncognito = false, string site = "gemini")
        {
            var creds = await _credentialsService.GetCredentialsAsync();
            var profiles = creds.GeminiAccounts.OrderBy(a => a.Id).ToList();
            int currentIdx = creds.CurrentGeminiProfileIndex;

            if (!profiles.Any())
            {
                return (400, new { error = "Panel'den en az bir Gemini hesap profili ekleyin." });
            }

            int totalProfiles = profiles.Count;

            for (int attempt = 0; attempt < totalProfiles; attempt++)
            {
                int evalIdx = (currentIdx + attempt) % totalProfiles;
                var accountObj = profiles[evalIdx];

                if (accountObj.Status == "Exhausted")
                    continue;

                Console.WriteLine($"[Gemini Selenium] Denenen Profil: #{accountObj.Id} - {accountObj.AccountLabel} ({accountObj.ProfileName}), UserId: {userId}, IsAdmin: {isAdmin}");

                IWebDriver? driver = null;
                try
                {
                    var options = new ChromeOptions();
                    string profileDir = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, accountObj.ProfileName);
                    Directory.CreateDirectory(profileDir);
                    options.AddArgument($"--user-data-dir={profileDir}");
                    options.AddArgument("--disable-blink-features=AutomationControlled");
                    options.AddExcludedArgument("enable-automation");
                    options.AddArgument("--no-sandbox");
                    options.AddArgument("--disable-dev-shm-usage");
                    options.AddArgument("--disable-gpu");

                    // Kullanıcı geminiden resim alırken arkadaki sekmeyi/tarayıcıyı görememeli
                    if (!isAdmin)
                    {
                        options.AddArgument("--window-position=-4000,-4000");
                        options.AddArgument("--window-size=1400,900");
                    }
                    else
                    {
                        options.AddArgument("--window-size=1400,900");
                    }

                    driver = await Task.Run(() => new ChromeDriver(options));
                    if (!isAdmin)
                    {
                        try { driver.Manage().Window.Position = new System.Drawing.Point(-4000, -4000); } catch { }
                    }

                    Console.WriteLine($"[Gemini Selenium] Profil tarayıcısı açıldı: {accountObj.ProfileName}");
                    driver.Navigate().GoToUrl("https://gemini.google.com/app");

                    IWebElement? promptBox = null;
                    int maxLoginWaitSeconds = 12;
                    for (int i = 0; i < maxLoginWaitSeconds; i++)
                    {
                        await Task.Delay(1000);
                        try
                        {
                            var elements = driver.FindElements(By.CssSelector("rich-textarea [contenteditable='true'], div[role='textbox'], textarea"));
                            foreach (var el in elements)
                            {
                                if (el.Displayed && el.Enabled)
                                {
                                    promptBox = el;
                                    break;
                                }
                            }
                            if (promptBox != null) break;
                        }
                        catch { }
                    }

                    if (promptBox == null)
                    {
                        string currentUrl = driver.Url;
                        if (currentUrl.Contains("accounts.google.com") || currentUrl.Contains("signin"))
                        {
                            if (driver != null) { try { driver.Quit(); driver.Dispose(); } catch { } driver = null; }
                            if (attempt == totalProfiles - 1)
                            {
                                return (401, new
                                {
                                    error = $"'{accountObj.AccountLabel}' profilinde oturum açılmadığı için Google giriş ekranı belirdi. Çözüm: Paneldeki Gemini Hesap listesinden 'Oturum Aç (Chrome'u Aç)' butonuna tıklayarak açılan pencereden bir kez hesabınıza giriş yapın, ardından tekrar deneyin."
                                });
                            }
                            continue;
                        }
                        if (driver != null) { try { driver.Quit(); driver.Dispose(); } catch { } driver = null; }
                        continue;
                    }

                    string imagePrompt = $"Generate a high quality photo/image of: {prompt}. Do not write text explanation, just create the image.";
                    promptBox.Click();
                    promptBox.SendKeys(imagePrompt);
                    await Task.Delay(500);

                    try
                    {
                        var sendButtons = driver.FindElements(By.CssSelector("button[aria-label*='Send'], button[aria-label*='Gönder'], button.send-button, button[mattooltip*='Send']"));
                        bool clicked = false;
                        foreach (var btn in sendButtons)
                        {
                            if (btn.Displayed && btn.Enabled)
                            {
                                btn.Click();
                                clicked = true;
                                break;
                            }
                        }
                        if (!clicked)
                        {
                            promptBox.SendKeys(Keys.Enter);
                        }
                    }
                    catch
                    {
                        promptBox.SendKeys(Keys.Enter);
                    }

                    Console.WriteLine($"[Gemini Selenium] Prompt gönderildi, görsel üretimi bekleniyor ({prompt})...");

                    IWebElement? generatedImg = null;
                    int maxWaitSeconds = 45;
                    for (int i = 0; i < maxWaitSeconds; i++)
                    {
                        await Task.Delay(1000);
                        try
                        {
                            var imgs = driver.FindElements(By.CssSelector("model-response img, message-content img, .chat-window img, img[src*='googleusercontent.com'], img[src*='ggpht.com']"));
                            foreach (var img in imgs)
                            {
                                if (img.Displayed && img.Size.Width > 150 && img.Size.Height > 150)
                                {
                                    generatedImg = img;
                                    break;
                                }
                            }
                            if (generatedImg != null) break;
                        }
                        catch { }
                    }

                    if (generatedImg == null)
                    {
                        Console.WriteLine($"[Gemini Selenium Limit/Timeout] Profil #{accountObj.Id} ({accountObj.AccountLabel}) 45s içinde görsel yakalayamadı veya kota limitine takıldı. Sonraki profile geçiliyor...");
                        accountObj.Status = "Exhausted";
                        creds.CurrentGeminiProfileIndex = (evalIdx + 1) % totalProfiles;
                        await _credentialsService.SaveCredentialsAsync(creds);
                        if (driver != null) { try { driver.Quit(); driver.Dispose(); } catch { } driver = null; }
                        continue;
                    }

                    byte[] imageBytes;
                    try
                    {
                        var screenshot = ((ITakesScreenshot)generatedImg).GetScreenshot();
                        imageBytes = screenshot.AsByteArray;
                    }
                    catch
                    {
                        var screenshot = ((ITakesScreenshot)driver).GetScreenshot();
                        imageBytes = screenshot.AsByteArray;
                    }

                    if (imageBytes == null || imageBytes.Length < 1000)
                    {
                        if (driver != null) { try { driver.Quit(); driver.Dispose(); } catch { } driver = null; }
                        continue;
                    }

                    string fileName = $"melikgazi-gemini-web-{DateTime.Now:yyyyMMdd-HHmmss}-{Guid.NewGuid().ToString()[..6]}.png";
                    await _imageSyncService.SaveImageToAllDirectoriesAsync(imageBytes, fileName, "gemini");

                    string relPath = $"/generated-gemini/{fileName}";
                    string modelDisplayName = "Google Gemini Web (Kalıcı Google Oturumu)";

                    accountObj.LastUsed = DateTime.Now.ToString("g");
                    creds.CurrentGeminiProfileIndex = evalIdx;
                    await _credentialsService.SaveCredentialsAsync(creds);

                    string keyLabelUsed = $"{accountObj.AccountLabel} ({accountObj.ProfileName})";

                    var savedImage = new GeneratedImage
                    {
                        Prompt = prompt,
                        ImagePath = relPath,
                        ModelUsed = modelDisplayName,
                        KeyUsedLabel = keyLabelUsed,
                        ApiKeyId = 0,
                        UserId = userId,
                        CreatedAt = DateTime.Now
                    };
                    try
                    {
                        _context.GeneratedImages.Add(savedImage);
                        await _context.SaveChangesAsync();
                    }
                    catch (Exception dbEx)
                    {
                        Console.WriteLine($"[DB Save Warning - Gemini Image] {dbEx.Message}");
                    }

                    Console.WriteLine($"[Success] Gemini Web görsel yakalandı ve kaydedildi: {relPath} (Profil: #{accountObj.Id}, UserId: {userId})");

                    return (200, new
                    {
                        success = true,
                        image = relPath,
                        modelUsed = modelDisplayName,
                        keyUsedId = 0,
                        keyUsedLabel = keyLabelUsed,
                        imageId = savedImage.Id,
                        userId = userId
                    });
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"[Web Selenium Error - Profil #{accountObj.Id}] {ex.Message}");
                    if (driver != null) { try { driver.Quit(); driver.Dispose(); } catch { } driver = null; }
                    continue;
                }
                finally
                {
                    if (driver != null)
                    {
                        try
                        {
                            driver.Quit();
                            driver.Dispose();
                            Console.WriteLine($"[Gemini Selenium] Profil #{accountObj.Id} tarayıcısı kapatıldı.");
                        }
                        catch { }
                    }
                }
            }

            return (503, new { error = "Tüm Google Gemini hesap profillerinin kotası dolmuş veya oturumları açık değil. Panel üzerinden farklı bir profil oturumu açın veya limitlerin sıfırlanmasını bekleyin." });
        }

        public async Task<bool> OpenBrowserForLoginAsync(int profileId = 1)
        {
            try
            {
                var creds = await _credentialsService.GetCredentialsAsync();
                var accountObj = creds.GeminiAccounts.FirstOrDefault(a => a.Id == profileId);
                string profName = accountObj?.ProfileName ?? $"GeminiChromeProfile_{profileId}";

                var options = new ChromeOptions();
                string profileDir = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, profName);
                Directory.CreateDirectory(profileDir);
                options.AddArgument($"--user-data-dir={profileDir}");
                options.AddArgument("--disable-blink-features=AutomationControlled");
                options.AddExcludedArgument("enable-automation");
                options.AddArgument("--window-size=1300,850");

                var driver = await Task.Run(() => new ChromeDriver(options));
                driver.Navigate().GoToUrl("https://gemini.google.com/app");

                Console.WriteLine($"[Gemini Login] Chrome görünür olarak açıldı ({profName}). Kullanıcı oturum açabilir.");
                return true;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[Gemini Login Error] {ex.Message}");
                return false;
            }
        }
    }
}
