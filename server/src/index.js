import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { storage } from './services/storageService.js';

import authRoutes from './routes/authRoutes.js';
import patientRoutes from './routes/patientRoutes.js';
import admissionRoutes from './routes/admissionRoutes.js';
import bedRoutes from './routes/bedRoutes.js';
import aiRoutes from './routes/aiRoutes.js';
import analyticsRoutes from './routes/analyticsRoutes.js';
import settingsRoutes from './routes/settingsRoutes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());

// Request logger
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    if (req.path !== '/api/health') {
      console.log(`[${req.method}] ${req.path} - ${res.statusCode} (${duration}ms)`);
    }
  });
  next();
});

// Health check & System info endpoint
app.get('/api/health', (req, res) => {
  const status = storage.getStorageStatus();
  res.json({
    status: 'online',
    timestamp: new Date().toISOString(),
    system: 'Patient Admission Management System (PAMS)',
    version: '1.0.0',
    storage: status
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/admissions', admissionRoutes);
app.use('/api/beds', bedRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/settings', settingsRoutes);

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error'
  });
});

// Start Server (Standalone Local Mode)
async function startServer() {
  try {
    await storage.initialize();
    app.listen(PORT, () => {
      console.log(`\n========================================================`);
      console.log(`  PAMS Backend Server running on http://localhost:${PORT}`);
      console.log(`  Storage: ${storage.isMongoConnected ? 'MongoDB' : 'Local File Persistence (Demo Mode)'}`);
      console.log(`  Health Check: http://localhost:${PORT}/api/health`);
      console.log(`========================================================\n`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

let isInitialized = false;
export async function initApp() {
  if (!isInitialized) {
    await storage.initialize();
    isInitialized = true;
  }
  return app;
}

if (!process.env.VERCEL) {
  startServer();
}

export default app;
