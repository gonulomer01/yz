
// Theme Toggle Logic
function initTheme() {
  const savedTheme = localStorage.getItem('theme');
  if (savedTheme === 'light') {
    document.body.classList.add('light-mode');
  }
}
initTheme();

document.addEventListener('DOMContentLoaded', () => {
  updateNotificationBadge(notificationsArray.length);
  renderNotifications();
  checkActiveJobs();
  const themeToggleBtn = document.getElementById('theme-toggle-btn');
  
  if (themeToggleBtn) {
    // Set initial checkbox state based on body class
    themeToggleBtn.checked = document.body.classList.contains('light-mode');

    themeToggleBtn.addEventListener('change', (e) => {
      if (e.target.checked) {
        document.body.classList.add('light-mode');
        document.documentElement.classList.add('light-mode');
        localStorage.setItem('theme', 'light');
      } else {
        document.body.classList.remove('light-mode');
        document.documentElement.classList.remove('light-mode');
        localStorage.setItem('theme', 'dark');
      }
    });
  }
});

// Dropdown Toggle
function toggleUserDropdown(e) {
  e.stopPropagation();
  const dropdown = document.getElementById('user-dropdown-menu');
  const notifDropdown = document.getElementById('notification-dropdown-menu');
  if (notifDropdown) notifDropdown.style.display = 'none';
  if (dropdown) {
    if (dropdown.style.display === 'none' || dropdown.style.display === '') {
      dropdown.style.display = 'block';
    } else {
      dropdown.style.display = 'none';
    }
  }
}

document.addEventListener('click', function(e) {
  const dropdown = document.getElementById('user-dropdown-menu');
  if (dropdown && dropdown.style.display === 'block') {
    const container = document.querySelector('.user-badge-container');
    if (container && !container.contains(e.target)) {
      dropdown.style.display = 'none';
    }
  }
});

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
let currentUserModalId = null;
let geminiAccountsData = [];
let currentGeminiProfileIndex = 0;
let isGenerating = false;
let currentAbortController = null;
let currentJobId = null;
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
  currentJobId = null;

  if (btnGenerate) {
    btnGenerate.disabled = false;
    btnGenerate.classList.remove('btn-cancel');
    if (btnLabel) {
      btnLabel.innerHTML = '<i class="fa-solid fa-bolt-lightning"></i><span class="desktop-text"> Oluştur</span>';
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
    await fetch('/api/cancel', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ jobId: currentJobId })
    });
  } catch {}
  currentJobId = null;
  resetToInitialState(false);
  showToast('Üretim işlemi durduruldu ve başlangıç konumuna geçildi.', 'info');
}

