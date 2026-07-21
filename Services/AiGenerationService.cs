using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text.Json;
using System.Threading.Tasks;
using Microsoft.EntityFrameworkCore;
using yz.Controllers;
using yz.Data;
using yz.Models;
namespace yz.Services
{
    public class AiGenerationService
    {
        private readonly ApplicationDbContext _context;
        private readonly HttpClient _httpClient;
        private readonly ImageSyncService _imageSyncService;
        private readonly MultiAiSeleniumService _multiAiSeleniumService;
        private readonly AiCredentialsService _credentialsService;
        public AiGenerationService(ApplicationDbContext context, HttpClient httpClient, ImageSyncService imageSyncService, MultiAiSeleniumService multiAiSeleniumService, AiCredentialsService credentialsService)
        {
            _context = context;
            _httpClient = httpClient;
            _imageSyncService = imageSyncService;
            _multiAiSeleniumService = multiAiSeleniumService;
            _credentialsService = credentialsService;
        }
        public async Task CheckDailyResetAsync()
        {
            await _credentialsService.CheckDailyResetAsync();
        }
        public string MaskKey(string key)
        {
            if (string.IsNullOrEmpty(key)) return "";
            if (key.Length <= 8) return "********";
            return $"{key[..6]}...{key[^4..]}";
        }
        private void GetDimensions(string aspectRatio, out int width, out int height)
        {
            width = 1024;
            height = 1024;
            if (aspectRatio == "16:9") { width = 1344; height = 768; }
            else if (aspectRatio == "9:16") { width = 768; height = 1344; }
        }
        private string ApplyStyle(string prompt, string style)
        {
            return style switch
            {
                "cinematic" => $"cinematic photo of {prompt}, dramatic lighting, shallow depth of field, 8k, photorealistic",
                "photorealistic" => $"professional photograph of {prompt}, 35mm lens, analog film, natural lighting, high detail",
                "anime" => $"anime style illustration of {prompt}, vibrant colors, detailed line art, studio quality",
                "digital-art" => $"concept art of {prompt}, digital painting, highly detailed, sharp focus, trending on artstation",
                "3d-render" => $"octane render of {prompt}, 3d model, unreal engine 5, ray tracing, hyper-detailed",
                "watercolor" => $"watercolor painting of {prompt}, soft pastel colors, textured paper, artistic brush strokes",
                "oil-painting" => $"oil painting of {prompt}, canvas texture, heavy brush strokes, classical art, museum quality",
                "comic" => $"comic book style of {prompt}, bold outlines, retro halftone shading, pop art",
                "cyberpunk" => $"cyberpunk scene of {prompt}, neon lights, rain, futuristic city, synthwave aesthetic",
                _ => prompt
            };
        }
        private void AddFormField(MultipartFormDataContent form, string name, string value)
        {
            var content = new StringContent(value);
            content.Headers.ContentDisposition = new ContentDispositionHeaderValue("form-data")
            {
                Name = $"\"{name}\""
            };
            form.Add(content);
        }
        public async Task<(int StatusCode, object Response)> GenerateAsync(GenerateRequest req, int userId = 0, bool isAdmin = false)
        {
            if (req == null || string.IsNullOrWhiteSpace(req.Prompt))
                return (400, new { error = "Prompt gerekli." });
            string model = string.IsNullOrEmpty(req.Model) ? "sdxl" : req.Model;
            string finalPrompt = EnrichTurkishPromptForAi(ApplyStyle(req.Prompt, req.Style ?? "none"));
            try
            {
                if (model.StartsWith("pollinations-"))
                {
                    return await GeneratePollinationsAsync(req, model, finalPrompt, userId);
                }
                if (model == "gemini-web-profile")
                {
                    return await _multiAiSeleniumService.GenerateFromGeminiAsync(finalPrompt, req.AspectRatio, userId, isAdmin);
                }
                if (model == "chatgpt-web-profile")
                {
                    return await _multiAiSeleniumService.GenerateFromChatGptAsync(finalPrompt, req.AspectRatio, userId, isAdmin);
                }
                if (model == "copilot-web-profile")
                {
                    return await _multiAiSeleniumService.GenerateFromCopilotAsync(finalPrompt, req.AspectRatio, userId, isAdmin);
                }
                if (model == "triple-ai")
                {
                    return await _multiAiSeleniumService.GenerateTripleAsync(finalPrompt, req.AspectRatio, userId, isAdmin);
                }
                return await GenerateStabilityAsync(req, model, finalPrompt, userId);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[Generate Error] {ex.Message}");
                return (500, new { error = $"Model çalıştırılırken bir hata oluştu: {ex.Message}" });
            }
        }
        private async Task<(int StatusCode, object Response)> GeneratePollinationsAsync(GenerateRequest req, string model, string finalPrompt, int userId)
        {
            string polyModel = model.Replace("pollinations-", "");
            GetDimensions(req.AspectRatio, out int w, out int h);
            int seed = new Random().Next(1000, 9999999);
            string promptEncoded = Uri.EscapeDataString(finalPrompt);
            string url = $"https://image.pollinations.ai/prompt/{promptEncoded}?width={w}&height={h}&model={polyModel}&nologo=true&seed={seed}";
            Console.WriteLine($"[Pollinations AI Free Generation] Model: {polyModel}, Size: {w}x{h}, UserId: {userId}");
            using var reqMessage = new HttpRequestMessage(HttpMethod.Get, url);
            reqMessage.Headers.UserAgent.ParseAdd("Mozilla/5.0 (Windows NT 10.0; Win64; x64)");
            try
            {
                var httpResp = await _httpClient.SendAsync(reqMessage);
                if (!httpResp.IsSuccessStatusCode)
                {
                    var errText = await httpResp.Content.ReadAsStringAsync();
                    return ((int)httpResp.StatusCode, new { error = $"Ücretsiz AI Sunucusu Hatası ({httpResp.StatusCode}): {errText}" });
                }
                byte[] imageBytes = await httpResp.Content.ReadAsByteArrayAsync();
                if (imageBytes == null || imageBytes.Length < 1000)
                {
                    return (502, new { error = "Ücretsiz AI sunucusundan geçerli bir görsel alınamadı. Lütfen tekrar deneyin." });
                }
                string fileName = $"melikgazi-free-{DateTime.Now:yyyyMMdd-HHmmss}-{Guid.NewGuid().ToString()[..6]}.png";
                await _imageSyncService.SaveImageToAllDirectoriesAsync(imageBytes, fileName, "free");
                string relPath = $"/generated-free/{fileName}";
                string modelDisplayName = polyModel switch
                {
                    "flux-realism" => "FLUX.1 Realism (Pollinations AI)",
                    "turbo" => "SDXL Turbo (Pollinations AI)",
                    _ => "FLUX.1 Schnell (Pollinations AI)"
                };
                var savedImage = new GeneratedImage
                {
                    Prompt = req.Prompt,
                    ImagePath = relPath,
                    ModelUsed = modelDisplayName,
                    KeyUsedLabel = "Pollinations AI (Ücretsiz Sınırsız)",
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
                    Console.WriteLine($"[DB Save Warning - Free Image] {dbEx.Message}");
                }
                Console.WriteLine($"[Success] Free image generated and saved: {relPath} (UserId={userId})");
                return (200, new
                {
                    success = true,
                    image = relPath,
                    modelUsed = modelDisplayName,
                    keyUsedId = 0,
                    keyUsedLabel = "Pollinations AI (Ücretsiz Sınırsız)",
                    imageId = savedImage.Id,
                    userId = userId
                });
            }
            catch (Exception ex)
            {
                return (500, new { error = $"Ücretsiz AI (Pollinations) bağlantı hatası: {ex.Message}" });
            }
        }
        private async Task<(int StatusCode, object Response)> GenerateStabilityAsync(GenerateRequest req, string model, string finalPrompt, int userId)
        {
            await CheckDailyResetAsync();
            var creds = await _credentialsService.GetCredentialsAsync();
            var keys = creds.StabilityApiKeys.OrderBy(k => k.Id).ToList();
            int currentIdx = creds.CurrentKeyIndex;
            if (!keys.Any(k => !string.IsNullOrEmpty(k.KeyValue)))
                return (400, new { error = "Panel'den en az bir API anahtarı ekleyin." });
            if (!keys.Any(k => !string.IsNullOrEmpty(k.KeyValue) && k.Status != "Exhausted"))
            {
                foreach (var k in keys.Where(k => !string.IsNullOrEmpty(k.KeyValue)))
                {
                    k.Status = "Active";
                }
            }
            int totalKeys = keys.Count;
            for (int attempt = 0; attempt < totalKeys; attempt++)
            {
                int evalIdx = (currentIdx + attempt) % totalKeys;
                var keyObj = keys[evalIdx];
                if (string.IsNullOrEmpty(keyObj.KeyValue) || keyObj.Status == "Exhausted")
                    continue;
                string cleanKey = keyObj.KeyValue.Trim();
                Console.WriteLine($"[Generate] Model={model}, Key #{keyObj.Id} ({keyObj.Label}), UserId={userId}");
                try
                {
                    HttpResponseMessage httpResp;
                    bool isLegacy = (model == "sdxl");
                    if (isLegacy)
                    {
                        GetDimensions(req.AspectRatio, out int w, out int h);
                        var payload = new
                        {
                            text_prompts = new[] { new { text = finalPrompt } },
                            cfg_scale = 7, height = h, width = w, samples = 1, steps = 30
                        };
                        using var httpReq = new HttpRequestMessage(HttpMethod.Post,
                            "https://api.stability.ai/v1/generation/stable-diffusion-xl-1024-v1-0/text-to-image");
                        httpReq.Headers.Authorization = new AuthenticationHeaderValue("Bearer", cleanKey);
                        httpReq.Headers.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));
                        httpReq.Headers.UserAgent.ParseAdd("Mozilla/5.0");
                        httpReq.Content = JsonContent.Create(payload);
                        httpResp = await _httpClient.SendAsync(httpReq);
                    }
                    else
                    {
                        string endpoint;
                        if (model == "ultra" || model == "core")
                            endpoint = $"https://api.stability.ai/v2beta/stable-image/generate/{model}";
                        else
                            endpoint = "https://api.stability.ai/v2beta/stable-image/generate/sd3";
                        using var httpReq = new HttpRequestMessage(HttpMethod.Post, endpoint);
                        httpReq.Headers.Authorization = new AuthenticationHeaderValue("Bearer", cleanKey);
                        httpReq.Headers.Accept.Add(new MediaTypeWithQualityHeaderValue("application/json"));
                        httpReq.Headers.UserAgent.ParseAdd("Mozilla/5.0");
                        var form = new MultipartFormDataContent();
                        AddFormField(form, "prompt", finalPrompt);
                        AddFormField(form, "aspect_ratio", req.AspectRatio);
                        AddFormField(form, "output_format", "png");
                        if (model != "ultra" && model != "core")
                            AddFormField(form, "model", model);
                        httpReq.Content = form;
                        httpResp = await _httpClient.SendAsync(httpReq);
                    }
                    if (!httpResp.IsSuccessStatusCode)
                    {
                        var errBody = await httpResp.Content.ReadAsStringAsync();
                        Console.WriteLine($"[API Error] Key #{keyObj.Id} HTTP {httpResp.StatusCode}: {errBody}");
                        if (errBody.Contains("safety") || errBody.Contains("filter") || errBody.Contains("moderate"))
                            return (400, new { error = "Prompt güvenlik filtresine takıldı. Lütfen farklı kelimeler deneyin." });
                        int code = (int)httpResp.StatusCode;
                        if (code == 401 || code == 402 || code == 403 || code == 429 ||
                            errBody.Contains("insufficient") || errBody.Contains("credits") ||
                            errBody.Contains("quota") || errBody.Contains("exceeded") ||
                            errBody.Contains("payment_required") || errBody.Contains("exhausted"))
                        {
                            keyObj.Status = "Exhausted";
                            creds.CurrentKeyIndex = (evalIdx + 1) % totalKeys;
                            await _credentialsService.SaveCredentialsAsync(creds);
                            Console.WriteLine($"[API Key Exhausted] Key #{keyObj.Id} marked as Exhausted due to HTTP {code}: {errBody}");
                        }
                        else if (code == 400 && (errBody.Contains("invalid") || errBody.Contains("dimensions") || errBody.Contains("aspect_ratio")))
                        {
                            return (400, new { error = $"Seçilen model bu en/boy oranını veya parametreyi desteklemiyor: {errBody}" });
                        }
                        continue;
                    }
                    string imageBase64 = "";
                    var json = await httpResp.Content.ReadFromJsonAsync<JsonElement>();
                    if (isLegacy)
                    {
                        if (json.TryGetProperty("artifacts", out var arts) && arts.GetArrayLength() > 0)
                            imageBase64 = arts[0].GetProperty("base64").GetString() ?? "";
                    }
                    else
                    {
                        if (json.TryGetProperty("image", out var img))
                            imageBase64 = img.GetString() ?? "";
                    }
                    if (string.IsNullOrEmpty(imageBase64))
                        throw new Exception("Yanıtta görsel verisi bulunamadı.");
                    string fileName = $"melikgazi-{DateTime.Now:yyyyMMdd-HHmmss}-{Guid.NewGuid().ToString()[..6]}.png";
                    byte[] imageBytes = Convert.FromBase64String(imageBase64);
                    await _imageSyncService.SaveImageToAllDirectoriesAsync(imageBytes, fileName, "stability");
                    string relPath = $"/generated-stability/{fileName}";
                    string modelName = model switch
                    {
                        "ultra" => "Stable Image Ultra (8 Kredi)",
                        "core" => "Stable Image Core (3 Kredi)",
                        "sd3.5-large" => "SD 3.5 Large (6.5 Kredi)",
                        "sd3.5-large-turbo" => "SD 3.5 Turbo (4 Kredi)",
                        "sd3.5-medium" => "SD 3.5 Medium (3.5 Kredi)",
                        _ => "SDXL 1.0 (~1 Kredi)"
                    };
                    keyObj.UsageToday++;
                    keyObj.TotalUsage++;
                    creds.CurrentKeyIndex = evalIdx;
                    await _credentialsService.SaveCredentialsAsync(creds);
                    var savedImage = new GeneratedImage
                    {
                        Prompt = req.Prompt,
                        ImagePath = relPath,
                        ModelUsed = modelName,
                        KeyUsedLabel = keyObj.Label,
                        ApiKeyId = keyObj.Id,
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
                        Console.WriteLine($"[DB Save Warning - Stability Image] {dbEx.Message}");
                    }
                    Console.WriteLine($"[Success] Image generated and saved: {relPath} (Key #{keyObj.Id}, UserId={userId})");
                    return (200, new
                    {
                        success = true,
                        image = relPath,
                        modelUsed = modelName,
                        keyUsedId = keyObj.Id,
                        keyUsedLabel = keyObj.Label,
                        imageId = savedImage.Id,
                        userId = userId
                    });
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"[Error] Key #{keyObj.Id}: {ex.Message}");
                    continue;
                }
            }
            return (402, new { error = "Stability AI API anahtarlarınızda yeterli bakiye bulunamadı veya limit doldu (Mevcut anahtarlarınızın kredisi yetersiz - örn. 0.7 kredi veya eksi bakiye). Lütfen Yönetim Panelinden 'Yeni Anahtar' butonuna basarak bakiye yüklü yeni bir sk-... anahtarı ekleyin veya Ücretsiz FLUX / Gemini modellerini seçin." });
        }
        private string EnrichTurkishPromptForAi(string prompt)
        {
            if (string.IsNullOrWhiteSpace(prompt)) return "A masterpiece photograph, 8k resolution";
            string p = prompt.ToLowerInvariant();
            string enriched = prompt;
            if (p.Contains("kayseri") || p.Contains("erciyes") || p.Contains("melikgazi") || p.Contains("meydan") || p.Contains("pastırma") || p.Contains("mantı") || p.Contains("hunat") || p.Contains("saat kulesi") || p.Contains("talas"))
            {
                enriched = $"{prompt}. The historic Seljuk and Ottoman city of Kayseri, Turkey, iconic Mount Erciyes stratovolcano with majestic snowy peaks in the background, Melikgazi cultural district, clean modern Turkish architecture mixed with ancient stone monuments, ultra high definition, award winning architectural and landscape photography, 8k resolution, cinematic lighting";
            }
            else if (p.Contains("türkiye") || p.Contains("istanbul") || p.Contains("ankara") || p.Contains("izmir") || p.Contains("kapadokya") || p.Contains("cami") || p.Contains("boğaz") || p.Contains("atatürk"))
            {
                enriched = $"{prompt}. Authentic Turkish cultural and geographical landmark, rich historical architecture, stunning atmosphere, photorealistic, 8k masterpiece photography";
            }
            return enriched;
        }
    }
}