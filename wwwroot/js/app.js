/* === MELİKGAZİ BELEDİYESİ — YZ GÖRSEL PLATFORMU — app.js === */

const navStudio = document.getElementById('nav-studio');
const navDashboard = document.getElementById('nav-dashboard');
const sectionStudio = document.getElementById('section-studio');
const sectionDashboard = document.getElementById('section-dashboard');

const generatorForm = document.getElementById('generator-form');
const modelSelect = document.getElementById('model-select');
const styleSelect = document.getElementById('style-select');
const promptInput = document.getElementById('prompt-input');
const btnTranslate = document.getElementById('btn-translate');
const btnRandom = document.getElementById('btn-random');
const btnClear = document.getElementById('btn-clear');
const btnGenerate = document.getElementById('btn-generate');
const btnLabel = btnGenerate ? btnGenerate.querySelector('.btn-label') : null;
const btnLoader = btnGenerate ? btnGenerate.querySelector('.btn-loader') : null;

const canvasPlaceholder = document.getElementById('canvas-placeholder');
const canvasLoading = document.getElementById('canvas-loading');
const canvasSuccess = document.getElementById('canvas-success');
const canvasError = document.getElementById('canvas-error');
const loadingStatus = document.getElementById('loading-status');
const generatedImage = document.getElementById('generated-image');
const errorMessage = document.getElementById('error-message');
const btnRetry = document.getElementById('btn-retry');

const galleryGrid = document.getElementById('gallery-grid');
const galleryCount = document.getElementById('gallery-count');

const statsActive = document.getElementById('stats-active');
const statsToday = document.getElementById('stats-today');
const statsTotal = document.getElementById('stats-total');
const statsIndex = document.getElementById('stats-index');
const btnResetLimits = document.getElementById('btn-reset-limits');
const keysGrid = document.getElementById('keys-grid');
const usersGrid = document.getElementById('users-grid');

const editModal = document.getElementById('edit-modal');
const editForm = document.getElementById('edit-form');
const editId = document.getElementById('edit-id');
const editLabel = document.getElementById('edit-label');
const editKey = document.getElementById('edit-key');
const btnToggleKey = document.getElementById('btn-toggle-key');
const btnModalClose = document.getElementById('btn-modal-close');
const btnModalCancel = document.getElementById('btn-modal-cancel');

// Gallery Panel
const galleryPanel = document.getElementById('gallery-panel');
const galleryOverlay = document.getElementById('gallery-overlay');
const btnGalleryToggle = document.getElementById('btn-gallery-toggle');
const btnGalleryClose = document.getElementById('btn-gallery-close');

const isAdmin = document.body.getAttribute('data-is-admin') === 'true';

let keysData = [];
let currentKeyIndex = 0;
let persistentImages = [];
let usersData = [];
let geminiAccountsData = [];
let currentGeminiProfileIndex = 0;

const samplePrompts = [
  "Kayseri Erciyes Dağı'nın zirvesinde kar yağışı altında kuzey ışıkları, sinematik ultra detaylı manzara",
  "Melikgazi tarihi sokaklarında gün batımı, taş konaklar ve sıcak sarı sokak lambalarının dramatik ışığı",
  "Kapadokya'da sabah gün doğumunda gökyüzünde süzülen yüzlerce renkli sıcak hava balonu, 8k fotogerçekçi",
  "Tarihi Kayseri Kalesi önünde fütüristik siberpunk tramvay, neon tabelalar ve yağmurlu ıslak zemin",
  "Modern Selçuklu mimarisi tarzında tasarlanmış akıllı kütüphane binası, iç mekanda süzülen güneş ışıkları",
  "Kayseri Kapalıçarşı'da baharat çuvalları, otantik dükkanlar ve güler yüzlü esnaf, National Geographic tarzı fotoğraf",
  "Tarihi Gevher Nesibe Şifahanesi avlusunda ilkbahar çiçekleri, su şırıltısı ve huzurlu bir sabah atmosferi",
  "Uzay istasyonunun devasa cam penceresinden mavi gezegen Dünya'ya bakan Türk astronot, yansımalı kask, 8k",
  "Yıldızlararası bir uzay gemisinin teknolojik köprü üstü, hologram haritalar ve parlayan mavi kontrol panelleri",
  "Bulutların üzerinde süzülen fütüristik yeşil şehir, güneş panelleri, dikey ormanlar ve uçan araçlar",
  "Mars yüzeyinde kurulmuş cam kubbeli botanik bahçesi ve araştırma üssü, arka planda kızıl gezegen kanyonları",
  "Sulu boya tarzında büyülü bir masal ormanı, parlayan peri ışıkları, mor ve turkuaz pastel tonlar",
  "Studio Ghibli anime tarzında yemyeşil vadide akan şelale ve kenarında oturan sevimli küçük bir ejderha",
  "Kristal mağarada parlayan ametist taşları ve yeraltı gölü, esrarengiz mavi ve mor ışık hüzmeleri",
  "Tropikal yağmur ormanında yaprağın üzerindeki su damlasında yansıyan kurbağa, ultra net makro fotoğraf",
  "Afrika savanasında altın gün batımı önünde silüeti görünen zürafa ailesi ve akasya ağaçları",
  "Sonbaharda sarı ve kırmızı yapraklarla kaplanmış sisli bir patika yol, sabahın erken saatleri",
  "Sarı ve siyah renklerde tasarlanmış ultra lüks elektrikli spor otomobil, dramatik stüdyo aydınlatması",
  "Geleneksel motiflerle süslenmiş zırh giyen görkemli Selçuklu savaşçısı komutanı, sinematik stüdyo portresi"
];

function showToast(msg, type = 'success') {
  let container = document.querySelector('.toast-container');
  if (!container) {
    container = document.createElement('div');
    container.className = 'toast-container';
    document.body.appendChild(container);
  }
  const t = document.createElement('div');
  t.className = `toast toast-${type}`;
  t.innerHTML = `<i class="fa-solid fa-${type === 'success' ? 'check-circle' : type === 'info' ? 'info-circle' : 'circle-exclamation'}"></i> ${msg}`;
  container.appendChild(t);
  setTimeout(() => t.remove(), 4000);
}

/* === Sayfa Navigasyonu === */
if (navStudio) {
  navStudio.addEventListener('click', () => switchPage('studio'));
}
if (navDashboard) {
  navDashboard.addEventListener('click', () => switchPage('dashboard'));
}

function switchPage(page) {
  if (page === 'studio') {
    if (navStudio) navStudio.classList.add('active');
    if (navDashboard) navDashboard.classList.remove('active');
    if (sectionStudio) sectionStudio.classList.add('active');
    if (sectionDashboard) sectionDashboard.classList.remove('active');
    fetchImages();
  } else if (isAdmin) {
    if (navDashboard) navDashboard.classList.add('active');
    if (navStudio) navStudio.classList.remove('active');
    if (sectionDashboard) sectionDashboard.classList.add('active');
    if (sectionStudio) sectionStudio.classList.remove('active');
    fetchKeys();
    fetchGeminiAccounts();
    fetchUsers();
    fetchImages();
  }
}

