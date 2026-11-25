import { Locator, Page } from '@playwright/test';
import { AppRoutes } from '../../enums/app/app';
import { NavigationComponent } from '../components/navigation.component';

/**
 * Page Object for a single booking: event, customer and payment details,
 * plus the asynchronous refund-eligibility check.
 */
export class BookingDetailsPage {
    readonly nav: NavigationComponent;

    constructor(private readonly page: Page) {
        this.nav = new NavigationComponent(page);
    }

    // ==================== Locators ====================

    // Event title heading (level 1) for the given title.
    heading(title: string): Locator {
        return this.page.getByRole('heading', { level: 1, name: title });
    }

    get eventDetailsHeading(): Locator {
        return this.page.getByRole('heading', { name: 'Event Details' });
    }

    get customerDetailsHeading(): Locator {
        return this.page.getByRole('heading', { name: 'Customer Details' });
    }

    get paymentSummaryHeading(): Locator {
        return this.page.getByRole('heading', { name: 'Payment Summary' });
    }

    get checkRefundButton(): Locator {
        return this.page.getByRole('button', {
            name: 'Check eligibility for refund?',
        });
    }

    // Outcome of the refund check; appears a few seconds after the click.
    get refundResult(): Locator {
        return this.page.getByTestId('refund-result');
    }

    get backToBookingsButton(): Locator {
        return this.page.getByRole('button', {
            name: '← Back to My Bookings',
        });
    }

    // Value shown in the details cards (customer name, email, phone, total).
    detail(value: string): Locator {
        return this.page.getByText(value, { exact: true });
    }

    // ==================== Actions ====================

    /**
     * Opens the details page of the booking with the given ID.
     *
     * @param {number} bookingId - Numeric booking ID.
     * @returns {Promise<void>} Resolves when navigation is complete.
     */
    async openBooking(bookingId: number): Promise<void> {
        await this.page.goto(
            `${process.env.APP_URL!}${AppRoutes.BOOKINGS}/${bookingId}`,
            { waitUntil: 'domcontentloaded' }
        );
    }

    /**
     * Starts the refund-eligibility check. Callers assert the result with a
     * web-first assertion on `refundResult`, which waits for the delayed answer.
     *
     * @returns {Promise<void>} Resolves when the button has been clicked.
     */
    async checkRefundEligibility(): Promise<void> {
        await this.checkRefundButton.click();
    }
}
