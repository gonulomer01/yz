const fs = require('fs');
const path = 'c:/Dosyalar/Staj/yz/Services/MultiAiSeleniumService.cs';
let text = fs.readFileSync(path, 'utf8');

// 1. GenerateFromChatGptAsync Fixes
let gfcIndex = text.indexOf('public async Task<(int StatusCode, object Response)> GenerateFromChatGptAsync');
let gfcEnd = text.indexOf('public async Task<(int StatusCode, object Response)> GenerateFromCopilotAsync');
let gfcBlock = text.substring(gfcIndex, gfcEnd);

gfcBlock = gfcBlock.replace('var profiles = creds.GeminiAccounts.OrderBy(a => a.Id).ToList();', 'var profiles = (creds.ChatGptAccounts ?? new List<ChatGptAccountItem>()).OrderBy(a => a.Id).ToList();');
gfcBlock = gfcBlock.replace(/creds\.CurrentGeminiProfileIndex/g, 'creds.CurrentChatGptProfileIndex');

text = text.substring(0, gfcIndex) + gfcBlock + text.substring(gfcEnd);

// 2. GenerateFromCopilotAsync Fixes
let copilotIndex = text.indexOf('public async Task<(int StatusCode, object Response)> GenerateFromCopilotAsync');
let copilotEnd = text.indexOf('public async Task<(int StatusCode, object Response)> GenerateTripleAsync');
let copilotBlock = text.substring(copilotIndex, copilotEnd);

copilotBlock = copilotBlock.replace('var profiles = (creds.GeminiAccounts ?? new List<GeminiAccountItem>()).OrderBy(a => a.Id).ToList();', 'var profiles = (creds.CopilotAccounts ?? new List<CopilotAccountItem>()).OrderBy(a => a.Id).ToList();');
copilotBlock = copilotBlock.replace('var profiles = creds.GeminiAccounts.OrderBy(a => a.Id).ToList();', 'var profiles = (creds.CopilotAccounts ?? new List<CopilotAccountItem>()).OrderBy(a => a.Id).ToList();');
copilotBlock = copilotBlock.replace(/creds\.CurrentGeminiProfileIndex/g, 'creds.CurrentCopilotProfileIndex');

text = text.substring(0, copilotIndex) + copilotBlock + text.substring(copilotEnd);

// 3. GenerateTripleAsync parallelization
const oldTriple = `        public async Task<(int StatusCode, object Response)> GenerateTripleAsync(string prompt, string aspectRatio, int userId = 0, bool isAdmin = false)
        {
            string groupId = Guid.NewGuid().ToString("N")[..12];

            var geminiResult = await GenerateSiteForTripleAsync("gemini", prompt, aspectRatio, userId, isAdmin, groupId);
            var chatgptResult = await GenerateSiteForTripleAsync("chatgpt", prompt, aspectRatio, userId, isAdmin, groupId);
            var copilotResult = await GenerateSiteForTripleAsync("copilot", prompt, aspectRatio, userId, isAdmin, groupId);

            var results = new[] { geminiResult, chatgptResult, copilotResult };`;

const oldTripleRN = oldTriple.replace(/\n/g, '\r\n');

const newTriple = `        public async Task<(int StatusCode, object Response)> GenerateTripleAsync(string prompt, string aspectRatio, int userId = 0, bool isAdmin = false)
        {
            string groupId = Guid.NewGuid().ToString("N")[..12];

            var geminiTask = GenerateSiteForTripleAsync("gemini", prompt, aspectRatio, userId, isAdmin, groupId);
            var chatgptTask = GenerateSiteForTripleAsync("chatgpt", prompt, aspectRatio, userId, isAdmin, groupId);
            var copilotTask = GenerateSiteForTripleAsync("copilot", prompt, aspectRatio, userId, isAdmin, groupId);

            var results = await Task.WhenAll(geminiTask, chatgptTask, copilotTask);`;

if(text.includes(oldTripleRN)) {
    text = text.replace(oldTripleRN, newTriple.replace(/\n/g, '\r\n'));
} else if (text.includes(oldTriple)) {
    text = text.replace(oldTriple, newTriple);
}

// 4. GenerateSiteForTripleAsync profiles fix
let genTripleSiteIndex = text.indexOf('private async Task<SiteGenerationResult> GenerateSiteForTripleAsync');
let genTripleSiteEnd = text.indexOf('private async Task<SiteGenerationResult> RunGeminiSession');
let genTripleSiteBlock = text.substring(genTripleSiteIndex, genTripleSiteEnd);