/* === Galeri Panel === */
function openGallery() {
  if (galleryPanel) galleryPanel.classList.add('open');
  if (galleryOverlay) galleryOverlay.style.display = 'block';
  fetchImages();
}

function closeGallery() {
  if (galleryPanel) galleryPanel.classList.remove('open');
  if (galleryOverlay) galleryOverlay.style.display = 'none';
}

if (btnGalleryToggle) btnGalleryToggle.addEventListener('click', openGallery);
if (btnGalleryClose) btnGalleryClose.addEventListener('click', closeGallery);
if (galleryOverlay) galleryOverlay.addEventListener('click', closeGallery);

const btnSyncImages = document.getElementById('btn-sync-images');
if (btnSyncImages) {
  btnSyncImages.addEventListener('click', async () => {
    btnSyncImages.classList.add('spinning');
    showToast('Klasörler taranıyor ve senkronize ediliyor...');
    await fetchImages();
    setTimeout(() => btnSyncImages.classList.remove('spinning'), 600);
  });
}

const galleryFolderTabs = document.getElementById('gallery-folder-tabs');
if (galleryFolderTabs) {
  galleryFolderTabs.addEventListener('click', (e) => {
    const tabBtn = e.target.closest('.folder-tab');
    if (!tabBtn) return;
    galleryFolderTabs.querySelectorAll('.folder-tab').forEach(btn => btn.classList.remove('active'));
    tabBtn.classList.add('active');
    currentGalleryFolder = tabBtn.getAttribute('data-folder') || 'all';
    renderGallery();
  });
}

/* === Prompt Yardımcıları === */
if (btnClear) btnClear.addEventListener('click', () => { promptInput.value = ''; });
if (btnRandom) btnRandom.addEventListener('click', () => {
  promptInput.value = samplePrompts[Math.floor(Math.random() * samplePrompts.length)];
  showToast('Rastgele fikir yüklendi!');
});

if (modelSelect) {
  modelSelect.addEventListener('change', () => {
    const val = modelSelect.value;
    const geminiInfo = document.getElementById('gemini-web-info');
    const chatgptInfo = document.getElementById('chatgpt-web-info');
    const copilotInfo = document.getElementById('copilot-web-info');
    const tripleInfo = document.getElementById('triple-ai-info');
    if (geminiInfo) geminiInfo.style.display = val === 'gemini-web-profile' ? 'flex' : 'none';
    if (chatgptInfo) chatgptInfo.style.display = val === 'chatgpt-web-profile' ? 'flex' : 'none';
    if (copilotInfo) copilotInfo.style.display = val === 'copilot-web-profile' ? 'flex' : 'none';
    if (tripleInfo) tripleInfo.style.display = val === 'triple-ai' ? 'flex' : 'none';
  });
}

