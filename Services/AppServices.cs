using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using yz.Data;
using yz.Models;
namespace yz.Services
{
    public static class DatabaseInitializationService
    {
        public static void InitializeDatabase(this WebApplication app)
        {
            using var scope = app.Services.CreateScope();
            try
            {
                var db = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
                try
                {
                    db.Database.EnsureCreated();
                }
                catch (Exception ex) when (ex.Message.Contains("already exists") || ex.Message.Contains("Cannot open database") || ex.Message.Contains("4060") || ex.Message.Contains("5120") || ex.Message.Contains("Login failed"))
                {
                    Console.WriteLine("[Database] Orphaned or broken LocalDB catalog detected. Dropping database from LocalDB master and recreating...");
                    try
                    {
                        string mainConnStr = db.Database.GetConnectionString() ?? "Server=.;Database=SegmindNexusDb;Trusted_Connection=True;TrustServerCertificate=True;Encrypt=False;MultipleActiveResultSets=true";
                        var connBuilder = new Microsoft.Data.SqlClient.SqlConnectionStringBuilder(mainConnStr)
                        {
                            InitialCatalog = "master"
                        };
                        using var masterConn = new Microsoft.Data.SqlClient.SqlConnection(connBuilder.ConnectionString);
                        masterConn.Open();
                        using var cmd = masterConn.CreateCommand();
                        cmd.CommandText = @"
                            IF EXISTS (SELECT name FROM sys.databases WHERE name = N'SegmindNexusDb')
                            BEGIN
                                ALTER DATABASE [SegmindNexusDb] SET SINGLE_USER WITH ROLLBACK IMMEDIATE;
                                DROP DATABASE [SegmindNexusDb];
                            END";
                        cmd.ExecuteNonQuery();
                    }
                    catch (Exception masterEx)
                    {
                        Console.WriteLine($"[Master Clean Warning] {masterEx.Message}");
                        try { db.Database.ExecuteSqlRaw("ALTER DATABASE [SegmindNexusDb] SET SINGLE_USER WITH ROLLBACK IMMEDIATE"); } catch { }
                        try { db.Database.ExecuteSqlRaw("DROP DATABASE [SegmindNexusDb]"); } catch { }
                        try { db.Database.EnsureDeleted(); } catch { }
                    }
                    db.Database.EnsureCreated();
                }
                db.Database.ExecuteSqlRaw(@"
            IF NOT EXISTS (SELECT * FROM sys.tables WHERE name='GeneratedImages') 
            CREATE TABLE GeneratedImages (
                Id INT IDENTITY(1,1) PRIMARY KEY, 
                Prompt NVARCHAR(MAX) NULL, 
                ImagePath NVARCHAR(500) NULL, 
                ModelUsed NVARCHAR(100) NULL, 
                KeyUsedLabel NVARCHAR(100) NULL, 
                ApiKeyId INT NOT NULL, 
                UserId INT NOT NULL DEFAULT 0,
                CreatedAt DATETIME2 NOT NULL DEFAULT GETDATE()
            );");
                db.Database.ExecuteSqlRaw(@"
            IF NOT EXISTS (SELECT * FROM sys.tables WHERE name='Users')
            CREATE TABLE Users (
                Id INT IDENTITY(1,1) PRIMARY KEY,
                Username NVARCHAR(100) NOT NULL,
                DisplayName NVARCHAR(200) NOT NULL,
                PasswordHash NVARCHAR(MAX) NOT NULL,
                Role NVARCHAR(50) NOT NULL DEFAULT N'Kullanıcı',
                CreatedAt DATETIME2 NOT NULL DEFAULT GETDATE()
            );");
                db.Database.ExecuteSqlRaw(@"
            IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Users_Username')
                CREATE UNIQUE INDEX IX_Users_Username ON Users(Username);");
                db.Database.ExecuteSqlRaw(@"
            IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('GeneratedImages') AND name = 'GroupId')
                ALTER TABLE GeneratedImages ADD GroupId NVARCHAR(100) NULL;");
                db.Database.ExecuteSqlRaw(@"
            IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('GeneratedImages') AND name = 'IsSelected')
                ALTER TABLE GeneratedImages ADD IsSelected BIT NOT NULL DEFAULT 1;");
                db.Database.ExecuteSqlRaw(@"
            IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('GeneratedImages') AND name = 'SourceSite')
                ALTER TABLE GeneratedImages ADD SourceSite NVARCHAR(100) NOT NULL DEFAULT 'gemini';");
                db.Database.ExecuteSqlRaw(@"
            IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('GeneratedImages') AND name = 'UserId')
                ALTER TABLE GeneratedImages ADD UserId INT NOT NULL DEFAULT 0;");
                var adminExists = db.Users.Any(u => u.Username == "admin");
                if (!adminExists)
                {
                    string adminPasswordHash = BCrypt.Net.BCrypt.HashPassword("admin123");
                    var adminUser = new User
                    {
                        Username = "admin",
                        DisplayName = "Sistem Yöneticisi",
                        PasswordHash = adminPasswordHash,
                        Role = "Yönetici",
                        CreatedAt = DateTime.Now
                    };
                    db.Users.Add(adminUser);
                    db.SaveChanges();
                    Console.WriteLine("[Auth] Varsayılan admin kullanıcısı oluşturuldu (admin / admin123).");
                }
                var adminUser2 = db.Users.FirstOrDefault(u => u.Username == "admin");
                if (adminUser2 != null)
                {
                    int adminId = adminUser2.Id;
                    int updatedRows = db.Database.ExecuteSqlRaw(
                        "UPDATE GeneratedImages SET UserId = {0} WHERE UserId = 0", adminId);
                    if (updatedRows > 0)
                    {
                        Console.WriteLine($"[Auth] {updatedRows} adet sahipsiz görsel admin kullanıcısına (ID={adminId}) atandı.");
                    }
                }
                Console.WriteLine("[Database] Database initialized and checked successfully.");
                try
                {
                    var credService = scope.ServiceProvider.GetRequiredService<AiCredentialsService>();
                    credService.GetCredentialsAsync().GetAwaiter().GetResult();
                    Console.WriteLine("[Credentials] ai_credentials.json initialized and synchronized.");
                }
                catch (Exception credEx)
                {
                    Console.WriteLine($"[Credentials Error] {credEx.Message}");
                }
                try
                {
                    var imgService = scope.ServiceProvider.GetRequiredService<ImageSyncService>();
                    imgService.SyncDatabaseWithFilesystem(db);
                    Console.WriteLine("[Image Sync] Veritabanı ve klasörler başarıyla senkronize edildi.");
                }
                catch (Exception imgEx)
                {
                    Console.WriteLine($"[Image Sync Error] {imgEx.Message}");
                }
                if (adminUser2 != null)
                {
                    db.Database.ExecuteSqlRaw(
                        "UPDATE GeneratedImages SET UserId = {0} WHERE UserId = 0", adminUser2.Id);
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[Database Error] Failed to initialize database: {ex.Message}");
            }
        }
    }
    public class ImageSyncService
    {
        private readonly IWebHostEnvironment _env;
        public ImageSyncService(IWebHostEnvironment env)
        {
            _env = env;
        }
        public List<string> GetTargetDirectories(string category = "stability")
        {
            var webRoot = _env.WebRootPath ?? Path.Combine(Directory.GetCurrentDirectory(), "wwwroot");
            string subFolder = category.ToLowerInvariant() switch
            {
                "gemini" => "generated-gemini", "chatgpt" => "generated-chatgpt", "copilot" => "generated-copilot",
                "free" => "generated-free",
                _ => "generated-stability"
            };
            var dir = Path.Combine(webRoot, subFolder);
            Directory.CreateDirectory(dir);
            return new List<string> { dir };
        }
        public void SyncImagesOnStartup()
        {
            try
            {
                GetTargetDirectories("gemini"); GetTargetDirectories("chatgpt"); GetTargetDirectories("copilot");
                GetTargetDirectories("free");
                GetTargetDirectories("stability");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[Image Sync Warning] {ex.Message}");
            }
        }
        public void DeleteAllExistingImages()
        {
            try
            {
                var webRoot = _env.WebRootPath ?? Path.Combine(Directory.GetCurrentDirectory(), "wwwroot");
                var folders = new[] { "generated", "generated-free", "generated-gemini", "generated-stability" };
                int deletedCount = 0;
                foreach (var folder in folders)
                {
                    var dirPath = Path.Combine(webRoot, folder);
                    if (Directory.Exists(dirPath))
                    {
                        var files = Directory.GetFiles(dirPath, "*.*")
                            .Where(f => f.EndsWith(".png", StringComparison.OrdinalIgnoreCase) ||
                                        f.EndsWith(".jpg", StringComparison.OrdinalIgnoreCase) ||
                                        f.EndsWith(".jpeg", StringComparison.OrdinalIgnoreCase));
                        foreach (var file in files)
                        {
                            try { File.Delete(file); deletedCount++; } catch { }
                        }
                    }
                }
                Console.WriteLine($"[Image Cleanup] Tüm eski resimler silindi. Toplam: {deletedCount} adet.");
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[Image Cleanup Error] {ex.Message}");
            }
        }
        public async Task SaveImageToAllDirectoriesAsync(byte[] imageBytes, string fileName, string category = "stability")
        {
            foreach (var d in GetTargetDirectories(category))
            {
                try { await File.WriteAllBytesAsync(Path.Combine(d, fileName), imageBytes); } catch { }
            }
        }
        public void DeleteImageFromAllDirectories(string imagePath)
        {
            try
            {
                if (!string.IsNullOrEmpty(imagePath))
                {
                    var webRoot = _env.WebRootPath ?? Path.Combine(Directory.GetCurrentDirectory(), "wwwroot");
                    var cleanRelPath = imagePath.TrimStart('/', '\\').Replace('/', Path.DirectorySeparatorChar).Replace('\\', Path.DirectorySeparatorChar);
                    var exactPath = Path.Combine(webRoot, cleanRelPath);
                    if (File.Exists(exactPath))
                    {
                        try { File.Delete(exactPath); } catch { }
                    }
                    var fileName = Path.GetFileName(imagePath);
                    var allFolders = new[] { "generated-stability", "generated-gemini", "generated-chatgpt", "generated-copilot", "generated-free", "generated" };
                    foreach (var f in allFolders)
                    {
                        var filePath = Path.Combine(webRoot, f, fileName);
                        if (File.Exists(filePath))
                        {
                            try { File.Delete(filePath); } catch { }
                        }
                    }
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[Delete File Error] {ex.Message}");
            }
        }
        public void SyncDatabaseWithFilesystem(ApplicationDbContext db)
        {
            try
            {
                var webRoot = _env.WebRootPath ?? Path.Combine(Directory.GetCurrentDirectory(), "wwwroot");
                bool changed = false;
                var allDbImages = db.GeneratedImages.ToList();
                foreach (var img in allDbImages)
                {
                    bool exists = false;
                    if (!string.IsNullOrEmpty(img.ImagePath))
                    {
                        var cleanRelPath = img.ImagePath.TrimStart('/', '\\').Replace('/', Path.DirectorySeparatorChar).Replace('\\', Path.DirectorySeparatorChar);
                        var exactPath = Path.Combine(webRoot, cleanRelPath);
                        if (File.Exists(exactPath))
                        {
                            exists = true;
                        }
                        else
                        {
                            var fileName = Path.GetFileName(img.ImagePath);
                            var folders = new[] { "generated-stability", "generated-gemini", "generated-chatgpt", "generated-copilot", "generated-free", "generated" };
                            foreach (var f in folders)
                            {
                                var checkPath = Path.Combine(webRoot, f, fileName);
                                if (File.Exists(checkPath))
                                {
                                    img.ImagePath = $"/{f}/{fileName}";
                                    exists = true;
                                    changed = true;
                                    break;
                                }
                            }
                        }
                    }
                    if (!exists)
                    {
                        db.GeneratedImages.Remove(img);
                        changed = true;
                    }
                }
                var targetFolders = new[] { "generated-stability", "generated-gemini", "generated-chatgpt", "generated-copilot", "generated-free", "generated" };
                var adminUser = db.Users.FirstOrDefault(u => u.Username == "admin");
                int adminId = adminUser != null ? adminUser.Id : 1;
                var existingUserIds = db.Users.Select(u => u.Id).ToHashSet();
                foreach (var folder in targetFolders)
                {
                    var dirPath = Path.Combine(webRoot, folder);
                    if (Directory.Exists(dirPath))
                    {
                        var files = Directory.GetFiles(dirPath, "*.*")
                            .Where(f => f.EndsWith(".png", StringComparison.OrdinalIgnoreCase) ||
                                        f.EndsWith(".jpg", StringComparison.OrdinalIgnoreCase) ||
                                        f.EndsWith(".jpeg", StringComparison.OrdinalIgnoreCase) ||
                                        f.EndsWith(".webp", StringComparison.OrdinalIgnoreCase));
                        foreach (var file in files)
                        {
                            var fileName = Path.GetFileName(file);
                            var relPath = $"/{folder}/{fileName}";
                            if (!db.GeneratedImages.Local.Any(i => i.ImagePath == relPath || i.ImagePath.EndsWith("/" + fileName)) &&
                                !db.GeneratedImages.Any(i => i.ImagePath == relPath || i.ImagePath.EndsWith("/" + fileName)))
                            {
                                string modelUsedName = folder switch
                                {
                                    "generated-gemini" => "Google Gemini Web (Dışarıdan Eklenen)",
                                    "generated-free" => "FLUX.1 (Dışarıdan Eklenen)",
                                    "generated-stability" => "SDXL / Stability (Dışarıdan Eklenen)",
                                    _ => "Genel Görsel (Dışarıdan Eklenen)"
                                };
                                string keyLabelName = folder switch
                                {
                                    "generated-gemini" => "Google Gemini", "generated-chatgpt" => "ChatGPT (DALL-E 3)", "generated-copilot" => "Microsoft Copilot (Bing)",
                                    "generated-free" => "Pollinations AI",
                                    "generated-stability" => "Stability AI",
                                    _ => "Genel"
                                };
                                string? extractedGroupId = null;
                                if (fileName.Contains("triple_"))
                                {
                                    var parts = fileName.Split('_');
                                    for (int p = 0; p < parts.Length - 1; p++)
                                    {
                                        if (parts[p] == "triple" && p + 1 < parts.Length)
                                        {
                                            extractedGroupId = parts[p + 1];
                                            break;
                                        }
                                    }
                                }
                                int fileUserId = adminId;
                                if (fileName.Contains("-u"))
                                {
                                    var match = System.Text.RegularExpressions.Regex.Match(fileName, @"-u(\d+)-");
                                    if (match.Success && int.TryParse(match.Groups[1].Value, out int extractedUserId))
                                    {
                                        if (existingUserIds.Contains(extractedUserId))
                                        {
                                            fileUserId = extractedUserId;
                                        }
                                    }
                                }
                                db.GeneratedImages.Add(new GeneratedImage
                                {
                                    ImagePath = relPath,
                                    Prompt = $"Dışarıdan eklenen görsel ({fileName})",
                                    ModelUsed = modelUsedName,
                                    KeyUsedLabel = keyLabelName,
                                    ApiKeyId = 0,
                                    UserId = fileUserId,
                                    CreatedAt = File.GetCreationTime(file),
                                    GroupId = extractedGroupId
                                });
                                changed = true;
                            }
                        }
                    }
                }
                foreach (var img in allDbImages)
                {
                    if (!string.IsNullOrEmpty(img.ImagePath) && img.ImagePath.Contains("-u"))
                    {
                        var fn = Path.GetFileName(img.ImagePath);
                        var match = System.Text.RegularExpressions.Regex.Match(fn, @"-u(\d+)-");
                        if (match.Success && int.TryParse(match.Groups[1].Value, out int realUserId))
                        {
                            if (img.UserId != realUserId && existingUserIds.Contains(realUserId))
                            {
                                img.UserId = realUserId;
                                changed = true;
                            }
                        }
                    }
                }
                AutoGroupTripleImages(db, ref changed);
                if (changed)
                {
                    db.SaveChanges();
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[SyncDatabaseWithFilesystem Error] {ex.Message}");
            }
        }

        private void AutoGroupTripleImages(ApplicationDbContext db, ref bool changed)
        {
            var unGrouped = db.GeneratedImages
                .Where(i => string.IsNullOrEmpty(i.GroupId))
                .OrderBy(i => i.CreatedAt)
                .ToList();

            if (!unGrouped.Any()) return;

            var tripleFolders = new HashSet<string> { "gemini", "chatgpt", "copilot" };

            var used = new HashSet<int>();
            for (int i = 0; i < unGrouped.Count; i++)
            {
                var item1 = unGrouped[i];
                if (used.Contains(item1.Id)) continue;

                string folder1 = GetFolderFromPath(item1.ImagePath);
                if (!tripleFolders.Contains(folder1)) continue;

                var cluster = new List<GeneratedImage> { item1 };

                for (int j = i + 1; j < unGrouped.Count; j++)
                {
                    var item2 = unGrouped[j];
                    if (used.Contains(item2.Id)) continue;

                    string folder2 = GetFolderFromPath(item2.ImagePath);
                    if (!tripleFolders.Contains(folder2)) continue;

                    double secDiff = Math.Abs((item2.CreatedAt - item1.CreatedAt).TotalSeconds);
                    if (secDiff <= 180)
                    {
                        if (!cluster.Any(c => GetFolderFromPath(c.ImagePath) == folder2))
                        {
                            cluster.Add(item2);
                        }
                    }
                    else
                    {
                        break;
                    }
                }

                if (cluster.Count >= 2)
                {
                    string newGroupId = $"triple_auto_{item1.CreatedAt:yyyyMMddHHmmss}_{Guid.NewGuid().ToString()[..6]}";
                    foreach (var img in cluster)
                    {
                        img.GroupId = newGroupId;
                        used.Add(img.Id);
                    }
                    changed = true;
                }
            }
        }

        private static string GetFolderFromPath(string? path)
        {
            if (string.IsNullOrEmpty(path)) return "";
            var lower = path.ToLowerInvariant();
            if (lower.Contains("generated-gemini")) return "gemini";
            if (lower.Contains("generated-chatgpt")) return "chatgpt";
            if (lower.Contains("generated-copilot")) return "copilot";
            if (lower.Contains("generated-stability")) return "stability";
            if (lower.Contains("generated-free")) return "free";
            return "";
        }
    }
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
    public class ChatGptAccountItem
    {
        public int Id { get; set; }
        public string ProfileName { get; set; } = "";
        public string AccountLabel { get; set; } = "";
        public string Status { get; set; } = "Active";
        public string LastUsed { get; set; } = "";
    }
    public class CopilotAccountItem
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
        public List<ChatGptAccountItem> ChatGptAccounts { get; set; } = new();
        public int CurrentChatGptProfileIndex { get; set; } = 0;
        public List<CopilotAccountItem> CopilotAccounts { get; set; } = new();
        public int CurrentCopilotProfileIndex { get; set; } = 0;
    }
    public class AiCredentialsService
    {
        private static readonly System.Threading.SemaphoreSlim _fileLock = new System.Threading.SemaphoreSlim(1, 1);
        private readonly ApplicationDbContext _context;
        public AiCredentialsService(ApplicationDbContext context)
        {
            _context = context;
        }
        public async Task<AiCredentialsData> GetCredentialsAsync()
        {
            await _fileLock.WaitAsync();
            try
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
                        if (data.StabilityApiKeys.Count == 0)
                        {
                            data.StabilityApiKeys.Add(new StabilityKeyItem
                            {
                                Id = 1,
                                Label = "Stability Anahtarı #1",
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
                        if (data.ChatGptAccounts == null) data.ChatGptAccounts = new List<ChatGptAccountItem>();
                        if (data.ChatGptAccounts.Count == 0)
                        {
                            for (int i = 1; i <= 2; i++)
                            {
                                data.ChatGptAccounts.Add(new ChatGptAccountItem
                                {
                                    Id = i,
                                    ProfileName = $"ChatGptChromeProfile_{i}",
                                    AccountLabel = $"ChatGPT Hesap #{i}" + (i == 1 ? " (Ana Profil)" : ""),
                                    Status = "Active",
                                    LastUsed = ""
                                });
                            }
                            await SaveCredentialsAsync(data);
                        }
                        if (data.CopilotAccounts == null) data.CopilotAccounts = new List<CopilotAccountItem>();
                        if (data.CopilotAccounts.Count == 0)
                        {
                            for (int i = 1; i <= 2; i++)
                            {
                                data.CopilotAccounts.Add(new CopilotAccountItem
                                {
                                    Id = i,
                                    ProfileName = $"CopilotChromeProfile_{i}",
                                    AccountLabel = $"Copilot Hesap #{i}" + (i == 1 ? " (Ana Profil)" : ""),
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
            finally
            {
                _fileLock.Release();
            }
        }
        public async Task SaveCredentialsAsync(AiCredentialsData data)
        {
            await _fileLock.WaitAsync();
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
            finally
            {
                _fileLock.Release();
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
                if (data.ChatGptAccounts != null)
                {
                    foreach (var c in data.ChatGptAccounts) c.Status = "Active";
                }
                data.CurrentChatGptProfileIndex = 0;
                if (data.CopilotAccounts != null)
                {
                    foreach (var cp in data.CopilotAccounts) cp.Status = "Active";
                }
                data.CurrentCopilotProfileIndex = 0;
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
                    else if (!_context.ApiKeys.Local.Any(k => k.Id == item.Id))
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