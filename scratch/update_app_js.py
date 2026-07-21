import re

with open("c:\\Dosyalar\\Staj\\yz\\wwwroot\\js\\app.js", "r", encoding="utf-8") as f:
    content = f.read()

chatgpt_replacement = """async function loadChatGptAccounts() {
  if (!isAdmin) return;
  try {
    const res = await fetch('/api/chatgpt-accounts');
    if (!res.ok) throw new Error();
    const data = await res.json();
    chatgptAccountsData = data.accounts;
    renderChatGptAccounts();
  } catch { }
}

function renderChatGptAccounts() {
  const grid = document.getElementById('chatgpt-accounts-grid');
  if (!grid || !isAdmin) return;
  grid.innerHTML = '';

  chatgptAccountsData.forEach(a => {
    let badgeClass = a.status === 'Active' ? 'badge-active' : 'badge-exhausted';
    let badgeText = a.status === 'Active' ? 'Aktif' : 'Pasif';

    const card = document.createElement('div');
    card.className = 'key-card';
    card.innerHTML = `
      <div class="key-card-top">
        <div><span class="key-slot">#${a.id}</span> <span class="key-label">${a.accountLabel}</span></div>
        <span class="badge ${badgeClass}">${badgeText}</span>
      </div>
      <div class="key-masked">${a.profileName}</div>
      <div class="key-stats-row">
        <span>Son: <strong>${a.lastUsed || '—'}</strong></span>
      </div>
      <div style="display:flex; gap: 6px;">
        <button onclick="openChatGptSession(${a.id})" style="flex:1;">
          <i class="fa-solid fa-right-to-bracket"></i> Oturum Aç
        </button>
        <button onclick="openChatGptEditModal(${a.id}, '${a.accountLabel.replace(/'/g, "\\'")}', '${a.status}')" title="Düzenle">
          <i class="fa-solid fa-pen"></i>
        </button>
        <button onclick="deleteChatGptAccount(${a.id})" style="color: var(--color-danger);" title="Sil">
          <i class="fa-solid fa-trash"></i>
        </button>
      </div>
    `;
    grid.appendChild(card);
  });
}

window.openChatGptEditModal = function(id, label, status) {
  document.getElementById('chatgpt-edit-id').value = id;
  document.getElementById('chatgpt-edit-label').value = label;
  const statusEl = document.getElementById('chatgpt-edit-status');
  if (statusEl) statusEl.value = status;
  document.getElementById('chatgpt-edit-modal').style.display = 'flex';
};

const chatgptEditModal = document.getElementById('chatgpt-edit-modal');
const chatgptEditForm = document.getElementById('chatgpt-edit-form');
const btnChatGptModalClose = document.getElementById('btn-chatgpt-modal-close');
const btnChatGptModalCancel = document.getElementById('btn-chatgpt-modal-cancel');

function closeChatGptEditModal() { if (chatgptEditModal) chatgptEditModal.style.display = 'none'; }
if (btnChatGptModalClose) btnChatGptModalClose.addEventListener('click', closeChatGptEditModal);
if (btnChatGptModalCancel) btnChatGptModalCancel.addEventListener('click', closeChatGptEditModal);
if (chatgptEditModal) chatgptEditModal.addEventListener('click', (e) => { if (e.target === chatgptEditModal) closeChatGptEditModal(); });

if (chatgptEditForm) {
  chatgptEditForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = parseInt(document.getElementById('chatgpt-edit-id').value);
    const label = document.getElementById('chatgpt-edit-label').value.trim();
    const statusEl = document.getElementById('chatgpt-edit-status');
    const status = statusEl ? statusEl.value : 'Active';

    try {
      const res = await fetch('/api/chatgpt-accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, accountLabel: label, status })
      });
      if (!res.ok) throw new Error('Kayıt başarısız.');
      const data = await res.json();
      if (data.success || res.ok) {
        showToast(`Hesap güncellendi.`);
        closeChatGptEditModal();
        loadChatGptAccounts();
      }
    } catch (err) { showToast(err.message, 'error'); }
  });
}

const btnAddChatGptAcc = document.getElementById('btn-add-chatgpt-acc');
if (btnAddChatGptAcc) {
  btnAddChatGptAcc.addEventListener('click', async () => {
    try {
      const res = await fetch('/api/chatgpt-accounts/add', { method: 'POST' });
      if (res.ok) { showToast('Yeni hesap profili eklendi.'); loadChatGptAccounts(); }
      else { const err = await res.json(); showToast(err.error || 'Hata oluştu.', 'error'); }
    } catch (err) { showToast('Bağlantı hatası.', 'error'); }
  });
}

async function deleteChatGptAccount(id) {
    if (!confirm('Bu hesabı silmek istediğinize emin misiniz?')) return;
    try {
        const res = await fetch(`/api/chatgpt-accounts/${id}`, { method: 'DELETE' });
        if (res.ok) { loadChatGptAccounts(); }
        else { const err = await res.json(); alert(err.error || 'Hata oluştu.'); }
    } catch (e) { alert('Bağlantı hatası.'); }
}
"""

