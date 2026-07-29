import { Router } from 'express';
import * as policyController from '@controllers/policy.controller.js';
import { authenticate } from '@middlewares/authenticate.js';
import { requirePermission } from '@middlewares/requirePermission.js';
import { validateBody, validateParams, validateQuery } from '@middlewares/validate.js';
import {
  createPolicySchema,
  policyIdParamSchema,
  policySearchQuerySchema,
  renewPolicySchema,
  updatePolicySchema,
} from '@validators/policy.validator.js';
import { asyncHandler } from '@utils/asyncHandler.js';

const router = Router();

// All policy routes require authentication.
router.use(authenticate);

// ADMIN, AGENT — create a new policy for an existing customer.
router.post(
  '/',
  requirePermission('policy:create'),
  validateBody(createPolicySchema),
  asyncHandler(policyController.createPolicy),
);

// ADMIN, AGENT, CUSTOMER (self-scoped — enforced in the service layer).
router.get(
  '/',
  requirePermission('policy:list'),
  validateQuery(policySearchQuerySchema),
  asyncHandler(policyController.listPolicies),
);

router.get(
  '/:id',
  requirePermission('policy:read'),
  validateParams(policyIdParamSchema),
  asyncHandler(policyController.getPolicyById),
);

// ADMIN, AGENT only — CUSTOMER has view-only access per the Day 4 spec.
router.put(
  '/:id',
  requirePermission('policy:update'),
  validateParams(policyIdParamSchema),
  validateBody(updatePolicySchema),
  asyncHandler(policyController.updatePolicy),
);

router.post(
  '/:id/cancel',
  requirePermission('policy:cancel'),
  validateParams(policyIdParamSchema),
  asyncHandler(policyController.cancelPolicy),
);

router.post(
  '/:id/renew',
  requirePermission('policy:renew'),
  validateParams(policyIdParamSchema),
  validateBody(renewPolicySchema),
  asyncHandler(policyController.renewPolicy),
);

// ADMIN only — soft delete.
router.delete(
  '/:id',
  requirePermission('policy:delete'),
  validateParams(policyIdParamSchema),
  asyncHandler(policyController.deletePolicy),
);

export default router;
