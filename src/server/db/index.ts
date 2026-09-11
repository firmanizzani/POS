import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import dotenv from 'dotenv';
import path from 'path';
import * as schema from './schema.js';

dotenv.config();

const connectionString = process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/pos_minimarket';

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