if (btnTranslate) {
  btnTranslate.addEventListener('click', async () => {
    const text = promptInput.value.trim();
    if (!text) { showToast('Önce bir metin girin.', 'error'); return; }

    btnTranslate.disabled = true;
    try {
      const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text)}&langpair=tr|en`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.responseData && data.responseData.translatedText) {
        promptInput.value = data.responseData.translatedText;
        showToast('Metin İngilizceye çevrildi!');
      } else {
        throw new Error('Çeviri başarısız');
      }
    } catch (err) {
      showToast('Çeviri yapılamadı: ' + err.message, 'error');
    } finally {
      btnTranslate.disabled = false;
    }
  });
}

/* === Görsel Üretimi === */
if (generatorForm) generatorForm.addEventListener('submit', handleGenerate);
if (btnRetry) {
  btnRetry.addEventListener('click', () => {
    if (canvasError) canvasError.style.display = 'none';
    if (canvasPlaceholder) canvasPlaceholder.style.display = 'flex';
  });
}

async function handleGenerate(e) {
  e.preventDefault();
  const prompt = promptInput.value.trim();
  const ratio = document.querySelector('input[name="ratio"]:checked').value;

  if (!prompt) { showToast('Lütfen bir görsel tarifi girin.', 'error'); return; }

  btnGenerate.disabled = true;
  if (btnLabel) btnLabel.style.display = 'none';
  if (btnLoader) btnLoader.style.display = 'flex';
  if (canvasPlaceholder) canvasPlaceholder.style.display = 'none';
  if (canvasSuccess) canvasSuccess.style.display = 'none';
  if (canvasError) canvasError.style.display = 'none';
  if (canvasLoading) canvasLoading.style.display = 'flex';

  const selectedModel = modelSelect.value;
  if (selectedModel === 'triple-ai') {
    loadingStatus.textContent = '🚀 Üçlü üretim: Gemini + ChatGPT + Copilot aynı anda çalışıyor…';
  } else if (selectedModel.startsWith('gemini-') || selectedModel.startsWith('chatgpt-') || selectedModel.startsWith('copilot-')) {
    loadingStatus.textContent = '🤖 Selenium tarayıcı otomasyonu çalışıyor…';
  } else {
    loadingStatus.textContent = 'API sunucularına bağlanılıyor…';
  }

  try {
    const res = await fetch('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        prompt,
        aspectRatio: ratio,
        model: modelSelect.value,
        style: styleSelect.value
      })
    });

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || 'Görsel üretimi başarısız.');
    }

    const data = await res.json();
    if (data.success) {
      if (data.multiMode && data.results) {
        if (typeof canvasLoading !== 'undefined' && canvasLoading) canvasLoading.style.display = 'none';
        if (typeof canvasPlaceholder !== 'undefined' && canvasPlaceholder) canvasPlaceholder.style.display = 'flex';
        if (typeof canvasSuccess !== 'undefined' && canvasSuccess) canvasSuccess.style.display = 'none';
        
        await fetchImages();
        openTripleGroupModal(data.groupId);
        if (data.failures && data.failures.length > 0) {
          let failMsg = "Üretim tamamlandı ancak bazıları başarısız oldu:\n";
          data.failures.forEach(f => {
            failMsg += "- " + f.sourceSite + ": " + (f.error === 'login_required' ? 'Oturum açılmamış' : f.error) + "\n";
          });
          showToast(failMsg);
        } else {
          showToast("Çoklu üretim başarılı! Görseller kaydedildi.");
        }
      } else {
        addStudioImageToFeed(data.image, data.modelUsed, data.keyUsedLabel, true);
        showToast('Görsel başarıyla üretildi!');
        await fetchImages();
        if (isAdmin) await fetchKeys();
      }
    }
  } catch (err) {
    if (canvasLoading) canvasLoading.style.display = 'none';
    if (canvasError) canvasError.style.display = 'flex';
    if (errorMessage) errorMessage.textContent = err.message;
    showToast(err.message, 'error');
  } finally {
    btnGenerate.disabled = false;
    if (btnLabel) btnLabel.style.display = 'flex';
    if (btnLoader) btnLoader.style.display = 'none';
  }
}

/* === Görsel Akışı Helper === */
function addStudioImageToFeed(imageUrl, modelUsed, keyLabel, prepend = true) {
  const feedList = document.getElementById('studio-feed-list');
  if (!feedList) return;

  feedList.innerHTML = '';

  const card = document.createElement('div');
  card.className = 'studio-feed-item';
  card.innerHTML = `
    <div class="studio-feed-img-wrap">
      <img src="${imageUrl}" alt="Üretilen görsel">
    </div>
    <div class="result-bar">
      <span class="result-tag"><i class="fa-solid fa-microchip"></i> ${modelUsed || 'AI Model'}</span>
      <span class="result-tag"><i class="fa-solid fa-key"></i> ${keyLabel || 'Anahtar'}</span>
      <a class="result-tag download-tag" href="${imageUrl}" download="Melikgazi_${Date.now()}.png">
        <i class="fa-solid fa-download"></i> İndir
      </a>
    </div>
  `;

  feedList.appendChild(card);

  if (typeof canvasPlaceholder !== 'undefined' && canvasPlaceholder) canvasPlaceholder.style.display = 'none';
  if (typeof canvasLoading !== 'undefined' && canvasLoading) canvasLoading.style.display = 'none';
  if (typeof canvasError !== 'undefined' && canvasError) canvasError.style.display = 'none';
  if (typeof canvasSuccess !== 'undefined' && canvasSuccess) canvasSuccess.style.display = 'flex';
}

/* === Görseller === */
let currentGalleryFolder = 'all';

async function fetchImages() {
  try {
    const res = await fetch('/api/images');
    if (!res.ok) throw new Error();
    persistentImages = await res.json();
    renderGallery();
    if (galleryCount) galleryCount.textContent = persistentImages.length;
  } catch { }
}

function renderGallery() {
  if (!galleryGrid) return;

  const filteredImages = currentGalleryFolder === 'all'
    ? persistentImages
    : (currentGalleryFolder === 'triple'
        ? persistentImages.filter(item => item.groupId)
        : persistentImages.filter(item => item.folder === currentGalleryFolder && !item.groupId));

  if (filteredImages.length === 0) {
    const folderLabel = currentGalleryFolder === 'all' ? '' : ` (${currentGalleryFolder.toUpperCase()} klasörü)`;
    galleryGrid.innerHTML = `<div class="gallery-empty-panel"><p>Bu bölümde${folderLabel} henüz görsel bulunmuyor.</p></div>`;
    return;
  }
  
  galleryGrid.innerHTML = '';
  
  const groupedImages = [];
  const groupMap = new Map();
  
  filteredImages.forEach(item => {
    if (item.groupId) {
      if (!groupMap.has(item.groupId)) {
        groupMap.set(item.groupId, { isGroup: true, groupId: item.groupId, prompt: item.prompt, items: [], createdAt: item.createdAt });
        groupedImages.push(groupMap.get(item.groupId));
      }
      groupMap.get(item.groupId).items.push(item);
    } else {
      groupedImages.push(item);
    }
  });

  groupedImages.forEach(groupOrItem => {
    const div = document.createElement('div');
    div.className = 'gallery-item';

    if (groupOrItem.isGroup) {
       div.innerHTML = `
         <div style="position: absolute; top:0; left:0; width:100%; height:100%; display: grid; grid-template-columns: 1fr 1fr 1fr; grid-template-rows: 1fr;">
           ${groupOrItem.items.map((it, idx) => {
              if (idx > 2) return '';
              return `<img src="${it.image}" alt="Üretilen görsel" style="width:100%; height:100%; object-fit:cover; opacity: 0.8;">`;
           }).join('')}
         </div>
         <div class="gallery-folder-badge badge-gemini" style="background: linear-gradient(135deg, #10b981, #3b82f6);"><i class="fa-solid fa-layer-group"></i> Çoklu Üretim</div>
         <div class="gallery-overlay" style="z-index: 10;">${(groupOrItem.prompt || '').substring(0,40)}...</div>
         <button class="btn-del-img" title="Sil" onclick="deleteGroup(event, '${groupOrItem.groupId}')" style="z-index: 10;">
           <i class="fa-solid fa-trash-can"></i>
         </button>
       `;
       div.addEventListener('click', (e) => {
         if (e.target.closest('.btn-del-img')) return;
         openTripleGroupModal(groupOrItem.groupId);
       });
    } else {
       const item = groupOrItem;
       const badgeText = item.folder === 'gemini' ? 'Gemini Web' : (item.folder === 'free' ? 'Ücretsiz' : (item.folder === 'stability' ? 'Stability AI' : (item.folder === 'chatgpt' ? 'ChatGPT' : (item.folder === 'copilot' ? 'Copilot' : 'Genel'))));
       const badgeClass = item.folder === 'gemini' ? 'badge-gemini' : (item.folder === 'free' ? 'badge-free' : (item.folder === 'chatgpt' ? 'badge-chatgpt' : (item.folder === 'copilot' ? 'badge-copilot' : 'badge-stability')));

       div.innerHTML = `
         <img src="${item.image}" alt="Üretilen görsel">
         <div class="gallery-folder-badge ${badgeClass}">${badgeText}</div>
         <div class="gallery-overlay">${item.model}</div>
         <button class="btn-del-img" title="Sil" onclick="deleteImage(event, ${item.id})">
           <i class="fa-solid fa-trash-can"></i>
         </button>
       `;
       div.addEventListener('click', (e) => {
         if (e.target.closest('.btn-del-img')) return;
         closeGallery();
         switchPage('studio');
         addStudioImageToFeed(item.image, item.model, item.key, true);
       });
    }
    galleryGrid.appendChild(div);
  });
}

async function deleteGroup(e, groupId) {
  e.stopPropagation();
  if (!confirm('Bu çoklu üretimi ve içindeki tüm görselleri silmek istiyor musunuz?')) return;
  
  const groupItems = persistentImages.filter(i => i.groupId === groupId);
  try {
    for (const item of groupItems) {
      await fetch(`/api/images/${item.id}`, { method: 'DELETE' });
    }
    showToast('Çoklu üretim silindi!');
    await fetchImages();
  } catch (err) {
    showToast('Silinirken hata oluştu');
  }
}

function openTripleGroupModal(groupId) {
  const group = persistentImages.filter(i => i.groupId === groupId);
  if (!group || group.length === 0) return;
  
  const promptEl = document.getElementById('triple-group-prompt');
  if (promptEl) promptEl.textContent = "Prompt: " + group[0].prompt;
  
  const container = document.getElementById('triple-group-container');
  if (container) {
    container.innerHTML = '';
    group.forEach(res => {
      const col = document.createElement('div');
      col.style.cssText = "background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 12px; padding: 10px; display: flex; flex-direction: column;";
      col.innerHTML = `
        <img src="${res.image}" alt="Generated" style="width: 100%; height: 250px; object-fit: cover; border-radius: 8px; margin-bottom: 10px;">
        <h6 style="color: #fff; margin-bottom: 5px;">${res.model || res.sourceSite}</h6>
        <p style="font-size: 0.8rem; color: #aaa; margin-bottom: 15px; flex: 1;">${(res.sourceSite || '').toUpperCase()}</p>
        <a href="${res.image}" download class="action-btn" style="text-align: center; text-decoration: none; padding: 8px;">
          <i class="fa-solid fa-download"></i> İndir
        </a>
      `;
      container.appendChild(col);
    });
  }
  
  const modal = document.getElementById('triple-group-modal');
  if (modal) modal.style.display = 'flex';
}

const btnTripleGroupClose = document.getElementById('btn-triple-group-close');
if (btnTripleGroupClose) {
  btnTripleGroupClose.addEventListener('click', () => {
    document.getElementById('triple-group-modal').style.display = 'none';
  });
}
const btnTripleGroupOk = document.getElementById('btn-triple-group-ok');
if (btnTripleGroupOk) {
  btnTripleGroupOk.addEventListener('click', () => {
    document.getElementById('triple-group-modal').style.display = 'none';
  });
}



async function deleteImage(e, id) {
  e.stopPropagation();
  if (!confirm('Bu görseli kalıcı olarak silmek istiyor musunuz?')) return;
  try {
    const res = await fetch(`/api/images/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Silinemedi');
    showToast('Görsel silindi!');
    await fetchImages();
    if (isAdmin) await fetchKeys();
  } catch (err) {
    showToast('Hata: ' + err.message, 'error');
  }
}

