import { z } from 'zod';

/**
 * Global search: one query term matched across customers, policies, claims,
 * premium payments, and documents. `limit` caps results *per category* —
 * global search is a navigation aid, not a paginated list (each category
 * links to its own list page for the full filtered view).
 */
export const globalSearchQuerySchema = z.object({
  q: z
    .string()
    .trim()
    .min(2, 'Search term must be at least 2 characters')
    .max(100, 'Search term must be at most 100 characters'),
  limit: z.coerce.number().int().min(1).max(10).default(5),
});

export type GlobalSearchQuery = z.infer<typeof globalSearchQuerySchema>;