genTripleSiteBlock = genTripleSiteBlock.replace(
    'var profiles = (creds.GeminiAccounts ?? new List<GeminiAccountItem>()).OrderBy(a => a.Id).ToList();', 
    'var profiles = (creds.ChatGptAccounts ?? new List<ChatGptAccountItem>()).OrderBy(a => a.Id).ToList();'
);
// There are two "else if" blocks in GenerateSiteForTripleAsync, one for chatgpt and one for copilot.
// I will replace both manually using string manipulation.
genTripleSiteBlock = genTripleSiteBlock.replace(
    'else if (site == "chatgpt")\r\n                {\r\n                    var profiles = creds.GeminiAccounts.OrderBy(a => a.Id).ToList();',
    'else if (site == "chatgpt")\r\n                {\r\n                    var profiles = (creds.ChatGptAccounts ?? new List<ChatGptAccountItem>()).OrderBy(a => a.Id).ToList();'
);
genTripleSiteBlock = genTripleSiteBlock.replace(
    'else if (site == "copilot")\r\n                {\r\n                    var profiles = creds.GeminiAccounts.OrderBy(a => a.Id).ToList();',
    'else if (site == "copilot")\r\n                {\r\n                    var profiles = (creds.CopilotAccounts ?? new List<CopilotAccountItem>()).OrderBy(a => a.Id).ToList();'
);

text = text.substring(0, genTripleSiteIndex) + genTripleSiteBlock + text.substring(genTripleSiteEnd);

// 5. Update RunChatGptSession and RunCopilotSession signatures
text = text.replace(
    'private async Task<SiteGenerationResult> RunChatGptSession(GeminiAccountItem account, string prompt, string aspectRatio, int userId, bool isAdmin, string? groupId = null)',
    'private async Task<SiteGenerationResult> RunChatGptSession(ChatGptAccountItem account, string prompt, string aspectRatio, int userId, bool isAdmin, string? groupId = null)'
);

text = text.replace(
    'private async Task<SiteGenerationResult> RunCopilotSession(GeminiAccountItem account, string prompt, string aspectRatio, int userId, bool isAdmin, string? groupId = null)',
    'private async Task<SiteGenerationResult> RunCopilotSession(CopilotAccountItem account, string prompt, string aspectRatio, int userId, bool isAdmin, string? groupId = null)'
);

// 6. Fix SaveImageToDb to handle IsSelected
text = text.replace(
    'private async Task<int> SaveImageToDb(byte[] imageBytes, string fileName, string site, string prompt, string modelName, string keyLabel, int userId, string sourceSite = "gemini", string? groupId = null)',
    'private async Task<int> SaveImageToDb(byte[] imageBytes, string fileName, string site, string prompt, string modelName, string keyLabel, int userId, string sourceSite = "gemini", string? groupId = null, bool isSelected = true)'
);

// We need to update all calls to SaveImageToDb to pass `string.IsNullOrEmpty(groupId)` as isSelected
text = text.replace(
    'int imageId = await SaveImageToDb(imageBytes, fileName, "gemini", prompt, "Google Gemini Web", keyLabel, userId, "gemini", groupId);',
    'int imageId = await SaveImageToDb(imageBytes, fileName, "gemini", prompt, "Google Gemini Web", keyLabel, userId, "gemini", groupId, string.IsNullOrEmpty(groupId));'
);
text = text.replace(
    'int imageId = await SaveImageToDb(imageBytes, fileName, "chatgpt", prompt, "ChatGPT Web (DALL-E)", keyLabel, userId, "chatgpt", groupId);',
    'int imageId = await SaveImageToDb(imageBytes, fileName, "chatgpt", prompt, "ChatGPT Web (DALL-E)", keyLabel, userId, "chatgpt", groupId, string.IsNullOrEmpty(groupId));'
);
text = text.replace(
    'int imageId = await SaveImageToDb(imageBytes, fileName, "copilot", prompt, "Microsoft Copilot (DALL-E 3)", keyLabel, userId, "copilot", groupId);',
    'int imageId = await SaveImageToDb(imageBytes, fileName, "copilot", prompt, "Microsoft Copilot (DALL-E 3)", keyLabel, userId, "copilot", groupId, string.IsNullOrEmpty(groupId));'
);

// Fix SaveImageToDb body
let saveDbIndex = text.indexOf('private async Task<int> SaveImageToDb');
let saveDbBlock = text.substring(saveDbIndex);
saveDbBlock = saveDbBlock.replace(
    'GroupId = groupId',
    'GroupId = groupId,\r\n                        IsSelected = isSelected'
);
text = text.substring(0, saveDbIndex) + saveDbBlock;


fs.writeFileSync(path, text, 'utf8');
console.log("MultiAiSeleniumService updated successfully!");