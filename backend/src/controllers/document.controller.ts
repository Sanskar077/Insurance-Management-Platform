import type { Response } from 'express';
import type { AuthenticatedRequest } from '@middlewares/authenticate.js';
import * as documentService from '@services/document.service.js';
import { BadRequestError, UnauthorizedError } from '@utils/AppError.js';
import type {
  DocumentSearchQuery,
  UploadDocumentMetadataInput,
} from '@validators/document.validator.js';

function requireUser(req: AuthenticatedRequest) {
  if (!req.user) throw new UnauthorizedError('Authentication required');
  return req.user;
}

export async function uploadDocument(req: AuthenticatedRequest, res: Response): Promise<void> {
  const user = requireUser(req);

  if (!req.file) {
    throw new BadRequestError('A file is required');
  }

  const metadata = req.body as UploadDocumentMetadataInput;
  const document = await documentService.uploadDocument(metadata, req.file, user);
  res.status(201).json({ success: true, data: document });
}

export async function listDocuments(req: AuthenticatedRequest, res: Response): Promise<void> {
  const user = requireUser(req);
  const query = res.locals.query as DocumentSearchQuery;
  const result = await documentService.listDocuments(query, user);
  res.status(200).json({ success: true, ...result });
}

export async function getDocumentById(req: AuthenticatedRequest, res: Response): Promise<void> {
  const user = requireUser(req);
  const { id } = res.locals.params as { id: string };
  const document = await documentService.getDocumentById(id, user);
  res.status(200).json({ success: true, data: document });
}

export async function downloadDocument(req: AuthenticatedRequest, res: Response): Promise<void> {
  const user = requireUser(req);
  const { id } = res.locals.params as { id: string };
  const { buffer, originalFileName, mimeType } = await documentService.downloadDocument(id, user);

  res.setHeader('Content-Type', mimeType);
  res.setHeader(
    'Content-Disposition',
    `attachment; filename="${encodeURIComponent(originalFileName)}"`,
  );
  res.status(200).send(buffer);
}

export async function deleteDocument(_req: AuthenticatedRequest, res: Response): Promise<void> {
  const { id } = res.locals.params as { id: string };
  await documentService.deleteDocument(id);
  res.status(200).json({ success: true, message: 'Document deleted successfully' });
}
