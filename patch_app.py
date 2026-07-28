import re

with open('wwwroot/js/app.js', 'r', encoding='utf-8') as f:
    js = f.read()

# 1. Update Notification Array to use localStorage
notif_decl = 'let notificationsArray = [];'
new_notif_decl = '''let notificationsArray = JSON.parse(localStorage.getItem('yz_notifications') || '[]');
window.saveNotifications = function() {
    localStorage.setItem('yz_notifications', JSON.stringify(notificationsArray));
    updateNotificationBadge(notificationsArray.length);
};'''
js = js.replace(notif_decl, new_notif_decl)

# Update readNotification
read_notif = '''window.readNotification = function(id, groupId) {
  notificationsArray = notificationsArray.filter(n => n.id !== id);
  updateNotificationBadge(notificationsArray.length);
  renderNotifications();
  openTripleGroupModal(groupId);
};'''
new_read_notif = '''window.readNotification = function(id, groupId, imageId) {
  notificationsArray = notificationsArray.filter(n => n.id !== id);
  saveNotifications();
  renderNotifications();
  if (groupId && groupId !== 'single') {
      openTripleGroupModal(groupId);
  } else if (imageId) {
      // Find the image in the grid and click it
      const imgItem = document.querySelector(.gallery-item-img[data-id=""]);
      if (imgItem) imgItem.click();
      else switchPage('studio');
  }
};'''
js = js.replace(read_notif, new_read_notif)

# Add load notifications badge logic on page load
# We can find document.addEventListener('DOMContentLoaded', () => { and inject it
dom_content = 'document.addEventListener(\'DOMContentLoaded\', () => {'
js = js.replace(dom_content, dom_content + '\\n  updateNotificationBadge(notificationsArray.length);\\n  checkActiveJobs();')

# Replace updateNotificationBadge to use the existing function but maybe it's fine as is.
# Yes, updateNotificationBadge works fine.

# Replace handleGenerate and handleTripleStreamGenerate completely.
# We will just strip them out and append our new robust logic at the end of the file.
# First, let's remove the old functions using regex.

js = re.sub(r'async function handleGenerate\(e\)\s*\{.*?(?=async function handleTripleStreamGenerate)', '', js, flags=re.DOTALL)
js = re.sub(r'async function handleTripleStreamGenerate[^{]+\{.*?(?=\s*// --- Initial Checks ---)', '', js, flags=re.DOTALL)


