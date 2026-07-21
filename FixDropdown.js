const fs = require('fs');
const path = 'c:/Dosyalar/Staj/yz/Views/Home/Index.cshtml';
let text = fs.readFileSync(path, 'utf8');

const searchStr = `<option value="gemini-web-profile">🤖 Google Gemini Web (Çoklu Hesap Rotasyon)</option>`;
const optionsToAdd = `
                    <option value="chatgpt-web-profile">🤖 ChatGPT Web (DALL-E) (Çoklu Hesap Rotasyon)</option>
                    <option value="copilot-web-profile">🤖 Microsoft Copilot (Çoklu Hesap Rotasyon)</option>
                    <option value="triple-ai">🚀 Üçlü AI (Gemini + ChatGPT + Copilot Paralel Üretim)</option>`;

if (text.includes(searchStr)) {
    text = text.replace(searchStr, searchStr + optionsToAdd);
    fs.writeFileSync(path, text, 'utf8');
    console.log("Index.cshtml updated with new dropdown options (UTF8).");
} else {
    // try with fallback encoding match
    const altSearch = '<option value="gemini-web-profile">';
    const idx = text.indexOf(altSearch);
    if (idx > -1) {
        const lineEnd = text.indexOf('\n', idx);
        text = text.substring(0, lineEnd) + optionsToAdd + text.substring(lineEnd);
        fs.writeFileSync(path, text, 'utf8');
        console.log("Index.cshtml updated with new dropdown options (fallback).");
    } else {
        console.log("Could not find gemini-web-profile in Index.cshtml.");
    }
}