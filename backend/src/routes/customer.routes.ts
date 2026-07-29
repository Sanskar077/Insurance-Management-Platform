import { Router } from 'express';
import * as customerController from '@controllers/customer.controller.js';
import { authenticate } from '@middlewares/authenticate.js';
import { requirePermission } from '@middlewares/requirePermission.js';
import {
  validateBody,
  validateBodyByRole,
  validateParams,
  validateQuery,
} from '@middlewares/validate.js';
import {
  createCustomerSchema,
  customerIdParamSchema,
  customerSearchQuerySchema,
  updateCustomerSchema,
  updateOwnCustomerSchema,
} from '@validators/customer.validator.js';
import { asyncHandler } from '@utils/asyncHandler.js';

const router = Router();

// All customer routes require authentication.
router.use(authenticate);

// ADMIN, AGENT — create a new customer (also creates the linked login account).
router.post(
  '/',
  requirePermission('customer:create'),
  validateBody(createCustomerSchema),
  asyncHandler(customerController.createCustomer),
);

// ADMIN, AGENT — paginated, searchable customer list.
router.get(
  '/',
  requirePermission('customer:list'),
  validateQuery(customerSearchQuerySchema),
  asyncHandler(customerController.listCustomers),
);

// CUSTOMER — fetch their own profile without needing to know their customer id.
router.get(
  '/me',
  requirePermission('customer:read-own'),
  asyncHandler(customerController.getOwnProfile),
);

// ADMIN, AGENT, CUSTOMER (self only — enforced in the service layer).
router.get(
  '/:id',
  requirePermission('customer:read'),
  validateParams(customerIdParamSchema),
  asyncHandler(customerController.getCustomerById),
);

// Structure-only placeholder for the future Customer History feature.
router.get(
  '/:id/history',
  requirePermission('customer:history'),
  validateParams(customerIdParamSchema),
  asyncHandler(customerController.getCustomerHistory),
);

// ADMIN, AGENT get the full update schema; CUSTOMER is restricted to phone/address.
router.put(
  '/:id',
  requirePermission('customer:update'),
  validateParams(customerIdParamSchema),
  validateBodyByRole({ CUSTOMER: updateOwnCustomerSchema }, updateCustomerSchema),
  asyncHandler(customerController.updateCustomer),
);

// ADMIN only — soft delete.
router.delete(
  '/:id',
  requirePermission('customer:delete'),
  validateParams(customerIdParamSchema),
  asyncHandler(customerController.deleteCustomer),
);

export default router;
