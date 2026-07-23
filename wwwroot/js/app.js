const navStudio = document.getElementById('nav-studio');
const navDashboard = document.getElementById('nav-dashboard');
const sectionStudio = document.getElementById('section-studio');
const sectionDashboard = document.getElementById('section-dashboard');
const generatorForm = document.getElementById('generator-form');

// Sidebar ve Mobil Çekmece Menü Kontrolleri (Global & Güvenilir)
const sidebarToggleBtn = document.getElementById('sidebar-toggle');
const mobileMenuBtn = document.getElementById('mobile-menu-btn');
const appSidebar = document.getElementById('app-sidebar');
const mainContent = document.getElementById('main-content');
const sidebarBackdrop = document.getElementById('sidebar-backdrop');

window.toggleMobileSidebar = function(e) {
  if (e) { try { e.stopPropagation(); e.preventDefault(); } catch {} }
  const sidebar = document.getElementById('app-sidebar');
  const backdrop = document.getElementById('sidebar-backdrop');
  if (!sidebar) return;
  const isOpen = sidebar.classList.contains('mobile-open');
  if (isOpen) {
    sidebar.classList.remove('mobile-open');
    if (backdrop) backdrop.classList.remove('active');
  } else {
    sidebar.classList.remove('collapsed');
    sidebar.classList.add('mobile-open');
    if (backdrop) backdrop.classList.add('active');
  }
};

window.closeMobileSidebar = function() {
  const sidebar = document.getElementById('app-sidebar');
  const backdrop = document.getElementById('sidebar-backdrop');
  if (sidebar) sidebar.classList.remove('mobile-open');
  if (backdrop) backdrop.classList.remove('active');
};

window.toggleDesktopSidebar = function(e) {
  if (e) { try { e.preventDefault(); e.stopPropagation(); } catch {} }
  const sidebar = document.getElementById('app-sidebar');
  const main = document.getElementById('main-content');
  if (!sidebar) return;
  if (window.innerWidth <= 900) {
    window.closeMobileSidebar();
  } else {
    sidebar.classList.toggle('collapsed');
    if (main) main.classList.toggle('sidebar-collapsed-main');
    const isCollapsed = sidebar.classList.contains('collapsed');
    localStorage.setItem('sidebar_collapsed', isCollapsed ? 'true' : 'false');
  }
};

if (sidebarToggleBtn) {
  sidebarToggleBtn.addEventListener('click', window.toggleDesktopSidebar);
}
if (mobileMenuBtn) {
  mobileMenuBtn.addEventListener('click', window.toggleMobileSidebar);
  mobileMenuBtn.addEventListener('touchstart', window.toggleMobileSidebar, { passive: false });
}
if (sidebarBackdrop) {
  sidebarBackdrop.addEventListener('click', window.closeMobileSidebar);
  sidebarBackdrop.addEventListener('touchstart', window.closeMobileSidebar, { passive: true });
}

document.querySelectorAll('.sidebar-nav-item').forEach(item => {
  item.addEventListener('click', () => {
    if (window.innerWidth <= 900) {
      window.closeMobileSidebar();
    }
  });
});
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
const galleryPanel = document.getElementById('gallery-panel');
const galleryOverlay = document.getElementById('gallery-overlay');
const btnGalleryToggle = document.getElementById('btn-gallery-toggle');
const btnGalleryClose = document.getElementById('btn-gallery-close');
const btnProfile = document.getElementById('btn-profile');
const sectionGallery = document.getElementById('section-gallery');
const sectionProfile = document.getElementById('section-profile');
const isAdmin = document.body.getAttribute('data-is-admin') === 'true';
let keysData = [];
let currentKeyIndex = 0;
let persistentImages = [];
let usersData = [];
let geminiAccountsData = [];
let currentGeminiProfileIndex = 0;
let isGenerating = false;
let currentAbortController = null;
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
const pageTitleHeading = document.getElementById('page-title-heading');

if (sidebarToggleBtn && appSidebar && mainContent) {
  if (localStorage.getItem('sidebar_collapsed') === 'true') {
    appSidebar.classList.add('collapsed');
    mainContent.classList.add('sidebar-collapsed-main');
  }

  sidebarToggleBtn.addEventListener('click', () => {
    appSidebar.classList.toggle('collapsed');
    mainContent.classList.toggle('sidebar-collapsed-main');
    const isCollapsed = appSidebar.classList.contains('collapsed');
    localStorage.setItem('sidebar_collapsed', isCollapsed ? 'true' : 'false');
  });
}

if (navStudio) {
  navStudio.addEventListener('click', () => switchPage('studio'));
}
if (navDashboard) {
  navDashboard.addEventListener('click', () => switchPage('dashboard'));
}
if (btnGalleryToggle) {
  btnGalleryToggle.addEventListener('click', () => switchPage('gallery'));
}
if (btnProfile) {
  btnProfile.addEventListener('click', () => switchPage('profile'));
}

function switchPage(page) {
  if (navStudio) navStudio.classList.remove('active');
  if (navDashboard) navDashboard.classList.remove('active');
  if (btnGalleryToggle) btnGalleryToggle.classList.remove('active');
  if (btnProfile) btnProfile.classList.remove('active');

  if (sectionStudio) sectionStudio.classList.remove('active');
  if (sectionDashboard) sectionDashboard.classList.remove('active');
  if (sectionGallery) sectionGallery.classList.remove('active');
  if (sectionProfile) sectionProfile.classList.remove('active');

  if (page === 'studio') {
    if (navStudio) navStudio.classList.add('active');
    if (sectionStudio) sectionStudio.classList.add('active');
    if (pageTitleHeading) pageTitleHeading.innerHTML = '<i class="fa-solid fa-wand-magic-sparkles"></i> <h2>Stüdyo</h2>';
    fetchImages();
  } else if (page === 'gallery') {
    if (btnGalleryToggle) btnGalleryToggle.classList.add('active');
    if (sectionGallery) sectionGallery.classList.add('active');
    if (pageTitleHeading) pageTitleHeading.innerHTML = '<i class="fa-solid fa-images"></i> <h2>Görsel Arşivi</h2>';
    fetchImages();
  } else if (page === 'dashboard' && isAdmin) {
    if (navDashboard) navDashboard.classList.add('active');
    if (sectionDashboard) sectionDashboard.classList.add('active');
    if (pageTitleHeading) pageTitleHeading.innerHTML = '<i class="fa-solid fa-sliders"></i> <h2>Yönetim Paneli</h2>';
    fetchKeys();
    fetchGeminiAccounts();
    loadChatGptAccounts();
    loadCopilotAccounts();
    fetchUsers();
    fetchImages();
  } else if (page === 'profile') {
    if (btnProfile) btnProfile.classList.add('active');
    if (sectionProfile) sectionProfile.classList.add('active');
    if (pageTitleHeading) pageTitleHeading.innerHTML = '<i class="fa-solid fa-user-gear"></i> <h2>Bilgileri Güncelle</h2>';
    loadProfileData();
  }
}
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
  modelSelect.dispatchEvent(new Event('change'));
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
if (generatorForm) generatorForm.addEventListener('submit', handleGenerate);
if (btnGenerate) {
  btnGenerate.addEventListener('click', (e) => {
    if (isGenerating) {
      e.preventDefault();
      cancelGeneration();
    }
  });
}
if (btnRetry) {
  btnRetry.addEventListener('click', () => {
    if (canvasError) canvasError.style.display = 'none';
    if (canvasPlaceholder) canvasPlaceholder.style.display = 'flex';
  });
}

