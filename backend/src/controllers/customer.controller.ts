import type { Response } from 'express';
import type { AuthenticatedRequest } from '@middlewares/authenticate.js';
import * as customerService from '@services/customer.service.js';
import type { CreateCustomerInput, CustomerSearchQuery } from '@validators/customer.validator.js';
import { UnauthorizedError } from '@utils/AppError.js';

function requireUser(req: AuthenticatedRequest) {
  if (!req.user) throw new UnauthorizedError('Authentication required');
  return req.user;
}

export async function createCustomer(req: AuthenticatedRequest, res: Response): Promise<void> {
  const input = req.body as CreateCustomerInput;
  const result = await customerService.createCustomer(input);
  res.status(201).json({ success: true, data: result });
}

export async function listCustomers(_req: AuthenticatedRequest, res: Response): Promise<void> {
  const query = res.locals.query as CustomerSearchQuery;
  const result = await customerService.listCustomers(query);
  res.status(200).json({ success: true, ...result });
}

export async function getCustomerById(req: AuthenticatedRequest, res: Response): Promise<void> {
  const user = requireUser(req);
  const { id } = res.locals.params as { id: string };
  const customer = await customerService.getCustomerById(id, user);
  res.status(200).json({ success: true, data: customer });
}

export async function getOwnProfile(req: AuthenticatedRequest, res: Response): Promise<void> {
  const user = requireUser(req);
  const customer = await customerService.getOwnProfile(user);
  res.status(200).json({ success: true, data: customer });
}

export async function updateCustomer(req: AuthenticatedRequest, res: Response): Promise<void> {
  const user = requireUser(req);
  const { id } = res.locals.params as { id: string };
  const customer = await customerService.updateCustomer(id, req.body, user);
  res.status(200).json({ success: true, data: customer });
}

export async function deleteCustomer(_req: AuthenticatedRequest, res: Response): Promise<void> {
  const { id } = res.locals.params as { id: string };
  await customerService.deleteCustomer(id);
  res.status(200).json({ success: true, message: 'Customer deleted successfully' });
}

export async function getCustomerHistory(req: AuthenticatedRequest, res: Response): Promise<void> {
  const user = requireUser(req);
  const { id } = res.locals.params as { id: string };
  const history = await customerService.getCustomerHistoryPlaceholder(id, user);
  res.status(200).json({ success: true, data: history });
}
