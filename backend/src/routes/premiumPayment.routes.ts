import { Router } from 'express';
import * as paymentController from '@controllers/premiumPayment.controller.js';
import { authenticate } from '@middlewares/authenticate.js';
import { requirePermission } from '@middlewares/requirePermission.js';
import {
  validateBody,
  validateBodyByRole,
  validateParams,
  validateQuery,
} from '@middlewares/validate.js';
import {
  createPremiumPaymentSchema,
  paginationQuerySchema,
  premiumPaymentIdParamSchema,
  premiumPaymentSearchQuerySchema,
  updatePaymentStatusSchema,
  updatePremiumPaymentSchema,
} from '@validators/premiumPayment.validator.js';
import { asyncHandler } from '@utils/asyncHandler.js';

const router = Router();

router.use(authenticate);

// ADMIN, AGENT — record a new premium payment for an existing policy.
router.post(
  '/',
  requirePermission('payment:create'),
  validateBody(createPremiumPaymentSchema),
  asyncHandler(paymentController.createPayment),
);

// ADMIN, AGENT, CUSTOMER (self-scoped — enforced in the service layer).
router.get(
  '/',
  requirePermission('payment:list'),
  validateQuery(premiumPaymentSearchQuerySchema),
  asyncHandler(paymentController.listPayments),
);

// Fixed segment — must be registered before the dynamic /:id route below,
// otherwise "overdue" would be parsed as an :id value.
router.get(
  '/overdue',
  requirePermission('payment:list'),
  validateQuery(paginationQuerySchema),
  asyncHandler(paymentController.listOverduePayments),
);

router.get(
  '/:id',
  requirePermission('payment:read'),
  validateParams(premiumPaymentIdParamSchema),
  asyncHandler(paymentController.getPaymentById),
);

// ADMIN gets full correction rights; AGENT is restricted to paymentStatus
// (+ paymentDate/transactionReference) via the role-aware schema selection.
router.put(
  '/:id',
  requirePermission('payment:update'),
  validateParams(premiumPaymentIdParamSchema),
  validateBodyByRole({ AGENT: updatePaymentStatusSchema }, updatePremiumPaymentSchema),
  asyncHandler(paymentController.updatePayment),
);

export default router;
