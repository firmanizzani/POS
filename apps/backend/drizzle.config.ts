import { defineConfig } from 'drizzle-kit';
import dotenv from 'dotenv';

import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config({ path: path.resolve(process.cwd(), 'apps/backend/.env') });
dotenv.config();

export default defineConfig({
  schema: './apps/backend/src/db/schema.ts',
  out: './apps/backend/drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/pos_minimarket',
  },
});
