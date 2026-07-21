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
        private readonly GeminiSeleniumService _geminiSeleniumService;
        private readonly MultiAiSeleniumService _multiAiSeleniumService;
        private readonly AiCredentialsService _credentialsService;

        public ApiController(ApplicationDbContext context, AiGenerationService aiGenerationService, ImageSyncService imageSyncService, GeminiSeleniumService geminiSeleniumService, MultiAiSeleniumService multiAiSeleniumService, AiCredentialsService credentialsService)
        {
            _context = context;
            _aiGenerationService = aiGenerationService;
            _imageSyncService = imageSyncService;
            _geminiSeleniumService = geminiSeleniumService;
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

            foreach (var g in creds.GeminiAccounts)
            {
                g.Status = "Active";
            }
            creds.CurrentGeminiProfileIndex = 0;

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
            int nextId = (creds.ChatGptAccounts.Count == 0 ? 1 : creds.ChatGptAccounts.Max(a => a.Id) + 1);
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

            // Ana ekranda (ve normal galeride) her kullanıcı (admin dahil) SADECE kendi ürettiği görselleri görür.
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

        // --- PROFİL ENDPOINTLERİ (Tüm Kullanıcılar) ---
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

        // --- KULLANICI YÖNETİMİ ENDPOINTLERİ (Sadece Yönetici) ---
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
                // Diğer adminlerin görsellerini GÖRMESİN (ancak kendi görsellerini görebilir veya standart kullanıcılarınkini görebilir)
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

            // Kullanıcının görsellerini sil
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

    public class GeminiAccountAddRequest
    {
        public string? AccountLabel { get; set; }
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
