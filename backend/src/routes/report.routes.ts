import { Router } from 'express';
import * as reportController from '@controllers/report.controller.js';
import { authenticate } from '@middlewares/authenticate.js';
import { authorize } from '@middlewares/authorize.js';
import { validateQuery } from '@middlewares/validate.js';
import { reportRangeQuerySchema } from '@validators/report.validator.js';
import { asyncHandler } from '@utils/asyncHandler.js';

const router = Router();

router.use(authenticate);

// Reports aggregate figures across ALL customers, so the whole module is
// ADMIN/AGENT-only — a CUSTOMER never sees other people's totals.
router.use(authorize('ADMIN', 'AGENT'));

router.get('/summary', asyncHandler(reportController.getDashboardSummary));

router.get(
  '/customer-growth',
  validateQuery(reportRangeQuerySchema),
  asyncHandler(reportController.getCustomerGrowth),
);

router.get(
  '/premium-collection',
  validateQuery(reportRangeQuerySchema),
  asyncHandler(reportController.getPremiumCollection),
);

router.get('/policy-statistics', asyncHandler(reportController.getPolicyStatistics));

router.get(
  '/claim-statistics',
  validateQuery(reportRangeQuerySchema),
  asyncHandler(reportController.getClaimStatistics),
);

export default router;
