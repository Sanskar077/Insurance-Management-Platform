import { Router } from 'express';
import * as documentController from '@controllers/document.controller.js';
import { authenticate } from '@middlewares/authenticate.js';
import { requirePermission } from '@middlewares/requirePermission.js';
import { upload } from '@middlewares/upload.js';
import { validateBody, validateParams, validateQuery } from '@middlewares/validate.js';
import {
  documentIdParamSchema,
  documentSearchQuerySchema,
  uploadDocumentMetadataSchema,
} from '@validators/document.validator.js';
import { asyncHandler } from '@utils/asyncHandler.js';

const router = Router();

router.use(authenticate);

// ADMIN, AGENT only — CUSTOMER has view/download-only access per spec.
router.post(
  '/',
  requirePermission('document:upload'),
  upload.single('file'),
  validateBody(uploadDocumentMetadataSchema),
  asyncHandler(documentController.uploadDocument),
);

// ADMIN, AGENT, CUSTOMER (self-scoped — enforced in the service layer).
router.get(
  '/',
  requirePermission('document:list'),
  validateQuery(documentSearchQuerySchema),
  asyncHandler(documentController.listDocuments),
);

router.get(
  '/:id',
  requirePermission('document:read'),
  validateParams(documentIdParamSchema),
  asyncHandler(documentController.getDocumentById),
);

router.get(
  '/:id/download',
  requirePermission('document:download'),
  validateParams(documentIdParamSchema),
  asyncHandler(documentController.downloadDocument),
);

// ADMIN, AGENT only — soft delete.
router.delete(
  '/:id',
  requirePermission('document:delete'),
  validateParams(documentIdParamSchema),
  asyncHandler(documentController.deleteDocument),
);

export default router;
