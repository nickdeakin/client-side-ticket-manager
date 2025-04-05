import { app, BrowserWindow } from 'electron';
import path from 'path';

function createWindow() {
    const win = new BrowserWindow({
        width: 1200,
        height: 900,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
        },
    });

    // Load the local index.html file directly
    win.loadFile(path.join(__dirname, 'public', 'index.html'));

    // Optional: Open DevTools for debugging
    // win.webContents.openDevTools();
}

app.whenReady().then(() => {
    createWindow();
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') app.quit();
});