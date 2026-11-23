import { z } from 'zod';

export function paginationValidationSchema(allowedLimits = [10, 20, 50]) {
  return z.object({
    page: z.coerce.number().min(1).default(1),
    limit: z.coerce
      .number()
      .refine((val) => allowedLimits.includes(val))
      .default(allowedLimits[0]),
  });
}

export function translatePaginationFrom(
  page: number,
  limit: number,
  totalItems: number,
): number {
  if (totalItems === 0) return 0;
  return (page - 1) * limit + 1;
}

export function translatePaginationTo(
  page: number,
  limit: number,
  totalItems: number,
): number {
  const to = page * limit;
  return to > totalItems ? totalItems : to;
}
