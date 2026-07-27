using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using yz.Models;
using yz.Services;

namespace yz.Controllers
{
    [ApiController]
    [Route("api/bulk-accounts")]
    [Authorize(Roles = "Yönetici")]
    public class AccountBulkController : ControllerBase
    {
        private readonly AiCredentialsService _credentialsService;
        private readonly MultiAiSeleniumService _seleniumService;

        public AccountBulkController(AiCredentialsService credentialsService, MultiAiSeleniumService seleniumService)
        {
            _credentialsService = credentialsService;
            _seleniumService = seleniumService;
        }

        [HttpPost("import")]
        public async Task<IActionResult> ImportAccounts(IFormFile file)
        {
            if (file == null || file.Length == 0) return BadRequest("Dosya yüklenmedi.");

            var accounts = new List<AccountBulkInfo>();
            using (var reader = new StreamReader(file.OpenReadStream()))
            {
                while (!reader.EndOfStream)
                {
                    var line = await reader.ReadLineAsync();
                    if (string.IsNullOrWhiteSpace(line)) continue;
                    var parts = line.Split('|');
                    if (parts.Length >= 3)
                    {
                        accounts.Add(new AccountBulkInfo
                        {
                            ModelType = parts[0].Trim(),
                            Email = parts[1].Trim(),
                            Password = parts[2].Trim()
                        });
                    }
                }
            }

            var creds = await _credentialsService.GetCredentialsAsync();

            int geminiCount = creds.GeminiAccounts?.Any() == true ? creds.GeminiAccounts.Max(x => x.Id) : 0;
            int chatgptCount = creds.ChatGptAccounts?.Any() == true ? creds.ChatGptAccounts.Max(x => x.Id) : 0;
            int copilotCount = creds.CopilotAccounts?.Any() == true ? creds.CopilotAccounts.Max(x => x.Id) : 0;

            var processList = new List<AccountBulkInfo>();

            foreach (var acc in accounts)
            {
                if (acc.ModelType.Equals("Gemini", StringComparison.OrdinalIgnoreCase))
                {
                    geminiCount++;
                    var profile = creds.GeminiAccounts.FirstOrDefault(x => x.Id == geminiCount);
                    if (profile == null)
                    {
                        profile = new GeminiAccountItem { Id = geminiCount };
                        creds.GeminiAccounts.Add(profile);
                    }
                    profile.ProfileName = $"GeminiChromeProfile_{geminiCount}";
                    profile.AccountLabel = $"Google Hesap #{geminiCount} ({acc.Email})";
                    profile.Status = "Active";
                    acc.ProfileIndex = geminiCount;
                    processList.Add(acc);
                }
                else if (acc.ModelType.Equals("ChatGPT", StringComparison.OrdinalIgnoreCase))
                {
                    chatgptCount++;
                    var profile = creds.ChatGptAccounts.FirstOrDefault(x => x.Id == chatgptCount);
                    if (profile == null)
                    {
                        profile = new ChatGptAccountItem { Id = chatgptCount };
                        creds.ChatGptAccounts.Add(profile);
                    }
                    profile.ProfileName = $"ChatGptChromeProfile_{chatgptCount}";
                    profile.AccountLabel = $"ChatGPT Hesap #{chatgptCount} ({acc.Email})";
                    profile.Status = "Active";
                    acc.ProfileIndex = chatgptCount;
                    processList.Add(acc);
                }
                else if (acc.ModelType.Equals("Copilot", StringComparison.OrdinalIgnoreCase))
                {
                    copilotCount++;
                    var profile = creds.CopilotAccounts.FirstOrDefault(x => x.Id == copilotCount);
                    if (profile == null)
                    {
                        profile = new CopilotAccountItem { Id = copilotCount };
                        creds.CopilotAccounts.Add(profile);
                    }
                    profile.ProfileName = $"CopilotChromeProfile_{copilotCount}";
                    profile.AccountLabel = $"Copilot Hesap #{copilotCount} ({acc.Email})";
                    profile.Status = "Active";
                    acc.ProfileIndex = copilotCount;
                    processList.Add(acc);
                }
            }

            await _credentialsService.SaveCredentialsAsync(creds);

            // Arka planda login islemini baslat
            _ = Task.Run(async () =>
            {
                await _seleniumService.StartBulkAutoLoginAsync(processList);
            });

            return Ok(new { success = true, message = $"{accounts.Count} hesap başarıyla tanımlandı ve otomatik giriş (Auto-Login) işlemi arka planda başlatıldı. Sisteme dışarıdan müdahale etmeyiniz ve tarayıcıların işini bitirmesini bekleyiniz." });
        }
    }
}