/* === API Anahtarları === */
async function fetchKeys() {
  if (!isAdmin) return;
  try {
    const res = await fetch('/api/keys');
    if (!res.ok) throw new Error();
    const data = await res.json();
    keysData = data.keys;
    currentKeyIndex = data.currentKeyIndex;
    renderKeys();
    updateStats();
  } catch { }
}

function renderKeys() {
  if (!keysGrid || !isAdmin) return;
  keysGrid.innerHTML = '';
  keysData.forEach(k => {
    let badgeClass, badgeText;
    if (!k.hasKey) { badgeClass = 'badge-empty'; badgeText = 'Boş'; }
    else if (k.status === 'Active') { badgeClass = 'badge-active'; badgeText = 'Aktif'; }
    else { badgeClass = 'badge-exhausted'; badgeText = 'Pasif'; }

    const card = document.createElement('div');
    card.className = 'key-card';
    card.innerHTML = `
      <div class="key-card-top">
        <div><span class="key-slot">#${k.id}</span> <span class="key-label">${k.label}</span></div>
        <span class="badge ${badgeClass}">${badgeText}</span>
      </div>
      <div class="key-masked">${k.hasKey ? k.apiKeyMasked : 'Anahtar yok'}</div>
      <div class="key-stats-row">
        <span class="key-stat">Bugün: <strong>${k.usageToday}</strong></span>
        <span class="key-stat">Toplam: <strong>${k.totalUsage}</strong></span>
      </div>
      <div style="display: flex; gap: 6px;">
        <button onclick="openEditModal(${k.id}, '${k.label.replace(/'/g, "\\'")}', ${k.hasKey}, '${k.status || 'Active'}')" style="flex: 1;">
          <i class="fa-solid fa-pen"></i> Düzenle
        </button>
        <button onclick="deleteKeySlot(${k.id})" style="color: var(--color-danger);" title="Sil">
          <i class="fa-solid fa-trash"></i>
        </button>
      </div>
    `;
    keysGrid.appendChild(card);
  });
}

function updateStats() {
  if (!statsActive || !isAdmin) return;
  const active = keysData.filter(k => k.hasKey && k.status === 'Active').length;
  const today = keysData.reduce((s, k) => s + k.usageToday, 0);
  const total = keysData.reduce((s, k) => s + k.totalUsage, 0);

  statsActive.textContent = active;
  statsToday.textContent = today;
  statsTotal.textContent = total;
  statsIndex.textContent = keysData.some(k => k.hasKey) ? `#${currentKeyIndex + 1}` : '—';
}

if (btnResetLimits) {
  btnResetLimits.addEventListener('click', async () => {
    if (!confirm('Tüm kullanım sayaçlarını sıfırlamak istediğinize emin misiniz?')) return;
    try {
      const res = await fetch('/api/keys/reset', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        showToast('Sayaçlar sıfırlandı!');
        fetchKeys();
      }
    } catch (err) { showToast('Hata: ' + err.message, 'error'); }
  });
}

/* === Stability Düzenleme Modalı === */
window.openEditModal = function(id, label, hasKey, status) {
  if (!editModal) return;
  editId.value = id;
  editLabel.value = label;
  editKey.value = ''; // Düzenlerken key bölümü boş metin kutusu olarak gelir
  editKey.type = 'password';
  if (btnToggleKey) btnToggleKey.innerHTML = '<i class="fa-solid fa-eye"></i>';
  const statusEl = document.getElementById('edit-status');
  if (statusEl) statusEl.value = status || 'Active';
  editModal.style.display = 'flex';
};

function closeModal() { if (editModal) editModal.style.display = 'none'; }
if (btnModalClose) btnModalClose.addEventListener('click', closeModal);
if (btnModalCancel) btnModalCancel.addEventListener('click', closeModal);
if (editModal) editModal.addEventListener('click', (e) => { if (e.target === editModal) closeModal(); });

if (btnToggleKey) {
  btnToggleKey.addEventListener('click', () => {
    const isPass = editKey.type === 'password';
    editKey.type = isPass ? 'text' : 'password';
    btnToggleKey.innerHTML = `<i class="fa-solid fa-eye${isPass ? '-slash' : ''}"></i>`;
  });
}

if (editForm) {
  editForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = parseInt(editId.value);
    const label = editLabel.value.trim();
    const apiKey = editKey.value.trim();
    const statusEl = document.getElementById('edit-status');
    const status = statusEl ? statusEl.value : 'Active';
    const payload = { id, label, status };
    if (apiKey && !apiKey.includes('•')) payload.apiKey = apiKey;

    try {
      const res = await fetch('/api/keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error('Kayıt başarısız.');
      const data = await res.json();
      if (data.success) {
        showToast(`Yuva #${id} güncellendi.`);
        closeModal();
        fetchKeys();
      }
    } catch (err) { showToast(err.message, 'error'); }
  });
}

/* === Gemini Hesapları === */
async function fetchGeminiAccounts() {
  if (!isAdmin) return;
  try {
    const res = await fetch('/api/gemini-accounts');
    if (!res.ok) throw new Error();
    const data = await res.json();
    geminiAccountsData = data.accounts;
    currentGeminiProfileIndex = data.currentProfileIndex;
    renderGeminiAccounts();
  } catch { }
}