async function handleTripleStreamGenerate(prompt, ratio, style, targetSite = 'all') {
  isGenerating = true;
  currentAbortController = new AbortController();

  btnGenerate.disabled = false;
  btnGenerate.classList.add('btn-cancel');
  if (btnLabel) {
    btnLabel.innerHTML = '<i class="fa-solid fa-xmark"></i><span class="desktop-text"> İptal Et</span>';
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

  let headerTitle = 'Çoklu Üretim Akışı (Gemini + ChatGPT + Copilot)';
  if (targetSite === 'gemini') headerTitle = 'Google Gemini Üretim Akışı';
  if (targetSite === 'chatgpt') headerTitle = 'ChatGPT (DALL-E) Üretim Akışı';
  if (targetSite === 'copilot') headerTitle = 'Microsoft Copilot Üretim Akışı';

  let cardsHtml = '';
  if (targetSite === 'all' || targetSite === 'gemini') {
      cardsHtml += `
      <div class="triple-stream-card" id="card-site-gemini">
        <div style="width:100%; height:240px; background: rgba(0,0,0,0.3); border-radius:10px; display:flex; flex-direction:column; justify-content:center; align-items:center; gap:10px;">
          <i class="fa-solid fa-circle-notch fa-spin" style="font-size:2rem; color:var(--color-primary);"></i>
          <span style="font-size:0.85rem; color:#aaa;">Google Gemini üretiliyor...</span>
        </div>
        <h5 style="margin-top:12px; color:#fff;"><i class="fa-brands fa-google" style="color:#4285f4;"></i> Google Gemini</h5>
      </div>`;
  }
  if (targetSite === 'all' || targetSite === 'chatgpt') {
      cardsHtml += `
      <div class="triple-stream-card" id="card-site-chatgpt">
        <div style="width:100%; height:240px; background: rgba(0,0,0,0.3); border-radius:10px; display:flex; flex-direction:column; justify-content:center; align-items:center; gap:10px;">
          <i class="fa-solid fa-circle-notch fa-spin" style="font-size:2rem; color:#10a37f;"></i>
          <span style="font-size:0.85rem; color:#aaa;">ChatGPT (DALL-E) üretiliyor...</span>
        </div>
        <h5 style="margin-top:12px; color:#fff;"><i class="fa-solid fa-brain" style="color:#10a37f;"></i> ChatGPT (DALL-E)</h5>
      </div>`;
  }
  if (targetSite === 'all' || targetSite === 'copilot') {
      cardsHtml += `
      <div class="triple-stream-card" id="card-site-copilot">
        <div style="width:100%; height:240px; background: rgba(0,0,0,0.3); border-radius:10px; display:flex; flex-direction:column; justify-content:center; align-items:center; gap:10px;">
          <i class="fa-solid fa-circle-notch fa-spin" style="font-size:2rem; color:#00a4ef;"></i>
          <span style="font-size:0.85rem; color:#aaa;">Microsoft Copilot üretiliyor...</span>
        </div>
        <h5 style="margin-top:12px; color:#fff;"><i class="fa-brands fa-microsoft" style="color:#00a4ef;"></i> Microsoft Copilot</h5>
      </div>`;
  }

  wrapper.innerHTML = `
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; flex-wrap: wrap; gap: 10px;">
      <h4 style="color: #fff; margin: 0; font-size: 1rem;"><i class="fa-solid fa-layer-group" style="color: #f59e0b;"></i> ${headerTitle}</h4>
      <div id="triple-stream-actions"></div>
    </div>
    <div class="triple-stream-grid" id="triple-cards-grid">
        ${cardsHtml}
    </div>
  `;
  feedList.appendChild(wrapper);

  const succeededImages = [];
  let groupId = null;

  try {
    const url = `/api/generate-triple-stream?prompt=${encodeURIComponent(prompt)}&aspectRatio=${encodeURIComponent(ratio)}&style=${encodeURIComponent(style)}&targetSite=${encodeURIComponent(targetSite)}`;
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
            } else if (data.type === 'queue') {
              const qData = data.payload;
              document.querySelectorAll('.triple-stream-card').forEach(card => {
                const span = card.querySelector('span');
                if (span) {
                  span.textContent = qData.status;
                }
              });
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
                      openSingleImageModal({
                        id: 0,
                        image: item.image,
                        prompt: prompt,
                        model: item.modelUsed,
                        sourceSite: item.site
                      }, false);
                    });
                  }
                  succeededImages.push(item);
                  if (typeof fetchImages === 'function') fetchImages();
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
              if (succeededImages.length > 0) { 
                notificationsArray.unshift({
                  id: Date.now(),
                  groupId: groupId || 'multi',
                  text: `${succeededImages.length} görsel üretildi.`,
                  time: new Date().toLocaleTimeString()
                });
                updateNotificationBadge(notificationsArray.length);
              }
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
      openSingleImageModal({
        id: 0,
        image: imageUrl,
        prompt: promptInput ? promptInput.value : '',
        model: modelUsed,
        sourceSite: ''
      }, false);
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
    // Favori sayacını güncelle
    const favCountEl = document.getElementById('fav-count');
    if (favCountEl) favCountEl.textContent = persistentImages.filter(i => i.isFavorite).length;
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
       const favIcon = groupOrItem.items[0].isFavorite ? 'fa-solid fa-heart' : 'fa-regular fa-heart';
       const favActiveClass = groupOrItem.items[0].isFavorite ? 'btn-fav-img active' : 'btn-fav-img';
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
         <button class="${favActiveClass} btn-fav-bottom-right" title="Favori" onclick="toggleGroupFavorite(event, '${groupOrItem.groupId}')">
           <i class="${favIcon}"></i>
         </button>
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
       const favIcon = item.isFavorite ? 'fa-solid fa-heart' : 'fa-regular fa-heart';
       const favActiveClass = item.isFavorite ? 'btn-fav-img active' : 'btn-fav-img';
       div.innerHTML = `
         <img src="${item.image}" alt="Üretilen görsel">
         <div class="gallery-folder-badge ${badgeClass}">${badgeText}</div>
         <div class="gallery-overlay">${item.model}</div>
         <button class="${favActiveClass} btn-fav-bottom-right" title="Favori" onclick="toggleFavorite(event, ${item.id})">
           <i class="${favIcon}"></i>
         </button>
         <button class="btn-del-img" title="Sil" onclick="deleteImage(event, ${item.id})">
           <i class="fa-solid fa-trash-can"></i>
         </button>
       `;
       div.addEventListener('click', (e) => {
         if (e.target.closest('.btn-del-img') || e.target.closest('.btn-fav-img')) return;
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
    renderFavorites();
    renderCollections();
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
  if (captionEl) captionEl.textContent = ''; // Prompt kaldırıldı, butonla iç içe geçmemesi için.

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

function openTripleGroupModal(groupId, sourceImages = persistentImages, canModify = true) {
  const group = sourceImages.filter(i => i.groupId === groupId);
  if (!group || group.length === 0) return;
  if (group.length === 1) {
    openSingleImageModal(group[0], canModify);
    return;
  }
  const promptEl = document.getElementById('triple-group-prompt');
  if (promptEl) promptEl.textContent = "Prompt: " + group[0].prompt;
  const container = document.getElementById('triple-group-container');
  if (container) {
    container.innerHTML = '';
    group.forEach(res => {
      const downloadFilename = getFormattedDownloadFilename(res.image, res.model, res.sourceSite);
      const col = document.createElement('div');
      col.style.cssText = "background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 12px; padding: 10px; display: flex; flex-direction: column;";
      
      const favIcon = res.isFavorite ? 'fa-solid fa-heart' : 'fa-regular fa-heart';
      const favActiveClass = res.isFavorite ? 'btn-fav-img active' : 'btn-fav-img';
      
      col.innerHTML = `
        <div style="position: relative;">
          <img src="${res.image}" alt="Generated" class="clickable-img" style="width: 100%; height: 250px; object-fit: cover; border-radius: 8px; margin-bottom: 10px;" title="Tam ekran görüntülemek için tıklayın">
          ${canModify ? `<button class="${favActiveClass} btn-fav-bottom-right" style="position: absolute; bottom: 16px; right: 8px; z-index: 20;" onclick="toggleFavorite(event, ${res.id})">
             <i class="${favIcon}"></i>
          </button>` : ''}
        </div>
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
function openSingleImageModal(item, canModify = true) {
  const modal = document.getElementById('single-image-modal');
  if (!modal) return;
  const promptEl = document.getElementById('single-image-prompt');
  if (promptEl) promptEl.textContent = "Prompt: " + item.prompt;
  const container = document.getElementById('single-image-container');
  if (container) {
    const favIcon = item.isFavorite ? 'fa-solid fa-heart' : 'fa-regular fa-heart';
    const favActiveClass = item.isFavorite ? 'btn-fav-img active' : 'btn-fav-img';
    container.innerHTML = `
      <div style="background: rgba(255, 255, 255, 0.05); border: 1px solid rgba(255, 255, 255, 0.1); border-radius: 12px; padding: 10px; display: flex; flex-direction: column; width: 100%; position:relative;">
        <img src="${item.image}" alt="Generated" class="clickable-img" style="width: 100%; max-height: 60vh; object-fit: contain; border-radius: 8px; margin-bottom: 10px;" title="Tam ekran görüntülemek için tıklayın">
        <h6 style="color: #fff; margin-bottom: 5px; text-align: center;">${item.model || item.sourceSite || ''}</h6>
        ${canModify ? `<button class="${favActiveClass}" style="position:absolute; top: 15px; right: 15px; z-index:20; padding:10px; font-size:1.5rem; border:none; background:rgba(0,0,0,0.5); border-radius:50%; cursor:pointer; color:#fff;" title="Favori" onclick="toggleFavorite(event, ${item.id}); this.innerHTML = this.querySelector('.fa-solid') ? '<i class=\\'fa-regular fa-heart\\'></i>' : '<i class=\\'fa-solid fa-heart\\' style=\\'color:#f43f5e;\\'></i>'; this.classList.toggle('active');">
          <i class="${favIcon}" ${item.isFavorite ? 'style="color:#f43f5e;"' : ''}></i>
        </button>` : ''}
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
    btnDownload.style.display = canModify ? '' : 'none';
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
  if (!confirm('Bu görseli çöp kutusuna taşımak istiyor musunuz?')) return;
  try {
    const res = await fetch(`/api/images/${id}`, { method: 'DELETE' });
    if (!res.ok) throw new Error('Silinemedi');
    showToast('Görsel silindi!');
    await fetchImages();
    renderFavorites();
    renderCollections();
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
        <button data-tempmail-chatgpt="${a.id}" data-label="${safeLabel}" style="flex:1;" title="Temp-Mail ile otomatik hesap oluştur"><i class="fa-solid fa-bolt"></i> Oto-Kayıt</button>
        <button data-edit-chatgpt="${a.id}" data-label="${safeLabel}" data-status="${a.status}" title="Düzenle"><i class="fa-solid fa-pen"></i></button>
        <button data-del-chatgpt="${a.id}" style="color: var(--color-danger);" title="Sil"><i class="fa-solid fa-trash"></i></button>
      </div>
    `;
    card.querySelector('[data-login-chatgpt]').addEventListener('click', () => openChatGptLogin(a.id, a.accountLabel));
    card.querySelector('[data-tempmail-chatgpt]').addEventListener('click', () => autoCreateChatGptWithTempMail(a.id, a.accountLabel));
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
async function autoCreateChatGptWithTempMail(id, label) {
  if (!confirm(`'${label}' profili için Temp-Mail ile otomatik ChatGPT hesabı oluşturulsun mu?`)) return;
  showToast('Temp-Mail ile otomatik hesap oluşturma başlatılıyor…', 'info');
  try {
    const res = await fetch(`/api/chatgpt-accounts/auto-create-tempmail/${id}`, { method: 'POST' });
    const data = await res.json();
    if (data.success) { showToast(data.message, 'success'); } else { showToast('Hata: ' + (data.message || 'Bilinmeyen hata'), 'error'); }
  } catch (err) { showToast('Bağlantı hatası: ' + err.message, 'error'); }
}
const btnAddChatgptGmail = document.getElementById('btn-add-chatgpt-gmail');
if (btnAddChatgptGmail) {
  btnAddChatgptGmail.addEventListener('click', async () => {
    const targetInput = document.getElementById('target-profile-input').value.trim();
    const gmailNo = document.getElementById('gmail-no-input').value.trim();
    const aliasNo = document.getElementById('alias-no-input').value.trim();
    if (!gmailNo || !aliasNo) {
      showToast('Lütfen Gmail No (örn: 3) ve Alias No (örn: 2) giriniz.', 'error');
      return;
    }
    const targetProfileId = targetInput ? parseInt(targetInput) : null;
    let msg = `Gmail #${gmailNo} ile +${aliasNo} hesabı otomatik oluşturuluyor...`;
    if (targetProfileId) msg = `Hedef Profil ${targetProfileId} üzerinde ` + msg;

    showToast(msg, 'info');
    try {
      const res = await fetch('/api/dashboard/create-chatgpt-gmail', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ gmailNo: parseInt(gmailNo), aliasNo: parseInt(aliasNo), targetProfileId: targetProfileId })
      });
      const data = await res.json();
      if (data.success) {
        showToast(data.message, 'success');
        await loadChatGptAccounts();
      } else {
        showToast('Hata: ' + (data.message || 'Oluşturulamadı'), 'error');
      }
    } catch (err) {
      showToast('Bağlantı hatası: ' + err.message, 'error');
    }
  });
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
    
    for (let i = 0; i < groupedImages.length; i++) {
      if (groupedImages[i].isGroup && groupedImages[i].items.length === 1) {
        groupedImages[i] = groupedImages[i].items[0];
      }
    }
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
  if (!confirm('Bu görseli çöp kutusuna taşımak istiyor musunuz?')) return;
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
// ==========================================
// KOLEKSİYON VE FAVORİLER MANTIĞI
// ==========================================
let currentCollectionFolder = null;

window.groupImages = function(imgs) {
    const groupedImages = [];
    const groupMap = new Map();
    imgs.forEach(item => {
        if (item.groupId) {
            if (!groupMap.has(item.groupId)) {
                groupMap.set(item.groupId, { isGroup: true, groupId: item.groupId, prompt: item.prompt, items: [], createdAt: item.createdAt });
            }
            groupMap.get(item.groupId).items.push(item);
        } else {
            groupedImages.push(item);
        }
    });

    groupMap.forEach(group => {
        if (group.items.length > 1) {
            groupedImages.push(group);
        } else if (group.items.length === 1) {
            groupedImages.push(group.items[0]);
        }
    });
    
    groupedImages.sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
    return groupedImages;
};

async function toggleFavorite(e, imageId) {
    e.stopPropagation();
    const btn = e.currentTarget;
    const icon = btn.querySelector('i');
    if (icon) {
        if (btn.classList.contains('active')) {
            icon.className = 'fa-regular fa-heart';
            btn.classList.remove('active');
        } else {
            icon.className = 'fa-solid fa-heart';
            btn.classList.add('active');
        }
    }
    try {
        const res = await fetch(`/api/images/${imageId}/favorite`, { method: 'PUT' });
        if (!res.ok) throw new Error('Favori işlemi başarısız');
        const data = await res.json();
        
        const img = persistentImages.find(i => i.id === imageId);
        if (img) img.isFavorite = data.isFavorite;
        
        if (typeof usersData !== 'undefined' && usersData) {
            usersData.forEach(u => {
                if (u.images) {
                    const uImg = u.images.find(i => i.id === imageId);
                    if (uImg) uImg.isFavorite = data.isFavorite;
                }
            });
        }
        
        renderGallery();
        renderFavorites();
        if (document.getElementById('user-images-modal') && document.getElementById('user-images-modal').style.display !== 'none') {
            if (typeof renderUserModalContent === 'function') renderUserModalContent();
        }
        
        const favCountEl = document.getElementById('fav-count');
        if (favCountEl) favCountEl.textContent = persistentImages.filter(i => i.isFavorite).length;
        showToast(data.isFavorite ? 'Favorilere eklendi!' : 'Favorilerden çıkarıldı.');
    } catch(err) {
        showToast('Hata: ' + err.message, 'error');
    }
}

async function toggleGroupFavorite(e, groupId) {
    e.stopPropagation();
    const btn = e.currentTarget;
    const icon = btn.querySelector('i');
    if (icon) {
        if (btn.classList.contains('active')) {
            icon.className = 'fa-regular fa-heart';
            btn.classList.remove('active');
        } else {
            icon.className = 'fa-solid fa-heart';
            btn.classList.add('active');
        }
    }
    const groupItems = persistentImages.filter(i => i.groupId === groupId);
    if(groupItems.length === 0) return;
    
    // Check if any is already favorite. If yes, unfavorite all. Else favorite all.
    const isCurrentlyFavorite = groupItems[0].isFavorite;
    
    try {
        for(const item of groupItems) {
            const res = await fetch(`/api/images/${item.id}/favorite`, { method: 'PUT' });
            if(res.ok) {
                const data = await res.json();
                item.isFavorite = data.isFavorite;
                if (typeof usersData !== 'undefined' && usersData) {
                    usersData.forEach(u => {
                        if (u.images) {
                            const uImg = u.images.find(i => i.id === item.id);
                            if (uImg) uImg.isFavorite = data.isFavorite;
                        }
                    });
                }
            }
        }
        
        renderGallery();
        renderFavorites();
        if (document.getElementById('user-images-modal') && document.getElementById('user-images-modal').style.display !== 'none') {
            if (typeof renderUserModalContent === 'function') renderUserModalContent();
        }
        const favCountEl2 = document.getElementById('fav-count');
        if (favCountEl2) favCountEl2.textContent = persistentImages.filter(i => i.isFavorite).length;
        
        // Also update triple group modal UI if it's open
        const tImg1 = document.getElementById('tImg1');
        if(tImg1 && document.getElementById('triple-group-modal').style.display === 'flex') {
            const heartBtns = document.querySelectorAll('.triple-group-fav-btn');
            heartBtns.forEach(btn => {
                const newIcon = !isCurrentlyFavorite ? 'fa-solid fa-heart' : 'fa-regular fa-heart';
                btn.innerHTML = `<i class="${newIcon}"></i>`;
                if(!isCurrentlyFavorite) btn.classList.add('active');
                else btn.classList.remove('active');
            });
        }
        showToast(!isCurrentlyFavorite ? 'Grup favorilere eklendi!' : 'Grup favorilerden çıkarıldı.');
    } catch(err) {
        showToast('Hata: ' + err.message, 'error');
    }
}

function renderFavorites() {
    const container = document.getElementById('favorites-grid');
    if (!container) return;
    container.innerHTML = '';
    const favs = persistentImages.filter(i => i.isFavorite);
    
    // Favori sayacını güncelle
    const favCountEl = document.getElementById('fav-count');
    if (favCountEl) favCountEl.textContent = favs.length;
    
    if (favs.length === 0) {
        container.innerHTML = '<div class="empty-state"><i class="fa-solid fa-heart-crack"></i><p>Henüz favoriye eklenmiş bir görsel yok.</p></div>';
        return;
    }
    
    const favGroups = groupImages(favs);
    
    favGroups.forEach(groupOrItem => {
        const div = document.createElement('div');
        div.className = 'gallery-item';
        
        if (groupOrItem.isGroup) {
            const items = groupOrItem.items;
            const favIcon = items[0].isFavorite ? 'fa-solid fa-heart' : 'fa-regular fa-heart';
            const favActiveClass = items[0].isFavorite ? 'btn-fav-img active' : 'btn-fav-img';
            
            div.innerHTML = `
              <div style="display:grid; grid-template-columns: 1fr 1fr; grid-template-rows: 1fr 1fr; gap:2px; width:100%; height:100%;">
                ${items.slice(0,4).map(it => `<img src="${it.image}" alt="Üretilen görsel" style="width:100%; height:100%; object-fit:cover; opacity:0.8;">`).join('')}
              </div>
              <div class="gallery-folder-badge badge-gemini" style="background: linear-gradient(135deg, #10b981, #3b82f6);"><i class="fa-solid fa-layer-group"></i> Çoklu Üretim</div>
              <div class="gallery-overlay" style="z-index:10; display:flex; flex-direction:column; justify-content:flex-end; align-items:center; padding:10px;">
                  <span style="font-size:0.8rem; text-align:center;">${String(groupOrItem.prompt||'').substring(0,60)}...</span>
              </div>
              <button class="${favActiveClass} btn-fav-bottom-right" title="Favori" onclick="toggleGroupFavorite(event, '${groupOrItem.groupId}')">
                <i class="${favIcon}"></i>
              </button>
            `;
            div.addEventListener('click', (e) => {
                if(e.target.closest('.btn-fav-img')) return;
                openTripleGroupModal(groupOrItem.groupId);
            });
        } else {
            const item = groupOrItem;
            const favIcon = item.isFavorite ? 'fa-solid fa-heart' : 'fa-regular fa-heart';
            const favActiveClass = item.isFavorite ? 'btn-fav-img active' : 'btn-fav-img';
            div.innerHTML = `
              <img src="${item.image}" alt="Görsel">
              <div class="gallery-overlay" style="z-index:10; display:flex; flex-direction:column; justify-content:flex-end; align-items:center; padding:10px;">
                  <span style="font-size:0.8rem; text-align:center;">${String(item.prompt||'').substring(0,60)}...</span>
              </div>
              <button class="${favActiveClass} btn-fav-bottom-right" title="Favori" onclick="toggleFavorite(event, ${item.id})">
                <i class="${favIcon}"></i>
              </button>
            `;
            div.addEventListener('click', (e) => {
                if(e.target.closest('.btn-fav-img')) return;
                openSingleImageModal(item);
            });
        }
        container.appendChild(div);
    });
}

function renderCollections() {
    const container = document.getElementById('collections-grid');
    const header = document.getElementById('collection-header-actions');
    if (!container) return;
    
    // Update header based on state
    if (currentCollectionFolder) {
        if (header) header.innerHTML = `
            <div style="display:flex; align-items:center; gap:12px; flex-wrap:wrap; width:100%;">
              <button class="action-btn secondary-btn" onclick="currentCollectionFolder = null; renderCollections();">
                  <i class="fa-solid fa-arrow-left"></i> Geri
              </button>
              <h3 style="color:#fff; margin:0; flex:1;"><i class="fa-solid fa-folder-open" style="color:var(--color-primary);"></i> ${currentCollectionFolder}</h3>
              <button class="action-btn primary-btn" onclick="openAddImagesToCollectionModal('${currentCollectionFolder}')">
                  <i class="fa-solid fa-plus"></i> Görsel Ekle
              </button>
              <button class="action-btn" style="background:rgba(239,68,68,0.15); color:#f87171; border-color:rgba(239,68,68,0.3);" onclick="deleteCollection('${currentCollectionFolder}')">
                  <i class="fa-solid fa-trash-can"></i> Koleksiyonu Sil
              </button>
            </div>
        `;
        
        container.innerHTML = '';
        const folderItems = persistentImages.filter(i => i.folderName === currentCollectionFolder);
        if (folderItems.length === 0) {
            container.innerHTML = '<div class="empty-state"><i class="fa-solid fa-folder-open"></i><p>Bu koleksiyonda henüz görsel yok. Yukarıdaki "Görsel Ekle" butonunu kullanarak ekleyebilirsiniz.</p></div>';
            return;
        }
        
        const folderGroups = groupImages(folderItems);
        folderGroups.forEach(groupOrItem => {
            const div = document.createElement('div');
            div.className = 'gallery-item';
            
            if (groupOrItem.isGroup) {
                const items = groupOrItem.items;
                const favIcon = items[0].isFavorite ? 'fa-solid fa-heart' : 'fa-regular fa-heart';
                const favActiveClass = items[0].isFavorite ? 'btn-fav-img active' : 'btn-fav-img';
                
                div.innerHTML = `
                  <div style="display:grid; grid-template-columns: 1fr 1fr; grid-template-rows: 1fr 1fr; gap:2px; width:100%; height:100%;">
                    ${items.slice(0,4).map(it => `<img src="${it.image}" alt="Görsel" style="width:100%; height:100%; object-fit:cover; opacity:0.8;">`).join('')}
                  </div>
                  <div class="gallery-folder-badge badge-gemini" style="background: linear-gradient(135deg, #10b981, #3b82f6);"><i class="fa-solid fa-layer-group"></i> Çoklu Üretim</div>
                  <div class="gallery-overlay" style="z-index:10; display:flex; flex-direction:column; justify-content:flex-end; align-items:center; padding:10px;">
                      <span style="font-size:0.8rem; text-align:center;">${String(groupOrItem.prompt||'').substring(0,60)}...</span>
                  </div>
                  <button class="${favActiveClass} btn-fav-bottom-right" title="Favori" onclick="toggleGroupFavorite(event, '${groupOrItem.groupId}')">
                    <i class="${favIcon}"></i>
                  </button>
                  <button class="btn-del-img" title="Koleksiyondan Çıkar" onclick="removeFromFolder(event, ${items[0].id}, true)">
                    <i class="fa-solid fa-xmark"></i>
                  </button>
                `;
                div.addEventListener('click', (e) => {
                    if(e.target.closest('.btn-fav-img') || e.target.closest('.btn-del-img')) return;
                    openTripleGroupModal(groupOrItem.groupId);
                });
            } else {
                const item = groupOrItem;
                const favIcon = item.isFavorite ? 'fa-solid fa-heart' : 'fa-regular fa-heart';
                const favActiveClass = item.isFavorite ? 'btn-fav-img active' : 'btn-fav-img';
                div.innerHTML = `
                  <img src="${item.image}" alt="Görsel">
                  <div class="gallery-overlay" style="z-index:10; display:flex; flex-direction:column; justify-content:flex-end; align-items:center; padding:10px;">
                      <span style="font-size:0.8rem; text-align:center;">${String(item.prompt||'').substring(0,60)}...</span>
                  </div>
                  <button class="${favActiveClass} btn-fav-bottom-right" title="Favori" onclick="toggleFavorite(event, ${item.id})">
                    <i class="${favIcon}"></i>
                  </button>
                  <button class="btn-del-img" title="Koleksiyondan Çıkar" onclick="removeFromFolder(event, ${item.id}, false)">
                    <i class="fa-solid fa-xmark"></i>
                  </button>
                `;
                div.addEventListener('click', (e) => {
                    if(e.target.closest('.btn-fav-img') || e.target.closest('.btn-del-img')) return;
                    openSingleImageModal(item);
                });
            }
            container.appendChild(div);
        });
        
    } else {
        if (header) header.innerHTML = `
            <button class="action-btn primary-btn" onclick="openFolderModal('create')">
                <i class="fa-solid fa-folder-plus"></i> Yeni Koleksiyon
            </button>
        `;
        
        container.innerHTML = '';
        const customFolders = JSON.parse(localStorage.getItem('customFolders') || '[]');
        const folders = [...new Set([...customFolders, ...persistentImages.filter(i => i.folderName).map(i => i.folderName)])];
        if (folders.length === 0) {
            container.innerHTML = '<div class="empty-state"><i class="fa-solid fa-layer-group"></i><p>Henüz koleksiyon bulunmuyor. "Yeni Koleksiyon" butonuyla oluşturun ve görsellerinizi düzenleyin.</p></div>';
            return;
        }
        
        folders.forEach(f => {
            const fItems = persistentImages.filter(i => i.folderName === f);
            const coverItems = fItems.slice(0, 4);
            const div = document.createElement('div');
            div.className = 'gallery-folder-card';
            const coverHtml = coverItems.length >= 2 
              ? `<div class="folder-cover-grid">${coverItems.slice(0,4).map(it => `<img src="${it.image}" alt="">`).join('')}</div>`
              : coverItems.length === 1
                ? `<img src="${coverItems[0].image}" alt="Koleksiyon" class="folder-cover-single">`
                : `<div class="folder-cover-single" style="display:flex; align-items:center; justify-content:center; background:var(--bg-lighter); font-size:4rem; color:var(--text-muted);"><i class="fa-solid fa-folder-open"></i></div>`;
            div.innerHTML = `
              ${coverHtml}
              <div class="folder-card-info">
                  <span class="folder-card-name"><i class="fa-solid fa-folder" style="color:var(--color-primary);"></i> ${f}</span>
                  <span class="folder-card-count">${fItems.length} görsel</span>
              </div>
              <div class="folder-card-actions">
                <button class="action-btn-sm danger-btn-sm" title="Koleksiyonu Sil" onclick="event.stopPropagation(); deleteCollection('${f}')">
                  <i class="fa-solid fa-trash-can"></i>
                </button>
              </div>
            `;
            div.addEventListener('click', () => {
                currentCollectionFolder = f;
                renderCollections();
            });
            container.appendChild(div);
        });
    }
}

async function deleteCollection(folderName) {
    if (!confirm(`'${folderName}' koleksiyonunu silmek istiyor musunuz? Görseller silinmez, sadece koleksiyondan çıkarılır.`)) return;
    try {
        const res = await fetch(`/api/folders/${encodeURIComponent(folderName)}`, { method: 'DELETE' });
        // Silinemedi hatasını yoksayabiliriz çünkü backend'de folder tablosu yoksa 404 dönebilir
        
        let customFolders = JSON.parse(localStorage.getItem('customFolders') || '[]');
        customFolders = customFolders.filter(f => f !== folderName);
        localStorage.setItem('customFolders', JSON.stringify(customFolders));
        
        persistentImages.forEach(i => { if (i.folderName === folderName) i.folderName = null; });
        currentCollectionFolder = null;
        renderCollections();
        showToast(`'${folderName}' koleksiyonu silindi.`);
    } catch(err) {
        showToast('Hata: ' + err.message, 'error');
    }
}

async function removeFromFolder(e, imageId, isGroup) {
    e.stopPropagation();
    if(!confirm('Bu görseli koleksiyondan çıkarmak istiyor musunuz?')) return;
    try {
        if (isGroup) {
            const img = persistentImages.find(i => i.id === imageId);
            const groupItems = persistentImages.filter(i => i.groupId === img.groupId);
            for(const item of groupItems) {
                await fetch(`/api/images/${item.id}/folder`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ folderName: null })
                });
                item.folderName = null;
            }
        } else {
            await fetch(`/api/images/${imageId}/folder`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ folderName: null })
            });
            const img = persistentImages.find(i => i.id === imageId);
            if (img) img.folderName = null;
        }
        renderGallery();
        renderCollections();
        showToast('Koleksiyondan çıkarıldı.');
    } catch(err) {
        showToast('Hata: ' + err.message, 'error');
    }
}