function resetToInitialState(isSuccess = false) {
  isGenerating = false;
  currentAbortController = null;

  if (btnGenerate) {
    btnGenerate.disabled = false;
    btnGenerate.classList.remove('btn-cancel');
    if (btnLabel) {
      btnLabel.innerHTML = '<i class="fa-solid fa-bolt-lightning"></i> Oluştur';
      btnLabel.style.display = 'flex';
    }
    if (btnLoader) btnLoader.style.display = 'none';
  }

  if (promptInput) promptInput.disabled = false;
  if (canvasLoading) canvasLoading.style.display = 'none';

  if (!isSuccess) {
    if (canvasPlaceholder) canvasPlaceholder.style.display = 'flex';
    if (canvasSuccess) canvasSuccess.style.display = 'none';
    if (canvasError) canvasError.style.display = 'none';
    if (loadingStatus) loadingStatus.textContent = '';
  }
}

async function cancelGeneration() {
  if (currentAbortController) {
    try { currentAbortController.abort(); } catch {}
    currentAbortController = null;
  }
  try {
    await fetch('/api/cancel', { method: 'POST' });
  } catch {}
  resetToInitialState(false);
  showToast('Üretim işlemi durduruldu ve başlangıç konumuna geçildi.', 'info');
}

async function handleGenerate(e) {
  if (e) e.preventDefault();

  if (isGenerating) {
    await cancelGeneration();
    return;
  }

  const prompt = promptInput.value.trim();
  const ratioEl = document.querySelector('input[name="ratio"]:checked');
  const ratio = ratioEl ? ratioEl.value : '1:1';
  if (!prompt) { showToast('Lütfen bir görsel tarifi girin.', 'error'); return; }

  const selectedModel = modelSelect.value;

  if (selectedModel === 'triple-ai') {
    await handleTripleStreamGenerate(prompt, ratio, styleSelect.value);
    return;
  }

  isGenerating = true;
  currentAbortController = new AbortController();

  btnGenerate.disabled = false;
  btnGenerate.classList.add('btn-cancel');
  if (btnLabel) {
    btnLabel.innerHTML = '<i class="fa-solid fa-xmark"></i> İptal Et';
    btnLabel.style.display = 'flex';
  }
  if (btnLoader) btnLoader.style.display = 'none';

  if (promptInput) promptInput.disabled = true;
  if (canvasPlaceholder) canvasPlaceholder.style.display = 'none';
  if (canvasSuccess) canvasSuccess.style.display = 'none';
  if (canvasError) canvasError.style.display = 'none';
  if (canvasLoading) canvasLoading.style.display = 'flex';

  if (selectedModel.startsWith('gemini-') || selectedModel.startsWith('chatgpt-') || selectedModel.startsWith('copilot-')) {
    loadingStatus.textContent = '🤖 Selenium tarayıcı otomasyonu çalışıyor…';
  } else {
    loadingStatus.textContent = 'API sunucularına bağlanılıyor…';
  }

  let isSuccess = false;
  try {
    const res = await fetch('/api/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: currentAbortController.signal,
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
      isSuccess = true;
      addStudioImageToFeed(data.image, data.modelUsed, data.keyUsedLabel, true);
      showToast('Görsel başarıyla üretildi!');
      await fetchImages();
      if (isAdmin) await fetchKeys();
    }
  } catch (err) {
    if (err.name === 'AbortError') {
      return;
    }
    if (canvasLoading) canvasLoading.style.display = 'none';
    if (canvasError) canvasError.style.display = 'flex';
    if (errorMessage) errorMessage.textContent = err.message;
    showToast(err.message, 'error');
  } finally {
    resetToInitialState(isSuccess);
  }
}

