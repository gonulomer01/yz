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
            int currentIdx = 0; 
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
                    Console.WriteLine($"[Gemini Selenium] Profil tarayÄ±cÄ±sÄ± aÃ§Ä±ldÄ±: {accountObj.ProfileName}");
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
                                    error = $"'{accountObj.AccountLabel}' profilinde oturum aÃ§Ä±lmadÄ±ÄŸÄ± iÃ§in Google giriÅŸ ekranÄ± belirdi. Ã‡Ã¶zÃ¼m: Paneldeki Gemini Hesap listesinden 'Oturum AÃ§ (Chrome'u AÃ§)' butonuna tÄ±klayarak aÃ§Ä±lan pencereden bir kez hesabÄ±nÄ±za giriÅŸ yapÄ±n, ardÄ±ndan tekrar deneyin."
                                });
                            }
                            continue;
                        }
                        if (driver != null) { try { driver.Quit(); driver.Dispose(); } catch { } driver = null; }
                        continue;
                    }
                    string ratioInstruction = "";
                    if (!string.IsNullOrEmpty(aspectRatio))
                    {
                        if (aspectRatio == "1:1") ratioInstruction = " The image MUST be strictly 1:1 square aspect ratio.";
                        else if (aspectRatio == "16:9") ratioInstruction = " The image MUST be strictly 16:9 landscape widescreen aspect ratio.";
                        else if (aspectRatio == "9:16") ratioInstruction = " The image MUST be strictly 9:16 portrait vertical aspect ratio.";
                        else ratioInstruction = $" The image MUST be in {aspectRatio} aspect ratio.";
                    }
                    string imagePrompt = $"Generate a high quality photo/image of: {prompt}.{ratioInstruction} Do not write any text explanation, just output the generated image.";
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
                    Console.WriteLine($"[Gemini Selenium] Prompt Gönderildi, gÃ¶rsel Ã¼retimi bekleniyor ({prompt})...");
                    IWebElement? generatedImg = null;
                    bool errorFound = false;
                    int maxWaitSeconds = 45;
                    for (int i = 0; i < maxWaitSeconds; i++)
                    {
                        await Task.Delay(1000);
                        try
                        {
                            var msgContents = driver.FindElements(By.CssSelector("message-content, model-response"));
                            var lastMsg = msgContents.LastOrDefault();
                            if (lastMsg != null)
                            {
                                string text = lastMsg.Text.ToLower();
                                if (text.Contains("Ã¼retilemedi") || text.Contains("oluÅŸturamÄ±yorum") || text.Contains("can't generate") || text.Contains("cannot generate") || text.Contains("could not create"))
                                {
                                    errorFound = true;
                                    Console.WriteLine($"[Gemini Selenium] Hata metni algÄ±landÄ±: GÃ¶rsel Ã¼retilemedi. Sonraki hesaba geÃ§iliyor...");
                                    break;
                                }
                            }
                            var imgs = driver.FindElements(By.CssSelector("model-response img, message-content img, .chat-window img, img[src*='googleusercontent.com'], img[src*='ggpht.com']"));
                            foreach (var img in imgs.Reverse())
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
                    if (errorFound)
                    {
                        if (driver != null) { try { driver.Quit(); driver.Dispose(); } catch { } driver = null; }
                        continue;
                    }
                    if (generatedImg == null)
                    {
                        Console.WriteLine($"[Gemini Selenium Limit/Timeout] Profil #{accountObj.Id} ({accountObj.AccountLabel}) 45s iÃ§inde gÃ¶rsel yakalayamadÄ± veya kota limitine takÄ±ldÄ±. Sonraki profile geÃ§iliyor...");
                        accountObj.Status = "Exhausted";
                        creds.CurrentGeminiProfileIndex = (evalIdx + 1) % totalProfiles;
                        await _credentialsService.SaveCredentialsAsync(creds);
                        if (driver != null) { try { driver.Quit(); driver.Dispose(); } catch { } driver = null; }
                        continue;
                    }
                    byte[]? imageBytes = null;
                    string fileExtension = ".png";
                    try
                    {
                        string? src = generatedImg.GetAttribute("src");
                        if (!string.IsNullOrEmpty(src))
                        {
                            if (src.Contains("googleusercontent.com") && src.Contains("="))
                            {
                                int equalIndex = src.LastIndexOf('=');
                                if (equalIndex > src.LastIndexOf('/')) 
                                {
                                    src = src.Substring(0, equalIndex) + "=s0";
                                }
                            }
                            else if (src.Contains("googleusercontent.com") && !src.Contains("="))
                            {
                                src += "=s0";
                            }
                            Console.WriteLine($"[Gemini Selenium] Ä°ndirilecek orijinal gÃ¶rsel URL'si: {src}");
                            driver.Navigate().GoToUrl(src);
                            var js = (IJavaScriptExecutor)driver;
                            driver.Manage().Timeouts().AsynchronousJavaScript = TimeSpan.FromSeconds(30);
                            string script = @"
                                var done = arguments[0];
                                // Orijinal dosyayÄ± almak iÃ§in same-origin fetch kullanÄ±yoruz
                                fetch(window.location.href)
                                    .then(response => response.blob())
                                    .then(blob => {
                                        var reader = new FileReader();
                                        reader.onloadend = function() {
                                            done(reader.result);
                                        };
                                        reader.readAsDataURL(blob);
                                    })
                                    .catch(err => {
                                        // Fetch baÅŸarÄ±sÄ±z olursa, fallback olarak Canvas deneyelim
                                        var img = document.querySelector('img');
                                        if (!img) { done('ERROR: fetch failed and img not found'); return; }
                                        function extract() {
                                            try {
                                                var canvas = document.createElement('canvas');
                                                canvas.width = img.naturalWidth;
                                                canvas.height = img.naturalHeight;
                                                var ctx = canvas.getContext('2d');
                                                ctx.drawImage(img, 0, 0);
                                                done(canvas.toDataURL('image/png'));
                                            } catch(e) {
                                                done('ERROR: ' + e.message);
                                            }
                                        }
                                        if (img.complete && img.naturalHeight > 0) {
                                            extract();
                                        } else {
                                            img.onload = extract;
                                            img.onerror = function() { done('ERROR: fallback failed'); };
                                        }
                                    });
                            ";
                            var result = js.ExecuteAsyncScript(script);
                            string dataUrl = result?.ToString() ?? "";
                            if (dataUrl.StartsWith("data:image"))
                            {
                                if (dataUrl.StartsWith("data:image/jpeg")) fileExtension = ".jpg";
                                else if (dataUrl.StartsWith("data:image/webp")) fileExtension = ".webp";
                                else if (dataUrl.StartsWith("data:image/gif")) fileExtension = ".gif";
                                string base64Data = dataUrl.Substring(dataUrl.IndexOf(',') + 1);
                                imageBytes = Convert.FromBase64String(base64Data);
                                Console.WriteLine($"[Gemini Selenium] GÃ¶rsel (Orijinal Dosya) tarayÄ±cÄ± Ã¼zerinden baÅŸarÄ±yla indirildi. Format: {fileExtension}, Boyut: {imageBytes.Length} byte.");
                            }
                            else
                            {
                                Console.WriteLine($"[Gemini Selenium] JS Canvas baÅŸarÄ±sÄ±z oldu ({dataUrl}), HttpClient deneniyor...");
                                using var client = new System.Net.Http.HttpClient();
                                imageBytes = await client.GetByteArrayAsync(src);
                            }
                        }
                    }
                    catch (Exception ex)
                    {
                        Console.WriteLine($"[Gemini Selenium] Image download failed: {ex.Message}");
                    }
                    if (imageBytes == null || imageBytes.Length < 1000)
                    {
                        Console.WriteLine($"[Gemini Selenium] Hata: GÃ¶rsel boyutu 1000 byte'tan kÃ¼Ã§Ã¼k veya indirilemedi.");
                        if (driver != null) { try { driver.Quit(); driver.Dispose(); } catch { } driver = null; }
                        continue;
                    }
                    string fileName = $"melikgazi-gemini-web-{DateTime.Now:yyyyMMdd-HHmmss}-{Guid.NewGuid().ToString()[..6]}{fileExtension}";
                    await _imageSyncService.SaveImageToAllDirectoriesAsync(imageBytes, fileName, "gemini");
                    string relPath = $"/generated-gemini/{fileName}";
                    string modelDisplayName = "Google Gemini Web (KalÄ±cÄ± Google Oturumu)";
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
                    Console.WriteLine($"[Success] Gemini Web gÃ¶rsel yakalandÄ± ve kaydedildi: {relPath} (Profil: #{accountObj.Id}, UserId: {userId})");
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
                            Console.WriteLine($"[Gemini Selenium] Profil #{accountObj.Id} tarayÄ±cÄ±sÄ± kapatÄ±ldÄ±.");
                        }
                        catch { }
                    }
                }
            }
            return (503, new { error = "TÃ¼m Google Gemini hesap profillerinin kotasÄ± dolmuÅŸ veya oturumlarÄ± aÃ§Ä±k deÄŸil. Panel Ã¼zerinden farklÄ± bir profil oturumu aÃ§Ä±n veya limitlerin sÄ±fÄ±rlanmasÄ±nÄ± bekleyin." });
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
                Console.WriteLine($"[Gemini Login] Chrome gÃ¶rÃ¼nÃ¼r olarak aÃ§Ä±ldÄ± ({profName}). KullanÄ±cÄ± oturum aÃ§abilir.");
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