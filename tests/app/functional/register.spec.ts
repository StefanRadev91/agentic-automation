import { AppRoutes } from '../../../enums/app/app';
import { expect, test } from '../../../fixtures/pom/test-options';
import { generateCredentials } from '../../../test-data/factories/app/user.factory';

/*
 * State cleanup: EventHub has no way to delete an account. The account each
 * test registers lives in its own isolated sandbox and affects nothing shared.
 */
test.describe('functional register', () => {
    test.beforeEach(async ({ resetStorageState, loginPage }) => {
        await resetStorageState();
        await loginPage.openRegisterPage();
    });

    test(
        'should register a new account and sign in',
        { tag: '@smoke' },
        async ({ loginPage }) => {
            const { email, password } = generateCredentials();

            await test.step('WHEN the user registers with valid data', async () => {
                await loginPage.register(email, password);
            });

            await test.step('THEN the user is signed in with the new account', async () => {
                await expect(loginPage.nav.userEmail).toHaveText(email);
            });
        }
    );

    test(
        'should link to the sign-in page',
        { tag: '@regression' },
        async ({ loginPage, page }) => {
            await test.step('WHEN the user follows the sign-in link', async () => {
                await page.getByRole('link', { name: 'Sign in' }).click();
            });

            await test.step('THEN the sign-in page is shown', async () => {
                await expect(page).toHaveURL(new RegExp(`${AppRoutes.LOGIN}$`));
                await expect(loginPage.signInHeading).toBeVisible();
            });
        }
    );
});
