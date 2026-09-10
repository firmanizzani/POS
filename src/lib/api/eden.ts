import { edenTreaty } from '@elysiajs/eden';
import type { App } from '../../server/index';

// Initialize type-safe Eden Client connecting SvelteKit to Elysia.js
const getApiUrl = () => {
  if (import.meta.env.PUBLIC_API_URL) return import.meta.env.PUBLIC_API_URL;
  if (typeof window !== 'undefined') return window.location.origin;
  return 'http://localhost:3000';
};

export const api = edenTreaty<App>(getApiUrl());