function openFolderModal(mode) {
    if (mode === 'create') {
        const overlay = document.getElementById('folderModalOverlay');
        if (overlay) overlay.style.display = 'flex';
        const input = document.getElementById('folderNameInput');
        if (input) {
            input.value = '';
            input.focus();
        }
    }
}

window.closeFolderModal = function() {
    const overlay = document.getElementById('folderModalOverlay');
    if (overlay) overlay.style.display = 'none';
};

const btnSaveFolder = document.getElementById('btnSaveFolder');
if (btnSaveFolder) {
    btnSaveFolder.addEventListener('click', () => {
        const input = document.getElementById('folderNameInput');
        if (input && input.value.trim()) {
            const newFolderName = input.value.trim();
            
            let customFolders = JSON.parse(localStorage.getItem('customFolders') || '[]');
            if (!customFolders.includes(newFolderName)) {
                customFolders.push(newFolderName);
                localStorage.setItem('customFolders', JSON.stringify(customFolders));
            }
            
            currentCollectionFolder = newFolderName;
            closeFolderModal();
            renderCollections();
        }
    });
}

// Koleksiyona Görsel Ekle Modal
let collectionSelectMode = false;
let collectionSelectedImages = [];

function openAddImagesToCollectionModal(folderName) {
    collectionSelectMode = true;
    collectionSelectedImages = [];
    
    const overlay = document.getElementById('collectionAddModalOverlay');
    const container = document.getElementById('collectionAddGrid');
    if(!overlay || !container) return;
    
    container.innerHTML = '';
    const available = persistentImages.filter(i => i.folderName !== folderName);
    
    // Çoklu üretim gruplarını ayır, hepsini tekil olarak göster (kullanıcı tekil seçmek istedi)
    if (available.length === 0) {
        container.innerHTML = '<p style="color:#aaa; text-align:center;">Eklenecek görsel bulunamadı.</p>';
    } else {
        available.forEach(item => {
            const div = document.createElement('div');
            div.className = 'gallery-item collection-selectable';
            div.style.cursor = 'pointer';
            
            div.innerHTML = `
              <img src="${item.image}">
              <div class="gallery-overlay">${item.model || ''}</div>
              <div class="collection-check"><i class="fa-solid fa-circle-check"></i></div>
            `;
            div.addEventListener('click', () => {
                div.classList.toggle('selected');
                if (div.classList.contains('selected')) {
                    collectionSelectedImages.push(item.id);
                } else {
                    collectionSelectedImages = collectionSelectedImages.filter(id => id !== item.id);
                }
            });
            container.appendChild(div);
        });
    }
    overlay.style.display = 'flex';
}

