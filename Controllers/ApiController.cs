using System;
using System.Collections.Generic;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using yz.Data;
using yz.Models;
using yz.Services;
namespace yz.Controllers
{
    [ApiController]
    [Route("api")]
    [Authorize]
    public class ApiController : ControllerBase
    {
        private readonly ApplicationDbContext _context;
        private readonly AiGenerationService _aiGenerationService;
        private readonly ImageSyncService _imageSyncService;
        private readonly MultiAiSeleniumService _multiAiSeleniumService;
        private readonly AiCredentialsService _credentialsService;
        public ApiController(ApplicationDbContext context, AiGenerationService aiGenerationService, ImageSyncService imageSyncService, MultiAiSeleniumService multiAiSeleniumService, AiCredentialsService credentialsService)
        {
            _context = context;
            _aiGenerationService = aiGenerationService;
            _imageSyncService = imageSyncService;
            _multiAiSeleniumService = multiAiSeleniumService;
            _credentialsService = credentialsService;
        }
        private int GetCurrentUserId()
        {
            var idClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (int.TryParse(idClaim, out int id)) return id;
            return 0;
        }
        [HttpGet("keys")]
        [Authorize(Roles = "Yönetici")]
        public async Task<IActionResult> GetKeys()
        {
            await _aiGenerationService.CheckDailyResetAsync();
            var creds = await _credentialsService.GetCredentialsAsync();
            return Ok(new
            {
                currentKeyIndex = creds.CurrentKeyIndex,
                lastResetDate = creds.LastResetDate,
                keys = creds.StabilityApiKeys.OrderBy(k => k.Id).Select(k => new
                {
                    id = k.Id,
                    label = k.Label,
                    apiKeyMasked = _credentialsService.MaskKey(k.KeyValue),
                    hasKey = !string.IsNullOrEmpty(k.KeyValue),
                    status = k.Status,
                    usageToday = k.UsageToday,
                    totalUsage = k.TotalUsage
                })
            });
        }
        [HttpPost("keys")]
        [Authorize(Roles = "Yönetici")]
        public async Task<IActionResult> UpdateKey([FromBody] KeyUpdateRequest req)
        {
            if (req == null || req.Id < 1)
                return BadRequest(new { error = "Geçersiz yuva." });
            var creds = await _credentialsService.GetCredentialsAsync();
            var key = creds.StabilityApiKeys.FirstOrDefault(k => k.Id == req.Id);
            if (key == null) return NotFound(new { error = "Yuva bulunamadı." });
            if (req.Label != null) key.Label = req.Label;
            if (req.Status != null) key.Status = req.Status.Trim();
            if (!string.IsNullOrEmpty(req.ApiKey) && !req.ApiKey.Contains("..."))
            {
                key.KeyValue = req.ApiKey.Trim();
                key.Status = req.Status ?? "Active";
                key.UsageToday = 0;
            }
            else if (!string.IsNullOrEmpty(key.KeyValue) && key.KeyValue.StartsWith("sk-") && req.Status == null)
            {
                key.Status = "Active";
            }
            await _credentialsService.SaveCredentialsAsync(creds);
            return Ok(new { success = true });
        }
        [HttpPost("keys/reset")]
        [Authorize(Roles = "Yönetici")]
        public async Task<IActionResult> ResetKeys()
        {
            var creds = await _credentialsService.GetCredentialsAsync();
            foreach (var k in creds.StabilityApiKeys)
            {
                k.UsageToday = 0;
                k.TotalUsage = 0;
                k.Status = "Active";
            }
            creds.CurrentKeyIndex = 0;
            await _credentialsService.SaveCredentialsAsync(creds);
            return Ok(new { success = true });
        }

        [HttpPost("gemini-accounts/reset")]
        [Authorize(Roles = "Yönetici")]
        public async Task<IActionResult> ResetGeminiAccounts()
        {
            var creds = await _credentialsService.GetCredentialsAsync();
            foreach (var g in creds.GeminiAccounts)
            {
                g.Status = "Active";
            }
            creds.CurrentGeminiProfileIndex = 0;
            await _credentialsService.SaveCredentialsAsync(creds);
            return Ok(new { success = true });
        }

        [HttpPost("chatgpt-accounts/reset")]
        [Authorize(Roles = "Yönetici")]
        public async Task<IActionResult> ResetChatGptAccounts()
        {
            var creds = await _credentialsService.GetCredentialsAsync();
            foreach (var c in creds.ChatGptAccounts)
            {
                c.Status = "Active";
            }
            creds.CurrentChatGptProfileIndex = 0;
            await _credentialsService.SaveCredentialsAsync(creds);
            return Ok(new { success = true });
        }

