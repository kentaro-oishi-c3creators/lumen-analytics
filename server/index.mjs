import { createApi } from './app.mjs';
const port = Number(process.env.PORT || 8787);
if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error('PORT must be 1–65535');
createApi().listen(port, '0.0.0.0', () =>
  console.log(`LUMEN API listening on port ${port}. Secrets are never logged.`),
);