copilot_replacement = """async function loadCopilotAccounts() {
  if (!isAdmin) return;
  try {
    const res = await fetch('/api/copilot-accounts');
    if (!res.ok) throw new Error();
    const data = await res.json();
    copilotAccountsData = data.accounts;
    renderCopilotAccounts();
  } catch { }
}

function renderCopilotAccounts() {
  const grid = document.getElementById('copilot-accounts-grid');
  if (!grid || !isAdmin) return;
  grid.innerHTML = '';

  copilotAccountsData.forEach(a => {
    let badgeClass = a.status === 'Active' ? 'badge-active' : 'badge-exhausted';
    let badgeText = a.status === 'Active' ? 'Aktif' : 'Pasif';

    const card = document.createElement('div');
    card.className = 'key-card';
    card.innerHTML = `
      <div class="key-card-top">
        <div><span class="key-slot">#${a.id}</span> <span class="key-label">${a.accountLabel}</span></div>
        <span class="badge ${badgeClass}">${badgeText}</span>
      </div>
      <div class="key-masked">${a.profileName}</div>
      <div class="key-stats-row">
        <span>Son: <strong>${a.lastUsed || '—'}</strong></span>
      </div>
      <div style="display:flex; gap: 6px;">
        <button onclick="openCopilotSession(${a.id})" style="flex:1;">
          <i class="fa-solid fa-right-to-bracket"></i> Oturum Aç
        </button>
        <button onclick="openCopilotEditModal(${a.id}, '${a.accountLabel.replace(/'/g, "\\'")}', '${a.status}')" title="Düzenle">
          <i class="fa-solid fa-pen"></i>
        </button>
        <button onclick="deleteCopilotAccount(${a.id})" style="color: var(--color-danger);" title="Sil">
          <i class="fa-solid fa-trash"></i>
        </button>
      </div>
    `;
    grid.appendChild(card);
  });
}

window.openCopilotEditModal = function(id, label, status) {
  document.getElementById('copilot-edit-id').value = id;
  document.getElementById('copilot-edit-label').value = label;
  const statusEl = document.getElementById('copilot-edit-status');
  if (statusEl) statusEl.value = status;
  document.getElementById('copilot-edit-modal').style.display = 'flex';
};

const copilotEditModal = document.getElementById('copilot-edit-modal');
const copilotEditForm = document.getElementById('copilot-edit-form');
const btnCopilotModalClose = document.getElementById('btn-copilot-modal-close');
const btnCopilotModalCancel = document.getElementById('btn-copilot-modal-cancel');

function closeCopilotEditModal() { if (copilotEditModal) copilotEditModal.style.display = 'none'; }
if (btnCopilotModalClose) btnCopilotModalClose.addEventListener('click', closeCopilotEditModal);
if (btnCopilotModalCancel) btnCopilotModalCancel.addEventListener('click', closeCopilotEditModal);
if (copilotEditModal) copilotEditModal.addEventListener('click', (e) => { if (e.target === copilotEditModal) closeCopilotEditModal(); });

if (copilotEditForm) {
  copilotEditForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = parseInt(document.getElementById('copilot-edit-id').value);
    const label = document.getElementById('copilot-edit-label').value.trim();
    const statusEl = document.getElementById('copilot-edit-status');
    const status = statusEl ? statusEl.value : 'Active';

    try {
      const res = await fetch('/api/copilot-accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, accountLabel: label, status })
      });
      if (!res.ok) throw new Error('Kayıt başarısız.');
      const data = await res.json();
      if (data.success || res.ok) {
        showToast(`Hesap güncellendi.`);
        closeCopilotEditModal();
        loadCopilotAccounts();
      }
    } catch (err) { showToast(err.message, 'error'); }
  });
}

const btnAddCopilotAcc = document.getElementById('btn-add-copilot-acc');
if (btnAddCopilotAcc) {
  btnAddCopilotAcc.addEventListener('click', async () => {
    try {
      const res = await fetch('/api/copilot-accounts/add', { method: 'POST' });
      if (res.ok) { showToast('Yeni hesap profili eklendi.'); loadCopilotAccounts(); }
      else { const err = await res.json(); showToast(err.error || 'Hata oluştu.', 'error'); }
    } catch (err) { showToast('Bağlantı hatası.', 'error'); }
  });
}

async function deleteCopilotAccount(id) {
    if (!confirm('Bu hesabı silmek istediğinize emin misiniz?')) return;
    try {
        const res = await fetch(`/api/copilot-accounts/${id}`, { method: 'DELETE' });
        if (res.ok) { loadCopilotAccounts(); }
        else { const err = await res.json(); alert(err.error || 'Hata oluştu.'); }
    } catch (e) { alert('Bağlantı hatası.'); }
}
"""

content = re.sub(
    r"async function loadChatGptAccounts\(\) \{.*?async function deleteChatGptAccount\(id\) \{[^\}]+\}",
    chatgpt_replacement,
    content,
    flags=re.DOTALL
)

content = re.sub(
    r"async function loadCopilotAccounts\(\) \{.*?async function deleteCopilotAccount\(id\) \{[^\}]+\}",
    copilot_replacement,
    content,
    flags=re.DOTALL
)

with open("c:\\Dosyalar\\Staj\\yz\\wwwroot\\js\\app.js", "w", encoding="utf-8") as f:
    f.write(content)

print("Replaced!")
