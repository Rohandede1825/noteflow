const { app, BrowserWindow, Menu, shell, nativeImage } = require('electron');
const path = require('path');
const http = require('http');

// Crucial: Set App User Model ID so Windows Taskbar pins, groups, and displays NoteFlow custom icon
if (process.platform === 'win32') {
  app.setAppUserModelId('com.noteflow.app');
}

let mainWindow = null;
let serverInstance = null;

// Determine if we are in production / packaged build
const isDev = !app.isPackaged;
const PORT = process.env.PORT || 5000;

// Start embedded backend server
function startServer() {
  try {
    // Set environment
    process.env.NODE_ENV = isDev ? 'development' : 'production';
    process.env.PORT = PORT.toString();

    // Require the backend server directly in the main Node process
    const backendServer = require('../backend/src/server.js');
    console.log('[Electron] Embedded NoteFlow backend initialized.');
  } catch (err) {
    console.error('[Electron] Error starting backend server:', err.message);
  }
  
}

function waitForServer(url, timeout = 10000) {
  const start = Date.now();
  return new Promise((resolve, reject) => {
    const check = () => {
      http.get(url, (res) => {
        if (res.statusCode >= 200 && res.statusCode < 400) {
          resolve(true);
        } else {
          retry();
        }
      }).on('error', () => {
        retry();
      });
    };

    const retry = () => {
      if (Date.now() - start > timeout) {
        // Fallback: resolve anyway to allow window to open
        resolve(false);
      } else {
        setTimeout(check, 300);
      }
    };

    check();
  });
}

async function createWindow() {
  const iconPath = process.platform === 'win32'
    ? path.join(__dirname, 'assets/icon.ico')
    : path.join(__dirname, 'assets/icon.png');
  const windowIcon = nativeImage.createFromPath(iconPath);

  mainWindow = new BrowserWindow({
    width: 1360,
    height: 880,
    minWidth: 960,
    minHeight: 600,
    title: 'NoteFlow',
    icon: windowIcon,
    backgroundColor: '#17181C',
    autoHideMenuBar: true,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      spellcheck: false,
      webSecurity: true
    }
  });

  Menu.setApplicationMenu(null);

  // Wait for local server
  const healthUrl = `http://localhost:${PORT}/api/health`;
  await waitForServer(healthUrl, 6000);

  // Load the application
  mainWindow.loadURL(`http://localhost:${PORT}`);

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    mainWindow.focus();
  });

  // Open external links in default browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http:') || url.startsWith('https:')) {
      shell.openExternal(url);
    }
    return { action: 'deny' };
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// App lifecycle
app.whenReady().then(async () => {
  if (process.platform === 'win32') {
    app.setAppUserModelId('com.noteflow.app');
  }

  startServer();
  await createWindow();

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
