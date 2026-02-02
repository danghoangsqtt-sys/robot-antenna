import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'node:path';
import { fileURLToPath } from 'node:url'; // Cần thêm module này

// -----------------------------------------------------------------------------
// SỬA LỖI 1: Tự tạo __dirname và __filename cho môi trường ES Module
// -----------------------------------------------------------------------------
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// The built directory structure
process.env.DIST = path.join(__dirname, '../dist');
process.env.VITE_PUBLIC = app.isPackaged ? process.env.DIST : path.join(__dirname, '../public');

let mainWindow: BrowserWindow | null = null;
const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL'];

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    icon: path.join(process.env.VITE_PUBLIC, 'electron-vite.svg'),
    webPreferences: {
      // -----------------------------------------------------------------------
      // SỬA LỖI 2: Cập nhật đường dẫn preload khớp với log build (.mjs)
      // Log của bạn hiển thị: dist-electron/preload.mjs
      // -----------------------------------------------------------------------
      preload: path.join(__dirname, 'preload.mjs'), 
      nodeIntegration: true,
      contextIsolation: false,
      // [FIX] Disable webSecurity to allow Renderer process to fetch from external APIs without CORS blocking.
      // This is safe for internal Electron tools and is required for API calls from the renderer to services like Google GenAI.
      webSecurity: false,
    },
    titleBarStyle: 'hiddenInset',
    backgroundColor: '#0b1220', 
  });

  if (VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(path.join(process.env.DIST, 'index.html'));
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

app.whenReady().then(createWindow);

// IPC Example
ipcMain.handle('save-file', async (event, data) => {
  console.log("Saving file...", data);
  return { success: true };
});