function closeCollectionAddModal() {
    const overlay = document.getElementById('collectionAddModalOverlay');
    if(overlay) overlay.style.display = 'none';
    collectionSelectMode = false;
    collectionSelectedImages = [];
}

const btnConfirmCollectionAdd = document.getElementById('btnConfirmCollectionAdd');
if (btnConfirmCollectionAdd) {
    btnConfirmCollectionAdd.addEventListener('click', async () => {
        if (!currentCollectionFolder || collectionSelectedImages.length === 0) {
            closeCollectionAddModal();
            return;
        }
        const prevText = btnConfirmCollectionAdd.innerHTML;
        btnConfirmCollectionAdd.innerHTML = '<i class="fa-solid fa-circle-notch fa-spin"></i> Ekleniyor...';
        btnConfirmCollectionAdd.disabled = true;
        
        try {
            for(const imgId of collectionSelectedImages) {
                await fetch(`/api/images/${imgId}/folder`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ folderName: currentCollectionFolder })
                });
                const img = persistentImages.find(i => i.id === imgId);
                if (img) img.folderName = currentCollectionFolder;
            }
            renderGallery();
            renderCollections();
            showToast(`${collectionSelectedImages.length} görsel koleksiyona eklendi.`);
        } catch(err) {
            showToast('Hata oluştu.', 'error');
        }
        
        btnConfirmCollectionAdd.disabled = false;
        btnConfirmCollectionAdd.innerHTML = prevText;
        closeCollectionAddModal();
    });
}

// ==========================================
// YENİ SAYFA GEÇİŞLERİ (KOLEKSİYON & FAVORİLER)
// ==========================================
const navCollections = document.getElementById('nav-collections');
const navFavorites = document.getElementById('nav-favorites');
const navTrash = document.getElementById('nav-trash');
const navNotifications = document.getElementById('nav-notifications');
const sectionCollections = document.getElementById('section-collections');
const sectionFavorites = document.getElementById('section-favorites');
const sectionTrash = document.getElementById('section-trash');
const sectionNotifications = document.getElementById('section-notifications');