async function handleTripleStreamGenerate(prompt, ratio, style) {
  isGenerating = true;
  currentAbortController = new AbortController();

  btnGenerate.disabled = false;
  btnGenerate.classList.add('btn-cancel');
  if (btnLabel) {
    btnLabel.innerHTML = '<i class="fa-solid fa-xmark"></i> İptal Et';
    btnLabel.style.display = 'flex';
  }
  if (btnLoader) btnLoader.style.display = 'none';

  if (promptInput) promptInput.disabled = true;
  if (canvasPlaceholder) canvasPlaceholder.style.display = 'none';
  if (canvasLoading) canvasLoading.style.display = 'none';
  if (canvasError) canvasError.style.display = 'none';

  const feedList = document.getElementById('studio-feed-list');
  if (!feedList) return;
  feedList.innerHTML = '';

  if (canvasSuccess) canvasSuccess.style.display = 'flex';

  const wrapper = document.createElement('div');
  wrapper.style.width = '100%';
  wrapper.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; flex-wrap: wrap; gap: 10px;">
      <h4 style="color: #fff; margin: 0; font-size: 1rem;"><i class="fa-solid fa-layer-group" style="color: #f59e0b;"></i> Üçlü Üretim Akışı (Gemini + ChatGPT + Copilot)</h4>
      <div id="triple-stream-actions"></div>
    </div>
    <div class="triple-stream-grid" id="triple-cards-grid">
      <div class="triple-stream-card" id="card-site-gemini">
        <div style="width:100%; height:240px; background: rgba(0,0,0,0.3); border-radius:10px; display:flex; flex-direction:column; justify-content:center; align-items:center; gap:10px;">
          <i class="fa-solid fa-circle-notch fa-spin" style="font-size:2rem; color:var(--color-primary);"></i>
          <span style="font-size:0.85rem; color:#aaa;">Google Gemini Üretiliyor...</span>
        </div>
        <h5 style="margin-top:12px; color:#fff;"><i class="fa-brands fa-google" style="color:#4285f4;"></i> Google Gemini</h5>
      </div>
      <div class="triple-stream-card" id="card-site-chatgpt">
        <div style="width:100%; height:240px; background: rgba(0,0,0,0.3); border-radius:10px; display:flex; flex-direction:column; justify-content:center; align-items:center; gap:10px;">
          <i class="fa-solid fa-circle-notch fa-spin" style="font-size:2rem; color:#10a37f;"></i>
          <span style="font-size:0.85rem; color:#aaa;">ChatGPT (DALL-E) Üretiliyor...</span>
        </div>
        <h5 style="margin-top:12px; color:#fff;"><i class="fa-solid fa-brain" style="color:#10a37f;"></i> ChatGPT (DALL-E)</h5>
      </div>
      <div class="triple-stream-card" id="card-site-copilot">
        <div style="width:100%; height:240px; background: rgba(0,0,0,0.3); border-radius:10px; display:flex; flex-direction:column; justify-content:center; align-items:center; gap:10px;">
          <i class="fa-solid fa-circle-notch fa-spin" style="font-size:2rem; color:#00a4ef;"></i>
          <span style="font-size:0.85rem; color:#aaa;">Microsoft Copilot Üretiliyor...</span>
        </div>
        <h5 style="margin-top:12px; color:#fff;"><i class="fa-brands fa-microsoft" style="color:#00a4ef;"></i> Microsoft Copilot</h5>
      </div>
    </div>
  `;
  feedList.appendChild(wrapper);

  const succeededImages = [];
  let groupId = null;

  try {
    const url = `/api/generate-triple-stream?prompt=${encodeURIComponent(prompt)}&aspectRatio=${encodeURIComponent(ratio)}&style=${encodeURIComponent(style)}`;
    const response = await fetch(url, { signal: currentAbortController.signal });
    if (!response.ok) {
      throw new Error("Üçlü üretim servisine bağlanılamadı.");
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split('\n\n');
      buffer = lines.pop() || '';

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          try {
            const data = JSON.parse(line.substring(6));
            if (data.type === 'start') {
              groupId = data.payload.groupId;
            } else if (data.type === 'progress') {
              const item = data.payload;
              const card = document.getElementById(`card-site-${item.site}`);
              if (card) {
                if (item.status === 'success') {
                  card.classList.add('completed');
                  const streamDownloadName = getFormattedDownloadFilename(item.image, item.modelUsed, item.site);
                  card.innerHTML = `
                    <img src="${item.image}" alt="${item.site}" class="triple-stream-img clickable-img" title="Tam ekran görüntülemek için tıklayın">
                    <h5 style="margin-top:10px; color:#fff;">${item.modelUsed || item.site.toUpperCase()}</h5>
                    <span style="font-size:0.78rem; color:#aaa; margin-bottom:8px;">${item.keyUsedLabel || ''}</span>
                    <a href="${item.image}" download="${streamDownloadName}" class="action-btn" style="width:100%; text-align:center; padding:6px; font-size:0.82rem;">
                      <i class="fa-solid fa-download"></i> İndir
                    </a>
                  `;
                  const img = card.querySelector('img');
                  if (img) {
                    img.addEventListener('click', () => {
                      openFullscreenLightbox(item.image, prompt, item.modelUsed, item.site);
                    });
                  }
                  succeededImages.push(item);
                  showToast(`${item.site.toUpperCase()} görseli üretildi ve eklendi!`);
                } else {
                  card.classList.add('failed');
                  card.innerHTML = `
                    <div style="width:100%; height:240px; background: rgba(239,68,68,0.1); border-radius:10px; display:flex; flex-direction:column; justify-content:center; align-items:center; gap:8px; padding:12px; text-align:center;">
                      <i class="fa-solid fa-triangle-exclamation" style="font-size:2rem; color:var(--color-danger);"></i>
                      <span style="font-size:0.85rem; color:#ff8888; font-weight:600;">${item.site.toUpperCase()} Başarısız</span>
                      <span style="font-size:0.75rem; color:#ccc;">${item.error === 'login_required' ? 'Oturum Açılmamış' : (item.error || 'Limit/Bağlantı hatası')}</span>
                    </div>
                    <h5 style="margin-top:10px; color:#aaa;">${item.site.toUpperCase()}</h5>
                  `;
                }
              }
            } else if (data.type === 'complete') {
              const payload = data.payload;
              const actionsContainer = document.getElementById('triple-stream-actions');
              if (actionsContainer && succeededImages.length > 0) {
                const btnBulkDownload = document.createElement('button');
                btnBulkDownload.className = 'action-btn primary-btn';
                btnBulkDownload.innerHTML = `<i class="fa-solid fa-file-zipper"></i> Toplu İndir (${succeededImages.length} Resim + Prompt TXT)`;
                btnBulkDownload.onclick = () => downloadTripleZip(succeededImages, prompt, groupId || 'multi');
                actionsContainer.appendChild(btnBulkDownload);
              }
              showToast(`Üçlü üretim tamamlandı! (${succeededImages.length}/${succeededImages.length + (payload.failures?.length || 0)} görsel başarılı)`);
              await fetchImages();
            }
          } catch (e) { console.error('SSE Error', e); }
        }
      }
    }
  } catch (err) {
    if (err.name !== 'AbortError') {
      showToast(err.message, 'error');
    }
  } finally {
    resetToInitialState(succeededImages.length > 0);
  }
}

function getModelTagFromItem(item) {
  if (!item) return 'AI_Gorsel';
  const src = (((item.sourceSite || '') + ' ' + (item.model || '') + ' ' + (item.image || '') + ' ' + (item.folder || '')).toLowerCase());
  if (src.includes('copilot')) return 'Microsoft_Copilot';
  if (src.includes('gemini')) return 'Google_Gemini';
  if (src.includes('chatgpt') || src.includes('dalle') || src.includes('dall-e')) return 'ChatGPT_DALLE';
  if (src.includes('flux') || src.includes('pollinations') || src.includes('free')) return 'FLUX_Realism';
  if (src.includes('stability') || src.includes('sdxl') || src.includes('ultra') || src.includes('core')) return 'Stability_AI';
  if (item.model) return String(item.model).replace(/[^a-zA-Z0-9_-]/g, '_');
  return 'AI_Gorsel';
}

function getFormattedDownloadFilename(imagePath, modelName = '', site = '') {
  let modelTag = getModelTagFromItem({ model: modelName, sourceSite: site, image: imagePath });
  let baseName = imagePath ? imagePath.split('/').pop() : '';
  if (!baseName) baseName = `gorsel_${Date.now()}.png`;
  if (!baseName.includes('.')) baseName += '.png';

  if (baseName.startsWith('mega-image-studio-') || baseName.startsWith('melikgazi-')) {
    return `MegaImageStudio_${modelTag}_${baseName.replace(/^(mega-image-studio-|melikgazi-)/, '')}`;
  }
  return `MegaImageStudio_${modelTag}_${baseName}`;
}

async function downloadTripleZip(images, promptText, groupId) {
  if (!images || images.length === 0) return;
  try {
    const zip = new JSZip();
    showToast('Zip arşivi oluşturuluyor...');
    for (let i = 0; i < images.length; i++) {
      const item = images[i];
      let modelTag = getModelTagFromItem(item);
      let filename = `${i + 1}_${modelTag}.png`;
      const resp = await fetch(item.image);
      const blob = await resp.blob();
      zip.file(filename, blob);
    }
    zip.file("prompt.txt", promptText || "Prompt bilgisi bulunamadı.");
    const zipBlob = await zip.generateAsync({ type: "blob" });
    const downloadUrl = URL.createObjectURL(zipBlob);
    const a = document.createElement("a");
    a.href = downloadUrl;
    a.download = `uclu_uretim_${groupId || Date.now()}.zip`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(downloadUrl);
    showToast("Toplu indirme başarılı!");
  } catch (err) {
    showToast("Toplu indirmede hata: " + err.message, "error");
  }
}

function addStudioImageToFeed(imageUrl, modelUsed, keyLabel, prepend = true) {
  const feedList = document.getElementById('studio-feed-list');
  if (!feedList) return;
  feedList.innerHTML = '';
  const card = document.createElement('div');
  card.className = 'studio-feed-item';
  const downloadFilename = getFormattedDownloadFilename(imageUrl, modelUsed, '');
  card.innerHTML = `
    <div class="studio-feed-img-wrap">
      <img src="${imageUrl}" alt="Üretilen görsel" class="clickable-img" title="Tam ekran görüntülemek için tıklayın">
    </div>
    <div class="result-bar">
      <span class="result-tag"><i class="fa-solid fa-microchip"></i> ${modelUsed || 'AI Model'}</span>
      <span class="result-tag"><i class="fa-solid fa-key"></i> ${keyLabel || 'Anahtar'}</span>
      <a class="result-tag download-tag" href="${imageUrl}" download="${downloadFilename}">
        <i class="fa-solid fa-download"></i> İndir
      </a>
    </div>
  `;
  const imgInCard = card.querySelector('img');
  if (imgInCard) {
    imgInCard.addEventListener('click', () => {
      openFullscreenLightbox(imageUrl, promptInput ? promptInput.value : '', modelUsed);
    });
  }
  feedList.appendChild(card);
  if (typeof canvasPlaceholder !== 'undefined' && canvasPlaceholder) canvasPlaceholder.style.display = 'none';
  if (typeof canvasLoading !== 'undefined' && canvasLoading) canvasLoading.style.display = 'none';
  if (typeof canvasError !== 'undefined' && canvasError) canvasError.style.display = 'none';
  if (typeof canvasSuccess !== 'undefined' && canvasSuccess) canvasSuccess.style.display = 'flex';
}

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

  const groupedImages = [];
  const groupMap = new Map();

  persistentImages.forEach(item => {
    if (item.groupId) {
      if (!groupMap.has(item.groupId)) {
        const groupObj = {
          isGroup: true,
          groupId: item.groupId,
          prompt: item.prompt,
          createdAt: item.createdAt,
          items: []
        };
        groupMap.set(item.groupId, groupObj);
        groupedImages.push(groupObj);
      }
      groupMap.get(item.groupId).items.push(item);
    } else {
      groupedImages.push(item);
    }
  });

  let filteredList = [];
  if (currentGalleryFolder === 'all') {
    filteredList = groupedImages;
  } else if (currentGalleryFolder === 'triple') {
    filteredList = groupedImages.filter(g => g.isGroup);
  } else {
    filteredList = persistentImages.filter(it => it.folder === currentGalleryFolder && !it.groupId);
  }

  if (filteredList.length === 0) {
    const folderLabel = currentGalleryFolder === 'all' ? '' : ` (${currentGalleryFolder.toUpperCase()} klasörü)`;
    galleryGrid.innerHTML = `<div class="gallery-empty-panel"><p>Bu bölümde${folderLabel} henüz görsel bulunmuyor.</p></div>`;
    return;
  }

  galleryGrid.innerHTML = '';

  filteredList.forEach(groupOrItem => {
    const div = document.createElement('div');
    div.className = 'gallery-item';
    div.style.aspectRatio = '1 / 1';
    if (groupOrItem.isGroup) {
       div.innerHTML = `
         <div style="position: absolute; top:0; left:0; width:100%; height:100%; display: grid; grid-template-columns: 1fr 1fr 1fr; grid-template-rows: 1fr;">
           ${groupOrItem.items.map((it, idx) => {
              if (idx > 2) return '';
              return `<img src="${it.image}" alt="Üretilen görsel" style="width:100%; height:100%; object-fit:cover; opacity: 0.85;">`;
           }).join('')}
         </div>
         <div class="gallery-folder-badge badge-gemini" style="background: linear-gradient(135deg, #10b981, #3b82f6);"><i class="fa-solid fa-layer-group"></i> Üçlü Üretim</div>
         <div class="gallery-overlay" style="z-index: 10; display:flex; flex-direction:column; justify-content:flex-end; align-items:center; padding: 10px;">
             <span style="font-size: 0.8rem; margin-bottom: 5px; text-align: center;">${(String(groupOrItem.prompt || '')).substring(0,60)}${(String(groupOrItem.prompt || '')).length > 60 ? '...' : ''}</span>
         </div>
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
         openSingleImageModal(item);
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

function openFullscreenLightbox(imageSrc, caption = '', modelName = '', site = '') {
  const modal = document.getElementById('fullscreen-image-modal');
  const imgEl = document.getElementById('fullscreen-image-img');
  const captionEl = document.getElementById('fullscreen-image-caption');
  const btnDownload = document.getElementById('btn-fullscreen-download');

  if (!modal || !imgEl) return;

  imgEl.src = imageSrc;
  if (captionEl) captionEl.textContent = caption ? (caption.startsWith('Prompt:') ? caption : "Prompt: " + caption) : '';

  if (btnDownload) {
    btnDownload.href = imageSrc;
    btnDownload.download = getFormattedDownloadFilename(imageSrc, modelName, site);
  }

  modal.style.display = 'flex';
}

function closeFullscreenLightbox() {
  const modal = document.getElementById('fullscreen-image-modal');
  if (modal) modal.style.display = 'none';
}

const btnFullscreenClose = document.getElementById('btn-fullscreen-close');
if (btnFullscreenClose) {
  btnFullscreenClose.addEventListener('click', closeFullscreenLightbox);
}

const fullscreenModal = document.getElementById('fullscreen-image-modal');
if (fullscreenModal) {
  fullscreenModal.addEventListener('click', (e) => {
    if (e.target === fullscreenModal || e.target.classList.contains('fullscreen-lightbox-content')) {
      closeFullscreenLightbox();
    }
  });
}

document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape') {
    closeFullscreenLightbox();
  }
});

