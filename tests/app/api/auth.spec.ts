import { ApiEndpoints } from '../../../enums/app/app';
import {
    AuthResponse,
    AuthResponseSchema,
    MeResponse,
    MeResponseSchema,
} from '../../../fixtures/api/schemas/app/authSchema';
import {
    ErrorResponse,
    ErrorResponseSchema,
    UnauthorizedResponse,
    UnauthorizedResponseSchema,
    ValidationErrorResponse,
    ValidationErrorResponseSchema,
} from '../../../fixtures/api/schemas/util/errorResponseSchema';
import { expect, test } from '../../../fixtures/pom/test-options';
import { generateCredentials } from '../../../test-data/factories/app/user.factory';
import {
    INVALID_EMAILS,
    SHORT_PASSWORDS,
    WRONG_LOGIN_ATTEMPTS,
} from '../../../test-data/static/app/invalidAuth';
import { INVALID_STRING_VALUES } from '../../../test-data/static/util/invalid-values';

/*
 * State cleanup: EventHub has no endpoint to delete a user. Every account
 * created here lives in its own isolated sandbox and cannot affect other
 * tests, so there is nothing shared to revert.
 */
test.describe('api/auth - register', () => {
    test(
        'should return 201 and a token for new credentials',
        { tag: '@api' },
        async ({ apiRequest }) => {
            const credentials = generateCredentials();

            const { status, body } = await apiRequest<AuthResponse>({
                method: 'POST',
                url: ApiEndpoints.REGISTER,
                baseUrl: process.env.API_URL,
                body: credentials,
            });

            expect(status).toBe(201);
            expect(AuthResponseSchema.parse(body)).toBeTruthy();
            expect(body.user.email).toBe(credentials.email);
        }
    );

    test(
        'should return 400 when the email is already registered',
        { tag: '@api' },
        async ({ apiRequest }) => {
            const credentials = generateCredentials();

            await test.step('GIVEN an account already exists', async () => {
                const { status } = await apiRequest<AuthResponse>({
                    method: 'POST',
                    url: ApiEndpoints.REGISTER,
                    baseUrl: process.env.API_URL,
                    body: credentials,
                });
                expect(status).toBe(201);
            });

            await test.step('WHEN the same email is registered again', async () => {
                const { status, body } = await apiRequest<ErrorResponse>({
                    method: 'POST',
                    url: ApiEndpoints.REGISTER,
                    baseUrl: process.env.API_URL,
                    body: credentials,
                });

                expect(status).toBe(400);
                expect(ErrorResponseSchema.parse(body)).toBeTruthy();
                expect(body.error).toBe('Email already registered');
            });
        }
    );

    test(
        'should return 400 for an empty body',
        { tag: '@api' },
        async ({ apiRequest }) => {
            const { status, body } = await apiRequest<ValidationErrorResponse>({
                method: 'POST',
                url: ApiEndpoints.REGISTER,
                baseUrl: process.env.API_URL,
                body: {},
            });

            expect(status).toBe(400);
            expect(ValidationErrorResponseSchema.parse(body)).toBeTruthy();
        }
    );

    for (const field of ['email', 'password'] as const) {
        test(
            `should return 400 when ${field} is omitted`,
            { tag: '@api' },
            async ({ apiRequest }) => {
                const payload: Record<string, unknown> = {
                    ...generateCredentials(),
                };
                delete payload[field];

                const { status, body } =
                    await apiRequest<ValidationErrorResponse>({
                        method: 'POST',
                        url: ApiEndpoints.REGISTER,
                        baseUrl: process.env.API_URL,
                        body: payload,
                    });

                expect(status).toBe(400);
                expect(ValidationErrorResponseSchema.parse(body)).toBeTruthy();
                expect(body.details.map((detail) => detail.field)).toContain(
                    field
                );
            }
        );

        for (const invalidValue of INVALID_STRING_VALUES) {
            // Number/boolean passwords crash the live API; covered by the
            // explicit skipped tests below the field loop.
            if (
                field === 'password' &&
                (typeof invalidValue === 'number' ||
                    typeof invalidValue === 'boolean')
            ) {
                continue;
            }

            test(
                `should return 400 when ${field} is ${JSON.stringify(invalidValue)}`,
                { tag: '@api' },
                async ({ apiRequest }) => {
                    const { status, body } =
                        await apiRequest<ValidationErrorResponse>({
                            method: 'POST',
                            url: ApiEndpoints.REGISTER,
                            baseUrl: process.env.API_URL,
                            body: {
                                ...generateCredentials(),
                                [field]: invalidValue,
                            },
                        });

                    expect(status).toBe(400);
                    expect(
                        ValidationErrorResponseSchema.parse(body)
                    ).toBeTruthy();
                }
            );
        }
    }

    for (const invalidPassword of [123, true]) {
        // FIXME: https://api.eventhub.rahulshettyacademy.com/api/docs - a non-string password crashes the API with 500 "Internal server error" instead of a 400 validation error.
        test.skip(
            `should return 400 when password is ${JSON.stringify(invalidPassword)}`,
            { tag: '@api' },
            async ({ apiRequest }) => {
                const { status, body } =
                    await apiRequest<ValidationErrorResponse>({
                        method: 'POST',
                        url: ApiEndpoints.REGISTER,
                        baseUrl: process.env.API_URL,
                        body: {
                            ...generateCredentials(),
                            password: invalidPassword,
                        },
                    });

                expect(status).toBe(400);
                expect(ValidationErrorResponseSchema.parse(body)).toBeTruthy();
            }
        );
    }

    for (const email of INVALID_EMAILS) {
        test(
            `should return 400 for malformed email "${email}"`,
            { tag: '@api' },
            async ({ apiRequest }) => {
                const { status, body } =
                    await apiRequest<ValidationErrorResponse>({
                        method: 'POST',
                        url: ApiEndpoints.REGISTER,
                        baseUrl: process.env.API_URL,
                        body: { ...generateCredentials(), email },
                    });

                expect(status).toBe(400);
                expect(ValidationErrorResponseSchema.parse(body)).toBeTruthy();
            }
        );
    }

    for (const password of SHORT_PASSWORDS) {
        test(
            `should return 400 for password shorter than 6 characters "${password}"`,
            { tag: '@api' },
            async ({ apiRequest }) => {
                const { status, body } =
                    await apiRequest<ValidationErrorResponse>({
                        method: 'POST',
                        url: ApiEndpoints.REGISTER,
                        baseUrl: process.env.API_URL,
                        body: { ...generateCredentials(), password },
                    });

                expect(status).toBe(400);
                expect(ValidationErrorResponseSchema.parse(body)).toBeTruthy();
            }
        );
    }
});