if (navCollections) {
    navCollections.addEventListener('click', () => {
        switchPage('collections');
    });
}

if (navFavorites) {
    navFavorites.addEventListener('click', () => {
        switchPage('favorites');
    });
}
if (navTrash) {
    navTrash.addEventListener('click', () => {
        switchPage('trash');
    });
}


// Override switchPage to handle new pages
const originalSwitchPage = window.switchPage;
if (!originalSwitchPage) {
    // Should not happen, but just in case
}

window.switchPage = function(page) {
    // Reset all navs
    if (navStudio) navStudio.classList.remove('active');
    if (navDashboard) navDashboard.classList.remove('active');
    if (btnGalleryToggle) btnGalleryToggle.classList.remove('active');
    if (btnProfile) btnProfile.classList.remove('active');
    if (navCollections) navCollections.classList.remove('active');
    if (navFavorites) navFavorites.classList.remove('active');
    if (navTrash) navTrash.classList.remove('active');
    
    // Reset all sections
    if (sectionStudio) sectionStudio.classList.remove('active');
    if (sectionDashboard) sectionDashboard.classList.remove('active');
    if (sectionGallery) sectionGallery.classList.remove('active');
    if (sectionProfile) sectionProfile.classList.remove('active');
    if (sectionCollections) sectionCollections.classList.remove('active');
    if (sectionFavorites) sectionFavorites.classList.remove('active');
    if (sectionTrash) sectionTrash.classList.remove('active');

    if (page === 'collections') {
        if (navCollections) navCollections.classList.add('active');
        if (sectionCollections) sectionCollections.classList.add('active');
        if (pageTitleHeading) pageTitleHeading.innerHTML = '<i class="fa-solid fa-box-archive"></i> <h2>Koleksiyonlar</h2>';
        renderCollections();
    } else if (page === 'favorites') {
        if (navFavorites) navFavorites.classList.add('active');
        if (sectionFavorites) sectionFavorites.classList.add('active');
        if (pageTitleHeading) pageTitleHeading.innerHTML = '<i class="fa-solid fa-heart"></i> <h2>Favoriler</h2>';
        renderFavorites();
    } else if (page === 'trash') {
        if (navTrash) navTrash.classList.add('active');
        if (sectionTrash) sectionTrash.classList.add('active');
        if (pageTitleHeading) pageTitleHeading.innerHTML = '<i class="fa-solid fa-trash-can"></i> <h2>Çöp Kutusu</h2>';
        renderTrash();

    } else {
        // Fallback to existing logic for other pages
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
            if(typeof fetchKeys === 'function') fetchKeys();
            if(typeof fetchGeminiAccounts === 'function') fetchGeminiAccounts();
            if(typeof loadChatGptAccounts === 'function') loadChatGptAccounts();
            if(typeof loadCopilotAccounts === 'function') loadCopilotAccounts();
            if(typeof fetchUsers === 'function') fetchUsers();
            fetchImages();
        } else if (page === 'profile') {
            if (btnProfile) btnProfile.classList.add('active');
            if (sectionProfile) sectionProfile.classList.add('active');
            if (pageTitleHeading) pageTitleHeading.innerHTML = '<i class="fa-solid fa-user"></i> <h2>Profilim</h2>';
            if (typeof loadProfileData === 'function') loadProfileData();
        }
    }
    
    // Update mobile bottom bar active state
    document.querySelectorAll('.mobile-bottom-bar .bottom-nav-item').forEach(item => {
      item.classList.remove('active-bottom');
    });
    
    if (page === 'studio') {
      let btn = document.querySelector('.mobile-bottom-bar .bottom-nav-item[onclick*="nav-studio"]');
      if(btn) btn.classList.add('active-bottom');
    } else if (page === 'gallery') {
      let btn = document.querySelector('.mobile-bottom-bar .bottom-nav-item[onclick*="btn-gallery-toggle"]');
      if(btn) btn.classList.add('active-bottom');
    } else if (page === 'collections') {
      let btn = document.querySelector('.mobile-bottom-bar .bottom-nav-item[onclick*="nav-collections"]');
      if(btn) btn.classList.add('active-bottom');
    } else if (page === 'favorites') {
      let btn = document.querySelector('.mobile-bottom-bar .bottom-nav-item[onclick*="nav-favorites"]');
      if(btn) btn.classList.add('active-bottom');
    } else if (page === 'trash') {
      let btn = document.querySelector('.mobile-bottom-bar .bottom-nav-item[onclick*="nav-trash"]');
      if(btn) btn.classList.add('active-bottom');
    } else if (page === 'dashboard') {
      let btn = document.querySelector('.mobile-bottom-bar .bottom-nav-item[onclick*="nav-dashboard"]');
      if(btn) btn.classList.add('active-bottom');
    } else if (page === 'profile') {
      let btn = document.querySelector('.mobile-bottom-bar .bottom-nav-item[onclick*="btn-profile"]');
      if(btn) btn.classList.add('active-bottom');
    }
};

// ==========================================
// USER MODAL TAB OVERRIDES
// ==========================================
let currentUserModalTab = 'all';

const umTabAll = document.getElementById('um-tab-all');
const umTabCollections = document.getElementById('um-tab-collections');
const umTabFavorites = document.getElementById('um-tab-favorites');

function switchUserModalTab(tabId) {
    if (umTabAll) umTabAll.classList.remove('active', 'primary-btn');
    if (umTabCollections) umTabCollections.classList.remove('active', 'primary-btn');
    if (umTabFavorites) umTabFavorites.classList.remove('active', 'primary-btn');
    
    if (umTabAll) umTabAll.classList.add('secondary-btn');
    if (umTabCollections) umTabCollections.classList.add('secondary-btn');
    if (umTabFavorites) umTabFavorites.classList.add('secondary-btn');

    currentUserModalTab = tabId;
    if (tabId === 'all') {
        if (umTabAll) { umTabAll.classList.remove('secondary-btn'); umTabAll.classList.add('active', 'primary-btn'); }
    } else if (tabId === 'collections') {
        if (umTabCollections) { umTabCollections.classList.remove('secondary-btn'); umTabCollections.classList.add('active', 'primary-btn'); }
    } else if (tabId === 'favorites') {
        if (umTabFavorites) { umTabFavorites.classList.remove('secondary-btn'); umTabFavorites.classList.add('active', 'primary-btn'); }
    }
    renderUserModalContent();
}

if (umTabAll) umTabAll.addEventListener('click', () => switchUserModalTab('all'));
if (umTabCollections) umTabCollections.addEventListener('click', () => switchUserModalTab('collections'));
if (umTabFavorites) umTabFavorites.addEventListener('click', () => switchUserModalTab('favorites'));

// User Modal Rendering Fix
window.renderUserModalContent = function() {
    if (!userImagesContainer) return;
    userImagesContainer.innerHTML = '';
    const userObj = usersData.find(u => u.id === currentUserModalId);
    if (!userObj || !userObj.images) return;
    
    const currentUserId = parseInt(document.body.getAttribute('data-user-id') || '0');
    const isOwnImages = currentUserModalId === currentUserId;
    // Admin başkasının görsellerinde favori/koleksiyon değiştiremez, sadece görebilir
    const canModify = isOwnImages;
    
    let filteredImages = userObj.images;
    if (currentUserModalTab === 'favorites') {
        filteredImages = userObj.images.filter(i => i.isFavorite);
    } else if (currentUserModalTab === 'collections') {
        filteredImages = userObj.images.filter(i => i.folderName);
    }
    
    if (filteredImages.length === 0) {
        const emptyMsg = currentUserModalTab === 'favorites' ? 'Bu kullanıcının favorisi bulunmuyor.'
            : currentUserModalTab === 'collections' ? 'Bu kullanıcının koleksiyonu bulunmuyor.'
            : 'Bu sekmede gösterilecek görsel bulunmuyor.';
        userImagesContainer.innerHTML = `<div class="empty-state" style="grid-column:1/-1;"><i class="fa-solid fa-${currentUserModalTab === 'favorites' ? 'heart-crack' : currentUserModalTab === 'collections' ? 'folder-open' : 'image'}"></i><p>${emptyMsg}</p></div>`;
        return;
    }
    
    // Koleksiyon sekmesinde klasör gruplama göster
    if (currentUserModalTab === 'collections') {
        const userFolders = [...new Set(filteredImages.map(i => i.folderName).filter(Boolean))];
        userFolders.forEach(f => {
            const folderHeader = document.createElement('div');
            folderHeader.style.cssText = 'grid-column:1/-1; padding:8px 12px; background:rgba(138,180,248,0.1); border-radius:8px; color:var(--color-primary); font-weight:600; font-size:0.85rem; display:flex; align-items:center; gap:6px;';
            folderHeader.innerHTML = `<i class="fa-solid fa-folder"></i> ${f}`;
            userImagesContainer.appendChild(folderHeader);
            
            const fItems = filteredImages.filter(i => i.folderName === f);
            const fGroups = groupImages(fItems);
            fGroups.forEach(groupOrItem => {
                renderUserModalItem(groupOrItem, false, canModify);
            });
        });
        return;
    }
    
    const uGroups = groupImages(filteredImages);
    uGroups.forEach(groupOrItem => {
        renderUserModalItem(groupOrItem, currentUserModalTab === 'all', canModify);
    });
};

