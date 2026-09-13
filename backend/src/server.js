import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

import { initSchema } from './db/schema.js';
import { seedDatabase } from './db/seed.js';
import { get } from './db/index.js';

import authRoutes from './routes/auth.js';
import servicesRoutes from './routes/services.js';
import workersRoutes from './routes/workers.js';
import bookingsRoutes from './routes/bookings.js';
import paymentsRoutes from './routes/payments.js';
import ratingsRoutes from './routes/ratings.js';
import cooperativesRoutes from './routes/cooperatives.js';
import welfareRoutes from './routes/welfare.js';
import aiRoutes from './routes/ai.js';
import notificationsRoutes from './routes/notifications.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5000;

// Universal CORS Middleware for standalone & Vercel deployment
app.use((req, res, next) => {
  const origin = req.headers.origin || '*';
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization, X-CSRF-Token, Accept-Version, Content-Length, Content-MD5, Date, X-Api-Version');
  if (req.headers.origin) {
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  }
  
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  next();
});

app.use(express.json());

// Middleware for initializing Vercel serverless database on request
app.use(async (req, res, next) => {
  if (req.method === 'OPTIONS') {
    return next();
  }
  try {
    const userCount = await get(`SELECT COUNT(*) as count FROM users`);
    if (!userCount || userCount.count === 0) {
      await seedDatabase();
    }
  } catch (err) {
    try {
      await initSchema();
      await seedDatabase();
    } catch (e) {
      console.error('Auto-seed error:', e);
    }
  }
  next();
});

// Root welcome endpoint
app.get('/', (req, res) => {
  res.json({
    status: 'ONLINE',
    service: 'SIH26089 SahakarGig Backend API',
    health: '/api/health',
    timestamp: new Date().toISOString()
  });
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'HEALTHY',
    service: 'SIH26089 Cooperative Gig Services Platform Backend API',
    timestamp: new Date().toISOString()
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/services', servicesRoutes);
app.use('/api/workers', workersRoutes);
app.use('/api/bookings', bookingsRoutes);
app.use('/api/payments', paymentsRoutes);
app.use('/api/ratings', ratingsRoutes);
app.use('/api/cooperatives', cooperativesRoutes);
app.use('/api/welfare', welfareRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/notifications', notificationsRoutes);

// Fallback 404 handler with CORS headers
app.use((req, res) => {
  const origin = req.headers.origin || '*';
  res.setHeader('Access-Control-Allow-Origin', origin);
  if (req.headers.origin) {
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  }
  res.status(404).json({ error: true, message: `Route ${req.method} ${req.url} not found` });
});

// Global error handler with CORS headers
app.use((err, req, res, next) => {
  console.error('Unhandled API Server Error:', err);
  const origin = req.headers.origin || '*';
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS, PATCH');
  res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.headers.origin) {
    res.setHeader('Access-Control-Allow-Credentials', 'true');
  }
  res.status(err.status || 500).json({
    error: true,
    message: err.message || 'Internal Server Error'
  });
});

// Initialize database schema and auto-seed if clean startup
const startServer = async () => {
  try {
    await initSchema();
    const userCount = await get(`SELECT COUNT(*) as count FROM users`);
    if (!userCount || userCount.count === 0) {
      console.log('Database empty. Running initial seed data setup...');
      await seedDatabase();
    } else {
      console.log(`Database ready. Existing users: ${userCount.count}`);
    }

    if (!process.env.VERCEL) {
      app.listen(PORT, () => {
        console.log(`====================================================`);
        console.log(`SAHAKARGIG API SERVER RUNNING ON PORT ${PORT}`);
        console.log(`Health Check: http://localhost:${PORT}/api/health`);
        console.log(`====================================================`);
      });
    }
  } catch (error) {
    console.error('Failed to start server:', error);
  }
};

startServer();

export default app;
