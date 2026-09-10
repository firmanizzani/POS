import { app } from './index.js';

app.listen(3000);
console.log(`🚀 Server Elysia.js POS running at http://${app.server?.hostname}:${app.server?.port}`);
