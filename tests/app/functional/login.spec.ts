import { expect, test } from '../../../fixtures/pom/test-options';
import { loadTestUser } from '../../../helpers/app/createStorageState';
import {
    INVALID_EMAILS,
    SHORT_PASSWORDS,
    WRONG_LOGIN_ATTEMPTS,
} from '../../../test-data/static/app/invalidAuth';

test.describe('functional login', () => {
    test.beforeEach(async ({ resetStorageState, loginPage }) => {
        await resetStorageState();
        await loginPage.openLoginPage();
    });

    test(
        'should sign in with valid credentials',
        { tag: '@smoke' },
        async ({ loginPage }) => {
            const { email, password } = loadTestUser();

            await test.step('WHEN the user submits valid credentials', async () => {
                await loginPage.login(email, password);
            });

            await test.step('THEN the signed-in email is shown in the header', async () => {
                await expect(loginPage.nav.userEmail).toHaveText(email);
            });
        }
    );

    test(
        'should sign out and return to the sign-in page',
        { tag: '@regression' },
        async ({ loginPage }) => {
            const { email, password } = loadTestUser();

            await test.step('GIVEN a signed-in user', async () => {
                await loginPage.loginAndVerify(email, password);
            });

            await test.step('WHEN the user logs out', async () => {
                await loginPage.nav.logout();
            });

            await test.step('THEN the sign-in form is shown again', async () => {
                await expect(loginPage.signInHeading).toBeVisible();
            });
        }
    );

    for (const { description, email, password } of WRONG_LOGIN_ATTEMPTS) {
        test(
            `should reject wrong credentials - ${description}`,
            { tag: '@regression' },
            async ({ loginPage }) => {
                await test.step('WHEN the user submits unknown credentials', async () => {
                    await loginPage.login(email, password);
                });

                await test.step('THEN an invalid credentials error is shown', async () => {
                    await expect(
                        loginPage.invalidCredentialsError
                    ).toBeVisible();
                });
            }
        );
    }

    test(
        'should require an email and a password',
        { tag: '@regression' },
        async ({ loginPage }) => {
            await test.step('WHEN the user submits an empty form', async () => {
                await loginPage.signInButton.click();
            });

            await test.step('THEN both field errors are shown', async () => {
                await expect(loginPage.emailInvalidError).toBeVisible();
                await expect(loginPage.passwordTooShortError).toBeVisible();
            });
        }
    );

    for (const email of INVALID_EMAILS) {
        test(
            `should reject malformed email "${email}"`,
            { tag: '@regression' },
            async ({ loginPage }) => {
                const { password } = loadTestUser();

                await test.step('WHEN the user submits a malformed email', async () => {
                    await loginPage.login(email, password);
                });

                await test.step('THEN the email validation error is shown', async () => {
                    await expect(loginPage.emailInvalidError).toBeVisible();
                });
            }
        );
    }

    for (const password of SHORT_PASSWORDS) {
        test(
            `should reject password shorter than 6 characters "${password}"`,
            { tag: '@regression' },
            async ({ loginPage }) => {
                const { email } = loadTestUser();

                await test.step('WHEN the user submits a short password', async () => {
                    await loginPage.login(email, password);
                });

                await test.step('THEN the password validation error is shown', async () => {
                    await expect(loginPage.passwordTooShortError).toBeVisible();
                });
            }
        );
    }
});
