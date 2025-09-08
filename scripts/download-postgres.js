const https = require('https');
const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const unzipper = require('unzipper');

/**
 * Script to download portable PostgreSQL for Electron packaging
 */

const POSTGRES_VERSIONS = {
  win32: {
    url: 'https://get.enterprisedb.com/postgresql/postgresql-15.4-1-windows-x64-binaries.zip',
    filename: 'postgresql-windows.zip'
  },
  darwin: {
    url: 'https://get.enterprisedb.com/postgresql/postgresql-15.4-1-osx-binaries.zip', 
    filename: 'postgresql-macos.zip'
  },
  linux: {
    url: 'https://get.enterprisedb.com/postgresql/postgresql-15.4-1-linux-x64-binaries.tar.gz',
    filename: 'postgresql-linux.tar.gz'
  }
};

async function downloadPostgreSQL() {
  try {
    const platform = process.platform;
    const postgresInfo = POSTGRES_VERSIONS[platform];
    
    if (!postgresInfo) {
      throw new Error(`Unsupported platform: ${platform}`);
    }
    
    console.log(`🔄 Downloading PostgreSQL for ${platform}...`);
    
    const postgresDir = path.join(__dirname, '..', 'postgres');
    if (!fs.existsSync(postgresDir)) {
      fs.mkdirSync(postgresDir, { recursive: true });
    }
    
    // Check if already downloaded
    const binDir = path.join(postgresDir, 'bin');
    if (fs.existsSync(binDir) && fs.readdirSync(binDir).length > 0) {
      console.log('✅ PostgreSQL already downloaded');
      return;
    }
    
    const downloadPath = path.join(postgresDir, postgresInfo.filename);
    
    // Download PostgreSQL
    console.log(`📥 Downloading from ${postgresInfo.url}...`);
    await downloadFile(postgresInfo.url, downloadPath);
    
    console.log('📦 Download completed. Extracting...');
    
    // Extract based on file type
    if (postgresInfo.filename.endsWith('.zip')) {
      await extractZip(downloadPath, postgresDir);
    } else if (postgresInfo.filename.endsWith('.tar.gz')) {
      await extractTarGz(downloadPath, postgresDir);
    }
    
    // Clean up download file
    fs.unlinkSync(downloadPath);
    
    console.log('✅ PostgreSQL downloaded and extracted successfully!');
    
    // Verify extraction
    const expectedBinDir = path.join(postgresDir, 'bin');
    if (!fs.existsSync(expectedBinDir)) {
      // Try to find the extracted directory
      const extractedDirs = fs.readdirSync(postgresDir).filter(item => {
        const itemPath = path.join(postgresDir, item);
        return fs.statSync(itemPath).isDirectory();
      });
      
      if (extractedDirs.length > 0) {
        const sourceBinDir = path.join(postgresDir, extractedDirs[0], 'bin');
        if (fs.existsSync(sourceBinDir)) {
          // Move contents up one level
          console.log('📁 Reorganizing PostgreSQL directory structure...');
          const items = fs.readdirSync(path.join(postgresDir, extractedDirs[0]));
          items.forEach(item => {
            const source = path.join(postgresDir, extractedDirs[0], item);
            const destination = path.join(postgresDir, item);
            fs.renameSync(source, destination);
          });
          // Remove empty directory
          fs.rmdirSync(path.join(postgresDir, extractedDirs[0]));
        }
      }
    }
    
    // Create configuration files
    await createPostgreSQLConfig(postgresDir);
    
    // Set executable permissions on Unix systems
    if (process.platform !== 'win32') {
      console.log('🔧 Setting executable permissions...');
      await executeCommand(`chmod +x ${path.join(postgresDir, 'bin')}/*`);
    }
    
    console.log('🎉 PostgreSQL setup completed!');
    
  } catch (error) {
    console.error('❌ Failed to download PostgreSQL:', error);
    process.exit(1);
  }
}

