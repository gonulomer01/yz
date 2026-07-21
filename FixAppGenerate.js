const fs = require('fs');
const path = 'c:/Dosyalar/Staj/yz/wwwroot/js/app.js';
let text = fs.readFileSync(path, 'utf8');

const oldSuccessBlock = `      const data = await res.json();
      if (data.success) {
        addStudioImageToFeed(data.image, data.modelUsed, data.keyUsedLabel, true);
        showToast('Görsel başarıyla üretildi!');
  
        await fetchImages();
        if (isAdmin) await fetchKeys();
      }`;

const newSuccessBlock = `      const data = await res.json();
      if (data.success) {
        if (data.multiMode && data.results) {
            // Triple AI Selection Modal
            const container = document.getElementById('triple-results-container');
            if (container) {
                container.innerHTML = '';
                data.results.forEach(res => {
                    const col = document.createElement('div');
                    col.className = 'col-md-4';
                    col.innerHTML = \`
                        <div class="card bg-secondary border-0 h-100 shadow">
                            <img src="\${res.image}" class="card-img-top" alt="Generated" style="object-fit:cover; height:250px;">
                            <div class="card-body d-flex flex-column">
                                <h6 class="card-title text-light">\${res.modelUsed}</h6>
                                <p class="small text-white-50 mb-3">\${res.sourceSite.toUpperCase()}</p>
                                <div class="mt-auto d-grid gap-2">
                                    <a href="\${res.image}" download class="btn btn-sm btn-outline-light"><i class="fas fa-download me-2"></i>İndir</a>
                                    <button class="btn btn-sm btn-warning" onclick="selectTripleImage('\${data.groupId}', \${res.imageId})"><i class="fas fa-check-circle me-2"></i>Bunu Seç ve Kaydet</button>
                                </div>
                            </div>
                        </div>
                    \`;
                    container.appendChild(col);
                });
                
                const tripleModal = new bootstrap.Modal(document.getElementById('tripleSelectionModal'));
                tripleModal.show();
                showToast('Üçlü üretim tamamlandı, lütfen görsel seçin.');
            }
        } else {
            addStudioImageToFeed(data.image, data.modelUsed, data.keyUsedLabel, true);
            showToast('Görsel başarıyla üretildi!');
      
            await fetchImages();
            if (isAdmin) await fetchKeys();
        }
      }`;

// We will use replace with string matching or regex. The problem is Turkish characters and whitespace.
// Instead of replacing the whole block, I'll inject the code via index.
const insertionMarker = `const data = await res.json();`;
let insertIndex = text.indexOf(insertionMarker);
if (insertIndex > -1) {
    // Find the end of the `if (data.success) { ... }` block manually
    let blockStart = text.indexOf(`if (data.success) {`, insertIndex);
    if (blockStart > -1) {
        let blockEnd = text.indexOf(`}`, blockStart); // this might just match the end of if block
        
        let oldBlock = text.substring(blockStart, text.indexOf('catch (err)', blockStart));
        
        const newBlock = `if (data.success) {
        if (data.multiMode && data.results) {
            const container = document.getElementById('triple-results-container');
            if (container) {
                container.innerHTML = '';
                data.results.forEach(res => {
                    const col = document.createElement('div');
                    col.className = 'col-md-4';
                    col.innerHTML = \`
                        <div class="card bg-secondary border-0 h-100 shadow">
                            <img src="\${res.image}" class="card-img-top" alt="Generated" style="object-fit:cover; height:250px;">
                            <div class="card-body d-flex flex-column">
                                <h6 class="card-title text-light">\${res.modelUsed}</h6>
                                <p class="small text-white-50 mb-3">\${res.sourceSite.toUpperCase()}</p>
                                <div class="mt-auto d-grid gap-2">
                                    <a href="\${res.image}" download class="btn btn-sm btn-outline-light"><i class="fas fa-download me-2"></i>İndir</a>
                                    <button class="btn btn-sm btn-warning" onclick="selectTripleImage('\${data.groupId}', \${res.imageId})"><i class="fas fa-check-circle me-2"></i>Bunu Seç ve Kaydet</button>
                                </div>
                            </div>
                        </div>
                    \`;
                    container.appendChild(col);
                });
                
                const tripleModal = new bootstrap.Modal(document.getElementById('tripleSelectionModal'));
                tripleModal.show();
                showToast('Üretim tamamlandı, lütfen görsel seçin.');
            }
        } else {
            addStudioImageToFeed(data.image, data.modelUsed, data.keyUsedLabel, true);
            showToast('Görsel başarıyla üretildi!');
            await fetchImages();
            if (isAdmin) await fetchKeys();
        }
      }
    } `;
        
        text = text.replace(oldBlock, newBlock);
    }
}

// Also add the selectTripleImage function
const selectFunction = `
async function selectTripleImage(groupId, imageId) {
    try {
        const res = await fetch(\`/api/images/select/\${groupId}/\${imageId}\`, { method: 'POST' });
        if (res.ok) {
            showToast('Görsel seçildi ve kaydedildi!');
            const modalEl = document.getElementById('tripleSelectionModal');
            const modal = bootstrap.Modal.getInstance(modalEl);
            if (modal) modal.hide();
            
            // Reload page or fetchImages to show it
            window.location.reload();
        } else {
            const err = await res.json();
            alert(err.error || 'Hata oluştu.');
        }
    } catch (e) {
        alert('Bağlantı hatası.');
    }
}
`;
text = text + selectFunction;

fs.writeFileSync(path, text, 'utf8');
console.log("app.js handleGenerate updated!");