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

    get clearAllButton(): Locator {
        return this.page.getByRole('button', { name: 'Clear all bookings' });
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

    /**
     * Opens the details page of the booking with the given reference.
     *
     * @param {string} bookingRef - Booking reference to open.
     * @returns {Promise<void>} Resolves when the link has been clicked.
     */
    async openBookingDetails(bookingRef: string): Promise<void> {
        await this.bookingCard(bookingRef)
            .getByRole('button', { name: 'View Details' })
            .click();
    }

    /**
     * Deletes every booking of the signed-in user. The app asks for
     * confirmation in a native browser dialog, which is accepted here.
     *
     * @returns {Promise<void>} Resolves when the button has been clicked.
     */
    async clearAllBookings(): Promise<void> {
        this.page.once('dialog', (dialog) => dialog.accept());
        await this.clearAllButton.click();
    }
}
