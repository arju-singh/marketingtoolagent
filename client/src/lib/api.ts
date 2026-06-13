// Base URL of the Express API. Empty in dev (Vite proxies /api → the server);
// set VITE_API_BASE to the deployed API origin in production.
export const API_BASE = import.meta.env.VITE_API_BASE || "";
