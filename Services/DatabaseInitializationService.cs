using System;
using System.IO;
using System.Linq;
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
                        using var masterConn = new Microsoft.Data.SqlClient.SqlConnection("Server=(localdb)\\mssqllocaldb;Database=master;Trusted_Connection=True;MultipleActiveResultSets=true");
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

                // Users tablosunu oluştur (yoksa)
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

                // Users tablosuna Username unique index ekle (yoksa)
                db.Database.ExecuteSqlRaw(@"
            IF NOT EXISTS (SELECT * FROM sys.indexes WHERE name = 'IX_Users_Username')
                CREATE UNIQUE INDEX IX_Users_Username ON Users(Username);");

                // GeneratedImages tablosuna UserId sütunu ekle (yoksa)
                db.Database.ExecuteSqlRaw(@"
            IF NOT EXISTS (SELECT * FROM sys.columns WHERE object_id = OBJECT_ID('GeneratedImages') AND name = 'UserId')
                ALTER TABLE GeneratedImages ADD UserId INT NOT NULL DEFAULT 0;");

                // Varsayılan admin kullanıcısını oluştur (yoksa)
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

                // Mevcut UserId=0 olan görselleri admin kullanıcısına ata
                var adminUser2 = db.Users.FirstOrDefault(u => u.Username == "admin");
                if (adminUser2 != null)
                {
                    int adminId = adminUser2.Id;
                    db.Database.ExecuteSqlRaw(
                        "UPDATE GeneratedImages SET UserId = {0} WHERE UserId = 0", adminId);
                    Console.WriteLine($"[Auth] Mevcut görseller admin kullanıcısına (ID={adminId}) atandı.");
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

                // Sync sonrası tekrar UserId=0 olanları admin'e ata (filesystem'den yeni eklenen görseller)
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
}