        [HttpPost("copilot-accounts/reset")]
        [Authorize(Roles = "Yönetici")]
        public async Task<IActionResult> ResetCopilotAccounts()
        {
            var creds = await _credentialsService.GetCredentialsAsync();
            foreach (var c in creds.CopilotAccounts)
            {
                c.Status = "Active";
            }
            creds.CurrentCopilotProfileIndex = 0;
            await _credentialsService.SaveCredentialsAsync(creds);
            return Ok(new { success = true });
        }
        [HttpPost("keys/add")]
        [Authorize(Roles = "Yönetici")]
        public async Task<IActionResult> AddStabilityKey([FromBody] StabilityKeyAddRequest? req)
        {
            var creds = await _credentialsService.GetCredentialsAsync();
            int nextId = (creds.StabilityApiKeys.Count == 0 ? 1 : creds.StabilityApiKeys.Max(k => k.Id) + 1);
            string label = !string.IsNullOrWhiteSpace(req?.Label) ? req.Label.Trim() : $"Stability Anahtarı #{nextId}";
            creds.StabilityApiKeys.Add(new StabilityKeyItem
            {
                Id = nextId,
                Label = label,
                KeyValue = req?.ApiKey?.Trim() ?? "",
                Status = "Active",
                UsageToday = 0,
                TotalUsage = 0
            });
            await _credentialsService.SaveCredentialsAsync(creds);
            return Ok(new { success = true, id = nextId });
        }
        [HttpDelete("keys/{id}")]
        [Authorize(Roles = "Yönetici")]
        public async Task<IActionResult> DeleteStabilityKey(int id)
        {
            var creds = await _credentialsService.GetCredentialsAsync();
            var key = creds.StabilityApiKeys.FirstOrDefault(k => k.Id == id);
            if (key == null) return NotFound(new { error = "Yuva bulunamadı." });
            if (creds.StabilityApiKeys.Count <= 1)
                return BadRequest(new { error = "En az bir Stability AI anahtarı yuvası kalmalıdır." });
            creds.StabilityApiKeys.Remove(key);
            if (creds.CurrentKeyIndex >= creds.StabilityApiKeys.Count)
            {
                creds.CurrentKeyIndex = 0;
            }
            await _credentialsService.SaveCredentialsAsync(creds);
            return Ok(new { success = true });
        }
        [HttpGet("gemini-accounts")]
        [Authorize(Roles = "Yönetici")]
        public async Task<IActionResult> GetGeminiAccounts()
        {
            var creds = await _credentialsService.GetCredentialsAsync();
            return Ok(new
            {
                currentProfileIndex = creds.CurrentGeminiProfileIndex,
                accounts = creds.GeminiAccounts.OrderBy(a => a.Id).Select(a => new
                {
                    id = a.Id,
                    profileName = a.ProfileName,
                    accountLabel = a.AccountLabel,
                    status = a.Status,
                    lastUsed = string.IsNullOrEmpty(a.LastUsed) ? "Henüz kullanılmadı" : a.LastUsed
                })
            });
        }
        [HttpPost("gemini-accounts")]
        [Authorize(Roles = "Yönetici")]
        public async Task<IActionResult> UpdateGeminiAccount([FromBody] GeminiAccountUpdateRequest req)
        {
            if (req == null || req.Id < 1)
                return BadRequest(new { error = "Geçersiz hesap ID." });
            var creds = await _credentialsService.GetCredentialsAsync();
            var acc = creds.GeminiAccounts.FirstOrDefault(a => a.Id == req.Id);
            if (acc == null) return NotFound(new { error = "Hesap bulunamadı." });
            if (req.AccountLabel != null) acc.AccountLabel = req.AccountLabel.Trim();
            if (req.Status != null) acc.Status = req.Status.Trim();
            await _credentialsService.SaveCredentialsAsync(creds);
            return Ok(new { success = true });
        }
        [HttpPost("gemini-accounts/add")]
        [Authorize(Roles = "Yönetici")]
        public async Task<IActionResult> AddGeminiAccount([FromBody] GeminiAccountAddRequest? req)
        {
            var creds = await _credentialsService.GetCredentialsAsync();
            int nextId = (creds.GeminiAccounts.Count == 0 ? 1 : creds.GeminiAccounts.Max(a => a.Id) + 1);
            string label = !string.IsNullOrWhiteSpace(req?.AccountLabel) ? req.AccountLabel.Trim() : $"Google Hesap #{nextId}";
            creds.GeminiAccounts.Add(new GeminiAccountItem
            {
                Id = nextId,
                ProfileName = $"GeminiChromeProfile_{nextId}",
                AccountLabel = label,
                Status = "Active",
                LastUsed = ""
            });
            await _credentialsService.SaveCredentialsAsync(creds);
            return Ok(new { success = true, id = nextId });
        }
        [HttpDelete("gemini-accounts/{id}")]
        [Authorize(Roles = "Yönetici")]
        public async Task<IActionResult> DeleteGeminiAccount(int id)
        {
            var creds = await _credentialsService.GetCredentialsAsync();
            var acc = creds.GeminiAccounts.FirstOrDefault(a => a.Id == id);
            if (acc == null) return NotFound(new { error = "Hesap bulunamadı." });
            if (creds.GeminiAccounts.Count <= 1)
                return BadRequest(new { error = "En az bir Google Gemini profili kalmalıdır." });
            creds.GeminiAccounts.Remove(acc);
            await _credentialsService.SaveCredentialsAsync(creds);
            return Ok(new { success = true });
        }
        [HttpGet("chatgpt-accounts")]
        [Authorize(Roles = "Yönetici")]
        public async Task<IActionResult> GetChatGptAccounts()
        {
            var creds = await _credentialsService.GetCredentialsAsync();
            return Ok(new
            {
                currentProfileIndex = creds.CurrentChatGptProfileIndex,
                accounts = creds.ChatGptAccounts.OrderBy(a => a.Id).Select(a => new
                {
                    id = a.Id,
                    profileName = a.ProfileName,
                    accountLabel = a.AccountLabel,
                    status = a.Status,
                    lastUsed = string.IsNullOrEmpty(a.LastUsed) ? "Henüz kullanılmadı" : a.LastUsed
                })
            });
        }
        [HttpPost("chatgpt-accounts")]
        [Authorize(Roles = "Yönetici")]
        public async Task<IActionResult> UpdateChatGptAccount([FromBody] GeminiAccountUpdateRequest req)
        {
            if (req == null || req.Id < 1)
                return BadRequest(new { error = "Geçersiz hesap ID." });
            var creds = await _credentialsService.GetCredentialsAsync();
            var acc = creds.ChatGptAccounts.FirstOrDefault(a => a.Id == req.Id);
            if (acc == null) return NotFound(new { error = "Hesap bulunamadı." });
            if (req.AccountLabel != null) acc.AccountLabel = req.AccountLabel.Trim();
            if (req.Status != null) acc.Status = req.Status.Trim();
            await _credentialsService.SaveCredentialsAsync(creds);
            return Ok(new { success = true });
        }
        [HttpPost("chatgpt-accounts/add")]
        [Authorize(Roles = "Yönetici")]
        public async Task<IActionResult> AddChatGptAccount([FromBody] GeminiAccountAddRequest? req)
        {
            var creds = await _credentialsService.GetCredentialsAsync();
            int nextId = 1;
            var existingIds = creds.ChatGptAccounts.Select(a => a.Id).ToHashSet();
            while (existingIds.Contains(nextId))
            {
                nextId++;
            }
            string label = !string.IsNullOrWhiteSpace(req?.AccountLabel) ? req.AccountLabel.Trim() : $"ChatGPT Hesap #{nextId}";
            creds.ChatGptAccounts.Add(new ChatGptAccountItem
            {
                Id = nextId,
                ProfileName = $"ChatGptChromeProfile_{nextId}",
                AccountLabel = label,
                Status = "Active",
                LastUsed = ""
            });
            await _credentialsService.SaveCredentialsAsync(creds);
            return Ok(new { success = true, id = nextId });
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

        [HttpPost("chatgpt-accounts/auto-create-plus")]
        [Authorize(Roles = "Yönetici")]
        public async Task<IActionResult> AutoCreatePlusChatGptAccount([FromBody] GeminiAccountAddRequest? req)
        {
            var creds = await _credentialsService.GetCredentialsAsync();

            // 1. Ana (taban) Gmail hesaplarını tespit et ('+' içermeyenler)
            var baseAccounts = creds.ChatGptAccounts
                .Where(a => {
                    string e = ExtractEmailFromAccountLabel(a.AccountLabel);
                    return !string.IsNullOrEmpty(e) && !e.Contains("+");
                })
                .OrderBy(a => a.Id)
                .ToList();

            // Aktif taban hesabı seç (Varsayılan 1. profil veya aktif olan ilk taban profil)
            var selectedBaseAccount = baseAccounts.FirstOrDefault(a => a.Status == "Active") 
                                   ?? baseAccounts.FirstOrDefault() 
                                   ?? creds.ChatGptAccounts.FirstOrDefault(a => a.Id == 1);

            string baseEmail = ExtractEmailFromAccountLabel(selectedBaseAccount?.AccountLabel ?? "");
            if (string.IsNullOrEmpty(baseEmail) && !string.IsNullOrEmpty(creds.BaseGmail))
            {
                baseEmail = creds.BaseGmail;
            }
            if (string.IsNullOrEmpty(baseEmail))
            {
                baseEmail = "tygotr001@gmail.com";
            }

            int targetBaseProfileId = selectedBaseAccount?.Id ?? 1;

            string userPart = baseEmail.Split('@')[0];
            string domainPart = baseEmail.Split('@')[1];

            // 2. Bu ana e-posta adresi için kullanılmış en yüksek '+' numarasını bul
            int maxPlus = 0;
            foreach (var acc in creds.ChatGptAccounts)
            {
                string e = ExtractEmailFromAccountLabel(acc.AccountLabel);
                if (!string.IsNullOrEmpty(e) && e.Contains("+") && e.StartsWith(userPart + "+", StringComparison.OrdinalIgnoreCase))
                {
                    try
                    {
                        int plusPos = e.IndexOf("+");
                        int atPos = e.IndexOf("@");
                        if (plusPos > 0 && atPos > plusPos)
                        {
                            string numStr = e.Substring(plusPos + 1, atPos - plusPos - 1);
                            if (int.TryParse(numStr, out int val) && val > maxPlus)
                            {
                                maxPlus = val;
                            }
                        }
                    }
                    catch { }
                }
            }

            int nextPlusNum = maxPlus + 1;
            string aliasEmail = $"{userPart}+{nextPlusNum}@{domainPart}";

            int nextId = (creds.ChatGptAccounts.Count == 0 ? 1 : creds.ChatGptAccounts.Max(a => a.Id) + 1);
            string profileName = $"ChatGptChromeProfile_{nextId}";
            string label = $"ChatGPT Hesap #{nextId} ({aliasEmail})";

            creds.ChatGptAccounts.Add(new ChatGptAccountItem
            {
                Id = nextId,
                ProfileName = profileName,
                AccountLabel = label,
                Status = "Active",
                LastUsed = ""
            });

            await _credentialsService.SaveCredentialsAsync(creds);

            // Arka planda tam otomatik robotu ve 2 pencereyi aç (1: Yeni ChatGPT Kayıt, 2: Ana Gmail Kutusu)
            _ = Task.Run(async () =>
            {
                try
                {
                    await _multiAiSeleniumService.AutoCreateAndVerifyChatGptAccountAsync(nextId, aliasEmail, targetBaseProfileId);
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"[Auto Robot Thread Error] {ex.Message}");
                }
            });

            return Ok(new
            {
                success = true,
                id = nextId,
                aliasEmail = aliasEmail,
                label = label,
                baseProfileId = targetBaseProfileId,
                message = $"{aliasEmail} adresiyle ChatGPT Hesap #{nextId} oluşturuldu! Robot otomatik doldurma ve Gmail kod çekme işlemini başlattı."
            });
        }

