import { Router } from 'express';
import * as searchController from '@controllers/search.controller.js';
import { authenticate } from '@middlewares/authenticate.js';
import { authorize } from '@middlewares/authorize.js';
import { validateQuery } from '@middlewares/validate.js';
import { globalSearchQuerySchema } from '@validators/search.validator.js';
import { asyncHandler } from '@utils/asyncHandler.js';

const router = Router();

router.use(authenticate);

// All roles — CUSTOMER results are self-scoped in the service layer.
router.get(
  '/',
  authorize('ADMIN', 'AGENT', 'CUSTOMER'),
  validateQuery(globalSearchQuerySchema),
  asyncHandler(searchController.globalSearch),
);

export default router;
