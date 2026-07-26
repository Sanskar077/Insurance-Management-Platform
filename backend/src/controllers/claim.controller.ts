import type { Response } from 'express';
import type { AuthenticatedRequest } from '@middlewares/authenticate.js';
import * as claimService from '@services/claim.service.js';
import { UnauthorizedError } from '@utils/AppError.js';
import type {
  ApproveClaimInput,
  ClaimSearchQuery,
  CloseClaimInput,
  CreateClaimInput,
  RejectClaimInput,
  UpdateClaimInput,
} from '@validators/claim.validator.js';

function requireUser(req: AuthenticatedRequest) {
  if (!req.user) throw new UnauthorizedError('Authentication required');
  return req.user;
}

export async function createClaim(req: AuthenticatedRequest, res: Response): Promise<void> {
  const user = requireUser(req);
  const input = req.body as CreateClaimInput;
  const claim = await claimService.createClaim(input, user);
  res.status(201).json({ success: true, data: claim });
}

export async function listClaims(req: AuthenticatedRequest, res: Response): Promise<void> {
  const user = requireUser(req);
  const query = res.locals.query as ClaimSearchQuery;
  const result = await claimService.listClaims(query, user);
  res.status(200).json({ success: true, ...result });
}

export async function getClaimById(req: AuthenticatedRequest, res: Response): Promise<void> {
  const user = requireUser(req);
  const { id } = res.locals.params as { id: string };
  const claim = await claimService.getClaimById(id, user);
  res.status(200).json({ success: true, data: claim });
}

export async function updateClaim(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { id } = res.locals.params as { id: string };
  const input = req.body as UpdateClaimInput;
  const claim = await claimService.updateClaim(id, input);
  res.status(200).json({ success: true, data: claim });
}

export async function approveClaim(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { id } = res.locals.params as { id: string };
  const input = req.body as ApproveClaimInput;
  const claim = await claimService.approveClaim(id, input);
  res.status(200).json({ success: true, data: claim });
}

export async function rejectClaim(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { id } = res.locals.params as { id: string };
  const input = req.body as RejectClaimInput;
  const claim = await claimService.rejectClaim(id, input);
  res.status(200).json({ success: true, data: claim });
}

export async function closeClaim(req: AuthenticatedRequest, res: Response): Promise<void> {
  const { id } = res.locals.params as { id: string };
  const input = req.body as CloseClaimInput;
  const claim = await claimService.closeClaim(id, input);
  res.status(200).json({ success: true, data: claim });
}
