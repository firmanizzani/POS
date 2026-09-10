import { app } from '../src/index.js';

export default async function handler(req: Request) {
  return app.handle(req);
}
