import { expect, Locator, Page } from '@playwright/test';
import { AppRoutes, Messages } from '../../enums/app/app';
import { NavigationComponent } from '../components/navigation.component';

/**
 * Page Object for the EventHub sign-in and registration screens.
 */
export class LoginPage {
    /** Navigation bar, visible once the user is signed in */
    readonly nav: NavigationComponent;

    constructor(private readonly page: Page) {
        this.nav = new NavigationComponent(page);
    }

    // ==================== Locators ====================

    get signInHeading(): Locator {
        return this.page.getByRole('heading', { name: 'Sign in to EventHub' });
    }

    get registerHeading(): Locator {
        return this.page.getByRole('heading', { name: 'Create your account' });
    }

    get emailInput(): Locator {
        return this.page.getByLabel('Email', { exact: true });
    }

    get passwordInput(): Locator {
        return this.page.getByLabel('Password', { exact: true });
    }

    // The registration form has no label associations: placeholders are the
    // most semantic locators available there.
    get registerEmailInput(): Locator {
        return this.page.getByPlaceholder('you@email.com');
    }

    get registerPasswordInput(): Locator {
        return this.page.getByPlaceholder(
            'Min 8 chars, uppercase, number & symbol'
        );
    }

    get confirmPasswordInput(): Locator {
        return this.page.getByPlaceholder('Repeat your password');
    }

    get signInButton(): Locator {
        return this.page.getByRole('button', { name: 'Sign In' });
    }

    get createAccountButton(): Locator {
        return this.page.getByRole('button', { name: 'Create Account' });
    }

    get registerLink(): Locator {
        return this.page.getByRole('link', { name: 'Register' });
    }

    get invalidCredentialsError(): Locator {
        return this.page.getByText(Messages.LOGIN_ERROR);
    }

    get emailInvalidError(): Locator {
        return this.page.getByText(Messages.EMAIL_INVALID);
    }

    get passwordTooShortError(): Locator {
        return this.page.getByText(Messages.PASSWORD_TOO_SHORT);
    }

    // ==================== Actions ====================

    /**
     * Opens the sign-in page.
     *
     * @returns {Promise<void>} Resolves when navigation is complete.
     */
    async openLoginPage(): Promise<void> {
        await this.page.goto(`${process.env.APP_URL!}${AppRoutes.LOGIN}`, {
            waitUntil: 'domcontentloaded',
        });
    }

    /**
     * Opens the registration page.
     *
     * @returns {Promise<void>} Resolves when navigation is complete.
     */
    async openRegisterPage(): Promise<void> {
        await this.page.goto(`${process.env.APP_URL!}${AppRoutes.REGISTER}`, {
            waitUntil: 'domcontentloaded',
        });
    }

    /**
     * Fills the sign-in form and submits it. No response wait: invalid input
     * is rejected client-side without a request, so callers assert the outcome
     * with web-first assertions.
     *
     * @param {string} email - Account email.
     * @param {string} password - Account password.
     * @returns {Promise<void>} Resolves when the form has been submitted.
     */
    async login(email: string, password: string): Promise<void> {
        await this.emailInput.fill(email);
        await this.passwordInput.fill(password);
        await this.signInButton.click();
    }

    /**
     * Signs in and asserts the header shows the signed-in email.
     *
     * @param {string} email - Account email.
     * @param {string} password - Account password.
     * @returns {Promise<void>} Resolves when login is verified successful.
     */
    async loginAndVerify(email: string, password: string): Promise<void> {
        await this.login(email, password);
        await expect(this.nav.userEmail).toHaveText(email);
    }

    /**
     * Fills the registration form (password entered twice) and submits it.
     *
     * @param {string} email - Email of the new account.
     * @param {string} password - Password of the new account.
     * @returns {Promise<void>} Resolves when the form has been submitted.
     */
    async register(email: string, password: string): Promise<void> {
        await this.registerEmailInput.fill(email);
        await this.registerPasswordInput.fill(password);
        await this.confirmPasswordInput.fill(password);
        await this.createAccountButton.click();
    }
}
