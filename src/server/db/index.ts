import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import * as schema from './schema.js';

let rawUrl = (process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/pos_minimarket').trim();
if ((rawUrl.startsWith('"') && rawUrl.endsWith('"')) || (rawUrl.startsWith("'") && rawUrl.endsWith("'"))) {
  rawUrl = rawUrl.slice(1, -1).trim();
}
const connectionString = rawUrl;

const isCloudDb = connectionString.includes('neon.tech') || 
                  connectionString.includes('sslmode=require') || 
                  connectionString.includes('render.com') ||
                  connectionString.includes('supabase.com') ||
                  connectionString.includes('.aws.');

const pool = new pg.Pool({
  connectionString,
  ssl: isCloudDb ? { rejectUnauthorized: false } : false,
});

export const db = drizzle(pool, { schema });