        [HttpPost("chatgpt-accounts/auto-create-custom-email")]
        [Authorize(Roles = "Yönetici")]
        public async Task<IActionResult> AutoCreateCustomEmailChatGptAccount([FromBody] CustomEmailRequest? req)
        {
            string email = req?.Email?.Trim() ?? "";
            if (string.IsNullOrEmpty(email) || !email.Contains("@"))
            {
                return BadRequest(new { error = "Lütfen geçerli bir e-posta adresi girin." });
            }

            var creds = await _credentialsService.GetCredentialsAsync();

            int nextId = 1;
            var existingIds = creds.ChatGptAccounts.Select(a => a.Id).ToHashSet();
            while (existingIds.Contains(nextId))
            {
                nextId++;
            }

            string profileName = $"ChatGptChromeProfile_{nextId}";
            string label = $"ChatGPT Hesap #{nextId} ({email})";

            int targetBaseProfileId = 1;
            if (email.Contains("@"))
            {
                string userPart = email.Split('@')[0];
                string baseUser = userPart.Split('+')[0];
                var digitsMatch = System.Text.RegularExpressions.Regex.Match(baseUser, @"\d+");
                if (digitsMatch.Success && int.TryParse(digitsMatch.Value, out int profileNum) && profileNum >= 1)
                {
                    targetBaseProfileId = profileNum;
                }
            }

            creds.ChatGptAccounts.Add(new ChatGptAccountItem
            {
                Id = nextId,
                ProfileName = profileName,
                AccountLabel = label,
                Status = "Active",
                LastUsed = ""
            });

            await _credentialsService.SaveCredentialsAsync(creds);

            // Arka planda Tam Otomatik Robotu ve Pencereleri Başlat
            _ = Task.Run(async () =>
            {
                try
                {
                    await _multiAiSeleniumService.AutoCreateAndVerifyChatGptAccountAsync(nextId, email, targetBaseProfileId);
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"[Auto Custom Robot Thread Error] {ex.Message}");
                }
            });

