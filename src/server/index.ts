import { Elysia } from 'elysia';
import { cors } from '@elysiajs/cors';
import { swagger } from '@elysiajs/swagger';
import { authRoutes } from './routes/auth.js';
import { productRoutes } from './routes/products.js';
import { cashierRoutes } from './routes/cashier.js';
import { analyticsRoutes } from './routes/analytics.js';
import { supplierRoutes } from './routes/suppliers.js';
import { stockAdjustmentRoutes } from './routes/stock-adjustments.js';
import { memberRoutes } from './routes/members.js';
import { promoRoutes } from './routes/promos.js';
import { transactionRoutes } from './routes/transactions.js';

export const app = new Elysia({ prefix: '/api' })
  .use(cors())
  .use(swagger())
  .get('/', () => ({ message: 'Minimarket POS API Server is running', status: 'OK' }))
  .use(authRoutes)
  .use(productRoutes)
  .use(cashierRoutes)
  .use(analyticsRoutes)
  .use(supplierRoutes)
  .use(stockAdjustmentRoutes)
  .use(memberRoutes)
  .use(promoRoutes)
  .use(transactionRoutes);

export type App = typeof app;
