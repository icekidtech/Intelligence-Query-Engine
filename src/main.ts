import 'reflect-metadata';
import express, { Express } from 'express';
import dotenv from 'dotenv';
import { corsMiddleware, manualCors } from './middleware/index.middleware';
import { healthRoute } from './routes/health.routes';
import profileRoutes from './routes/profiles.routes';
import { initializeDatabase, closeDatabase } from './database';

dotenv.config();

const app: Express = express();
const port = process.env.PORT || 5000;

// ==================== Middleware ====================

// Parse JSON requests
app.use(express.json());

// Enable CORS
app.use(corsMiddleware);

// Fallback: Manually set CORS headers
app.use(manualCors);

// ==================== Routes ====================

// Health check
app.get('/health', healthRoute);

// Stage 1: Profile management endpoints
app.use('/api/profiles', profileRoutes);

// ==================== Error Handling ====================

// 404 handler
app.use((_req: any, res: any) => {
  res.status(404).json({
    status: 'error',
    message: 'Route not found',
  });
});

// ==================== Server Start ====================

async function startServer() {
  try {
    // Initialize database
    console.log('Initializing database...');
    await initializeDatabase();
    console.log('Database initialized successfully');

    // Start server
    app.listen(port, () => {
      console.log(`Server running on http://localhost:${port}`);
      console.log(`Stage 1 - Profile endpoints: http://localhost:${port}/api/profiles`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    await closeDatabase();
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
  console.log('\nShutting down gracefully...');
  await closeDatabase();
  process.exit(0);
});

startServer();

export default app;
