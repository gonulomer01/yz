using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using yz.Data;
using yz.Models;

namespace yz.Services
{
    public class StabilityKeyItem
    {
        public int Id { get; set; }
        public string Label { get; set; } = "";
        public string KeyValue { get; set; } = "";
        public string Status { get; set; } = "Active";
        public int UsageToday { get; set; } = 0;
        public int TotalUsage { get; set; } = 0;
    }

    public class GeminiAccountItem
    {
        public int Id { get; set; }
        public string ProfileName { get; set; } = "";
        public string AccountLabel { get; set; } = "";
        public string Status { get; set; } = "Active";
        public string LastUsed { get; set; } = "";
    }

    public class AiCredentialsData
    {
        public List<StabilityKeyItem> StabilityApiKeys { get; set; } = new();
        public int CurrentKeyIndex { get; set; } = 0;
        public string LastResetDate { get; set; } = "";
        public List<GeminiAccountItem> GeminiAccounts { get; set; } = new();
        public int CurrentGeminiProfileIndex { get; set; } = 0;
    }

    public class AiCredentialsService
    {
        private readonly ApplicationDbContext _context;

        public AiCredentialsService(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<AiCredentialsData> GetCredentialsAsync()
        {
            string projectFilePath = Path.Combine(Directory.GetCurrentDirectory(), "ai_credentials.json");
            string baseFilePath = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "ai_credentials.json");

            string activePath = File.Exists(projectFilePath) ? projectFilePath : (File.Exists(baseFilePath) ? baseFilePath : projectFilePath);

            if (!File.Exists(activePath))
            {
                var data = new AiCredentialsData
                {
                    CurrentKeyIndex = 0,
                    LastResetDate = DateTime.Today.ToString("yyyy-MM-dd"),
                    CurrentGeminiProfileIndex = 0
                };

                for (int i = 1; i <= 10; i++)
                {
                    data.StabilityApiKeys.Add(new StabilityKeyItem
                    {
                        Id = i,
                        Label = $"Hesap {i}",
                        KeyValue = "",
                        Status = "Active",
                        UsageToday = 0,
                        TotalUsage = 0
                    });
                }

                for (int i = 1; i <= 4; i++)
                {
                    data.GeminiAccounts.Add(new GeminiAccountItem
                    {
                        Id = i,
                        ProfileName = $"GeminiChromeProfile_{i}",
                        AccountLabel = $"Google Hesap #{i}" + (i == 1 ? " (Ana Profil)" : ""),
                        Status = "Active",
                        LastUsed = ""
                    });
                }

                await SaveCredentialsAsync(data);
                return data;
            }
            else
            {
                try
                {
                    string json = await File.ReadAllTextAsync(activePath);
                    var data = JsonSerializer.Deserialize<AiCredentialsData>(json, new JsonSerializerOptions { PropertyNameCaseInsensitive = true });
                    if (data == null) data = new AiCredentialsData();

                    if (data.StabilityApiKeys == null) data.StabilityApiKeys = new List<StabilityKeyItem>();
                    while (data.StabilityApiKeys.Count < 10)
                    {
                        int nextId = (data.StabilityApiKeys.Count == 0 ? 1 : data.StabilityApiKeys.Max(k => k.Id) + 1);
                        data.StabilityApiKeys.Add(new StabilityKeyItem
                        {
                            Id = nextId,
                            Label = $"Hesap {nextId}",
                            KeyValue = "",
                            Status = "Active",
                            UsageToday = 0,
                            TotalUsage = 0
                        });
                    }

                    if (data.GeminiAccounts == null) data.GeminiAccounts = new List<GeminiAccountItem>();
                    if (data.GeminiAccounts.Count == 0)
                    {
                        for (int i = 1; i <= 4; i++)
                        {
                            data.GeminiAccounts.Add(new GeminiAccountItem
                            {
                                Id = i,
                                ProfileName = $"GeminiChromeProfile_{i}",
                                AccountLabel = $"Google Hesap #{i}" + (i == 1 ? " (Ana Profil)" : ""),
                                Status = "Active",
                                LastUsed = ""
                            });
                        }
                        await SaveCredentialsAsync(data);
                    }

                    try { await SyncWithDatabaseAsync(data); } catch { }
                    return data;
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"[AiCredentialsService Read Error] {ex.Message}");
                    return new AiCredentialsData();
                }
            }
        }

