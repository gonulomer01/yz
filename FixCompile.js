const fs = require('fs');
const path = 'c:/Dosyalar/Staj/yz/Services/MultiAiSeleniumService.cs';
let text = fs.readFileSync(path, 'utf8');

// The replacement script missed the SaveImageToDb definition because of formatting?
// Let's manually inject the missing parameter in SaveImageToDb definition.
const searchSig = 'private async Task<int> SaveImageToDb(byte[] imageBytes, string fileName, string site, string prompt, string modelName, string keyLabel, int userId, string sourceSite = "gemini", string? groupId = null)';
if (text.includes(searchSig)) {
    text = text.replace(searchSig, 'private async Task<int> SaveImageToDb(byte[] imageBytes, string fileName, string site, string prompt, string modelName, string keyLabel, int userId, string sourceSite = "gemini", string? groupId = null, bool isSelected = true)');
}

// In SaveImageToDb body, I injected `IsSelected = isSelected` but `isSelected` might not exist if the signature wasn't replaced.
// Let's just blindly force-replace the signature.
text = text.replace(/private async Task<int> SaveImageToDb\([^)]+\)/, 'private async Task<int> SaveImageToDb(byte[] imageBytes, string fileName, string site, string prompt, string modelName, string keyLabel, int userId, string sourceSite = "gemini", string? groupId = null, bool isSelected = true)');

// Fix GenerateFromChatGptAsync profiles
text = text.replace(
    'var profiles = creds.GeminiAccounts.OrderBy(a => a.Id).ToList();\r\n            int currentIdx = 0;\r\n\r\n            if (!profiles.Any())\r\n                return (400, new { error = "Panel\'den en az bir ChatGPT hesap profili ekleyin." });',
    'var profiles = (creds.ChatGptAccounts ?? new List<ChatGptAccountItem>()).OrderBy(a => a.Id).ToList();\r\n            int currentIdx = 0;\r\n\r\n            if (!profiles.Any())\r\n                return (400, new { error = "Panel\'den en az bir ChatGPT hesap profili ekleyin." });'
);

text = text.replace(
    'var profiles = creds.GeminiAccounts.OrderBy(a => a.Id).ToList();\n            int currentIdx = 0;\n\n            if (!profiles.Any())\n                return (400, new { error = "Panel\'den en az bir ChatGPT hesap profili ekleyin." });',
    'var profiles = (creds.ChatGptAccounts ?? new List<ChatGptAccountItem>()).OrderBy(a => a.Id).ToList();\n            int currentIdx = 0;\n\n            if (!profiles.Any())\n                return (400, new { error = "Panel\'den en az bir ChatGPT hesap profili ekleyin." });'
);


// Fix GenerateFromCopilotAsync profiles
text = text.replace(
    'var profiles = creds.GeminiAccounts.OrderBy(a => a.Id).ToList();\r\n            int currentIdx = 0;\r\n\r\n            if (!profiles.Any())\r\n                return (400, new { error = "Panel\'den en az bir Copilot hesap profili ekleyin." });',
    'var profiles = (creds.CopilotAccounts ?? new List<CopilotAccountItem>()).OrderBy(a => a.Id).ToList();\r\n            int currentIdx = 0;\r\n\r\n            if (!profiles.Any())\r\n                return (400, new { error = "Panel\'den en az bir Copilot hesap profili ekleyin." });'
);
text = text.replace(
    'var profiles = creds.GeminiAccounts.OrderBy(a => a.Id).ToList();\n            int currentIdx = 0;\n\n            if (!profiles.Any())\n                return (400, new { error = "Panel\'den en az bir Copilot hesap profili ekleyin." });',
    'var profiles = (creds.CopilotAccounts ?? new List<CopilotAccountItem>()).OrderBy(a => a.Id).ToList();\n            int currentIdx = 0;\n\n            if (!profiles.Any())\n                return (400, new { error = "Panel\'den en az bir Copilot hesap profili ekleyin." });'
);


// In GenerateSiteForTripleAsync, make sure we use the right types.
text = text.replace(
    'else if (site == "chatgpt")\r\n                {\r\n                    var profiles = creds.GeminiAccounts.OrderBy(a => a.Id).ToList();',
    'else if (site == "chatgpt")\r\n                {\r\n                    var profiles = (creds.ChatGptAccounts ?? new List<ChatGptAccountItem>()).OrderBy(a => a.Id).ToList();'
);
text = text.replace(
    'else if (site == "copilot")\r\n                {\r\n                    var profiles = creds.GeminiAccounts.OrderBy(a => a.Id).ToList();',
    'else if (site == "copilot")\r\n                {\r\n                    var profiles = (creds.CopilotAccounts ?? new List<CopilotAccountItem>()).OrderBy(a => a.Id).ToList();'
);

text = text.replace(
    'else if (site == "chatgpt")\n                {\n                    var profiles = creds.GeminiAccounts.OrderBy(a => a.Id).ToList();',
    'else if (site == "chatgpt")\n                {\n                    var profiles = (creds.ChatGptAccounts ?? new List<ChatGptAccountItem>()).OrderBy(a => a.Id).ToList();'
);
text = text.replace(
    'else if (site == "copilot")\n                {\n                    var profiles = creds.GeminiAccounts.OrderBy(a => a.Id).ToList();',
    'else if (site == "copilot")\n                {\n                    var profiles = (creds.CopilotAccounts ?? new List<CopilotAccountItem>()).OrderBy(a => a.Id).ToList();'
);

fs.writeFileSync(path, text, 'utf8');
console.log("Fixed compile errors in MultiAiSeleniumService.");