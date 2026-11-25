import { z } from 'zod/v4';

/** Response of GET /health. */
export const HealthResponseSchema = z.strictObject({
    status: z.literal('ok'),
    timestamp: z.iso.datetime(),
    dbStatus: z.string(),
});

/** Response of GET /config. */
export const ConfigResponseSchema = z.strictObject({
    showExploreLinks: z.boolean(),
});
