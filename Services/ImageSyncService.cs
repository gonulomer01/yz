using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Hosting;
using yz.Data;
using yz.Models;

namespace yz.Services
{
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
                "gemini" => "generated-gemini",
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
                GetTargetDirectories("gemini");
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
                    var allFolders = new[] { "generated-stability", "generated-gemini", "generated-free", "generated" };
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
                            var folders = new[] { "generated-stability", "generated-gemini", "generated-free", "generated" };
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

                var targetFolders = new[] { "generated-stability", "generated-gemini", "generated-free", "generated" };
                var adminUser = db.Users.FirstOrDefault(u => u.Username == "admin");
                int adminId = adminUser != null ? adminUser.Id : 1;

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
                                    "generated-gemini" => "Google Gemini",
                                    "generated-free" => "Pollinations AI",
                                    "generated-stability" => "Stability AI",
                                    _ => "Genel"
                                };

                                db.GeneratedImages.Add(new GeneratedImage
                                {
                                    ImagePath = relPath,
                                    Prompt = $"Dışarıdan eklenen görsel ({fileName})",
                                    ModelUsed = modelUsedName,
                                    KeyUsedLabel = keyLabelName,
                                    ApiKeyId = 0,
                                    UserId = adminId,
                                    CreatedAt = File.GetCreationTime(file)
                                });
                                changed = true;
                            }
                        }
                    }
                }

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
    }
}