function renderUserModalItem(groupOrItem, showDelete, canModify) {
    const div = document.createElement('div');
    div.className = 'gallery-item';
    
    if (groupOrItem.isGroup) {
        const items = groupOrItem.items;
        const favIcon = items[0].isFavorite ? 'fa-solid fa-heart' : 'fa-regular fa-heart';
        const favActiveClass = items[0].isFavorite ? 'btn-fav-img active' : 'btn-fav-img';
        
        div.innerHTML = `
          <div style="display:grid; grid-template-columns: 1fr 1fr; grid-template-rows: 1fr 1fr; gap:2px; width:100%; height:100%;">
            ${items.slice(0,4).map(it => `<img src="${it.image}" style="width:100%; height:100%; object-fit:cover; opacity:0.8;">`).join('')}
          </div>
          <div class="gallery-folder-badge badge-gemini" style="background: linear-gradient(135deg, #10b981, #3b82f6);"><i class="fa-solid fa-layer-group"></i> Çoklu Üretim</div>
          <div class="gallery-overlay" style="z-index:10; display:flex; flex-direction:column; justify-content:flex-end; align-items:center; padding:10px;">
              <span style="font-size:0.8rem; text-align:center;">${String(groupOrItem.prompt||'').substring(0,60)}...</span>
          </div>
          ${canModify ? `<span class="${favActiveClass} btn-fav-bottom-right" style="pointer-events:none;">
            <i class="${favIcon}" ${items[0].isFavorite ? 'style="color:#f43f5e;"' : ''}></i>
          </span>` : ''}
          ${showDelete ? `<button class="btn-del-img" title="Sil" onclick="deleteGroupFromUserModal(event, '${groupOrItem.groupId}', ${currentUserModalId})" style="z-index: 10;"><i class="fa-solid fa-trash-can"></i></button>` : ''}
        `;
        div.addEventListener('click', (e) => {
            if(e.target.closest('.btn-del-img')) return;
            const userObj = usersData.find(u => u.id === currentUserModalId);
            openTripleGroupModal(groupOrItem.groupId, userObj ? userObj.images : persistentImages, canModify);
        });
    } else {
        const item = groupOrItem;
        const favIcon = item.isFavorite ? 'fa-solid fa-heart' : 'fa-regular fa-heart';
        const favActiveClass = item.isFavorite ? 'btn-fav-img active' : 'btn-fav-img';
        const folderBadge = item.folderName ? `<span class="gallery-user-folder-badge"><i class="fa-solid fa-folder"></i> ${item.folderName}</span>` : '';
        
        div.innerHTML = `
          <img src="${item.image}" alt="Görsel">
          ${folderBadge}
          <div class="gallery-overlay">${item.model}</div>
          ${canModify ? `<span class="${favActiveClass} btn-fav-bottom-right" style="pointer-events:none;">
            <i class="${favIcon}" ${item.isFavorite ? 'style="color:#f43f5e;"' : ''}></i>
          </span>` : ''}
          ${showDelete ? `<button class="btn-del-img" title="Sil" onclick="deleteImageFromUserModal(event, ${item.id}, ${currentUserModalId})"><i class="fa-solid fa-trash-can"></i></button>` : ''}
        `;
        div.addEventListener('click', (e) => {
            if(e.target.closest('.btn-del-img')) return;
            openSingleImageModal(item, canModify);
        });
    }
    userImagesContainer.appendChild(div);
}

// Make sure that when opening the user modal we render the current tab
const oldOpenUserImagesModal = window.openUserImagesModal;
window.openUserImagesModal = function(userId, displayName) {
    currentUserModalId = userId;
    if (userImagesModal) userImagesModal.style.display = 'flex';
    if (userImagesModalTitle) userImagesModalTitle.innerHTML = `<i class="fa-solid fa-images" style="color: var(--color-primary);"></i> ${displayName} - Görselleri`;
    renderUserModalContent();
};





// --- Notification System ---
let unreadNotificationCount = 0;
let lastGeneratedGroupId = null;

function updateNotificationBadge(count) {
  unreadNotificationCount = count;
  const badgeTop = document.getElementById('top-notif-count');
  if (unreadNotificationCount > 0) {
    if (badgeTop) { badgeTop.style.display = 'inline-block'; badgeTop.textContent = unreadNotificationCount; }
  } else {
    if (badgeTop) badgeTop.style.display = 'none';
  }
}




// --- Notifications Array & Render ---
let notificationsArray = JSON.parse(localStorage.getItem('yz_notifications') || '[]');

// Sync notifications across multiple tabs
window.addEventListener('storage', function(e) {
  if (e.key === 'yz_notifications') {
    try {
      notificationsArray = JSON.parse(e.newValue || '[]');
      updateNotificationBadge(notificationsArray.length);
      renderNotifications();
    } catch(err) {}
  }
});
window.addEventListener('focus', function() {
  try {
    const freshData = localStorage.getItem('yz_notifications');
    if (freshData) {
      notificationsArray = JSON.parse(freshData);
      updateNotificationBadge(notificationsArray.length);
      renderNotifications();
    }
  } catch(err) {}
});
window.saveNotifications = function() {
    localStorage.setItem('yz_notifications', JSON.stringify(notificationsArray));
    updateNotificationBadge(notificationsArray.length);
};
window.renderNotifications = function() {
  const list = document.getElementById('top-notifications-list');
  const empty = document.getElementById('top-notifications-empty');
  if (!list || !empty) return;
  
  if (notificationsArray.length === 0) {
    empty.style.display = 'block';
    list.innerHTML = '';
    list.appendChild(empty);
  } else {
    empty.style.display = 'none';
    list.innerHTML = notificationsArray.map(n => `
      <div class="notification-item" onclick="readNotification(${n.id}, '${n.groupId}', ${n.imageId || 'null'})" style="padding: 12px 15px; border-bottom: 1px solid var(--border-color); cursor: pointer; display: flex; justify-content: space-between; align-items: center; transition: background 0.2s;">
        <div>
          <strong style="color:var(--text-main); font-weight:700; font-size: 0.9rem;">${n.text}</strong>
          <div style="font-size:0.75rem; color:var(--text-muted); margin-top:3px;"><i class="fa-regular fa-clock"></i> ${n.time}</div>
        </div>
        <i class="fa-solid fa-chevron-right" style="color:var(--color-primary); opacity:0.7; font-size: 0.8rem;"></i>
      </div>
    `).join('');
  }
};

window.toggleNotificationDropdown = function(e) {
    if (e) e.stopPropagation();
    const dropdown = document.getElementById('notification-dropdown-menu');
    const userDropdown = document.getElementById('user-dropdown-menu');
    if (userDropdown) userDropdown.style.display = 'none';
    if (dropdown) {
      if (dropdown.style.display === 'block') {
        dropdown.style.display = 'none';
      } else {
        dropdown.style.display = 'block';
      }
    }
  };

window.clearNotifications = function(e) {
  if (e) e.stopPropagation();
  notificationsArray = [];
  saveNotifications();
  renderNotifications();
};

document.addEventListener('click', function(e) {
  const notifMenu = document.getElementById('notification-dropdown-menu');
  const notifBadge = document.querySelector('.notification-badge-container');
  if (notifMenu && notifBadge && !notifBadge.contains(e.target) && !notifMenu.contains(e.target)) {
    if (notifMenu.style.display === 'block') { notifMenu.style.display = 'none'; }
  }
});

window.readNotification = function(id, groupId, imageId) {
  notificationsArray = notificationsArray.filter(n => n.id !== id);
  saveNotifications();
  renderNotifications();
  const dropdown = document.getElementById('notification-dropdown-menu');
  if (dropdown) dropdown.style.display = 'none';
  if (groupId && groupId !== 'single') {
      openTripleGroupModal(groupId);
  } else if (imageId) {
      // Find the image in the grid and click it
      const imgItem = document.querySelector(`.gallery-item-img[data-id="${imageId}"]`);
      if (imgItem) imgItem.click();
      else switchPage('studio');
  }
};