            return Ok(new
            {
                success = true,
                id = nextId,
                email = email,
                label = label,
                baseProfileId = targetBaseProfileId,
                message = $"{email} adresiyle ChatGPT Hesap #{nextId} otomatik oluşturma başlatıldı."
            });
        }
        [HttpDelete("chatgpt-accounts/{id}")]
        [Authorize(Roles = "Yönetici")]
        public async Task<IActionResult> DeleteChatGptAccount(int id)
        {
            var creds = await _credentialsService.GetCredentialsAsync();
            var acc = creds.ChatGptAccounts.FirstOrDefault(a => a.Id == id);
            if (acc == null) return NotFound(new { error = "Hesap bulunamadı." });
            if (creds.ChatGptAccounts.Count <= 1)
                return BadRequest(new { error = "En az bir ChatGPT profili kalmalıdır." });
            creds.ChatGptAccounts.Remove(acc);
            await _credentialsService.SaveCredentialsAsync(creds);
            return Ok(new { success = true });
        }
        [HttpGet("copilot-accounts")]
        [Authorize(Roles = "Yönetici")]
        public async Task<IActionResult> GetCopilotAccounts()
        {
            var creds = await _credentialsService.GetCredentialsAsync();
            return Ok(new
            {
                currentProfileIndex = creds.CurrentCopilotProfileIndex,
                accounts = creds.CopilotAccounts.OrderBy(a => a.Id).Select(a => new
                {
                    id = a.Id,
                    profileName = a.ProfileName,
                    accountLabel = a.AccountLabel,
                    status = a.Status,
                    lastUsed = string.IsNullOrEmpty(a.LastUsed) ? "Henüz kullanılmadı" : a.LastUsed
                })
            });
        }
        [HttpPost("copilot-accounts")]
        [Authorize(Roles = "Yönetici")]
        public async Task<IActionResult> UpdateCopilotAccount([FromBody] GeminiAccountUpdateRequest req)
        {
            if (req == null || req.Id < 1)
                return BadRequest(new { error = "Geçersiz hesap ID." });
            var creds = await _credentialsService.GetCredentialsAsync();
            var acc = creds.CopilotAccounts.FirstOrDefault(a => a.Id == req.Id);
            if (acc == null) return NotFound(new { error = "Hesap bulunamadı." });
            if (req.AccountLabel != null) acc.AccountLabel = req.AccountLabel.Trim();
            if (req.Status != null) acc.Status = req.Status.Trim();
            await _credentialsService.SaveCredentialsAsync(creds);
            return Ok(new { success = true });
        }
        [HttpPost("copilot-accounts/add")]
        [Authorize(Roles = "Yönetici")]
        public async Task<IActionResult> AddCopilotAccount([FromBody] GeminiAccountAddRequest? req)
        {
            var creds = await _credentialsService.GetCredentialsAsync();
            int nextId = (creds.CopilotAccounts.Count == 0 ? 1 : creds.CopilotAccounts.Max(a => a.Id) + 1);
            string label = !string.IsNullOrWhiteSpace(req?.AccountLabel) ? req.AccountLabel.Trim() : $"Copilot Hesap #{nextId}";
            creds.CopilotAccounts.Add(new CopilotAccountItem
            {
                Id = nextId,
                ProfileName = $"CopilotChromeProfile_{nextId}",
                AccountLabel = label,
                Status = "Active",
                LastUsed = ""
            });
            await _credentialsService.SaveCredentialsAsync(creds);
            return Ok(new { success = true, id = nextId });
        }
        [HttpDelete("copilot-accounts/{id}")]
        [Authorize(Roles = "Yönetici")]
        public async Task<IActionResult> DeleteCopilotAccount(int id)
        {
            var creds = await _credentialsService.GetCredentialsAsync();
            var acc = creds.CopilotAccounts.FirstOrDefault(a => a.Id == id);
            if (acc == null) return NotFound(new { error = "Hesap bulunamadı." });
            if (creds.CopilotAccounts.Count <= 1)
                return BadRequest(new { error = "En az bir Copilot profili kalmalıdır." });
            creds.CopilotAccounts.Remove(acc);
            await _credentialsService.SaveCredentialsAsync(creds);
            return Ok(new { success = true });
        }
        [HttpGet("images")]
        public async Task<IActionResult> GetImages()
        {
            _imageSyncService.SyncDatabaseWithFilesystem(_context);
            int currentUserId = GetCurrentUserId();
            var dbImages = await _context.GeneratedImages
                .Where(img => img.UserId == currentUserId)
                .OrderByDescending(img => img.CreatedAt)
                .ToListAsync();
            var images = dbImages.Select(img => new
            {
                id = img.Id,
                image = img.ImagePath,
                prompt = img.Prompt,
                model = img.ModelUsed != null && (img.ModelUsed.Contains("Kredi") || img.ModelUsed.Contains("Ücretsiz") || img.ModelUsed.Contains("Dışarıdan") || img.ModelUsed.Contains("Google") || img.ModelUsed.Contains("FLUX")) ? img.ModelUsed : (img.ModelUsed + " (" + (
                    img.ModelUsed != null && img.ModelUsed.Contains("Ultra") ? "8 Kredi" :
                    img.ModelUsed != null && img.ModelUsed.Contains("Core") ? "3 Kredi" :
                    img.ModelUsed != null && img.ModelUsed.Contains("Turbo") ? "4 Kredi" :
                    img.ModelUsed != null && img.ModelUsed.Contains("Large") ? "6.5 Kredi" :
                    img.ModelUsed != null && img.ModelUsed.Contains("Medium") ? "3.5 Kredi" : "~1 Kredi"
                ) + ")"),
                key = img.KeyUsedLabel,
                apiKeyId = img.ApiKeyId,
                userId = img.UserId,
                createdAt = img.CreatedAt,
                folder = img.ImagePath != null && img.ImagePath.Contains("/generated-gemini/") ? "gemini" :
                         img.ImagePath != null && img.ImagePath.Contains("/generated-free/") ? "free" :
                         img.ImagePath != null && img.ImagePath.Contains("/generated-chatgpt/") ? "chatgpt" :
                         img.ImagePath != null && img.ImagePath.Contains("/generated-copilot/") ? "copilot" :
                         img.ImagePath != null && img.ImagePath.Contains("/generated-stability/") ? "stability" : "general",
                groupId = img.GroupId,
                sourceSite = img.SourceSite
            }).ToList();
            return Ok(images);
        }
        [HttpDelete("images/{id}")]
        public async Task<IActionResult> DeleteImage(int id)
        {
            int currentUserId = GetCurrentUserId();
            bool isAdmin = User.IsInRole("Yönetici");
            var img = await _context.GeneratedImages.FirstOrDefaultAsync(i => i.Id == id);
            if (img == null) return NotFound(new { error = "Görsel bulunamadı." });
            if (img.UserId != currentUserId && !isAdmin)
            {
                return Forbid();
            }
            _imageSyncService.DeleteImageFromAllDirectories(img.ImagePath);
            if (img.ApiKeyId > 0)
            {
                var creds = await _credentialsService.GetCredentialsAsync();
                var keyObj = creds.StabilityApiKeys.FirstOrDefault(k => k.Id == img.ApiKeyId);
                if (keyObj != null)
                {
                    if (keyObj.TotalUsage > 0) keyObj.TotalUsage--;
                    if (keyObj.UsageToday > 0) keyObj.UsageToday--;
                    await _credentialsService.SaveCredentialsAsync(creds);
                }
                else
                {
                    var dbKey = await _context.ApiKeys.FirstOrDefaultAsync(k => k.Id == img.ApiKeyId);
                    if (dbKey != null)
                    {
                        if (dbKey.TotalUsage > 0) dbKey.TotalUsage--;
                        if (dbKey.UsageToday > 0) dbKey.UsageToday--;
                        await _context.SaveChangesAsync();
                    }
                }
            }
            _context.GeneratedImages.Remove(img);
            await _context.SaveChangesAsync();
            return Ok(new { success = true });
        }
        [HttpPost("generate")]
        public async Task<IActionResult> Generate([FromBody] GenerateRequest req)
        {
            int currentUserId = GetCurrentUserId();
            bool isAdmin = User.IsInRole("Yönetici");
            var (statusCode, response) = await _aiGenerationService.GenerateAsync(req, currentUserId, isAdmin);
            return StatusCode(statusCode, response);
        }
        [HttpGet("generate-triple-stream")]
        public async Task GenerateTripleStream([FromQuery] string prompt, [FromQuery] string aspectRatio = "1:1", [FromQuery] string style = "none", CancellationToken cancellationToken = default)
        {
            Response.ContentType = "text/event-stream";
            Response.Headers["Cache-Control"] = "no-cache";
            Response.Headers["Connection"] = "keep-alive";

            if (string.IsNullOrWhiteSpace(prompt))
            {
                await WriteSseEventAsync(Response, "error", new { error = "Prompt gerekli." });
                return;
            }

            int currentUserId = GetCurrentUserId();
            bool isAdmin = User.IsInRole("Yönetici");
            string formattedPrompt = _aiGenerationService.FormatPrompt(prompt, style);
            string groupId = Guid.NewGuid().ToString("N")[..12];

            await WriteSseEventAsync(Response, "start", new { groupId, prompt });

            MultiAiSeleniumService.ResetCancelState();

            var geminiTask = _multiAiSeleniumService.GenerateSiteForTripleAsync("gemini", formattedPrompt, aspectRatio, currentUserId, isAdmin, groupId);
            var chatgptTask = _multiAiSeleniumService.GenerateSiteForTripleAsync("chatgpt", formattedPrompt, aspectRatio, currentUserId, isAdmin, groupId);
            var copilotTask = _multiAiSeleniumService.GenerateSiteForTripleAsync("copilot", formattedPrompt, aspectRatio, currentUserId, isAdmin, groupId);

            var pending = new List<Task<SiteGenerationResult>> { geminiTask, chatgptTask, copilotTask };
            var successResults = new List<SiteGenerationResult>();
            var failedResults = new List<SiteGenerationResult>();

            while (pending.Count > 0)
            {
                var completedTask = await Task.WhenAny(pending);
                pending.Remove(completedTask);

                if (cancellationToken.IsCancellationRequested || MultiAiSeleniumService.IsCancelRequested)
                {
                    break;
                }

                SiteGenerationResult result;
                try
                {
                    result = await completedTask;
                }
                catch (Exception ex)
                {
                    result = new SiteGenerationResult { Success = false, Error = ex.Message };
                }

                if (result.Success)
                {
                    successResults.Add(result);
                    await WriteSseEventAsync(Response, "progress", new
                    {
                        site = result.SourceSite,
                        status = "success",
                        image = result.ImagePath,
                        modelUsed = result.ModelUsed,
                        keyUsedLabel = result.KeyUsedLabel,
                        imageId = result.ImageId
                    });
                }
                else
                {
                    failedResults.Add(result);
                    await WriteSseEventAsync(Response, "progress", new
                    {
                        site = result.SourceSite,
                        status = "failed",
                        error = result.Error ?? "Üretim başarısız"
                    });
                }
            }

            await WriteSseEventAsync(Response, "complete", new
            {
                groupId,
                totalSuccess = successResults.Count,
                totalFailed = failedResults.Count,
                results = successResults.Select(r => new
                {
                    image = r.ImagePath,
                    modelUsed = r.ModelUsed,
                    keyUsedLabel = r.KeyUsedLabel,
                    imageId = r.ImageId,
                    sourceSite = r.SourceSite
                }),
                failures = failedResults.Select(f => new
                {
                    sourceSite = f.SourceSite,
                    error = f.Error
                })
            });
        }

