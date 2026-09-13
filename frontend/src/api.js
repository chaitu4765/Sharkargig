// API Base URL helper supporting separate Vercel frontend & backend projects
// Set VITE_API_URL in Vercel environment variables (e.g., https://your-backend.vercel.app)
export const API_BASE = import.meta.env.VITE_API_URL || '';