// --- Trash Feature ---
window.renderTrash = async function() {
  try {
    const res = await fetch('/api/images/trash');
    const data = await res.json();
    const grid = document.getElementById('trash-grid');
    if(!grid) return;
    if (data.length === 0) {
      grid.innerHTML = '<div style="grid-column: 1 / -1; text-align: center; color: var(--text-muted); padding: 40px;"><i class="fa-solid fa-trash-can" style="font-size: 2rem; margin-bottom:10px;"></i><br>Çöp kutusu boş.</div>';
      return;
    }
    grid.innerHTML = '';
    window.trashData = data;

    const groupedImages = [];
    const groupMap = new Map();
  
    data.forEach(item => {
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

    groupedImages.forEach(groupOrItem => {
      const div = document.createElement('div');
      div.className = 'gallery-item';
      if (groupOrItem.isGroup) {
         div.style.aspectRatio = '1 / 1';
         div.innerHTML = `
           <div style="position: absolute; top:0; left:0; width:100%; height:100%; display: grid; grid-template-columns: 1fr 1fr 1fr; grid-template-rows: 1fr;">
             ${groupOrItem.items.map((it, idx) => {
                if (idx > 2) return '';
                return '<img src="' + it.image + '" alt="Trash" style="width:100%; height:100%; object-fit:cover; opacity: 0.85;">';
             }).join('')}
           </div>
           <div class="gallery-folder-badge badge-gemini" style="background: linear-gradient(135deg, #10b981, #3b82f6);"><i class="fa-solid fa-layer-group"></i> Üçlü Üretim</div>
           <div class="gallery-overlay" style="z-index: 10; display:flex; flex-direction:column; justify-content:center; align-items:center; padding: 10px; gap: 8px;">
               <button class="action-btn" title="Kalıcı Sil" onclick="permanentDeleteGroup(event, '${groupOrItem.groupId}')" style="background: rgba(239, 68, 68, 0.9); color: #fff; width: 40px; height: 40px; border-radius: 50%;">
                 <i class="fa-solid fa-trash-can"></i>
               </button>
               <button class="action-btn" title="Geri Yükle" onclick="restoreGroup(event, '${groupOrItem.groupId}')" style="background: rgba(16, 185, 129, 0.9); color: #fff; width: 40px; height: 40px; border-radius: 50%;">
                 <i class="fa-solid fa-rotate-left"></i>
               </button>
           </div>
         `;
         div.addEventListener('click', (e) => {
           if (e.target.closest('.action-btn')) return;
           openTripleGroupModal(groupOrItem.groupId, window.trashData, false);
         });
      } else {
         const item = groupOrItem;
         const badgeText = item.folder === 'gemini' ? 'Gemini Web' : (item.folder === 'free' ? 'Ücretsiz' : (item.folder === 'stability' ? 'Stability AI' : (item.folder === 'chatgpt' ? 'ChatGPT' : (item.folder === 'copilot' ? 'Copilot' : 'Genel'))));
         const badgeClass = item.folder === 'gemini' ? 'badge-gemini' : (item.folder === 'free' ? 'badge-free' : (item.folder === 'chatgpt' ? 'badge-chatgpt' : (item.folder === 'copilot' ? 'badge-copilot' : 'badge-stability')));
         div.innerHTML = `
           <img src="${item.image}" alt="Trash">
           <div class="gallery-folder-badge ${badgeClass}">${badgeText}</div>
           <div class="gallery-overlay" style="z-index: 10; display:flex; justify-content:center; align-items:center; gap: 8px;">
               <button class="action-btn" title="Kalıcı Sil" onclick="permanentDeleteImage(event, ${item.id})" style="background: rgba(239, 68, 68, 0.9); color: #fff; width: 40px; height: 40px; border-radius: 50%;">
                 <i class="fa-solid fa-trash-can"></i>
               </button>
               <button class="action-btn" title="Geri Yükle" onclick="restoreImage(event, ${item.id})" style="background: rgba(16, 185, 129, 0.9); color: #fff; width: 40px; height: 40px; border-radius: 50%;">
                 <i class="fa-solid fa-rotate-left"></i>
               </button>
           </div>
         `;
         div.addEventListener('click', (e) => {
           if (e.target.closest('.action-btn')) return;
           openSingleImageModal(item, false);
         });
      }
      grid.appendChild(div);
    });
  } catch(e) {
    console.error(e);
  }
};

window.restoreImage = async function(e, id) {
  e.stopPropagation();
  try {
    const res = await fetch('/api/images/' + id + '/restore', { method: 'POST' });
    if (res.ok) {
      showToast('Görsel geri getirildi.', 'success');
      renderTrash();
      fetchImages(); // refresh cache
    }
  } catch(err) {
    showToast('Hata oluştu.', 'error');
  }
};

window.permanentDeleteImage = async function(e, id) {
  e.stopPropagation();
  if(!confirm('Bu görsel kalıcı olarak silinecek. Emin misiniz?')) return;
  try {
    const res = await fetch('/api/images/' + id + '/permanent', { method: 'DELETE' });
    if (res.ok) {
      showToast('Kalıcı olarak silindi.', 'success');
      renderTrash();
    }
  } catch(err) {
    showToast('Hata oluştu.', 'error');
  }
};

window.restoreGroup = async function(e, groupId) {
  e.stopPropagation();
  const groupItems = (window.trashData || []).filter(i => i.groupId === groupId);
  try {
    for (const item of groupItems) {
      await fetch('/api/images/' + item.id + '/restore', { method: 'POST' });
    }
    showToast('Çoklu üretim geri getirildi!', 'success');
    renderTrash();
    fetchImages(); // refresh cache
  } catch (err) {
    showToast('Geri getirilirken hata oluştu.', 'error');
  }
};

window.permanentDeleteGroup = async function(e, groupId) {
  e.stopPropagation();
  if(!confirm('Bu çoklu üretimi ve içindeki tüm görselleri kalıcı olarak silmek istediğinize emin misiniz?')) return;
  const groupItems = (window.trashData || []).filter(i => i.groupId === groupId);
  try {
    for (const item of groupItems) {
      await fetch('/api/images/' + item.id + '/permanent', { method: 'DELETE' });
    }
    showToast('Çoklu üretim kalıcı olarak silindi!', 'success');
    renderTrash();
  } catch (err) {
    showToast('Silinirken hata oluştu.', 'error');
  }
};



// --- Robust Background Generation Logic ---
async function handleGenerate(e) {
  if (e) e.preventDefault();
  if (isGenerating) { await cancelGeneration(); return; }

  const prompt = promptInput.value.trim();
  const ratioEl = document.querySelector('input[name="ratio"]:checked');
  const ratio = ratioEl ? ratioEl.value : '1:1';
  if (!prompt) { showToast('Lütfen bir görsel tarifi girin.', 'error'); return; }

  const selectedModel = modelSelect.value;
  if (selectedModel === 'triple-ai' || selectedModel === 'gemini-web-profile' || selectedModel === 'chatgpt-web-profile' || selectedModel === 'copilot-web-profile') {
    let targetSite = 'all';
    if (selectedModel === 'gemini-web-profile') targetSite = 'gemini';
    if (selectedModel === 'chatgpt-web-profile') targetSite = 'chatgpt';
    if (selectedModel === 'copilot-web-profile') targetSite = 'copilot';
    await handleTripleStreamGenerate(prompt, ratio, styleSelect.value, targetSite);
    return;
  }

  isGenerating = true;
  currentAbortController = new AbortController();

  btnGenerate.disabled = false;
  btnGenerate.classList.add('btn-cancel');
  if (btnLabel) { btnLabel.innerHTML = '<i class="fa-solid fa-xmark"></i><span class="desktop-text"> İptal Et</span>'; btnLabel.style.display = 'flex'; }
  if (btnLoader) btnLoader.style.display = 'none';

  if (promptInput) promptInput.disabled = true;
  if (canvasPlaceholder) canvasPlaceholder.style.display = 'none';
  if (canvasSuccess) canvasSuccess.style.display = 'none';
  if (canvasError) canvasError.style.display = 'none';
  if (canvasLoading) canvasLoading.style.display = 'flex';
  if (loadingStatus) loadingStatus.textContent = 'API sunucularına bağlanılıyor…';

  try {
    const res = await fetch('/api/generate-job', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: currentAbortController.signal,
      body: JSON.stringify({ prompt, aspectRatio: ratio, model: selectedModel, style: styleSelect.value })
    });
    if (!res.ok) throw new Error((await res.json()).error || 'Görsel üretimi başarısız.');
    
    const initialJobData = await res.json();
    currentJobId = initialJobData.jobId;
    
    // Save to local storage for persistence
    localStorage.setItem('yz_active_job', JSON.stringify({ id: currentJobId, type: 'single' }));
    
    await pollJob(currentJobId, 'single');
  } catch (err) {
    if (err.name !== 'AbortError') {
      if (canvasLoading) canvasLoading.style.display = 'none';
      if (canvasError) canvasError.style.display = 'flex';
      if (errorMessage) errorMessage.textContent = err.message;
      showToast(err.message, 'error');
    }
    resetToInitialState(false);
  }
}

async function handleTripleStreamGenerate(prompt, ratio, style, targetSite = 'all') {
  isGenerating = true;
  currentAbortController = new AbortController();

  btnGenerate.disabled = false;
  btnGenerate.classList.add('btn-cancel');
  if (btnLabel) { btnLabel.innerHTML = '<i class="fa-solid fa-xmark"></i><span class="desktop-text"> İptal Et</span>'; btnLabel.style.display = 'flex'; }
  if (btnLoader) btnLoader.style.display = 'none';

  if (promptInput) promptInput.disabled = true;
  if (canvasPlaceholder) canvasPlaceholder.style.display = 'none';
  if (canvasLoading) canvasLoading.style.display = 'none';
  if (canvasError) canvasError.style.display = 'none';

  const feedList = document.getElementById('studio-feed-list');
  if (feedList) feedList.innerHTML = '';
  if (canvasSuccess) canvasSuccess.style.display = 'flex';

  renderTripleCards(targetSite); // Helper to draw the UI cards

  try {
    const res = await fetch('/api/generate-triple-job', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      signal: currentAbortController.signal,
      body: JSON.stringify({ prompt, aspectRatio: ratio, style: style, targetSite: targetSite })
    });
    if (!res.ok) throw new Error((await res.json()).error || 'Çoklu görsel üretimi başlatılamadı.');
    
    const initialJobData = await res.json();
    currentJobId = initialJobData.jobId;
    
    localStorage.setItem('yz_active_job', JSON.stringify({ id: currentJobId, type: 'triple', targetSite, prompt }));
    
    await pollJob(currentJobId, 'triple');
  } catch (err) {
    if (err.name !== 'AbortError') {
      showToast(err.message, 'error');
    }
    resetToInitialState(false);
  }
}

