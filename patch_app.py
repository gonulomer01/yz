import re

with open('wwwroot/js/app.js', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. Update toggleNotificationDropdown to mark as read
content = content.replace(
    '''window.toggleNotificationDropdown = function(e) {
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
  };''',
    '''window.toggleNotificationDropdown = function(e) {
      if (e) e.stopPropagation();
      const dropdown = document.getElementById('notification-dropdown-menu');
      const userDropdown = document.getElementById('user-dropdown-menu');
      if (userDropdown) userDropdown.style.display = 'none';
      
      // Bildirimleri okundu isaretle
      if (unreadNotificationCount > 0) {
          notificationsArray.forEach(n => n.unread = false);
          saveNotifications();
      }
      
      if (dropdown) {
        if (dropdown.style.display === 'block') {
          dropdown.style.display = 'none';
        } else {
          dropdown.style.display = 'block';
        }
      }
  };'''
)

# 2. Update updateNotificationBadge to count unread
content = content.replace(
    '''function updateNotificationBadge(count) {
    unreadNotificationCount = count;
    const badgeTop = document.getElementById('top-notif-count');
    if (unreadNotificationCount > 0) {
      if (badgeTop) { badgeTop.style.display = 'inline-block'; badgeTop.textContent = unreadNotificationCount; }
    } else {
      if (badgeTop) { badgeTop.style.display = 'none'; }
    }
  }''',
    '''function updateNotificationBadge() {
    unreadNotificationCount = notificationsArray.filter(n => n.unread !== false).length;
    const badgeTop = document.getElementById('top-notif-count');
    if (unreadNotificationCount > 0) {
      if (badgeTop) { badgeTop.style.display = 'inline-block'; badgeTop.textContent = unreadNotificationCount; }
    } else {
      if (badgeTop) { badgeTop.style.display = 'none'; }
    }
  }'''
)

# 3. Update updateNotificationBadge calls
content = content.replace('updateNotificationBadge(notificationsArray.length);', 'updateNotificationBadge();')

# 4. Update saveNotifications and createNotification (new notifications need unread: true)
content = content.replace(
    '''window.saveNotifications = function() {
      localStorage.setItem('yz_notifications', JSON.stringify(notificationsArray));
      updateNotificationBadge();
  };''',
    '''window.saveNotifications = function() {
      localStorage.setItem('yz_notifications', JSON.stringify(notificationsArray));
      updateNotificationBadge();
  };
  window.deleteNotification = function(e, id) {
      e.stopPropagation();
      notificationsArray = notificationsArray.filter(n => n.id !== id);
      saveNotifications();
      renderNotifications();
  };'''
)

content = content.replace(
    '''                  notificationsArray.unshift({
                    id: Date.now(),
                    groupId: groupId || 'multi',
                    text: \ görsel üretildi.,
                    time: new Date().toLocaleTimeString()
                  });''',
    '''                  notificationsArray.unshift({
                    id: Date.now(),
                    groupId: groupId || 'multi',
                    text: \ görsel üretildi.,
                    time: new Date().toLocaleTimeString(),
                    unread: true
                  });'''
)
content = content.replace(
    '''               notificationsArray.unshift({
                 id: Date.now(),
                 groupId: groupId || 'single',
                 imageId: initialJobData.imageId,
                 text: 1 görsel üretildi., time: new Date().toLocaleTimeString()
               });''',
    '''               notificationsArray.unshift({
                 id: Date.now(),
                 groupId: groupId || 'single',
                 imageId: initialJobData.imageId,
                 text: 1 görsel üretildi., time: new Date().toLocaleTimeString(),
                 unread: true
               });'''
)
content = content.replace(
    '''                       notificationsArray.unshift({
                         id: Date.now(),
                         groupId: groupId || 'multi',
                         text: \ görsel üretildi., time: new Date().toLocaleTimeString()
                       });''',
    '''                       notificationsArray.unshift({
                         id: Date.now(),
                         groupId: groupId || 'multi',
                         text: \ görsel üretildi., time: new Date().toLocaleTimeString(),
                         unread: true
                       });'''
)

# 5. Update renderNotifications to include delete button and readNotification logic
content = content.replace(
    '''window.renderNotifications = function() {
    const list = document.getElementById('top-notifications-list');
    const empty = document.getElementById('top-notifications-empty');
    if (!list || !empty) return;
    
    if (notificationsArray.length === 0) {
      empty.style.display = 'block';
      list.innerHTML = '';
      list.appendChild(empty);
    } else {
      empty.style.display = 'none';
      list.innerHTML = notificationsArray.map(n => 
        <div class="notification-item" onclick="readNotification(\, '\', \)" style="padding: 12px 15px; border-bottom: 1px solid var(--border-color); cursor: pointer; display: flex; justify-content: space-between; align-items: center; transition: background 0.2s;">
          <div>
            <strong style="color:var(--text-main); font-weight:700; font-size: 0.9rem;">\</strong>
            <div style="font-size:0.75rem; color:var(--text-muted); margin-top:3px;"><i class="fa-regular fa-clock"></i> \</div>
          </div>
          <i class="fa-solid fa-chevron-right" style="color:var(--color-primary); opacity:0.7; font-size: 0.8rem;"></i>
        </div>
      ).join('');
    }
  };''',
    '''window.renderNotifications = function() {
    const list = document.getElementById('top-notifications-list');
    const empty = document.getElementById('top-notifications-empty');
    if (!list || !empty) return;
    
    if (notificationsArray.length === 0) {
      empty.style.display = 'block';
      list.innerHTML = '';
      list.appendChild(empty);
    } else {
      empty.style.display = 'none';
      list.innerHTML = notificationsArray.map(n => 
        <div class="notification-item \" onclick="readNotification(\, '\', \)" style="padding: 12px 15px; border-bottom: 1px solid var(--border-color); cursor: pointer; display: flex; justify-content: space-between; align-items: center; transition: background 0.2s; background: \;">
          <div style="flex:1;">
            <strong style="color:var(--text-main); font-weight:700; font-size: 0.9rem;">\</strong>
            <div style="font-size:0.75rem; color:var(--text-muted); margin-top:3px;"><i class="fa-regular fa-clock"></i> \</div>
          </div>
          <button class="action-btn-sm danger-btn-sm" style="margin-left:10px; padding: 4px 8px;" onclick="deleteNotification(event, \)" title="Sil">
            <i class="fa-solid fa-xmark"></i>
          </button>
        </div>
      ).join('');
    }
  };'''
)
content = content.replace(
    '''  window.readNotification = function(id, groupId, imageId) {
    notificationsArray = notificationsArray.filter(n => n.id !== id);
    saveNotifications();
    renderNotifications();
    const dropdown = document.getElementById('notification-dropdown-menu');
    if (dropdown) dropdown.style.display = 'none';
    if (groupId && groupId !== 'single') {
        openTripleGroupModal(groupId);
    } else if (imageId) {
        // Find the image in the grid and click it
        const imgItem = document.querySelector(.gallery-item-img[data-id="\"]);
        if (imgItem) imgItem.click();
        else switchPage('studio');
    }
  };''',
    '''  window.readNotification = function(id, groupId, imageId) {
    const notif = notificationsArray.find(n => n.id === id);
    if(notif) notif.unread = false;
    saveNotifications();
    renderNotifications();
    const dropdown = document.getElementById('notification-dropdown-menu');
    if (dropdown) dropdown.style.display = 'none';
    if (groupId && groupId !== 'single') {
        openTripleGroupModal(groupId);
    } else if (imageId) {
        // Find the image in the grid and click it
        const imgItem = document.querySelector(.gallery-item-img[data-id="\"]);
        if (imgItem) imgItem.click();
        else switchPage('studio');
    }
  };'''
)

# 6. Update openAddImagesToCollectionModal and btnConfirmCollectionAdd logic for favorites
content = content.replace(
    '''function openAddImagesToCollectionModal(folderName) {
      collectionSelectMode = true;
      collectionSelectedImages = [];
      
      const overlay = document.getElementById('collectionAddModalOverlay');
      const container = document.getElementById('collectionAddGrid');
      if(!overlay || !container) return;
      
      const available = persistentImages.filter(i => i.folderName !== currentCollectionFolder);''',
    '''function openAddImagesToCollectionModal(folderName) {
      collectionSelectMode = true;
      collectionSelectedImages = [];
      
      const overlay = document.getElementById('collectionAddModalOverlay');
      const container = document.getElementById('collectionAddGrid');
      if(!overlay || !container) return;
      
      let available = [];
      if(folderName === '__favorites__') {
          available = persistentImages.filter(i => !i.isFavorite);
          currentCollectionFolder = '__favorites__';
      } else {
          available = persistentImages.filter(i => i.folderName !== currentCollectionFolder);
      }'''
)
content = content.replace(
    '''          try {
              for(const imgId of collectionSelectedImages) {
                  await fetch(/api/images/\/folder, {
                      method: 'PUT',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({ folderName: currentCollectionFolder })
                  });
                  const img = persistentImages.find(i => i.id === imgId);
                  if (img) img.folderName = currentCollectionFolder;
              }
              renderGallery();
              renderCollections();
              showToast(\ görsel koleksiyona eklendi.);
          } catch(err) {
              showToast('Hata oluþtu.', 'error');
          }''',
    '''          try {
              if (currentCollectionFolder === '__favorites__') {
                  for(const imgId of collectionSelectedImages) {
                      await fetch(/api/images/\/favorite, { method: 'PUT' });
                      const img = persistentImages.find(i => i.id === imgId);
                      if (img) img.isFavorite = true;
                  }
                  renderGallery();
                  renderFavorites();
                  showToast(\ görsel favorilere eklendi.);
              } else {
                  for(const imgId of collectionSelectedImages) {
                      await fetch(/api/images/\/folder, {
                          method: 'PUT',
                          headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ folderName: currentCollectionFolder })
                      });
                      const img = persistentImages.find(i => i.id === imgId);
                      if (img) img.folderName = currentCollectionFolder;
                  }
                  renderGallery();
                  renderCollections();
                  showToast(\ görsel koleksiyona eklendi.);
              }
          } catch(err) {
              showToast('Hata oluþtu.', 'error');
          }'''
)

# 7. Remove modal change logic that shows the banners
content = re.sub(r"document\.getElementById\('gemini-web-info'\)\.style\.display\s*=\s*.*?;\s*", "", content)
content = re.sub(r"document\.getElementById\('chatgpt-web-info'\)\.style\.display\s*=\s*.*?;\s*", "", content)
content = re.sub(r"document\.getElementById\('copilot-web-info'\)\.style\.display\s*=\s*.*?;\s*", "", content)
content = re.sub(r"document\.getElementById\('triple-ai-info'\)\.style\.display\s*=\s*.*?;\s*", "", content)


with open('wwwroot/js/app.js', 'w', encoding='utf-8') as f:
    f.write(content)

print("Patch applied to app.js")
