import cors from 'cors';
import express from 'express';
import { analyticsRoutes } from './routes/analyticsRoutes.js';
import { authRoutes } from './routes/authRoutes.js';
import { courseRoutes } from './routes/courseRoutes.js';
import { learningRoutes } from './routes/learningRoutes.js';
import { errorMiddleware } from './middleware/errorMiddleware.js';

export const app = express();

app.use(cors({ origin: process.env.CLIENT_ORIGIN ?? 'http://localhost:5173' }));
app.use(express.json({ limit: '1mb' }));

app.get('/health', (_req, res) => {
  res.json({ ok: true });
});

app.use('/api/auth', authRoutes);
app.use('/api/courses', courseRoutes);
app.use('/api/learning', learningRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use(errorMiddleware);
