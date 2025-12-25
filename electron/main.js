import { app, BrowserWindow } from 'electron';
import path from 'path';
import { fileURLToPath } from 'url';
import { setupIpcHandlers } from './ipcHandlers.js';
import { setupFileHandlers } from './fileHandlers.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Initialize IPC Handlers
setupIpcHandlers();
setupFileHandlers();

function createWindow() {
    const win = new BrowserWindow({
        width: 1200,
        height: 800,
        webPreferences: {
            preload: path.join(__dirname, 'preload.cjs'),
            // Security Hardening
            nodeIntegration: false, // Disable Node in renderer
            contextIsolation: true, // Enable isolation
            webSecurity: true // Enable CORS protection
        },
    });

    // Remove the default menu bar
    win.removeMenu();

    // Check if we are in development mode
    const isDev = process.env.NODE_ENV === 'development';

    if (isDev) {
        win.loadURL('http://localhost:3000');
        // Open the DevTools.
        win.webContents.openDevTools();
    } else {
        // In production, load the index.html from the build directory
        // Adjusted path assuming electron/main.js is one level deep from root
        win.loadFile(path.join(__dirname, '../dist/index.html'));
    }
}

app.whenReady().then(() => {
    createWindow();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) {
            createWindow();
        }
    });
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});