function openTripleGroupModal(groupId, sourceImages = persistentImages) {
  const group = sourceImages.filter(i => i.groupId === groupId);
  if (!group || group.length === 0) return;
  const promptEl = document.getElementById('triple-group-prompt');
  if (promptEl) promptEl.textContent = "Prompt: " + group[0].prompt;
  const container = document.getElementById('triple-group-container');
  if (container) {
    container.innerHTML = '';
    group.forEach(res => {
      const downloadFilename = getFormattedDownloadFilename(res.image, res.model, res.sourceSite);
      const col = document.createElement('div');
      col.style.cssText = "background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 12px; padding: 10px; display: flex; flex-direction: column;";
      col.innerHTML = `
        <img src="${res.image}" alt="Generated" class="clickable-img" style="width: 100%; height: 250px; object-fit: cover; border-radius: 8px; margin-bottom: 10px;" title="Tam ekran görüntülemek için tıklayın">
        <h6 style="color: #fff; margin-bottom: 5px;">${res.model || res.sourceSite}</h6>
        <p style="font-size: 0.8rem; color: #aaa; margin-bottom: 15px; flex: 1;">${(res.sourceSite || '').toUpperCase()}</p>
        <a href="${res.image}" download="${downloadFilename}" class="action-btn" style="text-align: center; text-decoration: none; padding: 8px;">
          <i class="fa-solid fa-download"></i> İndir
        </a>
      `;
      const imgInCol = col.querySelector('img');
      if (imgInCol) {
        imgInCol.addEventListener('click', () => {
          openFullscreenLightbox(res.image, group[0]?.prompt || '', res.model, res.sourceSite);
        });
      }
      container.appendChild(col);
    });
  }
  const modal = document.getElementById('triple-group-modal');
  if (modal) modal.style.display = 'flex';
  const btnDownloadAll = document.getElementById('btn-triple-group-download-all');
  if (btnDownloadAll) {
    btnDownloadAll.innerHTML = `<i class="fa-solid fa-file-zipper"></i> Toplu İndir (${group.length} Resim + Prompt TXT)`;
    btnDownloadAll.onclick = async () => {
      try {
        const zip = new JSZip();
        btnDownloadAll.disabled = true;
        btnDownloadAll.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Hazırlanıyor...';
        for (let i = 0; i < group.length; i++) {
          const res = group[i];
          let modelTag = getModelTagFromItem(res);
          let filename = `${i + 1}_${modelTag}.png`;
          const response = await fetch(res.image);
          const blob = await response.blob();
          zip.file(filename, blob);
        }

        const promptText = (group[0] && group[0].prompt) || "Prompt bilgisi mevcut değil.";
        zip.file("prompt.txt", promptText);
        const zipBlob = await zip.generateAsync({ type: "blob" });
        const downloadUrl = URL.createObjectURL(zipBlob);
        const a = document.createElement("a");
        a.href = downloadUrl;
        a.download = `uclu_uretim_${groupId}.zip`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(downloadUrl);
        showToast("Toplu indirme başarılı!");
      } catch (err) {
        console.error(err);
        showToast("Toplu indirme sırasında bir hata oluştu.", "error");
      } finally {
        btnDownloadAll.disabled = false;
        btnDownloadAll.innerHTML = `<i class="fa-solid fa-file-zipper"></i> Toplu İndir (${group.length} Resim + Prompt TXT)`;
      }
    };
  }
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
function openSingleImageModal(item) {
  const modal = document.getElementById('single-image-modal');
  if (!modal) return;
  const promptEl = document.getElementById('single-image-prompt');
  if (promptEl) promptEl.textContent = "Prompt: " + (item.prompt || item.model || '');
  const container = document.getElementById('single-image-container');
  if (container) {
    container.innerHTML = `
      <div style="background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 12px; padding: 10px; display: flex; flex-direction: column; width: 100%;">
        <img src="${item.image}" alt="Generated" class="clickable-img" style="width: 100%; max-height: 60vh; object-fit: contain; border-radius: 8px; margin-bottom: 10px;" title="Tam ekran görüntülemek için tıklayın">
        <h6 style="color: #fff; margin-bottom: 5px; text-align: center;">${item.model || item.sourceSite || ''}</h6>
      </div>
    `;
    const imgInContainer = container.querySelector('img');
    if (imgInContainer) {
      imgInContainer.addEventListener('click', () => {
        openFullscreenLightbox(item.image, item.prompt || item.model || '', item.model, item.sourceSite);
      });
    }
  }
  const btnDownload = document.getElementById('btn-single-image-download');
  if (btnDownload) {
    btnDownload.href = item.image;
    btnDownload.download = getFormattedDownloadFilename(item.image, item.model, item.sourceSite);
  }
  modal.style.display = 'flex';
}
const btnSingleImageClose = document.getElementById('btn-single-image-close');
if (btnSingleImageClose) {
  btnSingleImageClose.addEventListener('click', () => {
    document.getElementById('single-image-modal').style.display = 'none';
  });
}
const btnSingleImageOk = document.getElementById('btn-single-image-ok');
if (btnSingleImageOk) {
  btnSingleImageOk.addEventListener('click', () => {
    document.getElementById('single-image-modal').style.display = 'none';
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
const dashSubtabsNav = document.getElementById('dash-subtabs-nav');
if (dashSubtabsNav) {
  dashSubtabsNav.addEventListener('click', (e) => {
    const tabBtn = e.target.closest('.dash-subtab-btn');
    if (!tabBtn) return;
    const targetTab = tabBtn.getAttribute('data-dash-tab');
    if (!targetTab) return;

    dashSubtabsNav.querySelectorAll('.dash-subtab-btn').forEach(btn => btn.classList.remove('active'));
    tabBtn.classList.add('active');

    document.querySelectorAll('.dash-subpanel').forEach(panel => {
      panel.classList.remove('active');
    });

    const activePanel = document.getElementById(`dash-subpanel-${targetTab}`);
    if (activePanel) activePanel.classList.add('active');
  });
}

const accModelTabsNav = document.getElementById('acc-model-tabs-nav');
if (accModelTabsNav) {
  accModelTabsNav.addEventListener('click', (e) => {
    const tabBtn = e.target.closest('.acc-model-tab');
    if (!tabBtn) return;
    const targetModel = tabBtn.getAttribute('data-acc-model');
    if (!targetModel) return;

    accModelTabsNav.querySelectorAll('.acc-model-tab').forEach(btn => btn.classList.remove('active'));
    tabBtn.classList.add('active');

    document.querySelectorAll('.acc-model-panel').forEach(panel => {
      panel.style.display = 'none';
      panel.classList.remove('active');
    });

    const activePanel = document.getElementById(`acc-model-panel-${targetModel}`);
    if (activePanel) {
      activePanel.style.display = 'block';
      activePanel.classList.add('active');
    }
  });
}

if (btnResetLimits) {
  btnResetLimits.addEventListener('click', async () => {
    if (!confirm('Tüm Stability AI anahtarlarının pasifliğini sıfırlamak istediğinize emin misiniz?')) return;
    try {
      const res = await fetch('/api/keys/reset', { method: 'POST' });
      const data = await res.json();
      if (data.success) {
        showToast('Stability AI anahtarları ve sayaçlar sıfırlandı!');
        fetchKeys();
      }
    } catch (err) { showToast('Hata: ' + err.message, 'error'); }
  });
}

const btnResetGeminiAccs = document.getElementById('btn-reset-gemini-accs');
if (btnResetGeminiAccs) {
  btnResetGeminiAccs.addEventListener('click', async () => {
    if (!confirm('Tüm Google Gemini hesaplarının pasifliğini sıfırlayıp aktif duruma getirmek istiyor musunuz?')) return;
    try {
      const res = await fetch('/api/gemini-accounts/reset', { method: 'POST' });
      if (res.ok) {
        showToast('Tüm Google Gemini hesapları aktif konuma getirildi!');
        fetchGeminiAccounts();
      }
    } catch (err) { showToast('Hata: ' + err.message, 'error'); }
  });
}

const btnResetChatgptAccs = document.getElementById('btn-reset-chatgpt-accs');
if (btnResetChatgptAccs) {
  btnResetChatgptAccs.addEventListener('click', async () => {
    if (!confirm('Tüm ChatGPT hesaplarının pasifliğini sıfırlayıp aktif duruma getirmek istiyor musunuz?')) return;
    try {
      const res = await fetch('/api/chatgpt-accounts/reset', { method: 'POST' });
      if (res.ok) {
        showToast('Tüm ChatGPT hesapları aktif konuma getirildi!');
        loadChatGptAccounts();
      }
    } catch (err) { showToast('Hata: ' + err.message, 'error'); }
  });
}

const btnResetCopilotAccs = document.getElementById('btn-reset-copilot-accs');
if (btnResetCopilotAccs) {
  btnResetCopilotAccs.addEventListener('click', async () => {
    if (!confirm('Tüm Microsoft Copilot hesaplarının pasifliğini sıfırlayıp aktif duruma getirmek istiyor musunuz?')) return;
    try {
      const res = await fetch('/api/copilot-accounts/reset', { method: 'POST' });
      if (res.ok) {
        showToast('Tüm Microsoft Copilot hesapları aktif konuma getirildi!');
        loadCopilotAccounts();
      }
    } catch (err) { showToast('Hata: ' + err.message, 'error'); }
  });
}
window.openEditModal = function(id, label, hasKey, status) {
  if (!editModal) return;
  editId.value = id;
  editLabel.value = label;
  editKey.value = ''; 
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
        <div style="min-width: 0; flex: 1; display: flex; align-items: center; gap: 4px; overflow: hidden;">
          <span class="key-slot">#${a.id}</span>
          <span class="key-label" title="${a.accountLabel}">${a.accountLabel}</span>
        </div>
        <span class="badge ${badgeClass}">${badgeText}</span>
      </div>
      <div class="key-masked">${a.profileName}</div>
      <div class="key-stats-row">
        <span>Son: <strong>${a.lastUsed || '—'}</strong></span>
      </div>
      <div style="display:flex; gap: 6px; margin-top: auto;">
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
        <div style="min-width: 0; flex: 1; display: flex; align-items: center; gap: 4px; overflow: hidden;">
          <span class="key-slot">#${a.id}</span>
          <span class="key-label" title="${a.accountLabel}">${a.accountLabel}</span>
        </div>
        <span class="badge ${badgeClass}">${badgeText}</span>
      </div>
      <div class="key-masked">${a.profileName}</div>
      <div class="key-stats-row"><span>Son: <strong>${a.lastUsed || '—'}</strong></span></div>
      <div style="display:flex; gap: 6px; margin-top: auto;">
        <button data-login-chatgpt="${a.id}" data-label="${safeLabel}" style="flex:1;"><i class="fa-solid fa-right-to-bracket"></i> Oturum Aç</button>
        <button data-edit-chatgpt="${a.id}" data-label="${safeLabel}" data-status="${a.status}" title="Düzenle"><i class="fa-solid fa-pen"></i></button>
        <button data-del-chatgpt="${a.id}" style="color: var(--color-danger);" title="Sil"><i class="fa-solid fa-trash"></i></button>
      </div>
    `;
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

let isAutoGenRunning = false;

function incrementEmailAlias(email) {
  if (!email || !email.includes('@')) return email;
  const parts = email.split('@');
  const user = parts[0];
  const domain = parts[1];

  if (user.includes('+')) {
    const plusParts = user.split('+');
    const baseUser = plusParts[0];
    const numStr = plusParts[1];
    const num = parseInt(numStr, 10);
    if (!isNaN(num)) {
      return `${baseUser}+${num + 1}@${domain}`;
    }
  }
  return `${user}+1@${domain}`;
}

const btnStartAutoChatgptGen = document.getElementById('btn-start-auto-chatgpt-gen');
if (btnStartAutoChatgptGen) {
  btnStartAutoChatgptGen.addEventListener('click', async () => {
    if (isAutoGenRunning) {
      isAutoGenRunning = false;
      btnStartAutoChatgptGen.innerHTML = '<i class="fa-solid fa-play"></i> Otomatik Üretimi Başlat';
      btnStartAutoChatgptGen.style.background = 'linear-gradient(135deg, #10a37f, #059669)';
      showToast('Otomatik hesap üretici durduruldu.', 'info');
      return;
    }

    const emailInput = document.getElementById('auto-chatgpt-email-input');
    const loopToggle = document.getElementById('auto-chatgpt-loop-toggle');
    const email = emailInput ? emailInput.value.trim() : '';

    if (!email || !email.includes('@')) {
      showToast('Lütfen geçerli bir e-posta adresi girin.', 'error');
      return;
    }

    isAutoGenRunning = true;
    btnStartAutoChatgptGen.innerHTML = '<i class="fa-solid fa-stop"></i> Durdur';
    btnStartAutoChatgptGen.style.background = 'linear-gradient(135deg, #ef4444, #dc2626)';

    const isLoopMode = loopToggle ? loopToggle.checked : false;

    await runAutoGeneratorStep(email, isLoopMode);
  });
}

async function runAutoGeneratorStep(currentEmail, isLoopMode) {
  if (!isAutoGenRunning) return;

  showToast(`⚡ ${currentEmail} adresi ile hesap oluşturuluyor ve robot başlatılıyor...`, 'info');

  try {
    const res = await fetch('/api/chatgpt-accounts/auto-create-custom-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: currentEmail })
    });
    const data = await res.json();

    if (res.ok && data.success) {
      showToast(`🎉 ${currentEmail} hesabı oluşturuldu ve doğrulama robotu çalıştı!`, 'success');
      loadChatGptAccounts();

      if (isLoopMode && isAutoGenRunning) {
        const nextEmail = incrementEmailAlias(currentEmail);
        const emailInput = document.getElementById('auto-chatgpt-email-input');
        if (emailInput) emailInput.value = nextEmail;

        showToast(`🔄 Sonsuz Döngü: 4 saniye sonra ${nextEmail} hesabı açılacak...`, 'info');
        setTimeout(() => {
          if (isAutoGenRunning) {
            runAutoGeneratorStep(nextEmail, true);
          }
        }, 4000);
      } else {
        isAutoGenRunning = false;
        const btn = document.getElementById('btn-start-auto-chatgpt-gen');
        if (btn) {
          btn.innerHTML = '<i class="fa-solid fa-play"></i> Otomatik Üretimi Başlat';
          btn.style.background = 'linear-gradient(135deg, #10a37f, #059669)';
        }
      }
    } else {
      showToast('Hata: ' + (data.error || 'Hesap oluşturulamadı'), 'error');
      stopAutoGeneratorUI();
    }
  } catch (err) {
    showToast('Bağlantı hatası: ' + err.message, 'error');
    stopAutoGeneratorUI();
  }
}

function stopAutoGeneratorUI() {
  isAutoGenRunning = false;
  const btn = document.getElementById('btn-start-auto-chatgpt-gen');
  if (btn) {
    btn.innerHTML = '<i class="fa-solid fa-play"></i> Otomatik Üretimi Başlat';
    btn.style.background = 'linear-gradient(135deg, #10a37f, #059669)';
  }
}
const btnAddChatgptTempmail = document.getElementById('btn-add-chatgpt-tempmail');
if (btnAddChatgptTempmail) {
  btnAddChatgptTempmail.addEventListener('click', async () => {
    btnAddChatgptTempmail.disabled = true;
    btnAddChatgptTempmail.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i> Temp-Mail Başlatılıyor...';
    showToast('⚡ Temp-Mail.org ile ChatGPT otomatik hesap üretimi başlatıldı...', 'info');

    try {
      const res = await fetch('/api/chatgpt-accounts/auto-create-tempmail', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      const data = await res.json();
      if (res.ok && data.success) {
        showToast(`🎉 ${data.message}`, 'success');
        setTimeout(() => { loadChatGptAccounts(); }, 2000);
      } else {
        showToast('Hata: ' + (data.error || 'Temp-Mail hesap oluşturulamadı'), 'error');
      }
    } catch (err) {
      showToast('Bağlantı Hatası: ' + err.message, 'error');
    } finally {
      btnAddChatgptTempmail.disabled = false;
      btnAddChatgptTempmail.innerHTML = '<i class="fa-solid fa-bolt"></i> ⚡ Temp-Mail ile Otomatik Hesap Oluştur';
    }
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
        <div style="min-width: 0; flex: 1; display: flex; align-items: center; gap: 4px; overflow: hidden;">
          <span class="key-slot">#${a.id}</span>
          <span class="key-label" title="${a.accountLabel}">${a.accountLabel}</span>
        </div>
        <span class="badge ${badgeClass}">${badgeText}</span>
      </div>
      <div class="key-masked">${a.profileName}</div>
      <div class="key-stats-row"><span>Son: <strong>${a.lastUsed || '—'}</strong></span></div>
      <div style="display:flex; gap: 6px; margin-top: auto;">
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
    const nextNum = keysData.length === 0 ? 1 : (Math.max(...keysData.map(k => k.id || 0)) + 1);
    const label = prompt('Yeni anahtar etiketi:', `Stability #${nextNum}`);
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
const profileForm = document.getElementById('profile-form');
const profileUsername = document.getElementById('profile-username');
const profileRole = document.getElementById('profile-role');
const profileDisplayName = document.getElementById('profile-displayName');
const profilePassword = document.getElementById('profile-password');
const profileSubmitBtn = profileForm ? profileForm.querySelector('button[type="submit"]') : null;
let initialProfileDisplayName = '';
let initialProfilePassword = '';

function updateProfileSubmitState() {
  if (!profileSubmitBtn) return;
  const currentName = profileDisplayName ? profileDisplayName.value.trim() : '';
  const currentPass = profilePassword ? profilePassword.value.trim() : '';
  const isChanged = (currentName !== initialProfileDisplayName) || (currentPass !== '');
  profileSubmitBtn.disabled = !isChanged;
}

if (profileDisplayName) profileDisplayName.addEventListener('input', updateProfileSubmitState);
if (profilePassword) profilePassword.addEventListener('input', updateProfileSubmitState);

async function loadProfileData() {
  try {
    const res = await fetch('/api/profile');
    if (!res.ok) throw new Error('Profil yüklenemedi');
    const data = await res.json();
    if (profileUsername) profileUsername.value = data.username || '';
    if (profileRole) profileRole.value = data.role || '';
    if (profileDisplayName) profileDisplayName.value = data.displayName || '';
    if (profilePassword) profilePassword.value = '';
    
    initialProfileDisplayName = data.displayName || '';
    initialProfilePassword = '';
    updateProfileSubmitState();
  } catch (err) {
    showToast(err.message, 'error');
  }
}

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
        initialProfileDisplayName = displayName;
        initialProfilePassword = '';
        updateProfileSubmitState();
        const topBarUserName = document.querySelector('.top-bar-right .user-name');
        if (topBarUserName) topBarUserName.textContent = displayName;
      }
    } catch (err) {
      showToast(err.message, 'error');
    }
  });
}
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
  const currentUserId = parseInt(document.body.getAttribute('data-user-id') || '0');
  usersData.forEach(u => {
    let badgeClass = u.role === 'Yönetici' ? 'badge-active' : 'badge-empty';
    let badgeText = u.role === 'Yönetici' ? 'Yönetici (Admin)' : 'Standart Kullanıcı';
    const card = document.createElement('div');
    card.className = 'key-card';
    const isCurrentAdmin = u.id === currentUserId;
    const canSeeImages = u.role !== 'Yönetici' || isCurrentAdmin;

    card.innerHTML = `
      <div class="key-card-top">
        <div><span class="key-slot">#${u.id}</span> <span class="key-label">${u.displayName}</span> <small style="color:var(--text-muted);">(@${u.username})</small></div>
        <span class="badge ${badgeClass}">${badgeText}</span>
      </div>
      <div class="key-stats-row" style="margin-top: 12px; margin-bottom: 12px;">
        <span>Üretilen Görsel Sayısı: <strong>${u.imageCount}</strong> adet</span>
      </div>
      <div style="display:flex; gap: 6px; flex-wrap: wrap;">
        ${canSeeImages ? `
          <button onclick="openUserImagesModal(${u.id}, '${u.displayName.replace(/'/g, "\\'")}')" style="flex:1;" title="Ürettiği görselleri gör">
            <i class="fa-solid fa-images"></i> Görseller (${u.imageCount})
          </button>
        ` : `
          <button disabled style="flex:1; opacity:0.55; cursor:not-allowed;" title="Diğer yöneticilerin ürettiği görseller görüntülenemez">
            <i class="fa-solid fa-shield-halved"></i> Diğer Yönetici
          </button>
        `}
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
const userEditModal = document.getElementById('user-edit-modal');
const userEditForm = document.getElementById('user-edit-form');
const userEditId = document.getElementById('user-edit-id');
const userEditDisplayName = document.getElementById('user-edit-displayName');
const userEditPassword = document.getElementById('user-edit-password');
const userEditRole = document.getElementById('user-edit-role');
const btnUserModalClose = document.getElementById('btn-user-modal-close');
const btnUserModalCancel = document.getElementById('btn-user-modal-cancel');
const userEditSubmitBtn = userEditForm ? userEditForm.querySelector('button[type="submit"]') : null;
let initialUserEditDisplayName = '';
let initialUserEditPassword = '';
let initialUserEditRole = '';

function updateUserEditSubmitState() {
  if (!userEditSubmitBtn) return;
  const currentName = userEditDisplayName ? userEditDisplayName.value.trim() : '';
  const currentPass = userEditPassword ? userEditPassword.value.trim() : '';
  const currentRole = userEditRole ? userEditRole.value : '';
  const isChanged = (currentName !== initialUserEditDisplayName) || (currentPass !== '') || (currentRole !== initialUserEditRole);
  userEditSubmitBtn.disabled = !isChanged;
}

if (userEditDisplayName) userEditDisplayName.addEventListener('input', updateUserEditSubmitState);
if (userEditPassword) userEditPassword.addEventListener('input', updateUserEditSubmitState);
if (userEditRole) userEditRole.addEventListener('change', updateUserEditSubmitState);

window.openUserEditModal = function(id, displayName, role) {
  if (!userEditModal) return;
  if (userEditId) userEditId.value = id;
  if (userEditDisplayName) userEditDisplayName.value = displayName;
  if (userEditPassword) userEditPassword.value = ''; 
  if (userEditRole) userEditRole.value = role;

  initialUserEditDisplayName = displayName || '';
  initialUserEditPassword = '';
  initialUserEditRole = role || '';
  updateUserEditSubmitState();

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
    const groupedImages = [];
    const groupMap = new Map();
    imgs.forEach(item => {
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
      div.style.aspectRatio = '1 / 1';
      if (groupOrItem.isGroup) {
         div.innerHTML = `
           <div style="position: absolute; top:0; left:0; width:100%; height:100%; display: grid; grid-template-columns: 1fr 1fr 1fr; grid-template-rows: 1fr;">
             ${groupOrItem.items.map((it, idx) => {
                if (idx > 2) return '';
                return '<img src="' + it.image + '" alt="Üretilen görsel" style="width:100%; height:100%; object-fit:cover; opacity: 0.8;">';
             }).join('')}
           </div>
           <div class="gallery-folder-badge badge-gemini" style="background: linear-gradient(135deg, #10b981, #3b82f6);"><i class="fa-solid fa-layer-group"></i> Çoklu Üretim</div>
           <div class="gallery-overlay" style="z-index: 10; display:flex; flex-direction:column; justify-content:flex-end; align-items:center; padding: 10px;">
               <span style="font-size: 0.8rem; margin-bottom: 5px; text-align: center;">${(String(groupOrItem.prompt || '')).substring(0,60)}${(String(groupOrItem.prompt || '')).length > 60 ? '...' : ''}</span>
           </div>
           <button class="btn-del-img" title="Sil" onclick="deleteGroupFromUserModal(event, '${groupOrItem.groupId}', ${userId})" style="z-index: 10;">
             <i class="fa-solid fa-trash-can"></i>
           </button>
         `;
         div.addEventListener('click', (e) => {
           if (e.target.closest('.btn-del-img')) return;
           openTripleGroupModal(groupOrItem.groupId, imgs); 
         });
      } else {
         const item = groupOrItem;
         const badgeText = item.folder === 'gemini' ? 'Gemini Web' : (item.folder === 'free' ? 'Ücretsiz' : (item.folder === 'stability' ? 'Stability AI' : (item.folder === 'chatgpt' ? 'ChatGPT' : (item.folder === 'copilot' ? 'Copilot' : 'Genel'))));
         const badgeClass = item.folder === 'gemini' ? 'badge-gemini' : (item.folder === 'free' ? 'badge-free' : (item.folder === 'chatgpt' ? 'badge-chatgpt' : (item.folder === 'copilot' ? 'badge-copilot' : 'badge-stability')));
         div.innerHTML = `
           <img src="${item.image}" alt="Üretilen görsel">
           <div class="gallery-folder-badge ${badgeClass}">${badgeText}</div>
           <div class="gallery-overlay">${item.model}</div>
           <button class="btn-del-img" title="Sil" onclick="deleteImageFromUserModal(event, ${item.id}, ${userId})">
             <i class="fa-solid fa-trash-can"></i>
           </button>
         `;
         div.addEventListener('click', (e) => {
           if (e.target.closest('.btn-del-img')) return;
           openSingleImageModal(item);
         });
      }
      userImagesContainer.appendChild(div);
    });
  }
  userImagesModal.style.display = 'flex';
};
window.deleteGroupFromUserModal = async function(e, groupId, userId) {
  e.stopPropagation();
  if (!confirm('Bu çoklu üretimi ve içindeki tüm görselleri silmek istiyor musunuz?')) return;
  const userObj = usersData.find(u => u.id === userId);
  const imgs = userObj ? userObj.images : [];
  const groupItems = imgs.filter(i => i.groupId === groupId);
  try {
    for (const item of groupItems) {
      await fetch(`/api/images/${item.id}`, { method: 'DELETE' });
    }
    showToast('Çoklu üretim silindi!');
    await fetchUsers();
    await fetchImages();
    const updatedUserObj = usersData.find(u => u.id === userId);
    if (updatedUserObj && userImagesModal.style.display === 'flex') {
      openUserImagesModal(userId, updatedUserObj.displayName);
    }
  } catch (err) {
    showToast('Silinirken hata oluştu');
  }
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
fetchImages();
if (isAdmin) {
  fetchKeys();
  fetchGeminiAccounts();
  loadChatGptAccounts();
  loadCopilotAccounts();
  fetchUsers();
}