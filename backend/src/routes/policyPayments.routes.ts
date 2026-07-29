import { Router } from 'express';
import * as paymentController from '@controllers/premiumPayment.controller.js';
import { authenticate } from '@middlewares/authenticate.js';
import { requirePermission } from '@middlewares/requirePermission.js';
import { validateParams } from '@middlewares/validate.js';
import { policyIdParamSchema } from '@validators/premiumPayment.validator.js';
import { asyncHandler } from '@utils/asyncHandler.js';

// mergeParams so :policyId from the parent mount path (/api/policies/:policyId/payments)
// is available on req.params here.
const router = Router({ mergeParams: true });

router.use(authenticate);

// ADMIN, AGENT, CUSTOMER (self-scoped — enforced in the service layer).
router.get(
  '/',
  requirePermission('payment:list'),
  validateParams(policyIdParamSchema),
  asyncHandler(paymentController.listPaymentsForPolicy),
);

export default router;