function downloadFile(url, filepath) {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(filepath);
    
    const request = https.get(url, (response) => {
      // Handle redirects
      if (response.statusCode === 302 || response.statusCode === 301) {
        file.close();
        fs.unlinkSync(filepath);
        return downloadFile(response.headers.location, filepath).then(resolve).catch(reject);
      }
      
      if (response.statusCode !== 200) {
        file.close();
        fs.unlinkSync(filepath);
        reject(new Error(`HTTP ${response.statusCode}: ${response.statusMessage}`));
        return;
      }
      
      const totalSize = parseInt(response.headers['content-length'], 10);
      let downloadedSize = 0;
      
      response.on('data', (chunk) => {
        downloadedSize += chunk.length;
        if (totalSize) {
          const progress = ((downloadedSize / totalSize) * 100).toFixed(1);
          process.stdout.write(`\r📥 Downloading... ${progress}%`);
        }
      });
      
      response.pipe(file);
      
      file.on('finish', () => {
        file.close();
        console.log('\n✅ Download completed');
        resolve();
      });
      
      file.on('error', (error) => {
        fs.unlink(filepath, () => {}); // Delete the file on error
        reject(error);
      });
      
    }).on('error', (error) => {
      fs.unlink(filepath, () => {}); // Delete the file on error
      reject(error);
    });
    
    request.setTimeout(30000, () => {
      request.destroy();
      reject(new Error('Download timeout'));
    });
  });
}

function extractZip(zipPath, extractDir) {
  return new Promise((resolve, reject) => {
    console.log('📦 Extracting ZIP archive...');
    fs.createReadStream(zipPath)
      .pipe(unzipper.Extract({ path: extractDir }))
      .on('close', () => {
        console.log('✅ ZIP extraction completed');
        resolve();
      })
      .on('error', reject);
  });
}

function extractTarGz(tarPath, extractDir) {
  return new Promise((resolve, reject) => {
    console.log('📦 Extracting TAR.GZ archive...');
    exec(`tar -xzf "${tarPath}" -C "${extractDir}"`, (error, stdout, stderr) => {
      if (error) {
        reject(error);
      } else {
        console.log('✅ TAR.GZ extraction completed');
        resolve();
      }
    });
  });
}

async function createPostgreSQLConfig(postgresDir) {
  const configContent = `# PostgreSQL Configuration for POS System
# Auto-generated configuration for embedded PostgreSQL

# Connection Settings
port = 5432
max_connections = 50

# Memory Settings (optimized for desktop application)  
shared_buffers = 64MB
effective_cache_size = 256MB
work_mem = 8MB
maintenance_work_mem = 32MB

# Logging (minimal for desktop app)
log_statement = 'none'
log_min_messages = warning
log_min_error_statement = error
log_destination = 'stderr'
logging_collector = off

# Performance
checkpoint_completion_target = 0.9
wal_buffers = 2MB
default_statistics_target = 100

# Reliability
fsync = on
synchronous_commit = on
full_page_writes = on

# Security (local connections only)
listen_addresses = 'localhost'
ssl = off

# Locale
lc_messages = 'C'
lc_monetary = 'C'
lc_numeric = 'C'
lc_time = 'C'

# Other
timezone = 'UTC'
default_text_search_config = 'pg_catalog.english'
`;

  const configPath = path.join(postgresDir, 'postgresql.conf');
  fs.writeFileSync(configPath, configContent);
  
  // Create pg_hba.conf for authentication
  const hbaContent = `# PostgreSQL Client Authentication Configuration File
# Auto-generated for embedded PostgreSQL

# TYPE  DATABASE        USER            ADDRESS                 METHOD

# Local connections
local   all             all                                     trust
host    all             all             127.0.0.1/32            trust
host    all             all             ::1/128                 trust

# Allow replication connections
local   replication     all                                     trust
host    replication     all             127.0.0.1/32            trust
host    replication     all             ::1/128                 trust
`;

  const hbaPath = path.join(postgresDir, 'pg_hba.conf');
  fs.writeFileSync(hbaPath, hbaContent);
  
  console.log('⚙️  PostgreSQL configuration files created');
}

function executeCommand(command) {
  return new Promise((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
      if (error) {
        reject(error);
      } else {
        if (stdout) console.log(stdout);
        if (stderr) console.error(stderr);
        resolve(stdout);
      }
    });
  });
}

// Run if called directly
if (require.main === module) {
  downloadPostgreSQL();
}

module.exports = { downloadPostgreSQL };