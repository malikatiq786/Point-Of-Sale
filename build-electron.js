const builder = require('electron-builder');
const fs = require('fs');
const path = require('path');

// Configuration for electron-builder
const config = {
  appId: 'com.universalpos.pos-system',
  productName: 'Universal POS System',
  copyright: 'Copyright © 2025 Universal POS System',
  directories: {
    buildResources: 'build-resources',
    output: 'dist-electron'
  },
  files: [
    'electron/**/*',
    'server/**/*',
    'shared/**/*',
    'client/build/**/*',
    'node_modules/**/*',
    '!node_modules/.cache',
    '!node_modules/electron/**/*',
    '!node_modules/electron-builder/**/*',
    '!node_modules/typescript/**/*',
    '!node_modules/@types/**/*',
    '!**/*.ts',
    '!**/*.map',
    '!**/README.md',
    'package.json'
  ],
  extraResources: [
    {
      from: 'postgres',
      to: 'postgres',
      filter: ['**/*']
    },
    {
      from: 'database-backup',
      to: 'database-backup',
      filter: ['**/*']
    }
  ],
  extraMetadata: {
    main: 'electron/main.js'
  },
  win: {
    target: [
      {
        target: 'nsis',
        arch: ['x64']
      }
    ],
    icon: 'build-resources/icon.ico',
    requestedExecutionLevel: 'asInvoker'
  },
  nsis: {
    oneClick: false,
    allowElevation: true,
    allowToChangeInstallationDirectory: true,
    installerIcon: 'build-resources/icon.ico',
    uninstallerIcon: 'build-resources/icon.ico',
    installerHeaderIcon: 'build-resources/icon.ico',
    createDesktopShortcut: true,
    createStartMenuShortcut: true,
    shortcutName: 'POS System',
    displayLanguageSelector: false,
    installerLanguages: ['en_US'],
    language: '1033' // English
  },
  mac: {
    target: [
      {
        target: 'dmg',
        arch: ['x64', 'arm64']
      }
    ],
    icon: 'build-resources/icon.icns',
    category: 'public.app-category.business',
    hardenedRuntime: true,
    entitlements: 'build-resources/entitlements.mac.plist'
  },
  dmg: {
    title: 'Universal POS System',
    backgroundColor: '#ffffff',
    window: {
      width: 540,
      height: 380
    },
    contents: [
      {
        x: 410,
        y: 190,
        type: 'link',
        path: '/Applications'
      },
      {
        x: 130,
        y: 190,
        type: 'file'
      }
    ]
  },
  linux: {
    target: [
      {
        target: 'AppImage',
        arch: ['x64']
      },
      {
        target: 'deb',
        arch: ['x64']
      }
    ],
    icon: 'build-resources/icon.png',
    category: 'Office'
  },
  publish: null // Don't publish automatically
};

async function buildElectron() {
  try {
    console.log('Building Electron application...');
    
    // Ensure build directories exist
    if (!fs.existsSync('build-resources')) {
      fs.mkdirSync('build-resources');
      console.log('Created build-resources directory');
    }
    
    // Create default icons if they don't exist
    createDefaultIcons();
    
    // Build React app first
    console.log('Building React application...');
    const { spawn } = require('child_process');
    
    await new Promise((resolve, reject) => {
      const buildProcess = spawn('npm', ['run', 'build'], {
        stdio: 'inherit',
        shell: true
      });
      
      buildProcess.on('close', (code) => {
        if (code === 0) {
          resolve();
        } else {
          reject(new Error(`React build failed with code ${code}`));
        }
      });
    });
    
    // Build for current platform
    const result = await builder.build({
      targets: builder.Platform.current().createTarget(),
      config
    });
    
    console.log('\n✅ Build completed successfully!');
    console.log('📦 Output files:');
    result.forEach(file => {
      console.log(`   ${file}`);
    });
    
    console.log('\n🎉 Your standalone POS installer is ready!');
    console.log('📁 Check the "dist-electron" folder for the installer files.');
    
  } catch (error) {
    console.error('❌ Build failed:', error);
    process.exit(1);
  }
}

function createDefaultIcons() {
  const iconsNeeded = [
    { file: 'icon.ico', size: '256x256' },
    { file: 'icon.icns', size: '512x512' },
    { file: 'icon.png', size: '512x512' }
  ];
  
  iconsNeeded.forEach(icon => {
    const iconPath = path.join('build-resources', icon.file);
    if (!fs.existsSync(iconPath)) {
      console.log(`⚠️  Missing ${icon.file}, using default icon`);
      // Create a simple default icon placeholder
      // In a real scenario, you'd want to provide actual icon files
    }
  });
  
  // Create macOS entitlements file
  const entitlementsPath = path.join('build-resources', 'entitlements.mac.plist');
  if (!fs.existsSync(entitlementsPath)) {
    const entitlementsContent = `<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>com.apple.security.cs.allow-jit</key>
    <true/>
    <key>com.apple.security.cs.allow-unsigned-executable-memory</key>
    <true/>
    <key>com.apple.security.cs.disable-executable-page-protection</key>
    <true/>
    <key>com.apple.security.cs.disable-library-validation</key>
    <true/>
</dict>
</plist>`;
    fs.writeFileSync(entitlementsPath, entitlementsContent);
  }
}

// Run the build
if (require.main === module) {
  buildElectron();
}

module.exports = { buildElectron };