test.describe('api/auth - login', () => {
    test(
        'should return 200 and a token for valid credentials',
        { tag: '@api' },
        async ({ apiRequest }) => {
            const credentials = generateCredentials();

            await test.step('GIVEN a registered account', async () => {
                const { status } = await apiRequest<AuthResponse>({
                    method: 'POST',
                    url: ApiEndpoints.REGISTER,
                    baseUrl: process.env.API_URL,
                    body: credentials,
                });
                expect(status).toBe(201);
            });

            await test.step('WHEN the account logs in', async () => {
                const { status, body } = await apiRequest<AuthResponse>({
                    method: 'POST',
                    url: ApiEndpoints.LOGIN,
                    baseUrl: process.env.API_URL,
                    body: credentials,
                });

                expect(status).toBe(200);
                expect(AuthResponseSchema.parse(body)).toBeTruthy();
                expect(body.user.email).toBe(credentials.email);
            });
        }
    );

    for (const { description, email, password } of WRONG_LOGIN_ATTEMPTS) {
        // FIXME: https://api.eventhub.rahulshettyacademy.com/api/docs - the contract documents 404 for unknown credentials, the live API answers 400 "Invalid email or password".
        test.skip(
            `should return 404 for ${description}`,
            { tag: '@api' },
            async ({ apiRequest }) => {
                const { status, body } = await apiRequest<ErrorResponse>({
                    method: 'POST',
                    url: ApiEndpoints.LOGIN,
                    baseUrl: process.env.API_URL,
                    body: { email, password },
                });

                expect(status).toBe(404);
                expect(ErrorResponseSchema.parse(body)).toBeTruthy();
            }
        );
    }

    test(
        'should return 400 for an empty body',
        { tag: '@api' },
        async ({ apiRequest }) => {
            const { status, body } = await apiRequest<ValidationErrorResponse>({
                method: 'POST',
                url: ApiEndpoints.LOGIN,
                baseUrl: process.env.API_URL,
                body: {},
            });

            expect(status).toBe(400);
            expect(ValidationErrorResponseSchema.parse(body)).toBeTruthy();
        }
    );

    for (const field of ['email', 'password'] as const) {
        test(
            `should return 400 when ${field} is omitted`,
            { tag: '@api' },
            async ({ apiRequest }) => {
                const payload: Record<string, unknown> = {
                    ...generateCredentials(),
                };
                delete payload[field];

                const { status, body } =
                    await apiRequest<ValidationErrorResponse>({
                        method: 'POST',
                        url: ApiEndpoints.LOGIN,
                        baseUrl: process.env.API_URL,
                        body: payload,
                    });

                expect(status).toBe(400);
                expect(ValidationErrorResponseSchema.parse(body)).toBeTruthy();
            }
        );
    }
});

test.describe('api/auth - me', () => {
    test(
        'should return 200 and the signed-in user for a valid token',
        { tag: '@api' },
        async ({ apiRequest }) => {
            const { status, body } = await apiRequest<MeResponse>({
                method: 'GET',
                url: ApiEndpoints.ME,
                baseUrl: process.env.API_URL,
                headers: process.env.ACCESS_TOKEN,
            });

            expect(status).toBe(200);
            expect(MeResponseSchema.parse(body)).toBeTruthy();
        }
    );

    test(
        'should return 401 without a token',
        { tag: '@api' },
        async ({ apiRequest }) => {
            const { status, body } = await apiRequest<UnauthorizedResponse>({
                method: 'GET',
                url: ApiEndpoints.ME,
                baseUrl: process.env.API_URL,
            });

            expect(status).toBe(401);
            expect(UnauthorizedResponseSchema.parse(body)).toBeTruthy();
        }
    );

    test(
        'should return 401 for a malformed token',
        { tag: '@api' },
        async ({ apiRequest }) => {
            const { status, body } = await apiRequest<ErrorResponse>({
                method: 'GET',
                url: ApiEndpoints.ME,
                baseUrl: process.env.API_URL,
                headers: 'not-a-valid-jwt',
            });

            expect(status).toBe(401);
            expect(ErrorResponseSchema.parse(body)).toBeTruthy();
            expect(body.error).toBe('Invalid or expired token');
        }
    );
});
