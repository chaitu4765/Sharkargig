// API Base URL helper supporting separate Vercel frontend & backend projects
// Set VITE_API_URL in Vercel environment variables (e.g., https://your-backend.vercel.app)
const rawApiUrl = (import.meta.env.VITE_API_URL || '').trim();
export const API_BASE = rawApiUrl.endsWith('/') ? rawApiUrl.slice(0, -1) : rawApiUrl;