function renderGeminiAccounts() {
  const grid = document.getElementById('gemini-accounts-grid');
  if (!grid || !isAdmin) return;
  grid.innerHTML = '';

  geminiAccountsData.forEach(a => {
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
        <button onclick="openGeminiLogin(${a.id}, '${a.accountLabel.replace(/'/g, "\\'")}')" style="flex:1;">
          <i class="fa-solid fa-right-to-bracket"></i> Oturum Aç
        </button>
        <button onclick="openGeminiEditModal(${a.id}, '${a.accountLabel.replace(/'/g, "\\'")}', '${a.status}')" title="Düzenle">
          <i class="fa-solid fa-pen"></i>
        </button>
        <button onclick="deleteGeminiAccount(${a.id})" style="color: var(--color-danger);" title="Sil">
          <i class="fa-solid fa-trash"></i>
        </button>
      </div>
    `;
    grid.appendChild(card);
  });
}

window.openGeminiLogin = async function(id, label) {
  showToast(`'${label}' için Chrome açılıyor…`, 'info');
  try {
    const res = await fetch('/api/gemini-web/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ profileId: id })
    });
    const data = await res.json();
    if (data.success) {
      showToast(`'${label}' Chrome penceresi açıldı!`);
    } else {
      showToast('Chrome açılamadı.', 'error');
    }
  } catch (err) {
    showToast('Hata: ' + err.message, 'error');
  }
};

const geminiEditModal = document.getElementById('gemini-edit-modal');
const geminiEditForm = document.getElementById('gemini-edit-form');
const geminiEditId = document.getElementById('gemini-edit-id');
const geminiEditLabel = document.getElementById('gemini-edit-label');
const geminiEditStatus = document.getElementById('gemini-edit-status');
const btnGeminiModalClose = document.getElementById('btn-gemini-modal-close');
const btnGeminiModalCancel = document.getElementById('btn-gemini-modal-cancel');

window.openGeminiEditModal = function(id, label, status) {
  if (!geminiEditModal) return;
  geminiEditId.value = id;
  geminiEditLabel.value = label;
  geminiEditStatus.value = status;
  geminiEditModal.style.display = 'flex';
};

function closeGeminiModal() { if (geminiEditModal) geminiEditModal.style.display = 'none'; }
if (btnGeminiModalClose) btnGeminiModalClose.addEventListener('click', closeGeminiModal);
if (btnGeminiModalCancel) btnGeminiModalCancel.addEventListener('click', closeGeminiModal);
if (geminiEditModal) geminiEditModal.addEventListener('click', (e) => { if (e.target === geminiEditModal) closeGeminiModal(); });

if (geminiEditForm) {
  geminiEditForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = parseInt(geminiEditId.value);
    const accountLabel = geminiEditLabel.value.trim();
    const status = geminiEditStatus.value;
    try {
      const res = await fetch('/api/gemini-accounts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, accountLabel, status })
      });
      const data = await res.json();
      if (data.success) {
        showToast(`Google hesabı #${id} güncellendi.`);
        closeGeminiModal();
        fetchGeminiAccounts();
      } else {
        throw new Error(data.error || 'Güncellenemedi.');
      }
    } catch (err) { showToast(err.message, 'error'); }
  });
}

const btnAddGeminiAcc = document.getElementById('btn-add-gemini-acc');
if (btnAddGeminiAcc) {
  btnAddGeminiAcc.addEventListener('click', async () => {
    const label = prompt('Yeni Google hesabı adı:', `Google Hesap #${geminiAccountsData.length + 1}`);
    if (label === null) return;
    try {
      const res = await fetch('/api/gemini-accounts/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ accountLabel: label.trim() || undefined })
      });
      const data = await res.json();
      if (data.success) {
        showToast('Yeni profil yuvası eklendi!');
        fetchGeminiAccounts();
      } else {
        throw new Error(data.error || 'Eklenemedi');
      }
    } catch (err) { showToast(err.message, 'error'); }
  });
}

window.deleteGeminiAccount = async function(id) {
  if (!confirm(`#${id} Gemini profil yuvasını silmek istediğinize emin misiniz?`)) return;
  try {
    const res = await fetch(`/api/gemini-accounts/${id}`, { method: 'DELETE' });
    const data = await res.json();
    if (data.success) {
      showToast(`Profil #${id} silindi.`);
      fetchGeminiAccounts();
    } else {
      throw new Error(data.error || 'Silinemedi.');
    }
  } catch (err) { showToast(err.message, 'error'); }
};


/* === ChatGPT Hesap Yönetimi === */
let chatgptAccountsData = [];

async function loadChatGptAccounts() {
  if (!isAdmin) return;
  try {
    const res = await fetch('/api/chatgpt-accounts');
    if (!res.ok) throw new Error();
    const data = await res.json();
    chatgptAccountsData = data.accounts || [];
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
    const safeLabel = (a.accountLabel || '').replace(/'/g, "\\'");
    card.innerHTML = `
      <div class="key-card-top">
        <div><span class="key-slot">#${a.id}</span> <span class="key-label">${a.accountLabel}</span></div>
        <span class="badge ${badgeClass}">${badgeText}</span>
      </div>
      <div class="key-masked">${a.profileName}</div>
      <div class="key-stats-row"><span>Son: <strong>${a.lastUsed || '—'}</strong></span></div>
      <div style="display:flex; gap: 6px;">
        <button data-login-chatgpt="${a.id}" data-label="${safeLabel}" style="flex:1;"><i class="fa-solid fa-right-to-bracket"></i> Oturum Aç</button>
        <button data-edit-chatgpt="${a.id}" data-label="${safeLabel}" data-status="${a.status}" title="Düzenle"><i class="fa-solid fa-pen"></i></button>
        <button data-del-chatgpt="${a.id}" style="color: var(--color-danger);" title="Sil"><i class="fa-solid fa-trash"></i></button>
      </div>
    `;
    // Event listeners
    card.querySelector('[data-login-chatgpt]').addEventListener('click', () => openChatGptLogin(a.id, a.accountLabel));
    card.querySelector('[data-edit-chatgpt]').addEventListener('click', () => openChatGptEditModal(a.id, a.accountLabel, a.status));
    card.querySelector('[data-del-chatgpt]').addEventListener('click', () => deleteChatGptAccount(a.id));
    grid.appendChild(card);
  });
}

async function openChatGptLogin(id, label) {
  showToast(label + ' için Chrome açılıyor…', 'info');
  try {
    const res = await fetch('/api/chatgpt-web/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ profileId: id }) });
    const data = await res.json();
    if (data.success) { showToast(label + ' Chrome penceresi açıldı!'); } else { showToast('Chrome açılamadı.', 'error'); }
  } catch (err) { showToast('Hata: ' + err.message, 'error'); }
}

const chatgptEditModal = document.getElementById('chatgpt-edit-modal');
const chatgptEditForm = document.getElementById('chatgpt-edit-form');
const chatgptEditId = document.getElementById('chatgpt-edit-id');
const chatgptEditLabel = document.getElementById('chatgpt-edit-label');
const chatgptEditStatus = document.getElementById('chatgpt-edit-status');
const btnChatgptModalClose = document.getElementById('btn-chatgpt-modal-close');
const btnChatgptModalCancel = document.getElementById('btn-chatgpt-modal-cancel');

function openChatGptEditModal(id, label, status) {
  if (!chatgptEditModal) return;
  chatgptEditId.value = id;
  chatgptEditLabel.value = label;
  chatgptEditStatus.value = status;
  chatgptEditModal.style.display = 'flex';
}

function closeChatGptModal() { if (chatgptEditModal) chatgptEditModal.style.display = 'none'; }
if (btnChatgptModalClose) btnChatgptModalClose.addEventListener('click', closeChatGptModal);
if (btnChatgptModalCancel) btnChatgptModalCancel.addEventListener('click', closeChatGptModal);
if (chatgptEditModal) chatgptEditModal.addEventListener('click', (e) => { if (e.target === chatgptEditModal) closeChatGptModal(); });

if (chatgptEditForm) {
  chatgptEditForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = parseInt(chatgptEditId.value);
    const accountLabel = chatgptEditLabel.value.trim();
    const status = chatgptEditStatus.value;
    try {
      const res = await fetch('/api/chatgpt-accounts', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, accountLabel, status }) });
      if (!res.ok) throw new Error('Kayıt başarısız.');
      const data = await res.json();
      if (data.success || res.ok) { showToast('Hesap güncellendi.'); closeChatGptModal(); loadChatGptAccounts(); }
    } catch (err) { showToast(err.message, 'error'); }
  });
}

