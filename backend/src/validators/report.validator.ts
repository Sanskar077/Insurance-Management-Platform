import { z } from 'zod';

/**
 * Month-bucketed report series accept a `months` window (how far back to
 * aggregate). Bounded to keep the raw GROUP BY queries cheap.
 */
export const reportRangeQuerySchema = z.object({
  months: z.coerce.number().int().min(1).max(36).default(12),
});

export type ReportRangeQuery = z.infer<typeof reportRangeQuerySchema>;