        private static async Task WriteSseEventAsync(Microsoft.AspNetCore.Http.HttpResponse response, string eventType, object data)
        {
            try
            {
                var json = System.Text.Json.JsonSerializer.Serialize(new { type = eventType, payload = data });
                var sseLine = $"data: {json}\n\n";
                await response.WriteAsync(sseLine);
                await response.Body.FlushAsync();
            }
            catch { }
        }

        [HttpPost("cancel")]
        public IActionResult CancelGeneration()
        {
            _multiAiSeleniumService.CancelAllSessions();
            return Ok(new { success = true, message = "Tüm üretim işlemleri durduruldu." });
        }
        [HttpPost("gemini-web/login")]
        [Authorize(Roles = "Yönetici")]
        public async Task<IActionResult> OpenGeminiLogin([FromBody] GeminiLoginRequest? req)
        {
            int profileId = req?.ProfileId ?? 1;
            bool success = await _multiAiSeleniumService.OpenBrowserForLoginAsync("gemini", profileId);
            return Ok(new { success });
        }
        [HttpPost("chatgpt-web/login")]
        [Authorize(Roles = "Yönetici")]
        public async Task<IActionResult> OpenChatGptLogin([FromBody] GeminiLoginRequest? req)
        {
            int profileId = req?.ProfileId ?? 1;
            bool success = await _multiAiSeleniumService.OpenBrowserForLoginAsync("chatgpt", profileId);
            return Ok(new { success });
        }
        [HttpPost("copilot-web/login")]
        [Authorize(Roles = "Yönetici")]
        public async Task<IActionResult> OpenCopilotLogin([FromBody] GeminiLoginRequest? req)
        {
            int profileId = req?.ProfileId ?? 1;
            bool success = await _multiAiSeleniumService.OpenBrowserForLoginAsync("copilot", profileId);
            return Ok(new { success });
        }
        [HttpGet("profile")]
        public async Task<IActionResult> GetProfile()
        {
            int currentUserId = GetCurrentUserId();
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == currentUserId);
            if (user == null) return NotFound(new { error = "Kullanıcı bulunamadı." });
            return Ok(new
            {
                id = user.Id,
                username = user.Username,
                displayName = user.DisplayName,
                role = user.Role
            });
        }
        [HttpPost("profile")]
        public async Task<IActionResult> UpdateProfile([FromBody] ProfileUpdateRequest req)
        {
            int currentUserId = GetCurrentUserId();
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == currentUserId);
            if (user == null) return NotFound(new { error = "Kullanıcı bulunamadı." });
            if (!string.IsNullOrWhiteSpace(req.DisplayName))
            {
                user.DisplayName = req.DisplayName.Trim();
            }
            if (!string.IsNullOrWhiteSpace(req.Password))
            {
                if (req.Password.Length < 4)
                    return BadRequest(new { error = "Şifre en az 4 karakter olmalıdır." });
                user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(req.Password);
            }
            await _context.SaveChangesAsync();
            return Ok(new { success = true });
        }
        [HttpGet("users")]
        [Authorize(Roles = "Yönetici")]
        public async Task<IActionResult> GetUsers()
        {
            int currentUserId = GetCurrentUserId();
            var users = await _context.Users.OrderBy(u => u.Id).ToListAsync();
            var allImages = await _context.GeneratedImages.OrderByDescending(i => i.CreatedAt).ToListAsync();
            var userList = users.Select(u => new
            {
                id = u.Id,
                username = u.Username,
                displayName = u.DisplayName,
                role = u.Role,
                createdAt = u.CreatedAt,
                imageCount = allImages.Count(i => i.UserId == u.Id),
                images = (u.Role == "Yönetici" && u.Id != currentUserId) ? new List<object>() : allImages.Where(i => i.UserId == u.Id).Select(img => (object)new
                {
                    id = img.Id,
                    image = img.ImagePath,
                    prompt = img.Prompt,
                    model = img.ModelUsed != null && (img.ModelUsed.Contains("Kredi") || img.ModelUsed.Contains("Ücretsiz") || img.ModelUsed.Contains("Dışarıdan") || img.ModelUsed.Contains("Google") || img.ModelUsed.Contains("FLUX")) ? img.ModelUsed : (img.ModelUsed + " (" + (
                        img.ModelUsed != null && img.ModelUsed.Contains("Ultra") ? "8 Kredi" :
                        img.ModelUsed != null && img.ModelUsed.Contains("Core") ? "3 Kredi" :
                        img.ModelUsed != null && img.ModelUsed.Contains("Turbo") ? "4 Kredi" :
                        img.ModelUsed != null && img.ModelUsed.Contains("Large") ? "6.5 Kredi" :
                        img.ModelUsed != null && img.ModelUsed.Contains("Medium") ? "3.5 Kredi" : "~1 Kredi"
                    ) + ")"),
                    key = img.KeyUsedLabel,
                    apiKeyId = img.ApiKeyId,
                    userId = img.UserId,
                    createdAt = img.CreatedAt,
                    folder = img.ImagePath != null && img.ImagePath.Contains("/generated-gemini/") ? "gemini" :
                             img.ImagePath != null && img.ImagePath.Contains("/generated-free/") ? "free" :
                             img.ImagePath != null && img.ImagePath.Contains("/generated-chatgpt/") ? "chatgpt" :
                             img.ImagePath != null && img.ImagePath.Contains("/generated-copilot/") ? "copilot" :
                             img.ImagePath != null && img.ImagePath.Contains("/generated-stability/") ? "stability" : "general",
                    groupId = img.GroupId,
                    sourceSite = img.SourceSite
                }).ToList()
            }).ToList();
            return Ok(userList);
        }
        [HttpPost("users")]
        [Authorize(Roles = "Yönetici")]
        public async Task<IActionResult> CreateUser([FromBody] UserCreateRequest req)
        {
            if (string.IsNullOrWhiteSpace(req.Username) || string.IsNullOrWhiteSpace(req.Password))
                return BadRequest(new { error = "Kullanıcı adı ve şifre zorunludur." });
            string cleanUsername = req.Username.Trim().ToLower();
            if (await _context.Users.AnyAsync(u => u.Username == cleanUsername))
                return BadRequest(new { error = "Bu kullanıcı adı zaten kullanılıyor." });
            var user = new User
            {
                Username = cleanUsername,
                DisplayName = string.IsNullOrWhiteSpace(req.DisplayName) ? cleanUsername : req.DisplayName.Trim(),
                PasswordHash = BCrypt.Net.BCrypt.HashPassword(req.Password),
                Role = (req.Role == "Yönetici") ? "Yönetici" : "Kullanıcı",
                CreatedAt = DateTime.Now
            };
            _context.Users.Add(user);
            await _context.SaveChangesAsync();
            return Ok(new { success = true, id = user.Id });
        }
        [HttpPost("users/{id}")]
        [Authorize(Roles = "Yönetici")]
        public async Task<IActionResult> UpdateUser(int id, [FromBody] UserUpdateRequest req)
        {
            int currentUserId = GetCurrentUserId();
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == id);
            if (user == null) return NotFound(new { error = "Kullanıcı bulunamadı." });
            if (!string.IsNullOrWhiteSpace(req.DisplayName))
                user.DisplayName = req.DisplayName.Trim();
            if (!string.IsNullOrWhiteSpace(req.Password))
            {
                if (req.Password.Length < 4)
                    return BadRequest(new { error = "Şifre en az 4 karakter olmalıdır." });
                user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(req.Password);
            }
            if (!string.IsNullOrWhiteSpace(req.Role))
            {
                if (user.Id == currentUserId && req.Role != "Yönetici")
                {
                    return BadRequest(new { error = "Kendi yönetici rolünüzü kaldıramazsınız." });
                }
                user.Role = (req.Role == "Yönetici") ? "Yönetici" : "Kullanıcı";
            }
            await _context.SaveChangesAsync();
            return Ok(new { success = true });
        }
        [HttpDelete("users/{id}")]
        [Authorize(Roles = "Yönetici")]
        public async Task<IActionResult> DeleteUser(int id)
        {
            int currentUserId = GetCurrentUserId();
            if (id == currentUserId)
                return BadRequest(new { error = "Kendinizi silemezsiniz." });
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Id == id);
            if (user == null) return NotFound(new { error = "Kullanıcı bulunamadı." });
            if (user.Role == "Yönetici")
                return BadRequest(new { error = "Diğer bir yöneticinin hesabını doğrudan silemezsiniz." });
            var images = await _context.GeneratedImages.Where(i => i.UserId == id).ToListAsync();
            foreach (var img in images)
            {
                _imageSyncService.DeleteImageFromAllDirectories(img.ImagePath);
                _context.GeneratedImages.Remove(img);
            }
            _context.Users.Remove(user);
            await _context.SaveChangesAsync();
            return Ok(new { success = true });
        }

        [HttpGet("health")]
        [AllowAnonymous]
        public async Task<IActionResult> HealthCheck()
        {
            bool dbConnected = false;
            string? dbError = null;
            try
            {
                dbConnected = await _context.Database.CanConnectAsync();
            }
            catch (Exception ex)
            {
                dbError = ex.Message + (ex.InnerException != null ? " | " + ex.InnerException.Message : "");
            }

            return Ok(new
            {
                status = dbConnected ? "Healthy" : "Degraded",
                timestamp = DateTime.UtcNow,
                database = dbConnected ? "Connected" : "Disconnected",
                dbError = dbError,
                activeSeleniumDrivers = MultiAiSeleniumService.ActiveDriversCount
            });
        }

        [HttpGet("accounts/base-gmail")]
        [Authorize(Roles = "Yönetici")]
        public async Task<IActionResult> GetBaseGmail()
        {
            var creds = await _credentialsService.GetCredentialsAsync();
            return Ok(new { baseGmail = creds.BaseGmail });
        }

        [HttpPost("accounts/clone-plus-profile")]
        [Authorize(Roles = "Yönetici")]
        public async Task<IActionResult> ClonePlusProfile([FromBody] PlusProfileCloneRequest req)
        {
            if (req == null) return BadRequest(new { error = "Geçersiz istek." });

            var creds = await _credentialsService.GetCredentialsAsync();
            string baseGmail = !string.IsNullOrWhiteSpace(req.BaseGmail) ? req.BaseGmail.Trim() : creds.BaseGmail;

            if (string.IsNullOrWhiteSpace(baseGmail) || !baseGmail.Contains("@"))
            {
                return BadRequest(new { error = "Lütfen geçerli bir ana Gmail adresi giriniz (örnek: hesabiniz@gmail.com)." });
            }

            creds.BaseGmail = baseGmail;
            string modelType = (req.ModelType ?? "gemini").ToLowerInvariant().Trim();

            string userPart = baseGmail.Split('@')[0];
            string domainPart = baseGmail.Split('@')[1];

            int nextId;
            string newEmail;
            string profileName;
            string accountLabel;
            string loginUrl;

            if (modelType == "chatgpt")
            {
                nextId = creds.ChatGptAccounts.Count == 0 ? 1 : creds.ChatGptAccounts.Max(a => a.Id) + 1;
                newEmail = $"{userPart}+chatgpt{nextId}@{domainPart}";
                profileName = $"ChatGptChromeProfile_{nextId}";
                accountLabel = $"ChatGPT Hesap #{nextId} ({newEmail})";
                loginUrl = "https://chatgpt.com";

                creds.ChatGptAccounts.Add(new ChatGptAccountItem
                {
                    Id = nextId,
                    ProfileName = profileName,
                    AccountLabel = accountLabel,
                    Status = "Active",
                    LastUsed = ""
                });
            }
            else if (modelType == "copilot")
            {
                nextId = creds.CopilotAccounts.Count == 0 ? 1 : creds.CopilotAccounts.Max(a => a.Id) + 1;
                newEmail = $"{userPart}+copilot{nextId}@{domainPart}";
                profileName = $"CopilotChromeProfile_{nextId}";
                accountLabel = $"Copilot Hesap #{nextId} ({newEmail})";
                loginUrl = "https://copilot.microsoft.com";

                creds.CopilotAccounts.Add(new CopilotAccountItem
                {
                    Id = nextId,
                    ProfileName = profileName,
                    AccountLabel = accountLabel,
                    Status = "Active",
                    LastUsed = ""
                });
            }
            else
            {
                nextId = creds.GeminiAccounts.Count == 0 ? 1 : creds.GeminiAccounts.Max(a => a.Id) + 1;
                newEmail = $"{userPart}+gemini{nextId}@{domainPart}";
                profileName = $"GeminiChromeProfile_{nextId}";
                accountLabel = $"Google Hesap #{nextId} ({newEmail})";
                loginUrl = "https://gemini.google.com/app";

                creds.GeminiAccounts.Add(new GeminiAccountItem
                {
                    Id = nextId,
                    ProfileName = profileName,
                    AccountLabel = accountLabel,
                    Status = "Active",
                    LastUsed = ""
                });
            }

            await _credentialsService.SaveCredentialsAsync(creds);

            bool opened = false;
            if (req.AutoOpenLogin)
            {
                opened = await _multiAiSeleniumService.OpenBrowserForLoginAsync(modelType, nextId);
            }

            return Ok(new
            {
                success = true,
                email = newEmail,
                profileName = profileName,
                accountLabel = accountLabel,
                id = nextId,
                opened = opened,
                baseGmail = baseGmail
            });
        }
    }

    public class PlusProfileCloneRequest
    {
        public string ModelType { get; set; } = "gemini";
        public string BaseGmail { get; set; } = "";
        public bool AutoOpenLogin { get; set; } = true;
    }
    public class KeyUpdateRequest
    {
        public int Id { get; set; }
        public string? Label { get; set; }
        public string? ApiKey { get; set; }
        public string? Status { get; set; }
    }
    public class GenerateRequest
    {
        public string Prompt { get; set; } = "";
        public string AspectRatio { get; set; } = "1:1";
        public string Model { get; set; } = "sdxl";
        public string Style { get; set; } = "none";
    }
    public class StabilityKeyAddRequest
    {
        public string? Label { get; set; }
        public string? ApiKey { get; set; }
    }
    public class GeminiAccountUpdateRequest
    {
        public int Id { get; set; }
        public string? AccountLabel { get; set; }
        public string? Status { get; set; }
    }
    public class CustomEmailRequest
    {
        public string? Email { get; set; }
    }

    public class GeminiAccountAddRequest
    {
        public string AccountLabel { get; set; } = "";
    }
    public class GeminiLoginRequest
    {
        public int ProfileId { get; set; } = 1;
    }
    public class ProfileUpdateRequest
    {
        public string? DisplayName { get; set; }
        public string? Password { get; set; }
    }
    public class UserUpdateRequest
    {
        public string? DisplayName { get; set; }
        public string? Password { get; set; }
        public string? Role { get; set; }
    }
    public class UserCreateRequest
    {
        public string Username { get; set; } = "";
        public string? DisplayName { get; set; }
        public string Password { get; set; } = "";
        public string? Role { get; set; } = "Kullanıcı";
    }
}