const btnAddChatgptAcc = document.getElementById('btn-add-chatgpt-acc');
if (btnAddChatgptAcc) {
  btnAddChatgptAcc.addEventListener('click', async () => {
    const label = prompt('Yeni ChatGPT hesabı adı:', 'ChatGPT Hesap #' + (chatgptAccountsData.length + 1));
    if (label === null) return;
    try {
      const res = await fetch('/api/chatgpt-accounts/add', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ accountLabel: label.trim() || undefined }) });
      const data = await res.json();
      if (data.success) { showToast('Yeni ChatGPT profil yuvası eklendi!'); loadChatGptAccounts(); }
      else { throw new Error(data.error || 'Eklenemedi'); }
    } catch (err) { showToast(err.message, 'error'); }
  });
}

async function deleteChatGptAccount(id) {
  if (!confirm('#' + id + ' ChatGPT profilini silmek istiyor musunuz?')) return;
  try {
    const res = await fetch('/api/chatgpt-accounts/' + id, { method: 'DELETE' });
    const data = await res.json();
    if (data.success) { showToast('Profil #' + id + ' silindi.'); loadChatGptAccounts(); }
    else { throw new Error(data.error || 'Silinemedi.'); }
  } catch (err) { showToast(err.message, 'error'); }
}

/* === Copilot Hesap Yönetimi === */
let copilotAccountsData = [];

async function loadCopilotAccounts() {
  if (!isAdmin) return;
  try {
    const res = await fetch('/api/copilot-accounts');
    if (!res.ok) throw new Error();
    const data = await res.json();
    copilotAccountsData = data.accounts || [];
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
    const safeLabel = (a.accountLabel || '').replace(/'/g, "\\'");
    card.innerHTML = `
      <div class="key-card-top">
        <div><span class="key-slot">#${a.id}</span> <span class="key-label">${a.accountLabel}</span></div>
        <span class="badge ${badgeClass}">${badgeText}</span>
      </div>
      <div class="key-masked">${a.profileName}</div>
      <div class="key-stats-row"><span>Son: <strong>${a.lastUsed || '—'}</strong></span></div>
      <div style="display:flex; gap: 6px;">
        <button data-login-copilot="${a.id}" data-label="${safeLabel}" style="flex:1;"><i class="fa-solid fa-right-to-bracket"></i> Oturum Aç</button>
        <button data-edit-copilot="${a.id}" data-label="${safeLabel}" data-status="${a.status}" title="Düzenle"><i class="fa-solid fa-pen"></i></button>
        <button data-del-copilot="${a.id}" style="color: var(--color-danger);" title="Sil"><i class="fa-solid fa-trash"></i></button>
      </div>
    `;
    card.querySelector('[data-login-copilot]').addEventListener('click', () => openCopilotLogin(a.id, a.accountLabel));
    card.querySelector('[data-edit-copilot]').addEventListener('click', () => openCopilotEditModal(a.id, a.accountLabel, a.status));
    card.querySelector('[data-del-copilot]').addEventListener('click', () => deleteCopilotAccount(a.id));
    grid.appendChild(card);
  });
}

async function openCopilotLogin(id, label) {
  showToast(label + ' için Chrome açılıyor…', 'info');
  try {
    const res = await fetch('/api/copilot-web/login', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ profileId: id }) });
    const data = await res.json();
    if (data.success) { showToast(label + ' Chrome penceresi açıldı!'); } else { showToast('Chrome açılamadı.', 'error'); }
  } catch (err) { showToast('Hata: ' + err.message, 'error'); }
}

const copilotEditModal = document.getElementById('copilot-edit-modal');
const copilotEditForm = document.getElementById('copilot-edit-form');
const copilotEditId = document.getElementById('copilot-edit-id');
const copilotEditLabel = document.getElementById('copilot-edit-label');
const copilotEditStatus = document.getElementById('copilot-edit-status');
const btnCopilotModalClose = document.getElementById('btn-copilot-modal-close');
const btnCopilotModalCancel = document.getElementById('btn-copilot-modal-cancel');

function openCopilotEditModal(id, label, status) {
  if (!copilotEditModal) return;
  copilotEditId.value = id;
  copilotEditLabel.value = label;
  copilotEditStatus.value = status;
  copilotEditModal.style.display = 'flex';
}

function closeCopilotModal() { if (copilotEditModal) copilotEditModal.style.display = 'none'; }
if (btnCopilotModalClose) btnCopilotModalClose.addEventListener('click', closeCopilotModal);
if (btnCopilotModalCancel) btnCopilotModalCancel.addEventListener('click', closeCopilotModal);
if (copilotEditModal) copilotEditModal.addEventListener('click', (e) => { if (e.target === copilotEditModal) closeCopilotModal(); });

if (copilotEditForm) {
  copilotEditForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = parseInt(copilotEditId.value);
    const accountLabel = copilotEditLabel.value.trim();
    const status = copilotEditStatus.value;
    try {
      const res = await fetch('/api/copilot-accounts', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, accountLabel, status }) });
      if (!res.ok) throw new Error('Kayıt başarısız.');
      const data = await res.json();
      if (data.success || res.ok) { showToast('Hesap güncellendi.'); closeCopilotModal(); loadCopilotAccounts(); }
    } catch (err) { showToast(err.message, 'error'); }
  });
}

const btnAddCopilotAcc = document.getElementById('btn-add-copilot-acc');
if (btnAddCopilotAcc) {
  btnAddCopilotAcc.addEventListener('click', async () => {
    const label = prompt('Yeni Copilot hesabı adı:', 'Copilot Hesap #' + (copilotAccountsData.length + 1));
    if (label === null) return;
    try {
      const res = await fetch('/api/copilot-accounts/add', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ accountLabel: label.trim() || undefined }) });
      const data = await res.json();
      if (data.success) { showToast('Yeni Copilot profil yuvası eklendi!'); loadCopilotAccounts(); }
      else { throw new Error(data.error || 'Eklenemedi'); }
    } catch (err) { showToast(err.message, 'error'); }
  });
}

async function deleteCopilotAccount(id) {
  if (!confirm('#' + id + ' Copilot profilini silmek istiyor musunuz?')) return;
  try {
    const res = await fetch('/api/copilot-accounts/' + id, { method: 'DELETE' });
    const data = await res.json();
    if (data.success) { showToast('Profil #' + id + ' silindi.'); loadCopilotAccounts(); }
    else { throw new Error(data.error || 'Silinemedi.'); }
  } catch (err) { showToast(err.message, 'error'); }
}