        public async Task SaveCredentialsAsync(AiCredentialsData data)
        {
            try
            {
                var options = new JsonSerializerOptions { WriteIndented = true };
                string json = JsonSerializer.Serialize(data, options);

                string projectFilePath = Path.Combine(Directory.GetCurrentDirectory(), "ai_credentials.json");
                string baseFilePath = Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "ai_credentials.json");

                await File.WriteAllTextAsync(projectFilePath, json);
                try
                {
                    if (!string.Equals(baseFilePath, projectFilePath, StringComparison.OrdinalIgnoreCase))
                    {
                        await File.WriteAllTextAsync(baseFilePath, json);
                    }
                }
                catch { }

                try { await SyncWithDatabaseAsync(data); } catch { }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[AiCredentialsService Save Error] {ex.Message}");
            }
        }

        public async Task CheckDailyResetAsync()
        {
            var data = await GetCredentialsAsync();
            var todayStr = DateTime.Today.ToString("yyyy-MM-dd");
            if (data.LastResetDate != todayStr)
            {
                data.LastResetDate = todayStr;
                data.CurrentKeyIndex = 0;
                foreach (var k in data.StabilityApiKeys)
                {
                    k.Status = "Active";
                    k.UsageToday = 0;
                }
                foreach (var g in data.GeminiAccounts)
                {
                    g.Status = "Active";
                }
                data.CurrentGeminiProfileIndex = 0;
                await SaveCredentialsAsync(data);
            }
        }

        public string MaskKey(string key)
        {
            if (string.IsNullOrEmpty(key)) return "";
            if (key.Length <= 8) return "********";
            return $"{key[..6]}...{key[^4..]}";
        }

        private async Task SyncWithDatabaseAsync(AiCredentialsData data)
        {
            try
            {
                if (!_context.Database.CanConnect()) return;

                var dbKeys = await _context.ApiKeys.ToListAsync();
                var currentIds = data.StabilityApiKeys.Select(k => k.Id).ToHashSet();
                foreach (var dbKey in dbKeys)
                {
                    if (!currentIds.Contains(dbKey.Id))
                    {
                        _context.ApiKeys.Remove(dbKey);
                    }
                }

                foreach (var item in data.StabilityApiKeys)
                {
                    var dbKey = dbKeys.FirstOrDefault(k => k.Id == item.Id);
                    if (dbKey != null)
                    {
                        dbKey.Label = item.Label ?? "";
                        dbKey.KeyValue = item.KeyValue ?? "";
                        dbKey.Status = item.Status ?? "Active";
                        dbKey.UsageToday = item.UsageToday;
                        dbKey.TotalUsage = item.TotalUsage;
                    }
                    else
                    {
                        _context.ApiKeys.Add(new ApiKey
                        {
                            Id = item.Id,
                            Label = item.Label ?? $"Hesap {item.Id}",
                            KeyValue = item.KeyValue ?? "",
                            Status = item.Status ?? "Active",
                            UsageToday = item.UsageToday,
                            TotalUsage = item.TotalUsage
                        });
                    }
                }

                var idxSetting = await _context.AppSettings.FirstOrDefaultAsync(s => s.Key == "CurrentKeyIndex");
                if (idxSetting != null) idxSetting.Value = data.CurrentKeyIndex.ToString();
                else _context.AppSettings.Add(new AppSetting { Key = "CurrentKeyIndex", Value = data.CurrentKeyIndex.ToString() });

                var lastReset = await _context.AppSettings.FirstOrDefaultAsync(s => s.Key == "LastResetDate");
                if (lastReset != null) lastReset.Value = data.LastResetDate ?? "";
                else _context.AppSettings.Add(new AppSetting { Key = "LastResetDate", Value = data.LastResetDate ?? "" });

                await _context.SaveChangesAsync();
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[AiCredentialsService Sync Info] DB ile eşitleme atlandı: {ex.Message}");
            }
        }
    }
}

