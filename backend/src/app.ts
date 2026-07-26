import express, { type Request, type Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import compression from 'compression';
import { env } from '@config/env.js';
import authRoutes from '@routes/auth.routes.js';
import customerRoutes from '@routes/customer.routes.js';
import policyRoutes from '@routes/policy.routes.js';
import premiumPaymentRoutes from '@routes/premiumPayment.routes.js';
import policyPaymentsRoutes from '@routes/policyPayments.routes.js';
import claimRoutes from '@routes/claim.routes.js';
import { errorHandler, notFoundHandler } from '@middlewares/errorHandler.js';

const app = express();

// Core security & parsing middleware
app.use(helmet());
app.use(
  cors({
    origin: env.clientOrigin,
    credentials: true,
  }),
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(compression());
app.use(morgan(env.nodeEnv === 'production' ? 'combined' : 'dev'));

// Health check — confirms the server is running.
app.get('/api/health', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    service: 'insurance-management-platform-api',
    timestamp: new Date().toISOString(),
  });
});

// Feature routes
app.use('/api/auth', authRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/policies/:policyId/payments', policyPaymentsRoutes);
app.use('/api/policies', policyRoutes);
app.use('/api/premium-payments', premiumPaymentRoutes);
app.use('/api/claims', claimRoutes);

// 404 + centralized error handling (must be registered last)
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
