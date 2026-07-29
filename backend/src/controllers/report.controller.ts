import type { Response } from 'express';
import type { AuthenticatedRequest } from '@middlewares/authenticate.js';
import * as reportService from '@services/report.service.js';
import type { ReportRangeQuery } from '@validators/report.validator.js';

export async function getDashboardSummary(
  _req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  const summary = await reportService.getDashboardSummary();
  res.status(200).json({ success: true, data: summary });
}

export async function getCustomerGrowth(_req: AuthenticatedRequest, res: Response): Promise<void> {
  const { months } = res.locals.query as ReportRangeQuery;
  const report = await reportService.getCustomerGrowth(months);
  res.status(200).json({ success: true, data: report });
}

export async function getPremiumCollection(
  _req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  const { months } = res.locals.query as ReportRangeQuery;
  const report = await reportService.getPremiumCollection(months);
  res.status(200).json({ success: true, data: report });
}

export async function getPolicyStatistics(
  _req: AuthenticatedRequest,
  res: Response,
): Promise<void> {
  const report = await reportService.getPolicyStatistics();
  res.status(200).json({ success: true, data: report });
}

export async function getClaimStatistics(_req: AuthenticatedRequest, res: Response): Promise<void> {
  const { months } = res.locals.query as ReportRangeQuery;
  const report = await reportService.getClaimStatistics(months);
  res.status(200).json({ success: true, data: report });
}