# Append new logic
new_functions = '''
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
      cardsHtml += <div class="triple-stream-card" id="card-site-gemini"><div class="card-loader" style="width:100%; height:240px; background: rgba(0,0,0,0.3); border-radius:10px; display:flex; flex-direction:column; justify-content:center; align-items:center; gap:10px;"><i class="fa-solid fa-circle-notch fa-spin" style="font-size:2rem; color:var(--color-primary);"></i><span style="font-size:0.85rem; color:#aaa;">Google Gemini üretiliyor...</span></div><h5 style="margin-top:12px; color:#fff;"><i class="fa-brands fa-google" style="color:#4285f4;"></i> Google Gemini</h5></div>;
  }
  if (targetSite === 'all' || targetSite === 'chatgpt') {
      cardsHtml += <div class="triple-stream-card" id="card-site-chatgpt"><div class="card-loader" style="width:100%; height:240px; background: rgba(0,0,0,0.3); border-radius:10px; display:flex; flex-direction:column; justify-content:center; align-items:center; gap:10px;"><i class="fa-solid fa-circle-notch fa-spin" style="font-size:2rem; color:#10a37f;"></i><span style="font-size:0.85rem; color:#aaa;">ChatGPT üretiliyor...</span></div><h5 style="margin-top:12px; color:#fff;"><i class="fa-solid fa-brain" style="color:#10a37f;"></i> ChatGPT</h5></div>;
  }
  if (targetSite === 'all' || targetSite === 'copilot') {
      cardsHtml += <div class="triple-stream-card" id="card-site-copilot"><div class="card-loader" style="width:100%; height:240px; background: rgba(0,0,0,0.3); border-radius:10px; display:flex; flex-direction:column; justify-content:center; align-items:center; gap:10px;"><i class="fa-solid fa-circle-notch fa-spin" style="font-size:2rem; color:#00a4ef;"></i><span style="font-size:0.85rem; color:#aaa;">Microsoft Copilot üretiliyor...</span></div><h5 style="margin-top:12px; color:#fff;"><i class="fa-brands fa-microsoft" style="color:#00a4ef;"></i> Microsoft Copilot</h5></div>;
  }
  wrapper.innerHTML = <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px; flex-wrap: wrap; gap: 10px;"><h4 style="color: #fff; margin: 0; font-size: 1rem;"><i class="fa-solid fa-layer-group" style="color: #f59e0b;"></i> </h4><div id="triple-stream-actions"></div></div><div class="triple-stream-grid" id="triple-cards-grid"></div>;
  feedList.innerHTML = '';
  feedList.appendChild(wrapper);
}

async function pollJob(jobId, type) {
  let isSuccess = false;
  let lastProcessedCount = 0;
  
  while (isGenerating && currentJobId === jobId) {
    try {
      const res = await fetch(/api/job-status/);
      if (!res.ok) { await new Promise(r => setTimeout(r, 3000)); continue; }
      const data = await res.json();
      
      if (type === 'single') {
          if (data.status.startsWith('Beklemede')) {
             if (loadingStatus) loadingStatus.textContent = ⏳ Sırada bekleniyor... (Sıranız: );
          } else if (data.status === 'Üretiliyor') {
             if (loadingStatus) loadingStatus.textContent = '🎨 Üretiliyor... Lütfen bekleyin.';
          } else if (data.status === 'Tamamlandı') {
             isSuccess = true;
             addStudioImageToFeed(data.result.image, data.result.modelUsed, data.result.keyUsedLabel, true);
             showToast('Görsel başarıyla üretildi!');
             
             // Add notification
             notificationsArray.unshift({
                id: Date.now(), groupId: 'single', imageId: data.result.imageId,
                text: 1 görsel üretildi., time: new Date().toLocaleTimeString()
             });
             saveNotifications();
             await fetchImages();
             break;
          } else if (data.status === 'Hata' || data.status === 'İptal Edildi') {
             throw new Error(data.result?.error || data.status);
          }
      } 
      else if (type === 'triple') {
          if (data.result && data.result.progress) {
             // update cards dynamically
             const successes = data.result.progress;
             const failures = data.result.failures || [];
             
             for (let item of successes) {
                const card = document.getElementById(card-site-);
                if (card && card.querySelector('.card-loader')) {
                   card.innerHTML = <img src="" style="width:100%; height:240px; object-fit:cover; border-radius:10px; cursor:pointer;" onclick="openTripleGroupModal('')" />
                   <div style="display:flex; justify-content:space-between; align-items:center; margin-top:12px;">
                     <h5 style="color:#fff; margin:0;"><i class="fa-solid fa-check" style="color:var(--color-primary);"></i> </h5>
                   </div>;
                }
             }
             for (let item of failures) {
                const card = document.getElementById(card-site-);
                if (card && card.querySelector('.card-loader')) {
                   card.innerHTML = <div style="width:100%; height:240px; background:rgba(239,68,68,0.1); border:1px solid rgba(239,68,68,0.3); border-radius:10px; display:flex; flex-direction:column; justify-content:center; align-items:center; padding:20px; text-align:center;">
                     <i class="fa-solid fa-triangle-exclamation" style="font-size:2rem; color:var(--color-danger); margin-bottom:10px;"></i>
                     <span style="font-size:0.85rem; color:#ccc;"></span>
                   </div>
                   <h5 style="margin-top:12px; color:#fff;"><i class="fa-solid fa-xmark" style="color:var(--color-danger);"></i> </h5>;
                }
             }
             
             if (data.status === 'Tamamlandı' || data.result.isCompleted) {
                 isSuccess = true;
                 if (successes.length > 0) {
                     showToast(Çoklu üretim tamamlandı! ( başarılı));
                     notificationsArray.unshift({
                        id: Date.now(), groupId: data.result.groupId,
                        text: ${successes.length} görsel üretildi., time: new Date().toLocaleTimeString()
                     });
                     saveNotifications();
                 }
                 const actions = document.getElementById('triple-stream-actions');
                 if(actions && successes.length > 0) {
                     actions.innerHTML = <button class="action-btn primary-btn" onclick="openTripleGroupModal('')" style="padding: 6px 12px; font-size:0.85rem;"><i class="fa-solid fa-expand"></i> Sonuçları Büyüt</button>;
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
      const res = await fetch(/api/job-status/);
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
          
          showToast('Arka planda devam eden üretiminiz yüklendi.', 'info');
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
'''

js += '\\n' + new_functions

with open('wwwroot/js/app.js', 'w', encoding='utf-8') as f:
    f.write(js)
