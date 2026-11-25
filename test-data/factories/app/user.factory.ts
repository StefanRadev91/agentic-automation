import { faker } from '@faker-js/faker';
import {
    AuthInput,
    AuthInputSchema,
} from '../../../fixtures/api/schemas/app/authSchema';

/**
 * Generates unique, valid credentials for a brand-new EventHub account.
 * The password satisfies the stricter UI rule (8+ chars, uppercase, digit,
 * special character) so the same data works for API and UI registration.
 *
 * @param {Partial<AuthInput>} overrides - Optional values replacing the generated ones.
 * @returns {AuthInput} Credentials validated against `AuthInputSchema`.
 *
 * @example
 * const { email, password } = generateCredentials();
 */
export const generateCredentials = (
    overrides?: Partial<AuthInput>
): AuthInput => {
    const credentials: AuthInput = {
        email: faker.internet
            .email({ provider: 'example.com' })
            .toLowerCase()
            .replace('@', `.${faker.string.alphanumeric(6).toLowerCase()}@`),
        password: `Aa1!${faker.string.alphanumeric(10)}`,
        ...overrides,
    };

    return AuthInputSchema.parse(credentials);
};
