const fs = require('fs');
const path = 'c:/Dosyalar/Staj/yz/Views/Home/Index.cshtml';
let text = fs.readFileSync(path, 'utf8');

// 1. Fix the Tabs in Management Panel
const oldTabs = `<ul class="nav nav-tabs admin-tabs" id="adminTabs" role="tablist">
                    <li class="nav-item" role="presentation">
                        <button class="nav-link active" id="keys-tab" data-bs-toggle="tab" data-bs-target="#keys" type="button" role="tab"><i class="fas fa-key me-2"></i>API Anahtarları</button>
                    </li>
                    <li class="nav-item" role="presentation">
                        <button class="nav-link" id="gemini-tab" data-bs-toggle="tab" data-bs-target="#gemini" type="button" role="tab"><i class="fab fa-google me-2"></i>Web AI Profilleri</button>
                    </li>
                </ul>`;

const newTabs = `<ul class="nav nav-tabs admin-tabs" id="adminTabs" role="tablist">
                    <li class="nav-item" role="presentation">
                        <button class="nav-link active" id="keys-tab" data-bs-toggle="tab" data-bs-target="#keys" type="button" role="tab"><i class="fas fa-key me-2"></i>API Anahtarları</button>
                    </li>
                    <li class="nav-item" role="presentation">
                        <button class="nav-link" id="gemini-tab" data-bs-toggle="tab" data-bs-target="#gemini" type="button" role="tab"><i class="fab fa-google me-2"></i>Gemini</button>
                    </li>
                    <li class="nav-item" role="presentation">
                        <button class="nav-link" id="chatgpt-tab" data-bs-toggle="tab" data-bs-target="#chatgpt" type="button" role="tab"><i class="fas fa-robot me-2"></i>ChatGPT</button>
                    </li>
                    <li class="nav-item" role="presentation">
                        <button class="nav-link" id="copilot-tab" data-bs-toggle="tab" data-bs-target="#copilot" type="button" role="tab"><i class="fab fa-microsoft me-2"></i>Copilot</button>
                    </li>
                </ul>`;

if (text.includes(oldTabs.replace(/\n/g, '\r\n'))) {
    text = text.replace(oldTabs.replace(/\n/g, '\r\n'), newTabs.replace(/\n/g, '\r\n'));
} else if (text.includes(oldTabs)) {
    text = text.replace(oldTabs, newTabs);
}

// 2. Fix the Tab Contents
const geminiTabEnd = `                            </tbody>
                        </table>
                    </div>
                </div>`;

const extraTabsContent = `
                <!-- ChatGPT Hesapları Sekmesi -->
                <div class="tab-pane fade" id="chatgpt" role="tabpanel">
                    <div class="d-flex justify-content-between align-items-center mb-4">
                        <div>
                            <h5 class="mb-1"><i class="fas fa-robot text-success me-2"></i>ChatGPT Web (DALL-E) Hesapları</h5>
                            <p class="text-muted small mb-0">ChatGPT web arayüzü üzerinden ücretsiz resim üretimi için kullanılacak Google/Microsoft hesap profillerini ayarlayın.</p>
                        </div>
                        <button class="btn btn-success" onclick="addChatGptAccount()"><i class="fas fa-plus me-2"></i>Yeni Profil Ekle</button>
                    </div>
                    
                    <div class="table-responsive bg-white rounded-3 shadow-sm">
                        <table class="table table-hover align-middle mb-0" id="chatgpt-accounts-table">
                            <thead class="table-light">
                                <tr>
                                    <th width="50">ID</th>
                                    <th>Profil (Klasör) Adı</th>
                                    <th>Hesap Etiketi</th>
                                    <th>Durum</th>
                                    <th>Son Kullanım</th>
                                    <th width="250" class="text-end">İşlemler</th>
                                </tr>
                            </thead>
                            <tbody>
                                <!-- ChatGPT accounts loaded via JS -->
                            </tbody>
                        </table>
                    </div>
                </div>

                <!-- Copilot Hesapları Sekmesi -->
                <div class="tab-pane fade" id="copilot" role="tabpanel">
                    <div class="d-flex justify-content-between align-items-center mb-4">
                        <div>
                            <h5 class="mb-1"><i class="fab fa-microsoft text-info me-2"></i>Microsoft Copilot Hesapları</h5>
                            <p class="text-muted small mb-0">Bing/Copilot Designer üzerinden ücretsiz resim üretimi için kullanılacak Microsoft hesap profillerini ayarlayın.</p>
                        </div>
                        <button class="btn btn-info text-white" onclick="addCopilotAccount()"><i class="fas fa-plus me-2"></i>Yeni Profil Ekle</button>
                    </div>
                    
                    <div class="table-responsive bg-white rounded-3 shadow-sm">
                        <table class="table table-hover align-middle mb-0" id="copilot-accounts-table">
                            <thead class="table-light">
                                <tr>
                                    <th width="50">ID</th>
                                    <th>Profil (Klasör) Adı</th>
                                    <th>Hesap Etiketi</th>
                                    <th>Durum</th>
                                    <th>Son Kullanım</th>
                                    <th width="250" class="text-end">İşlemler</th>
                                </tr>
                            </thead>
                            <tbody>
                                <!-- Copilot accounts loaded via JS -->
                            </tbody>
                        </table>
                    </div>
                </div>`;

const searchEnd = geminiTabEnd.replace(/\n/g, '\r\n');
if (text.includes(searchEnd)) {
    text = text.replace(searchEnd, searchEnd + '\r\n' + extraTabsContent.replace(/\n/g, '\r\n'));
} else if (text.includes(geminiTabEnd)) {
    text = text.replace(geminiTabEnd, geminiTabEnd + '\n' + extraTabsContent);
}

// 3. Add Selection Modal at the end of the file
const selectionModal = `
<!-- Triple Generation Selection Modal -->
<div class="modal fade" id="tripleSelectionModal" data-bs-backdrop="static" tabindex="-1" aria-hidden="true">
    <div class="modal-dialog modal-xl modal-dialog-centered">
        <div class="modal-content bg-dark text-light border-0 shadow-lg">
            <div class="modal-header border-secondary border-opacity-25">
                <h5 class="modal-title"><i class="fas fa-layer-group text-warning me-2"></i>Üçlü Üretim Sonuçları</h5>
            </div>
            <div class="modal-body p-4">
                <p class="text-muted mb-4">Üretim tamamlandı! Lütfen aşağıdan beğendiğiniz **bir adet** görseli seçip kaydedin. İsterseniz önce cihazınıza orijinal çözünürlükte indirebilirsiniz.</p>
                <div class="row g-4" id="triple-results-container">
                    <!-- Results injected here via JS -->
                </div>
            </div>
            <div class="modal-footer border-secondary border-opacity-25">
                <button type="button" class="btn btn-outline-light" onclick="window.location.reload()">İptal Et (Hiçbirini Kaydetme)</button>
            </div>
        </div>
    </div>
</div>
`;
text = text + '\r\n' + selectionModal;

fs.writeFileSync(path, text, 'utf8');
console.log("Index.cshtml updated!");