import type { Response } from 'express';
import type { AuthenticatedRequest } from '@middlewares/authenticate.js';
import * as searchService from '@services/search.service.js';
import { UnauthorizedError } from '@utils/AppError.js';
import type { GlobalSearchQuery } from '@validators/search.validator.js';

export async function globalSearch(req: AuthenticatedRequest, res: Response): Promise<void> {
  if (!req.user) throw new UnauthorizedError('Authentication required');
  const { q, limit } = res.locals.query as GlobalSearchQuery;
  const results = await searchService.globalSearch(q, limit, req.user);
  res.status(200).json({ success: true, data: results });
}
