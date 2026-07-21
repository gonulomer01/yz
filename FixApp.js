const fs = require('fs');
const path = 'c:/Dosyalar/Staj/yz/wwwroot/js/app.js';
let text = fs.readFileSync(path, 'utf8');

const crudFunctions = `
// ==========================================
// CHATGPT ACCOUNTS (CRUD)
// ==========================================
async function loadChatGptAccounts() {
    try {
        const response = await fetch('/api/chatgpt-accounts');
        const data = await response.json();
        const tbody = document.querySelector('#chatgpt-accounts-table tbody');
        if(!tbody) return;
        tbody.innerHTML = '';
        
        data.accounts.forEach(acc => {
            const statusBadge = acc.status === 'Active' 
                ? '<span class="badge bg-success bg-opacity-10 text-success border border-success"><i class="fas fa-check-circle me-1"></i>Aktif</span>'
                : '<span class="badge bg-danger bg-opacity-10 text-danger border border-danger"><i class="fas fa-times-circle me-1"></i>Tükendi</span>';
                
            const tr = document.createElement('tr');
            tr.innerHTML = \`
                <td class="fw-bold text-secondary">#\${acc.id}</td>
                <td><code class="bg-light px-2 py-1 rounded text-dark">\${acc.profileName}</code></td>
                <td>
                    <div class="d-flex align-items-center">
                        <input type="text" class="form-control form-control-sm me-2" value="\${acc.accountLabel}" id="cg-label-\${acc.id}" style="max-width: 200px;">
                        <button class="btn btn-sm btn-outline-secondary" onclick="updateChatGptAccount(\${acc.id})"><i class="fas fa-save"></i></button>
                    </div>
                </td>
                <td>\${statusBadge}</td>
                <td class="text-muted small">\${acc.lastUsed}</td>
                <td class="text-end">
                    <button class="btn btn-sm btn-primary" onclick="openChatGptSession('\${acc.profileName}')">
                        <i class="fas fa-external-link-alt me-1"></i>Oturum Aç
                    </button>
                    <button class="btn btn-sm btn-outline-danger ms-1" onclick="deleteChatGptAccount(\${acc.id})" title="Sil">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            \`;
            tbody.appendChild(tr);
        });
    } catch (err) {
        console.error('ChatGPT hesapları yüklenemedi:', err);
    }
}

async function updateChatGptAccount(id) {
    const label = document.getElementById(\`cg-label-\${id}\`).value;
    try {
        const res = await fetch('/api/chatgpt-accounts', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: id, accountLabel: label })
        });
        if (res.ok) { alert('Hesap güncellendi.'); loadChatGptAccounts(); }
        else { const err = await res.json(); alert(err.error || 'Hata oluştu.'); }
    } catch (e) { alert('Bağlantı hatası.'); }
}

async function addChatGptAccount() {
    try {
        const res = await fetch('/api/chatgpt-accounts/add', { method: 'POST' });
        if (res.ok) { loadChatGptAccounts(); }
        else { const err = await res.json(); alert(err.error || 'Hata oluştu.'); }
    } catch (e) { alert('Bağlantı hatası.'); }
}

async function deleteChatGptAccount(id) {
    if (!confirm('Bu hesabı silmek istediğinize emin misiniz?')) return;
    try {
        const res = await fetch(\`/api/chatgpt-accounts/\${id}\`, { method: 'DELETE' });
        if (res.ok) { loadChatGptAccounts(); }
        else { const err = await res.json(); alert(err.error || 'Hata oluştu.'); }
    } catch (e) { alert('Bağlantı hatası.'); }
}

async function openChatGptSession(profileName) {
    try {
        alert("Chrome penceresi açılacak. Lütfen ChatGPT (openai.com) sitesine gidip manuel giriş yapın. İşiniz bitince Chrome'u kapatın.");
        await fetch(\`/api/gemini-accounts/open-session?profileName=\${profileName}\`);
    } catch (e) {
        console.error(e);
    }
}

// ==========================================
// COPILOT ACCOUNTS (CRUD)
// ==========================================
async function loadCopilotAccounts() {
    try {
        const response = await fetch('/api/copilot-accounts');
        const data = await response.json();
        const tbody = document.querySelector('#copilot-accounts-table tbody');
        if(!tbody) return;
        tbody.innerHTML = '';
        
        data.accounts.forEach(acc => {
            const statusBadge = acc.status === 'Active' 
                ? '<span class="badge bg-success bg-opacity-10 text-success border border-success"><i class="fas fa-check-circle me-1"></i>Aktif</span>'
                : '<span class="badge bg-danger bg-opacity-10 text-danger border border-danger"><i class="fas fa-times-circle me-1"></i>Tükendi</span>';
                
            const tr = document.createElement('tr');
            tr.innerHTML = \`
                <td class="fw-bold text-secondary">#\${acc.id}</td>
                <td><code class="bg-light px-2 py-1 rounded text-dark">\${acc.profileName}</code></td>
                <td>
                    <div class="d-flex align-items-center">
                        <input type="text" class="form-control form-control-sm me-2" value="\${acc.accountLabel}" id="cp-label-\${acc.id}" style="max-width: 200px;">
                        <button class="btn btn-sm btn-outline-secondary" onclick="updateCopilotAccount(\${acc.id})"><i class="fas fa-save"></i></button>
                    </div>
                </td>
                <td>\${statusBadge}</td>
                <td class="text-muted small">\${acc.lastUsed}</td>
                <td class="text-end">
                    <button class="btn btn-sm btn-info text-white" onclick="openCopilotSession('\${acc.profileName}')">
                        <i class="fas fa-external-link-alt me-1"></i>Oturum Aç
                    </button>
                    <button class="btn btn-sm btn-outline-danger ms-1" onclick="deleteCopilotAccount(\${acc.id})" title="Sil">
                        <i class="fas fa-trash"></i>
                    </button>
                </td>
            \`;
            tbody.appendChild(tr);
        });
    } catch (err) {
        console.error('Copilot hesapları yüklenemedi:', err);
    }
}

async function updateCopilotAccount(id) {
    const label = document.getElementById(\`cp-label-\${id}\`).value;
    try {
        const res = await fetch('/api/copilot-accounts', {
            method: 'POST', headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: id, accountLabel: label })
        });
        if (res.ok) { alert('Hesap güncellendi.'); loadCopilotAccounts(); }
        else { const err = await res.json(); alert(err.error || 'Hata oluştu.'); }
    } catch (e) { alert('Bağlantı hatası.'); }
}

async function addCopilotAccount() {
    try {
        const res = await fetch('/api/copilot-accounts/add', { method: 'POST' });
        if (res.ok) { loadCopilotAccounts(); }
        else { const err = await res.json(); alert(err.error || 'Hata oluştu.'); }
    } catch (e) { alert('Bağlantı hatası.'); }
}

async function deleteCopilotAccount(id) {
    if (!confirm('Bu hesabı silmek istediğinize emin misiniz?')) return;
    try {
        const res = await fetch(\`/api/copilot-accounts/\${id}\`, { method: 'DELETE' });
        if (res.ok) { loadCopilotAccounts(); }
        else { const err = await res.json(); alert(err.error || 'Hata oluştu.'); }
    } catch (e) { alert('Bağlantı hatası.'); }
}

async function openCopilotSession(profileName) {
    try {
        alert("Chrome penceresi açılacak. Lütfen Copilot (bing.com/copilot) sitesine gidip manuel giriş yapın. İşiniz bitince Chrome'u kapatın.");
        await fetch(\`/api/gemini-accounts/open-session?profileName=\${profileName}\`);
    } catch (e) {
        console.error(e);
    }
}
`;

text = text + '\n' + crudFunctions;

// Call loaders on init
const initRegex = /loadGeminiAccounts\(\);/;
if (text.match(initRegex)) {
    text = text.replace(initRegex, 'loadGeminiAccounts();\n    loadChatGptAccounts();\n    loadCopilotAccounts();');
}

fs.writeFileSync(path, text, 'utf8');
console.log("app.js updated!");