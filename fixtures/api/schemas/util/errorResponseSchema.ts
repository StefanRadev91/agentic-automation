import { z } from 'zod/v4';
import type { output as zOutput } from 'zod/v4';

/*
 * FIXME: the OpenAPI contract documents `{ success, error }` for error
 * responses, but the live API also returns a `details` array on auth and
 * validation failures. Shapes below follow the live responses.
 */

/** 400 / 404 / 500 error body: `{ success: false, error }` (+ optional details). */
export const ErrorResponseSchema = z.strictObject({
    success: z.literal(false),
    error: z.string(),
    details: z
        .array(z.strictObject({ field: z.string(), message: z.string() }))
        .optional(),
});

/** 400 validation error: always carries per-field details. */
export const ValidationErrorResponseSchema = z.strictObject({
    success: z.literal(false),
    error: z.literal('Validation failed'),
    details: z
        .array(z.strictObject({ field: z.string(), message: z.string() }))
        .min(1),
});

/** 401 body returned by every protected route without a valid token. */
export const UnauthorizedResponseSchema = z.strictObject({
    success: z.literal(false),
    error: z.literal('Unauthorized'),
});

export type ErrorResponse = zOutput<typeof ErrorResponseSchema>;
export type ValidationErrorResponse = zOutput<
    typeof ValidationErrorResponseSchema
>;
export type UnauthorizedResponse = zOutput<typeof UnauthorizedResponseSchema>;
