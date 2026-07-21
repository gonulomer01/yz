const fs = require('fs');
const path = 'c:/Dosyalar/Staj/yz/Controllers/ApiController.cs';
let content = fs.readFileSync(path, 'utf8');

// 1. Filter GetImages by IsSelected
content = content.replace(
    '.Where(img => img.UserId == currentUserId)',
    '.Where(img => img.UserId == currentUserId && img.IsSelected)'
);

// 2. Add endpoints for ChatGPT and Copilot, and the Selection endpoint
const newEndpoints = `
        // --- ChatGPT Hesapları ---
        [HttpGet("chatgpt-accounts")]
        [Authorize(Roles = "Yönetici")]
        public async Task<IActionResult> GetChatGptAccounts()
        {
            var creds = await _credentialsService.GetCredentialsAsync();
            return Ok(new
            {
                accounts = (creds.ChatGptAccounts ?? new List<ChatGptAccountItem>()).OrderBy(a => a.Id).Select(a => new
                {
                    id = a.Id, profileName = a.ProfileName, accountLabel = a.AccountLabel,
                    status = a.Status, lastUsed = string.IsNullOrEmpty(a.LastUsed) ? "Henüz kullanılmadı" : a.LastUsed
                })
            });
        }

        [HttpPost("chatgpt-accounts")]
        [Authorize(Roles = "Yönetici")]
        public async Task<IActionResult> UpdateChatGptAccount([FromBody] GeminiAccountUpdateRequest req)
        {
            if (req == null || req.Id < 1) return BadRequest(new { error = "Geçersiz hesap ID." });
            var creds = await _credentialsService.GetCredentialsAsync();
            var acc = creds.ChatGptAccounts?.FirstOrDefault(a => a.Id == req.Id);
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
            if (creds.ChatGptAccounts == null) creds.ChatGptAccounts = new List<ChatGptAccountItem>();
            int nextId = (creds.ChatGptAccounts.Count == 0 ? 1 : creds.ChatGptAccounts.Max(a => a.Id) + 1);
            string label = !string.IsNullOrWhiteSpace(req?.AccountLabel) ? req.AccountLabel.Trim() : $"ChatGPT Hesap #{nextId}";
            creds.ChatGptAccounts.Add(new ChatGptAccountItem { Id = nextId, ProfileName = $"ChatGptChromeProfile_{nextId}", AccountLabel = label, Status = "Active", LastUsed = "" });
            await _credentialsService.SaveCredentialsAsync(creds);
            return Ok(new { success = true, id = nextId });
        }

        [HttpDelete("chatgpt-accounts/{id}")]
        [Authorize(Roles = "Yönetici")]
        public async Task<IActionResult> DeleteChatGptAccount(int id)
        {
            var creds = await _credentialsService.GetCredentialsAsync();
            var acc = creds.ChatGptAccounts?.FirstOrDefault(a => a.Id == id);
            if (acc == null) return NotFound(new { error = "Hesap bulunamadı." });
            if (creds.ChatGptAccounts!.Count <= 1) return BadRequest(new { error = "En az bir ChatGPT profili kalmalıdır." });
            creds.ChatGptAccounts.Remove(acc);
            await _credentialsService.SaveCredentialsAsync(creds);
            return Ok(new { success = true });
        }

        // --- Copilot Hesapları ---
        [HttpGet("copilot-accounts")]
        [Authorize(Roles = "Yönetici")]
        public async Task<IActionResult> GetCopilotAccounts()
        {
            var creds = await _credentialsService.GetCredentialsAsync();
            return Ok(new
            {
                accounts = (creds.CopilotAccounts ?? new List<CopilotAccountItem>()).OrderBy(a => a.Id).Select(a => new
                {
                    id = a.Id, profileName = a.ProfileName, accountLabel = a.AccountLabel,
                    status = a.Status, lastUsed = string.IsNullOrEmpty(a.LastUsed) ? "Henüz kullanılmadı" : a.LastUsed
                })
            });
        }

        [HttpPost("copilot-accounts")]
        [Authorize(Roles = "Yönetici")]
        public async Task<IActionResult> UpdateCopilotAccount([FromBody] GeminiAccountUpdateRequest req)
        {
            if (req == null || req.Id < 1) return BadRequest(new { error = "Geçersiz hesap ID." });
            var creds = await _credentialsService.GetCredentialsAsync();
            var acc = creds.CopilotAccounts?.FirstOrDefault(a => a.Id == req.Id);
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
            if (creds.CopilotAccounts == null) creds.CopilotAccounts = new List<CopilotAccountItem>();
            int nextId = (creds.CopilotAccounts.Count == 0 ? 1 : creds.CopilotAccounts.Max(a => a.Id) + 1);
            string label = !string.IsNullOrWhiteSpace(req?.AccountLabel) ? req.AccountLabel.Trim() : $"Copilot Hesap #{nextId}";
            creds.CopilotAccounts.Add(new CopilotAccountItem { Id = nextId, ProfileName = $"CopilotChromeProfile_{nextId}", AccountLabel = label, Status = "Active", LastUsed = "" });
            await _credentialsService.SaveCredentialsAsync(creds);
            return Ok(new { success = true, id = nextId });
        }

        [HttpDelete("copilot-accounts/{id}")]
        [Authorize(Roles = "Yönetici")]
        public async Task<IActionResult> DeleteCopilotAccount(int id)
        {
            var creds = await _credentialsService.GetCredentialsAsync();
            var acc = creds.CopilotAccounts?.FirstOrDefault(a => a.Id == id);
            if (acc == null) return NotFound(new { error = "Hesap bulunamadı." });
            if (creds.CopilotAccounts!.Count <= 1) return BadRequest(new { error = "En az bir Copilot profili kalmalıdır." });
            creds.CopilotAccounts.Remove(acc);
            await _credentialsService.SaveCredentialsAsync(creds);
            return Ok(new { success = true });
        }

        // --- Triple AI Selection Endpoint ---
        [HttpPost("images/select/{groupId}/{imageId}")]
        public async Task<IActionResult> SelectTripleImage(string groupId, int imageId)
        {
            int currentUserId = GetCurrentUserId();
            var groupImages = await _context.GeneratedImages.Where(i => i.GroupId == groupId && i.UserId == currentUserId).ToListAsync();
            
            if (groupImages.Count == 0) return NotFound(new { error = "Görseller bulunamadı." });

            var selectedImg = groupImages.FirstOrDefault(i => i.Id == imageId);
            if (selectedImg == null) return NotFound(new { error = "Seçilen görsel bu grupta bulunamadı." });

            foreach (var img in groupImages)
            {
                if (img.Id == imageId)
                {
                    img.IsSelected = true;
                }
                else
                {
                    // Unselected images should be deleted from disk and DB
                    try {
                        string filePath = Path.Combine(Directory.GetCurrentDirectory(), "wwwroot", img.ImagePath.TrimStart('/'));
                        if (System.IO.File.Exists(filePath)) {
                            System.IO.File.Delete(filePath);
                        }
                    } catch { }
                    _context.GeneratedImages.Remove(img);
                }
            }

            await _context.SaveChangesAsync();
            return Ok(new { success = true });
        }
`;

const insertIndex = content.indexOf('[HttpGet("images")]');
if (insertIndex > -1) {
    content = content.substring(0, insertIndex) + newEndpoints + '\r\n        ' + content.substring(insertIndex);
}

fs.writeFileSync(path, content, 'utf8');
console.log("ApiController updated successfully!");