const btnAddKey = document.getElementById('btn-add-key');
if (btnAddKey) {
  btnAddKey.addEventListener('click', async () => {
    const label = prompt('Yeni anahtar etiketi:', `Stability #${keysData.length + 1}`);
    if (label === null) return;
    const apiKey = prompt('API anahtarı (sk-...) veya boş bırakın:', '');
    if (apiKey === null) return;
    try {
      const res = await fetch('/api/keys/add', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ label: label.trim() || undefined, apiKey: apiKey.trim() || undefined })
      });
      const data = await res.json();
      if (data.success) {
        showToast('Yeni anahtar yuvası eklendi!');
        fetchKeys();
      } else {
        throw new Error(data.error || 'Eklenemedi');
      }
    } catch (err) { showToast(err.message, 'error'); }
  });
}

window.deleteKeySlot = async function(id) {
  if (!confirm(`#${id} Stability anahtar yuvasını silmek istediğinize emin misiniz?`)) return;
  try {
    const res = await fetch(`/api/keys/${id}`, { method: 'DELETE' });
    const data = await res.json();
    if (data.success) {
      showToast(`Yuva #${id} silindi.`);
      fetchKeys();
    } else {
      throw new Error(data.error || 'Silinemedi.');
    }
  } catch (err) { showToast(err.message, 'error'); }
};

/* === KULLANICI PROFİLİM YÖNETİMİ === */
const profileModal = document.getElementById('profile-modal');
const btnProfile = document.getElementById('btn-profile');
const btnProfileClose = document.getElementById('btn-profile-close');
const btnProfileCancel = document.getElementById('btn-profile-cancel');
const profileForm = document.getElementById('profile-form');
const profileUsername = document.getElementById('profile-username');
const profileRole = document.getElementById('profile-role');
const profileDisplayName = document.getElementById('profile-displayName');
const profilePassword = document.getElementById('profile-password');

if (btnProfile) {
  btnProfile.addEventListener('click', async () => {
    try {
      const res = await fetch('/api/profile');
      if (!res.ok) throw new Error('Profil yüklenemedi');
      const data = await res.json();
      if (profileUsername) profileUsername.value = data.username;
      if (profileRole) profileRole.value = data.role;
      if (profileDisplayName) profileDisplayName.value = data.displayName;
      if (profilePassword) profilePassword.value = ''; // Şifre boş kutu olarak gelmeli
      if (profileModal) profileModal.style.display = 'flex';
    } catch (err) {
      showToast(err.message, 'error');
    }
  });
}

function closeProfileModal() { if (profileModal) profileModal.style.display = 'none'; }
if (btnProfileClose) btnProfileClose.addEventListener('click', closeProfileModal);
if (btnProfileCancel) btnProfileCancel.addEventListener('click', closeProfileModal);
if (profileModal) profileModal.addEventListener('click', (e) => { if (e.target === profileModal) closeProfileModal(); });

if (profileForm) {
  profileForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const displayName = profileDisplayName ? profileDisplayName.value.trim() : '';
    const password = profilePassword ? profilePassword.value.trim() : '';

    try {
      const res = await fetch('/api/profile', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          displayName: displayName || undefined,
          password: password || undefined
        })
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Profil güncellenemedi');
      }
      const data = await res.json();
      if (data.success) {
        showToast('Profil bilgileriniz güncellendi!');
        closeProfileModal();
        // Butondaki ismi güncelle
        if (btnProfile) {
          const badgeEl = btnProfile.querySelector('.role-badge');
          const badgeHtml = badgeEl ? badgeEl.outerHTML : '';
          btnProfile.innerHTML = `<i class="fa-solid fa-user-gear"></i> ${displayName} ${badgeHtml}`;
        }
      }
    } catch (err) {
      showToast(err.message, 'error');
    }
  });
}

/* === KULLANICI & ROL YÖNETİMİ (SADECE YÖNETİCİLER İÇİN) === */
async function fetchUsers() {
  if (!isAdmin) return;
  try {
    const res = await fetch('/api/users');
    if (!res.ok) throw new Error();
    usersData = await res.json();
    renderUsers();
  } catch { }
}

function renderUsers() {
  if (!usersGrid || !isAdmin) return;
  usersGrid.innerHTML = '';

  usersData.forEach(u => {
    let badgeClass = u.role === 'Yönetici' ? 'badge-active' : 'badge-empty';
    let badgeText = u.role === 'Yönetici' ? 'Yönetici (Admin)' : 'Standart Kullanıcı';

    const card = document.createElement('div');
    card.className = 'key-card';
    card.innerHTML = `
      <div class="key-card-top">
        <div><span class="key-slot">#${u.id}</span> <span class="key-label">${u.displayName}</span> <small style="color:var(--text-muted);">(@${u.username})</small></div>
        <span class="badge ${badgeClass}">${badgeText}</span>
      </div>
      <div class="key-stats-row" style="margin-top: 12px; margin-bottom: 12px;">
        <span>Üretilen Görsel Sayısı: <strong>${u.imageCount}</strong> adet</span>
      </div>
      <div style="display:flex; gap: 6px; flex-wrap: wrap;">
        ${(u.role !== 'Yönetici' || u.id === parseInt(document.body.getAttribute('data-user-id') || '0')) ? `
          <button onclick="openUserImagesModal(${u.id}, '${u.displayName.replace(/'/g, "\\'")}')" style="flex:1;" title="Ürettiği görselleri gör">
            <i class="fa-solid fa-images"></i> Görseller (${u.imageCount})
          </button>
        ` : `<span style="font-size:0.75rem; color:var(--text-muted); flex:1; display:flex; align-items:center;"><i class="fa-solid fa-shield-halved"></i> Diğer Yönetici</span>`}
        <button onclick="openUserEditModal(${u.id}, '${u.displayName.replace(/'/g, "\\'")}', '${u.role}')" title="Kullanıcıyı Düzenle">
          <i class="fa-solid fa-user-pen"></i> Düzenle
        </button>
        <button onclick="deleteUserSlot(${u.id}, '${u.username}')" style="color: var(--color-danger);" title="Kullanıcıyı Sil">
          <i class="fa-solid fa-trash"></i>
        </button>
      </div>
    `;
    usersGrid.appendChild(card);
  });
}

/* Kullanıcı Düzenleme Modalı */
const userEditModal = document.getElementById('user-edit-modal');
const userEditForm = document.getElementById('user-edit-form');
const userEditId = document.getElementById('user-edit-id');
const userEditDisplayName = document.getElementById('user-edit-displayName');
const userEditPassword = document.getElementById('user-edit-password');
const userEditRole = document.getElementById('user-edit-role');
const btnUserModalClose = document.getElementById('btn-user-modal-close');
const btnUserModalCancel = document.getElementById('btn-user-modal-cancel');

window.openUserEditModal = function(id, displayName, role) {
  if (!userEditModal) return;
  if (userEditId) userEditId.value = id;
  if (userEditDisplayName) userEditDisplayName.value = displayName;
  if (userEditPassword) userEditPassword.value = ''; // Şifre boş kutu olarak gelmeli
  if (userEditRole) userEditRole.value = role;
  userEditModal.style.display = 'flex';
};

