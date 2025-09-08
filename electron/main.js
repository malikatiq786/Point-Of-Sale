const { app, BrowserWindow, Menu, shell, dialog, ipcMain } = require('electron');
const path = require('path');
const isDev = require('electron-is-dev');
const { spawn } = require('child_process');
const Store = require('electron-store');
const fs = require('fs');

// Initialize electron store for app settings
const store = new Store();

let mainWindow;
let serverProcess;
let dbProcess;

const createWindow = () => {
  // Create the browser window
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1200,
    minHeight: 700,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      webSecurity: true,
      preload: path.join(__dirname, 'preload.js')
    },
    icon: path.join(__dirname, 'assets', 'icon.png'),
    show: false,
    titleBarStyle: 'default',
    autoHideMenuBar: true // Hide menu bar but allow Alt to show it
  });

  // Load the app
  const startUrl = isDev 
    ? 'http://localhost:5000' 
    : 'http://localhost:5000'; // Always load from local server
  
  mainWindow.loadURL(startUrl);

  // Show window when ready to prevent visual flash
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    
    // Focus on window (for Windows)
    if (process.platform === 'win32') {
      mainWindow.focus();
    }
  });

  // Handle window closed
  mainWindow.on('closed', () => {
    mainWindow = null;
  });

  // Handle external links
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    shell.openExternal(url);
    return { action: 'deny' };
  });

  // Set up custom menu for POS system
  createCustomMenu();
};

