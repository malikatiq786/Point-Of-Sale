const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  // Platform info
  platform: process.platform,
  versions: process.versions,
  
  // App control
  minimize: () => ipcRenderer.invoke('minimize'),
  maximize: () => ipcRenderer.invoke('maximize'),
  close: () => ipcRenderer.invoke('close'),
  
  // Store operations
  store: {
    get: (key) => ipcRenderer.invoke('store-get', key),
    set: (key, val) => ipcRenderer.invoke('store-set', key, val),
    delete: (key) => ipcRenderer.invoke('store-delete', key)
  },
  
  // POS specific functions
  triggerBackup: () => {
    // This will be used by the menu to trigger database backup
    if (window.location.hash !== '#/settings') {
      window.location.hash = '#/settings';
      setTimeout(() => {
        // Trigger backup after navigating to settings
        const backupBtn = document.querySelector('[data-testid="backup-button"]');
        if (backupBtn) {
          backupBtn.click();
        }
      }, 1000);
    }
  },
  
  // Check if running in Electron
  isElectron: true
});

// Prevent the renderer process from accessing Node.js
delete window.require;
delete window.exports;
delete window.module;