import { edenTreaty } from '@elysiajs/eden';
import type { App } from '../../../../apps/backend/src/index';

// Initialize type-safe Eden Client connecting SvelteKit to Elysia.js
export const api = edenTreaty<App>('http://localhost:3000');
