import type { Response } from 'express';
import type { AuthenticatedRequest } from '@middlewares/authenticate.js';
import * as paymentService from '@services/premiumPayment.service.js';
import { UnauthorizedError } from '@utils/AppError.js';
import type {
  CreatePremiumPaymentInput,
  PaginationQuery,
  PremiumPaymentSearchQuery,
  UpdatePaymentStatusInput,
  UpdatePremiumPaymentInput,
} from '@validators/premiumPayment.validator.js';

function requireUser(req: AuthenticatedRequest) {
  if (!req.user) throw new UnauthorizedError('Authentication required');
  return req.user;
}

export async function createPayment(req: AuthenticatedRequest, res: Response): Promise<void> {
  const input = req.body as CreatePremiumPaymentInput;
  const payment = await paymentService.createPremiumPayment(input);
  res.status(201).json({ success: true, data: payment });
}

export async function listPayments(req: AuthenticatedRequest, res: Response): Promise<void> {
  const user = requireUser(req);
  const query = res.locals.query as PremiumPaymentSearchQuery;
  const result = await paymentService.listPremiumPayments(query, user);
  res.status(200).json({ success: true, ...result });
}

export async function getPaymentById(req: AuthenticatedRequest, res: Response): Promise<void> {
  const user = requireUser(req);
  const { id } = res.locals.params as { id: string };
  const payment = await paymentService.getPremiumPaymentById(id, user);
  res.status(200).json({ success: true, data: payment });
}

export async function listPaymentsForPolicy(
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  const user = requireUser(req);
  const { policyId } = res.locals.params as { policyId: string };
  const { page, limit } = res.locals.query as PaginationQuery;
  const result = await paymentService.listPaymentsForPolicy(policyId, page, limit, user);
  res.status(200).json({ success: true, ...result });
}

export async function listOverduePayments(req: AuthenticatedRequest, res: Response): Promise<void> {
  const user = requireUser(req);
  const { page, limit } = res.locals.query as PaginationQuery;
  const result = await paymentService.listOverduePayments(page, limit, user);
  res.status(200).json({ success: true, ...result });
}

export async function updatePayment(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { id } = res.locals.params as { id: string };
  const user = requireUser(req);
  const payment =
    user.role === 'AGENT'
      ? await paymentService.updatePaymentStatus(id, req.body as UpdatePaymentStatusInput)
      : await paymentService.updatePremiumPayment(id, req.body as UpdatePremiumPaymentInput);
  res.status(200).json({ success: true, data: payment });
}
