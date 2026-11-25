import { Locator, Page } from '@playwright/test';
import { AppRoutes, Messages } from '../../enums/app/app';
import { NavigationComponent } from '../components/navigation.component';

/**
 * Page Object for "My Bookings": list, status and cancellation.
 */
export class BookingsPage {
    readonly nav: NavigationComponent;

    constructor(private readonly page: Page) {
        this.nav = new NavigationComponent(page);
    }

    // ==================== Locators ====================

    get heading(): Locator {
        return this.page.getByRole('heading', { name: 'My Bookings' });
    }

    get bookingCards(): Locator {
        return this.page.getByTestId('booking-card');
    }

    get emptyState(): Locator {
        return this.page.getByText(Messages.NO_BOOKINGS);
    }

    get confirmCancelButton(): Locator {
        return this.page.getByTestId('confirm-dialog-yes');
    }

    // Booking card containing the given reference (e.g. `E-Y71XGK`).
    bookingCard(bookingRef: string): Locator {
        return this.bookingCards.filter({ hasText: bookingRef });
    }

    // ==================== Actions ====================

    /**
     * Opens "My Bookings".
     *
     * @returns {Promise<void>} Resolves when navigation is complete.
     */
    async openBookingsPage(): Promise<void> {
        await this.page.goto(`${process.env.APP_URL!}${AppRoutes.BOOKINGS}`, {
            waitUntil: 'domcontentloaded',
        });
    }

    /**
     * Cancels the booking with the given reference and confirms the dialog.
     *
     * @param {string} bookingRef - Booking reference to cancel.
     * @returns {Promise<void>} Resolves when the dialog has been confirmed.
     */
    async cancelBooking(bookingRef: string): Promise<void> {
        await this.bookingCard(bookingRef)
            .getByTestId('cancel-booking-btn')
            .click();
        await this.confirmCancelButton.click();
    }
}
