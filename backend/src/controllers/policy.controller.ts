import type { Response } from 'express';
import type { AuthenticatedRequest } from '@middlewares/authenticate.js';
import * as policyService from '@services/policy.service.js';
import { UnauthorizedError } from '@utils/AppError.js';
import type {
  CreatePolicyInput,
  PolicySearchQuery,
  RenewPolicyInput,
  UpdatePolicyInput,
} from '@validators/policy.validator.js';

function requireUser(req: AuthenticatedRequest) {
  if (!req.user) throw new UnauthorizedError('Authentication required');
  return req.user;
}

export async function createPolicy(req: AuthenticatedRequest, res: Response): Promise<void> {
  const input = req.body as CreatePolicyInput;
  const policy = await policyService.createPolicy(input);
  res.status(201).json({ success: true, data: policy });
}

export async function listPolicies(req: AuthenticatedRequest, res: Response): Promise<void> {
  const user = requireUser(req);
  const query = res.locals.query as PolicySearchQuery;
  const result = await policyService.listPolicies(query, user);
  res.status(200).json({ success: true, ...result });
}

export async function getPolicyById(req: AuthenticatedRequest, res: Response): Promise<void> {
  const user = requireUser(req);
  const { id } = res.locals.params as { id: string };
  const policy = await policyService.getPolicyById(id, user);
  res.status(200).json({ success: true, data: policy });
}

export async function updatePolicy(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { id } = res.locals.params as { id: string };
  const input = req.body as UpdatePolicyInput;
  const policy = await policyService.updatePolicy(id, input);
  res.status(200).json({ success: true, data: policy });
}

export async function cancelPolicy(_req: AuthenticatedRequest, res: Response): Promise<void> {
  const { id } = res.locals.params as { id: string };
  const policy = await policyService.cancelPolicy(id);
  res.status(200).json({ success: true, data: policy });
}

export async function renewPolicy(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { id } = res.locals.params as { id: string };
  const input = req.body as RenewPolicyInput;
  const policy = await policyService.renewPolicy(id, input);
  res.status(201).json({ success: true, data: policy });
}

export async function deletePolicy(_req: AuthenticatedRequest, res: Response): Promise<void> {
  const { id } = res.locals.params as { id: string };
  await policyService.deletePolicy(id);
  res.status(200).json({ success: true, message: 'Policy deleted successfully' });
}
