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

app.use(cors({ origin: '*' }));
app.use(express.json());

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

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'HEALTHY',
    service: 'SIH26089 Cooperative Gig Services Platform Backend API',
    timestamp: new Date().toISOString()
  });
});

// Middleware for initializing Vercel serverless database on request
app.use(async (req, res, next) => {
  try {
    const userCount = await get(`SELECT COUNT(*) as count FROM users`);
    if (!userCount || userCount.count === 0) {
      await seedDatabase();
    }
  } catch (err) {
    await initSchema();
    await seedDatabase();
  }
  next();
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
