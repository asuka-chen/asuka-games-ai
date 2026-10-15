const { app, BrowserWindow, Menu } = require('electron');
const path = require('node:path');
app.whenReady().then(() => {
  Menu.setApplicationMenu(null);
  const window = new BrowserWindow({
    title: '星渊：无限火力', width: 1440, height: 960,
    minWidth: 1100, minHeight: 720, backgroundColor: '#060c17',
    webPreferences: { nodeIntegration: false, contextIsolation: true, sandbox: true }
  });
  window.webContents.setWindowOpenHandler(() => ({ action: 'deny' }));
  window.webContents.on('will-navigate', (event) => event.preventDefault());
  window.loadFile(path.join(__dirname, '..', 'star-abyss', 'index.html'));
  window.on('closed', () => app.quit());
});
app.on('window-all-closed', () => app.quit());
