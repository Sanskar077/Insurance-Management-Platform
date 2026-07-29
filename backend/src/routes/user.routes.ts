import { Router } from 'express';
import * as userController from '@controllers/user.controller.js';
import { authenticate } from '@middlewares/authenticate.js';
import { requirePermission } from '@middlewares/requirePermission.js';
import { validateBody, validateParams, validateQuery } from '@middlewares/validate.js';
import {
  createUserSchema,
  updateUserRoleSchema,
  userIdParamSchema,
  userSearchQuerySchema,
} from '@validators/user.validator.js';
import { asyncHandler } from '@utils/asyncHandler.js';

const router = Router();

// User administration is ADMIN-only across the board (see permission matrix).
router.use(authenticate);

router.get(
  '/',
  requirePermission('user:list'),
  validateQuery(userSearchQuerySchema),
  asyncHandler(userController.listUsers),
);

router.post(
  '/',
  requirePermission('user:create'),
  validateBody(createUserSchema),
  asyncHandler(userController.createUser),
);

router.get(
  '/:id',
  requirePermission('user:read'),
  validateParams(userIdParamSchema),
  asyncHandler(userController.getUserById),
);

router.put(
  '/:id/role',
  requirePermission('user:update-role'),
  validateParams(userIdParamSchema),
  validateBody(updateUserRoleSchema),
  asyncHandler(userController.updateUserRole),
);

export default router;
