/**
 * PostgreSQL-Datenbankverbindung und -konfiguration
 */

import { Pool, PoolClient } from 'pg';

// Datenbankkonfiguration
const dbConfig = {
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432'),
  database: process.env.DB_NAME || 'lb33_projects',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || 'password',
  max: 20, // Maximale Anzahl von Verbindungen im Pool
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
};

// Connection Pool erstellen
export const pool = new Pool(dbConfig);

// Hilfsfunktion für sichere Datenbankabfragen
export async function queryDatabase<T = any>(
  text: string, 
  params?: any[]
): Promise<{ success: boolean; data?: T[]; error?: string; rowCount?: number }> {
  let client: PoolClient | null = null;
  
  try {
    client = await pool.connect();
    const result = await client.query(text, params);
    
    return {
      success: true,
      data: result.rows,
      rowCount: result.rowCount || 0
    };
  } catch (error) {
    console.error('Datenbankfehler:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unbekannter Datenbankfehler'
    };
  } finally {
    if (client) {
      client.release();
    }
  }
}

// Datenbankverbindung testen
export async function testConnection(): Promise<boolean> {
  try {
    const result = await queryDatabase('SELECT NOW()');
    return result.success;
  } catch {
    return false;
  }
}

// Graceful shutdown
export async function closePool(): Promise<void> {
  await pool.end();
}
