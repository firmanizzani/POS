import { edenTreaty } from '@elysiajs/eden';
import type { App } from '../../../../apps/backend/src/index';

// Initialize type-safe Eden Client connecting SvelteKit to Elysia.js
const API_URL = import.meta.env.PUBLIC_API_URL || 'http://localhost:3000';
export const api = edenTreaty<App>(API_URL);
