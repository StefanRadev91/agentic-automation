import { Locator, Page } from '@playwright/test';

/**
 * Component Object for the EventHub top navigation bar.
 * Composed into every page object that shows the signed-in header.
 *
 * @example
 * await eventsPage.nav.openBookings();
 */
export class NavigationComponent {
    constructor(private readonly page: Page) {}

    // ==================== Locators ====================

    get homeLink(): Locator {
        return this.page.getByTestId('nav-home');
    }

    get eventsLink(): Locator {
        return this.page.getByTestId('nav-events');
    }

    get bookingsLink(): Locator {
        return this.page.getByTestId('nav-bookings');
    }

    get userEmail(): Locator {
        return this.page.getByTestId('user-email-display');
    }

    get logoutButton(): Locator {
        return this.page.getByTestId('logout-btn');
    }

    // ==================== Actions ====================

    /**
     * Opens the events list through the navigation bar.
     *
     * @returns {Promise<void>}
     */
    async openEvents(): Promise<void> {
        await this.eventsLink.click();
    }

    /**
     * Opens "My Bookings" through the navigation bar.
     *
     * @returns {Promise<void>}
     */
    async openBookings(): Promise<void> {
        await this.bookingsLink.click();
    }

    /**
     * Signs the current user out.
     *
     * @returns {Promise<void>}
     */
    async logout(): Promise<void> {
        await this.logoutButton.click();
    }
}
