const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');

/**
 * Script to prepare database backup for Electron packaging
 * This will export the current database schema and data
 */

async function prepareDatabaseBackup() {
  try {
    console.log('📦 Preparing database backup for Electron packaging...');
    
    // Create backup directory
    const backupDir = path.join(__dirname, '..', 'database-backup');
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }
    
    // Get database URL from environment
    const databaseUrl = process.env.DATABASE_URL;
    if (!databaseUrl) {
      console.log('⚠️  DATABASE_URL not found, creating empty database setup...');
      await createEmptyDatabaseSetup(backupDir);
      return;
    }
    
    console.log('📥 Exporting database schema and data...');
    
    // Export schema and data
    const schemaFile = path.join(backupDir, 'schema.sql');
    const dataFile = path.join(backupDir, 'data.sql');
    
    try {
      // Export schema only
      await executeCommand(`pg_dump --schema-only --no-owner --no-privileges "${databaseUrl}" > "${schemaFile}"`);
      console.log('✅ Schema exported successfully');
      
      // Export data only (with INSERT statements for better compatibility)
      await executeCommand(`pg_dump --data-only --no-owner --no-privileges --inserts --disable-triggers "${databaseUrl}" > "${dataFile}"`);
      console.log('✅ Data exported successfully');
      
    } catch (error) {
      console.log('⚠️  Database export failed (this is normal if database is not accessible)');
      console.log('Creating empty database setup...');
      await createEmptyDatabaseSetup(backupDir);
    }
    
    // Create initialization script
    const initScript = `-- Universal POS System Database Initialization Script
-- This script is automatically run on first application launch

-- Create database if it doesn't exist
SELECT 'CREATE DATABASE pos_database' WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'pos_database');

-- Connect to the database
\\c pos_database;

-- Import schema (if exists)
\\i schema.sql

-- Import initial data (if exists)
\\i data.sql

-- Ensure basic tables exist (fallback)
${getBasicSchema()}

-- Basic configuration data
INSERT INTO currencies (code, name, symbol) VALUES ('PKR', 'Pakistani Rupee', 'Rs') ON CONFLICT DO NOTHING;
INSERT INTO roles (name, description) VALUES 
  ('Super Admin', 'Full system access') ON CONFLICT DO NOTHING,
  ('Manager', 'Store management access') ON CONFLICT DO NOTHING,
  ('Cashier', 'Sales and basic operations') ON CONFLICT DO NOTHING;

-- Success message
\\echo 'Database initialization completed successfully!'
`;
    
    fs.writeFileSync(path.join(backupDir, 'init.sql'), initScript);
    
    console.log('✅ Database backup prepared successfully!');
    console.log('📁 Files created:');
    console.log('   - schema.sql: Database structure');
    console.log('   - data.sql: Database data');
    console.log('   - init.sql: Initialization script');
    
  } catch (error) {
    console.error('❌ Failed to prepare database backup:', error);
    process.exit(1);
  }
}

async function createEmptyDatabaseSetup(backupDir) {
  // Create empty files with basic structure
  fs.writeFileSync(path.join(backupDir, 'schema.sql'), '-- Schema will be created by Drizzle migrations\n');
  fs.writeFileSync(path.join(backupDir, 'data.sql'), '-- Initial data will be inserted by the application\n');
  console.log('✅ Empty database setup created');
}

function getBasicSchema() {
  return `
-- Basic schema fallback (minimal structure)
CREATE TABLE IF NOT EXISTS currencies (
  id SERIAL PRIMARY KEY,
  code VARCHAR(3) UNIQUE NOT NULL,
  name VARCHAR(100) NOT NULL,
  symbol VARCHAR(10) NOT NULL
);

CREATE TABLE IF NOT EXISTS roles (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) UNIQUE NOT NULL,
  description TEXT
);

CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(255) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,
  role_id INTEGER REFERENCES roles(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
`;
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
  prepareDatabaseBackup();
}

module.exports = { prepareDatabaseBackup };