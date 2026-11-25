import { z } from 'zod/v4';
import type { output as zOutput } from 'zod/v4';

/** Request body shared by POST /auth/register and POST /auth/login. */
export const AuthInputSchema = z.strictObject({
    email: z.email(),
    password: z.string().min(6),
});

/** Response of POST /auth/register (201) and POST /auth/login (200). */
export const AuthResponseSchema = z.strictObject({
    success: z.literal(true),
    token: z.string().min(1),
    user: z.strictObject({
        id: z.int(),
        email: z.email(),
    }),
});

/**
 * Response of GET /auth/me (200).
 * `iat` / `exp` are JWT claims returned by the live API; the OpenAPI contract
 * documents only `userId` and `email`.
 */
export const MeResponseSchema = z.strictObject({
    success: z.literal(true),
    user: z.strictObject({
        userId: z.int(),
        email: z.email(),
        iat: z.int(),
        exp: z.int(),
    }),
});

/** Persisted by the `setup-api` project and loaded by every worker. */
export const TestUserSchema = z.strictObject({
    email: z.email(),
    password: z.string().min(6),
    token: z.string().min(1),
    userId: z.int(),
});

export type AuthInput = zOutput<typeof AuthInputSchema>;
export type AuthResponse = zOutput<typeof AuthResponseSchema>;
export type MeResponse = zOutput<typeof MeResponseSchema>;
export type TestUser = zOutput<typeof TestUserSchema>;
