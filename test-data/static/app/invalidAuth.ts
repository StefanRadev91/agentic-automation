/**
 * Domain-specific invalid inputs for EventHub authentication tests.
 *
 * - `INVALID_EMAILS` — malformed emails the API and the UI must reject.
 * - `SHORT_PASSWORDS` — passwords under the 6-character minimum.
 * - `WRONG_LOGIN_ATTEMPTS` — well-formed credentials that do not match any account.
 *
 * Static data files may export only literal values (`as const`).
 */

export const INVALID_EMAILS = [
    'plaintext',
    'missing-at-sign.com',
    '@missing-local.com',
    'double@@at.com',
    'spaces in@email.com',
] as const;

export const SHORT_PASSWORDS = ['', '1', '12345'] as const;

export const WRONG_LOGIN_ATTEMPTS = [
    {
        description: 'unknown email',
        email: 'nobody.registered@example.com',
        password: 'WrongPassword1!',
    },
    {
        description: 'unknown email with another password',
        email: 'ghost.account@example.com',
        password: 'IncorrectPass2$',
    },
] as const;