function closeUserEditModal() { if (userEditModal) userEditModal.style.display = 'none'; }
if (btnUserModalClose) btnUserModalClose.addEventListener('click', closeUserEditModal);
if (btnUserModalCancel) btnUserModalCancel.addEventListener('click', closeUserEditModal);
if (userEditModal) userEditModal.addEventListener('click', (e) => { if (e.target === userEditModal) closeUserEditModal(); });

if (userEditForm) {
  userEditForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = parseInt(userEditId.value);
    const displayName = userEditDisplayName ? userEditDisplayName.value.trim() : '';
    const password = userEditPassword ? userEditPassword.value.trim() : '';
    const role = userEditRole ? userEditRole.value : 'Kullanıcı';

    try {
      const res = await fetch(`/api/users/${id}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          displayName: displayName || undefined,
          password: password || undefined,
          role: role
        })
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Kullanıcı güncellenemedi');
      }
      const data = await res.json();
      if (data.success) {
        showToast(`Kullanıcı #${id} güncellendi!`);
        closeUserEditModal();
        fetchUsers();
      }
    } catch (err) {
      showToast(err.message, 'error');
    }
  });
}

/* Yeni Kullanıcı Ekleme Modalı */
const userAddModal = document.getElementById('user-add-modal');
const btnAddUser = document.getElementById('btn-add-user');
const userAddForm = document.getElementById('user-add-form');
const userAddUsername = document.getElementById('user-add-username');
const userAddDisplayName = document.getElementById('user-add-displayName');
const userAddPassword = document.getElementById('user-add-password');
const userAddRole = document.getElementById('user-add-role');
const btnUserAddClose = document.getElementById('btn-user-add-close');
const btnUserAddCancel = document.getElementById('btn-user-add-cancel');

if (btnAddUser) {
  btnAddUser.addEventListener('click', () => {
    if (!userAddModal) return;
    if (userAddUsername) userAddUsername.value = '';
    if (userAddDisplayName) userAddDisplayName.value = '';
    if (userAddPassword) userAddPassword.value = '';
    if (userAddRole) userAddRole.value = 'Kullanıcı';
    userAddModal.style.display = 'flex';
  });
}

function closeUserAddModal() { if (userAddModal) userAddModal.style.display = 'none'; }
if (btnUserAddClose) btnUserAddClose.addEventListener('click', closeUserAddModal);
if (btnUserAddCancel) btnUserAddCancel.addEventListener('click', closeUserAddModal);
if (userAddModal) userAddModal.addEventListener('click', (e) => { if (e.target === userAddModal) closeUserAddModal(); });

if (userAddForm) {
  userAddForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = userAddUsername ? userAddUsername.value.trim() : '';
    const displayName = userAddDisplayName ? userAddDisplayName.value.trim() : '';
    const password = userAddPassword ? userAddPassword.value.trim() : '';
    const role = userAddRole ? userAddRole.value : 'Kullanıcı';

    try {
      const res = await fetch('/api/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, displayName, password, role })
      });
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Kullanıcı eklenemedi');
      }
      const data = await res.json();
      if (data.success) {
        showToast('Yeni kullanıcı oluşturuldu!');
        closeUserAddModal();
        fetchUsers();
      }
    } catch (err) {
      showToast(err.message, 'error');
    }
  });
}

window.deleteUserSlot = async function(id, username) {
  if (!confirm(`@${username} kullanıcısını ve ürettiği tüm görselleri kalıcı olarak silmek istediğinize emin misiniz?`)) return;
  try {
    const res = await fetch(`/api/users/${id}`, { method: 'DELETE' });
    if (!res.ok) {
      const errData = await res.json();
      throw new Error(errData.error || 'Kullanıcı silinemedi');
    }
    const data = await res.json();
    if (data.success) {
      showToast(`@${username} kullanıcısı silindi.`);
      fetchUsers();
      fetchImages();
    }
  } catch (err) {
    showToast(err.message, 'error');
  }
};

/* Kullanıcı Görsellerini İnceleme Modalı */
const userImagesModal = document.getElementById('user-images-modal');
const userImagesModalTitle = document.getElementById('user-images-modal-title');
const userImagesContainer = document.getElementById('user-images-container');
const btnUserImagesClose = document.getElementById('btn-user-images-close');

window.openUserImagesModal = function(userId, displayName) {
  if (!userImagesModal || !userImagesContainer) return;
  if (userImagesModalTitle) userImagesModalTitle.innerHTML = `<i class="fa-solid fa-images" style="color: var(--color-primary);"></i> ${displayName} — Ürettiği Görseller`;

  const userObj = usersData.find(u => u.id === userId);
  const imgs = userObj ? userObj.images : [];

  if (!imgs || imgs.length === 0) {
    userImagesContainer.innerHTML = `<div class="gallery-empty-panel" style="grid-column: 1/-1;"><p>Bu kullanıcının henüz üretmiş olduğu bir görsel bulunmuyor.</p></div>`;
  } else {
    userImagesContainer.innerHTML = '';
    imgs.forEach(item => {
      const div = document.createElement('div');
      div.className = 'gallery-item';
      div.style.background = '#1a1c20';
      div.style.position = 'relative';
      div.innerHTML = `
        <img src="${item.image}" alt="Görsel" style="width:100%; height:200px; object-fit:cover;">
        <div class="gallery-overlay" style="opacity:1; background:rgba(0,0,0,0.7); font-size:0.75rem;">${item.prompt || item.model}</div>
        <button class="btn-del-img" style="opacity:1;" title="Görseli Sil" onclick="deleteImageFromUserModal(event, ${item.id}, ${userId})">
          <i class="fa-solid fa-trash-can"></i>
        </button>
      `;
      userImagesContainer.appendChild(div);
    });
  }
  userImagesModal.style.display = 'flex';
};

window.deleteImageFromUserModal = async function(e, imageId, userId) {
  e.stopPropagation();
  if (!confirm('Bu görseli kalıcı olarak silmek istiyor musunuz?')) return;
  try {
    const res = await fetch(`/api/images/${imageId}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Silinemedi');
    showToast('Görsel silindi!');
    await fetchUsers();
    await fetchImages();
    // Modal içeriğini yenile
    const userObj = usersData.find(u => u.id === userId);
    if (userObj && userImagesModal.style.display === 'flex') {
      openUserImagesModal(userId, userObj.displayName);
    }
  } catch (err) {
    showToast('Hata: ' + err.message, 'error');
  }
};

function closeUserImagesModal() { if (userImagesModal) userImagesModal.style.display = 'none'; }
if (btnUserImagesClose) btnUserImagesClose.addEventListener('click', closeUserImagesModal);
if (userImagesModal) userImagesModal.addEventListener('click', (e) => { if (e.target === userImagesModal) closeUserImagesModal(); });

/* === İlk Yükleme === */
fetchImages();
if (isAdmin) {
  fetchKeys();
  fetchGeminiAccounts();
  loadChatGptAccounts();
  loadCopilotAccounts();
  fetchUsers();
}