function renderTripleCards(targetSite) {
  const feedList = document.getElementById('studio-feed-list');
  if (!feedList) return;
  const wrapper = document.createElement('div');
  wrapper.id = 'triple-stream-wrapper';
  wrapper.style.width = '100%';

  let headerTitle = 'Çoklu Üretim Akışı';
  let cardsHtml = '';
  if (targetSite === 'all' || targetSite === 'gemini') {
      cardsHtml += `<div class="triple-stream-card" id="card-site-gemini"><div class="card-loader" style="width:100%; height:240px; background: rgba(0,0,0,0.3); border-radius:10px; display:flex; flex-direction:column; justify-content:center; align-items:center; gap:10px;"><i class="fa-solid fa-circle-notch fa-spin" style="font-size:2rem; color:var(--color-primary);"></i><span style="font-size:0.85rem;">Google Gemini üretiliyor...</span></div><h5 style="margin-top:12px; color:#fff;"><i class="fa-brands fa-google" style="color:#4285f4;"></i> Google Gemini</h5></div>`;
  }
  if (targetSite === 'all' || targetSite === 'chatgpt') {
      cardsHtml += `<div class="triple-stream-card" id="card-site-chatgpt"><div class="card-loader" style="width:100%; height:240px; background: rgba(0,0,0,0.3); border-radius:10px; display:flex; flex-direction:column; justify-content:center; align-items:center; gap:10px;"><i class="fa-solid fa-circle-notch fa-spin" style="font-size:2rem; color:#10a37f;"></i><span style="font-size:0.85rem;">ChatGPT üretiliyor...</span></div><h5 style="margin-top:12px; color:#fff;"><i class="fa-solid fa-brain" style="color:#10a37f;"></i> ChatGPT</h5></div>`;
  }
  if (targetSite === 'all' || targetSite === 'copilot') {
      cardsHtml += `<div class="triple-stream-card" id="card-site-copilot"><div class="card-loader" style="width:100%; height:240px; background: rgba(0,0,0,0.3); border-radius:10px; display:flex; flex-direction:column; justify-content:center; align-items:center; gap:10px;"><i class="fa-solid fa-circle-notch fa-spin" style="font-size:2rem; color:#00a4ef;"></i><span style="font-size:0.85rem;">Microsoft Copilot üretiliyor...</span></div><h5 style="margin-top:12px; color:#fff;"><i class="fa-brands fa-microsoft" style="color:#00a4ef;"></i> Microsoft Copilot</h5></div>`;
  }
  wrapper.innerHTML = `<div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; flex-wrap: wrap; gap: 10px;"><h4 style="color: #fff; margin: 0; font-size: 1rem;"><i class="fa-solid fa-layer-group" style="color: #f59e0b;"></i> ${headerTitle}</h4><div id="triple-stream-actions"></div></div><div class="triple-stream-grid" id="triple-cards-grid">${cardsHtml}</div>`;
  feedList.innerHTML = '';
  feedList.appendChild(wrapper);
}

async function pollJob(jobId, type) {
  let isSuccess = false;
  let lastProcessedCount = 0;
  
  while (isGenerating && currentJobId === jobId) {
    try {
      const res = await fetch(`/api/job-status/${jobId}`);
      if (!res.ok) { await new Promise(r => setTimeout(r, 3000)); continue; }
      const data = await res.json();
      
      if (type === 'single') {
          if (data.status.startsWith('Beklemede')) {
             if (loadingStatus) loadingStatus.textContent = `⏳ Sırada bekleniyor... (Sıranız: ${data.position || '?'})`;
          } else if (data.status === 'Üretiliyor') {
             if (loadingStatus) loadingStatus.textContent = '🎨 Üretiliyor... Lütfen bekleyin.';
          } else if (data.status === 'Tamamlandı') {
             isSuccess = true;
             addStudioImageToFeed(data.result.image, data.result.modelUsed, data.result.keyUsedLabel, true);
             showToast('Görsel başarıyla üretildi!');
             
             // Add notification
             notificationsArray.unshift({
                id: Date.now(), groupId: 'single', imageId: data.result.imageId,
                text: `1 görsel üretildi.`, time: new Date().toLocaleTimeString()
             });
             saveNotifications();
             await fetchImages();
             break;
          } else if (data.status === 'Hata' || data.status === 'İptal Edildi') {
             throw new Error(data.result?.error || data.status);
          }
      } 
      else if (type === 'triple') {
          if (data.result && data.result.subStatuses) {
            Object.entries(data.result.subStatuses).forEach(([site, subData]) => {
                const card = document.getElementById(`card-site-${site}`);
                if (card) {
                    const span = card.querySelector('.card-loader span');
                    const icon = card.querySelector('.card-loader i');
                    if (span && icon) {
                        if (subData.status === 'Beklemede') {
                            span.textContent = `Beklemede (Sıra: ${subData.position || '?'})`;
                            icon.className = 'fa-regular fa-clock';
                        } else if (subData.status === 'Üretiliyor') {
                            span.textContent = `${site.charAt(0).toUpperCase() + site.slice(1)} Üretiliyor...`;
                            icon.className = 'fa-solid fa-circle-notch fa-spin';
                        }
                    }
                }
            });
          }
          if (data.result && data.result.progress) {
             // update cards dynamically
             const successes = data.result.progress;
             const failures = data.result.failures || [];
             
             for (let item of successes) {
                const card = document.getElementById(`card-site-${item.site}`);
                if (card && card.querySelector('.card-loader')) {
                   card.innerHTML = `<img src="${item.image}" style="width:100%; height:240px; object-fit:cover; border-radius:10px; cursor:pointer;" onclick="openTripleGroupModal('${data.result.groupId}')" />
                   <div style="display:flex; justify-content:space-between; align-items:center; margin-top:12px;">
                     <h5 style="color:#fff; margin:0;"><i class="fa-solid fa-check" style="color:var(--color-primary);"></i> ${item.site}</h5>
                   </div>`;
                }
             }
             for (let item of failures) {
                const card = document.getElementById(`card-site-${item.site}`);
                if (card && card.querySelector('.card-loader')) {
                   card.innerHTML = `<div style="width:100%; height:240px; background:rgba(239,68,68,0.1); border:1px solid rgba(239,68,68,0.3); border-radius:10px; display:flex; flex-direction:column; justify-content:center; align-items:center; padding:20px; text-align:center;">
                     <i class="fa-solid fa-triangle-exclamation" style="font-size:2rem; color:var(--color-danger); margin-bottom:10px;"></i>
                     <span style="font-size:0.85rem; color:#ccc;">${item.error}</span>
                   </div>
                   <h5 style="margin-top:12px; color:#fff;"><i class="fa-solid fa-xmark" style="color:var(--color-danger);"></i> ${item.site}</h5>`;
                }
             }
             
             if (data.status === 'Tamamlandı' || data.result.isCompleted) {
                 isSuccess = true;
                 if (successes.length > 0) {
                     showToast(`Çoklu üretim tamamlandı! (${successes.length} başarılı)`);
                     notificationsArray.unshift({
                        id: Date.now(), groupId: data.result.groupId,
                        text: `${successes.length} görsel üretildi.`, time: new Date().toLocaleTimeString()
                     });
                     saveNotifications();
                 }
                 const actions = document.getElementById('triple-stream-actions');
                 if(actions && successes.length > 0) {
                     actions.innerHTML = `<button class="action-btn primary-btn" onclick="openTripleGroupModal('${data.result.groupId}')" style="padding: 6px 12px; font-size:0.85rem;"><i class="fa-solid fa-expand"></i> Sonuçları Büyüt</button>`;
                 }
                 await fetchImages();
                 break;
             }
          }
          if (data.status === 'Hata' || data.status === 'İptal Edildi') {
             throw new Error(data.result?.error || data.status);
          }
      }
      
      await new Promise(r => setTimeout(r, 2500));
    } catch (err) {
      if (err.name !== 'AbortError') throw err;
    }
  }
  
  if (isSuccess) {
    localStorage.removeItem('yz_active_job');
    resetToInitialState(true);
  }
}

async function checkActiveJobs() {
  const activeJobStr = localStorage.getItem('yz_active_job');
  if (!activeJobStr) return;
  
  try {
      const activeJob = JSON.parse(activeJobStr);
      const res = await fetch(`/api/job-status/${activeJob.id}`);
      if (!res.ok) { localStorage.removeItem('yz_active_job'); return; }
      
      const data = await res.json();
      if (data.status !== 'Tamamlandı' && data.status !== 'Hata' && data.status !== 'İptal Edildi') {
          // Job is still running, restore UI
          isGenerating = true;
          currentJobId = activeJob.id;
          
          btnGenerate.disabled = false;
          btnGenerate.classList.add('btn-cancel');
          if (btnLabel) { btnLabel.innerHTML = '<i class="fa-solid fa-xmark"></i><span class="desktop-text"> İptal Et</span>'; btnLabel.style.display = 'flex'; }
          if (btnLoader) btnLoader.style.display = 'none';
          if (promptInput) promptInput.disabled = true;
          
          if (activeJob.type === 'single') {
              if (canvasPlaceholder) canvasPlaceholder.style.display = 'none';
              if (canvasLoading) canvasLoading.style.display = 'flex';
          } else if (activeJob.type === 'triple') {
              if (canvasPlaceholder) canvasPlaceholder.style.display = 'none';
              if (canvasSuccess) canvasSuccess.style.display = 'flex';
              renderTripleCards(activeJob.targetSite);
          }
          
          
          pollJob(activeJob.id, activeJob.type).catch(err => {
              showToast(err.message, 'error');
              localStorage.removeItem('yz_active_job');
              resetToInitialState(false);
          });
      } else {
          // Job finished while offline
          localStorage.removeItem('yz_active_job');
      }
  } catch (e) {
      localStorage.removeItem('yz_active_job');
  }
}

// Ensure the onclick attribute matches the updated function
window.readNotification = window.readNotification;
