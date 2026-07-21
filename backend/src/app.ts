import express, { type Request, type Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import compression from 'compression';

const app = express();

// Core security & parsing middleware
app.use(helmet());
app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN ?? 'http://localhost:5173',
    credentials: true,
  }),
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(compression());
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

// Health check — confirms the server is running.
// Feature routes (auth, customers, policies, claims, etc.) are added in later sessions.
app.get('/api/health', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    service: 'insurance-management-platform-api',
    timestamp: new Date().toISOString(),
  });
});

export default app;
