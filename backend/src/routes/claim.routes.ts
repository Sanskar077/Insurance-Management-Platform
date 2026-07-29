import { Router } from 'express';
import * as claimController from '@controllers/claim.controller.js';
import { authenticate } from '@middlewares/authenticate.js';
import { requirePermission } from '@middlewares/requirePermission.js';
import { validateBody, validateParams, validateQuery } from '@middlewares/validate.js';
import {
  approveClaimSchema,
  claimIdParamSchema,
  claimSearchQuerySchema,
  closeClaimSchema,
  createClaimSchema,
  rejectClaimSchema,
  updateClaimSchema,
} from '@validators/claim.validator.js';
import { asyncHandler } from '@utils/asyncHandler.js';

const router = Router();

router.use(authenticate);

// ADMIN, AGENT, CUSTOMER (CUSTOMER restricted to their own active policies —
// enforced in the service layer).
router.post(
  '/',
  requirePermission('claim:create'),
  validateBody(createClaimSchema),
  asyncHandler(claimController.createClaim),
);

// ADMIN, AGENT, CUSTOMER (self-scoped — enforced in the service layer).
router.get(
  '/',
  requirePermission('claim:list'),
  validateQuery(claimSearchQuerySchema),
  asyncHandler(claimController.listClaims),
);

router.get(
  '/:id',
  requirePermission('claim:read'),
  validateParams(claimIdParamSchema),
  asyncHandler(claimController.getClaimById),
);

// ADMIN, AGENT only — CUSTOMER has view/create-only access per the Day 6 spec.
router.put(
  '/:id',
  requirePermission('claim:update'),
  validateParams(claimIdParamSchema),
  validateBody(updateClaimSchema),
  asyncHandler(claimController.updateClaim),
);

router.post(
  '/:id/approve',
  requirePermission('claim:approve'),
  validateParams(claimIdParamSchema),
  validateBody(approveClaimSchema),
  asyncHandler(claimController.approveClaim),
);

router.post(
  '/:id/reject',
  requirePermission('claim:reject'),
  validateParams(claimIdParamSchema),
  validateBody(rejectClaimSchema),
  asyncHandler(claimController.rejectClaim),
);

router.post(
  '/:id/close',
  requirePermission('claim:close'),
  validateParams(claimIdParamSchema),
  validateBody(closeClaimSchema),
  asyncHandler(claimController.closeClaim),
);

export default router;
