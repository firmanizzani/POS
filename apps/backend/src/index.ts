import { Elysia } from 'elysia';
import { cors } from '@elysiajs/cors';
import { swagger } from '@elysiajs/swagger';
import { productRoutes } from './routes/products.js';
import { cashierRoutes } from './routes/cashier.js';
import { analyticsRoutes } from './routes/analytics.js';

export const app = new Elysia()
  .use(cors())
  .use(swagger())
  .get('/', () => ({ message: 'Minimarket POS API Server is running', status: 'OK' }))
  .use(productRoutes)
  .use(cashierRoutes)
  .use(analyticsRoutes)
  .listen(3000);

console.log(`🚀 Server Elysia.js POS running at http://${app.server?.hostname}:${app.server?.port}`);

export type App = typeof app;
