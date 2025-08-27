import { Pool } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from "@shared/schema";
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Please configure your PostgreSQL connection.",
  );
}

// Configure connection pool for standard PostgreSQL
export const pool = new Pool({ 
  connectionString: process.env.DATABASE_URL,
  max: 10, // Maximum connections 
  min: 1,  // Minimum connections
  idleTimeoutMillis: 60000, // Idle timeout
  connectionTimeoutMillis: 10000, // Connection timeout
});

export const db = drizzle(pool, { schema });

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('Closing database pool...');
  await pool.end();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('Closing database pool...');
  await pool.end();
  process.exit(0);
});