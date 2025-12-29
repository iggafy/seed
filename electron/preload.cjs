const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('api', {
    // Versions
    versions: {
        node: process.versions.node,
        chrome: process.versions.chrome,
        electron: process.versions.electron,
    },
    // AI Request Bridge
    aiRequest: (payload) => ipcRenderer.invoke('ai:generate', payload),

    // Terminal Logging
    log: (message) => ipcRenderer.invoke('log:terminal', message),

    // Persistence Layer
    db: {
        saveSeed: (seed) => ipcRenderer.invoke('seed:save', seed),
        loadSeed: (id) => ipcRenderer.invoke('seed:load', id),
        listSeeds: () => ipcRenderer.invoke('seed:list'),
        deleteSeed: (id) => ipcRenderer.invoke('seed:delete', id)
    }
});