const createCustomMenu = () => {
  const template = [
    {
      label: 'File',
      submenu: [
        {
          label: 'New Sale',
          accelerator: 'CmdOrCtrl+N',
          click: () => {
            mainWindow.webContents.executeJavaScript('window.location.hash = "#/pos"');
          }
        },
        { type: 'separator' },
        {
          label: 'Backup Database',
          click: () => {
            mainWindow.webContents.executeJavaScript('window.electronAPI?.triggerBackup?.()');
          }
        },
        { type: 'separator' },
        {
          label: 'Exit',
          accelerator: process.platform === 'darwin' ? 'Cmd+Q' : 'Ctrl+Q',
          click: () => {
            app.quit();
          }
        }
      ]
    },
    {
      label: 'View',
      submenu: [
        {
          label: 'Dashboard',
          accelerator: 'CmdOrCtrl+1',
          click: () => {
            mainWindow.webContents.executeJavaScript('window.location.hash = "#/"');
          }
        },
        {
          label: 'Products',
          accelerator: 'CmdOrCtrl+2',
          click: () => {
            mainWindow.webContents.executeJavaScript('window.location.hash = "#/products"');
          }
        },
        {
          label: 'Sales',
          accelerator: 'CmdOrCtrl+3',
          click: () => {
            mainWindow.webContents.executeJavaScript('window.location.hash = "#/sales"');
          }
        },
        { type: 'separator' },
        {
          label: 'Reload',
          accelerator: 'CmdOrCtrl+R',
          click: () => {
            mainWindow.reload();
          }
        },
        {
          label: 'Toggle Developer Tools',
          accelerator: process.platform === 'darwin' ? 'Alt+Cmd+I' : 'Ctrl+Shift+I',
          click: () => {
            mainWindow.webContents.toggleDevTools();
          }
        }
      ]
    },
    {
      label: 'Window',
      submenu: [
        {
          label: 'Minimize',
          accelerator: 'CmdOrCtrl+M',
          role: 'minimize'
        },
        {
          label: 'Close',
          accelerator: 'CmdOrCtrl+W',
          role: 'close'
        }
      ]
    },
    {
      label: 'Help',
      submenu: [
        {
          label: 'About POS System',
          click: () => {
            dialog.showMessageBox(mainWindow, {
              type: 'info',
              title: 'About POS System',
              message: 'Universal POS System v1.0.0',
              detail: 'A comprehensive Point of Sale system for retail businesses.\n\nBuilt with Electron, React, and PostgreSQL.',
              buttons: ['OK']
            });
          }
        }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
};

// Start embedded PostgreSQL
const startDatabase = () => {
  return new Promise((resolve, reject) => {
    try {
      const userDataPath = app.getPath('userData');
      const dbPath = path.join(userDataPath, 'database');
      const dbDataPath = path.join(dbPath, 'data');
      
      // Ensure database directory exists
      if (!fs.existsSync(dbPath)) {
        fs.mkdirSync(dbPath, { recursive: true });
      }
      
      // Initialize database if first run
      if (!fs.existsSync(dbDataPath)) {
        console.log('Initializing database for first run...');
        initializeDatabase(dbPath, dbDataPath)
          .then(() => {
            startPostgreSQL(dbPath, resolve, reject);
          })
          .catch(reject);
      } else {
        startPostgreSQL(dbPath, resolve, reject);
      }
    } catch (error) {
      reject(error);
    }
  });
};

const initializeDatabase = (dbPath, dbDataPath) => {
  return new Promise((resolve, reject) => {
    const postgresPath = getPostgresPath();
    
    console.log('Initializing PostgreSQL database...');
    
    const initProcess = spawn(path.join(postgresPath, getExecutableName('initdb')), [
      '-D', dbDataPath,
      '-U', 'postgres',
      '--auth-local=trust',
      '--auth-host=md5',
      '--encoding=UTF8'
    ]);

    initProcess.stdout.on('data', (data) => {
      console.log(`InitDB: ${data}`);
    });

    initProcess.stderr.on('data', (data) => {
      console.log(`InitDB: ${data}`);
    });

    initProcess.on('close', (code) => {
      if (code === 0) {
        console.log('Database initialized successfully');
        importInitialData(dbPath, dbDataPath)
          .then(resolve)
          .catch(reject);
      } else {
        reject(new Error(`Database initialization failed with code ${code}`));
      }
    });
  });
};

const importInitialData = (dbPath, dbDataPath) => {
  return new Promise((resolve, reject) => {
    // Start PostgreSQL temporarily to import data
    const postgresPath = getPostgresPath();
    const tempDbProcess = spawn(path.join(postgresPath, getExecutableName('postgres')), [
      '-D', dbDataPath,
      '-p', '5433', // Use different port for initialization
      '-k', dbPath
    ]);

    // Wait for PostgreSQL to start, then import data
    setTimeout(() => {
      const backupPath = path.join(process.resourcesPath, 'database-backup', 'init.sql');
      
      if (fs.existsSync(backupPath)) {
        console.log('Importing initial database data...');
        
        const psqlProcess = spawn(path.join(postgresPath, getExecutableName('psql')), [
          '-h', 'localhost',
          '-p', '5433',
          '-U', 'postgres',
          '-d', 'postgres',
          '-f', backupPath
        ]);

        psqlProcess.on('close', (code) => {
          tempDbProcess.kill();
          if (code === 0) {
            console.log('Initial data imported successfully');
            resolve();
          } else {
            console.log('No initial data to import, proceeding...');
            resolve(); // Continue even if import fails
          }
        });
      } else {
        tempDbProcess.kill();
        console.log('No initial data file found, proceeding...');
        resolve();
      }
    }, 3000);
  });
};

const startPostgreSQL = (dbPath, resolve, reject) => {
  const postgresPath = getPostgresPath();
  const dbDataPath = path.join(dbPath, 'data');
  
  console.log(`Starting PostgreSQL from: ${postgresPath}`);
  
  dbProcess = spawn(path.join(postgresPath, getExecutableName('postgres')), [
    '-D', dbDataPath,
    '-p', '5432',
    '-k', dbPath,
    '-c', 'log_statement=none',
    '-c', 'log_min_messages=warning'
  ]);

  dbProcess.stdout.on('data', (data) => {
    console.log(`PostgreSQL: ${data}`);
  });

  dbProcess.stderr.on('data', (data) => {
    const message = data.toString();
    console.log(`PostgreSQL: ${message}`);
    
    if (message.includes('ready to accept connections')) {
      console.log('PostgreSQL is ready');
      resolve();
    }
  });

  dbProcess.on('close', (code) => {
    console.log(`PostgreSQL exited with code ${code}`);
  });

  dbProcess.on('error', (error) => {
    console.error('PostgreSQL error:', error);
    reject(error);
  });

  // Fallback timeout
  setTimeout(() => {
    console.log('PostgreSQL startup timeout reached, assuming ready');
    resolve();
  }, 8000);
};

const getPostgresPath = () => {
  if (isDev) {
    // In development, try to use system PostgreSQL or bundled version
    const devPostgresPath = path.join(__dirname, '..', 'postgres', 'bin');
    if (fs.existsSync(devPostgresPath)) {
      return devPostgresPath;
    }
    return '/usr/bin'; // System PostgreSQL
  } else {
    // In production, use bundled PostgreSQL
    return path.join(process.resourcesPath, 'postgres', 'bin');
  }
};

const getExecutableName = (baseName) => {
  return process.platform === 'win32' ? `${baseName}.exe` : baseName;
};

// Start Express server
const startServer = () => {
  return new Promise((resolve, reject) => {
    const serverPath = isDev 
      ? path.join(__dirname, '..', 'server', 'index.ts')
      : path.join(process.resourcesPath, 'server', 'index.js');

    const nodeCommand = isDev ? 'tsx' : 'node';
    
    console.log(`Starting server: ${nodeCommand} ${serverPath}`);
    
    serverProcess = spawn(nodeCommand, [serverPath], {
      env: {
        ...process.env,
        NODE_ENV: isDev ? 'development' : 'production',
        DATABASE_URL: 'postgresql://postgres@localhost:5432/postgres',
        PORT: '5000'
      }
    });

    serverProcess.stdout.on('data', (data) => {
      console.log(`Server: ${data}`);
      if (data.includes('serving on port')) {
        console.log('Express server is ready');
        resolve();
      }
    });

    serverProcess.stderr.on('data', (data) => {
      console.error(`Server Error: ${data}`);
    });

    serverProcess.on('close', (code) => {
      console.log(`Server exited with code ${code}`);
    });

    serverProcess.on('error', (error) => {
      console.error('Server error:', error);
      reject(error);
    });

    // Fallback timeout
    setTimeout(() => {
      console.log('Server startup timeout reached, assuming ready');
      resolve();
    }, 10000);
  });
};

// IPC handlers for preload script
ipcMain.handle('minimize', () => {
  mainWindow.minimize();
});

ipcMain.handle('maximize', () => {
  if (mainWindow.isMaximized()) {
    mainWindow.unmaximize();
  } else {
    mainWindow.maximize();
  }
});

ipcMain.handle('close', () => {
  mainWindow.close();
});

ipcMain.handle('store-get', (event, key) => {
  return store.get(key);
});

ipcMain.handle('store-set', (event, key, val) => {
  store.set(key, val);
});

ipcMain.handle('store-delete', (event, key) => {
  store.delete(key);
});

// App event handlers
app.whenReady().then(async () => {
  try {
    console.log('Starting POS System...');
    
    // Show loading dialog
    const loadingWindow = new BrowserWindow({
      width: 400,
      height: 300,
      frame: false,
      alwaysOnTop: true,
      transparent: true,
      webPreferences: {
        nodeIntegration: false
      }
    });
    
    loadingWindow.loadURL(`data:text/html;charset=utf-8,
      <html>
        <body style="margin:0; padding:20px; background:rgba(255,255,255,0.95); font-family:Arial,sans-serif; text-align:center;">
          <div style="background:white; padding:30px; border-radius:10px; box-shadow:0 4px 12px rgba(0,0,0,0.2);">
            <h2 style="color:#333; margin-top:0;">Starting POS System...</h2>
            <div style="width:200px; height:4px; background:#e0e0e0; border-radius:2px; margin:20px auto;">
              <div style="width:0%; height:100%; background:#4CAF50; border-radius:2px; transition:width 0.3s;" id="progress"></div>
            </div>
            <p id="status" style="color:#666; margin-bottom:0;">Initializing...</p>
          </div>
          <script>
            let progress = 0;
            const updateProgress = (percent, text) => {
              document.getElementById('progress').style.width = percent + '%';
              document.getElementById('status').textContent = text;
            };
            
            setTimeout(() => updateProgress(25, 'Starting PostgreSQL...'), 500);
            setTimeout(() => updateProgress(50, 'Starting server...'), 3000);
            setTimeout(() => updateProgress(75, 'Loading interface...'), 6000);
            setTimeout(() => updateProgress(100, 'Ready!'), 8000);
          </script>
        </body>
      </html>
    `);
    
    // Start database first
    console.log('Starting PostgreSQL...');
    await startDatabase();
    
    // Then start the Express server
    console.log('Starting server...');
    await startServer();
    
    // Finally create the main window
    console.log('Creating main window...');
    createWindow();
    
    // Close loading window
    setTimeout(() => {
      loadingWindow.close();
    }, 2000);
    
    console.log('POS System ready!');
  } catch (error) {
    console.error('Failed to start POS System:', error);
    dialog.showErrorBox('Startup Error', `Failed to start POS System:\n\n${error.message}\n\nPlease try restarting the application.`);
    app.quit();
  }
});

app.on('window-all-closed', () => {
  // Stop all processes
  console.log('Shutting down POS System...');
  
  if (serverProcess) {
    serverProcess.kill();
  }
  if (dbProcess) {
    dbProcess.kill();
  }
  
  app.quit();
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// Security: Prevent new window creation
app.on('web-contents-created', (event, contents) => {
  contents.on('new-window', (event, navigationUrl) => {
    event.preventDefault();
    shell.openExternal(navigationUrl);
  });
});

// Handle app certificate errors for localhost
app.on('certificate-error', (event, webContents, url, error, certificate, callback) => {
  if (url.startsWith('http://localhost')) {
    event.preventDefault();
    callback(true);
  } else {
    callback(false);
  }
});