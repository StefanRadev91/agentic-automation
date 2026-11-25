import { Locator, Page } from '@playwright/test';
import { AppRoutes, Messages } from '../../enums/app/app';
import { CreateBookingInput } from '../../fixtures/api/schemas/app/bookingSchema';
import { NavigationComponent } from '../components/navigation.component';

/**
 * Page Object for a single event: details and the "Book Tickets" form.
 */
export class EventDetailsPage {
    readonly nav: NavigationComponent;

    constructor(private readonly page: Page) {
        this.nav = new NavigationComponent(page);
    }

    // ==================== Locators ====================

    // Event title heading (level 1) for the given title.
    heading(title: string): Locator {
        return this.page.getByRole('heading', { level: 1, name: title });
    }

    get increaseTicketsButton(): Locator {
        return this.page.getByRole('button', { name: '+' });
    }

    get fullNameInput(): Locator {
        return this.page.getByLabel('Full Name*');
    }

    get emailInput(): Locator {
        return this.page.getByLabel('Email*');
    }

    get phoneInput(): Locator {
        return this.page.getByLabel('Phone Number*');
    }

    get confirmBookingButton(): Locator {
        return this.page.getByRole('button', { name: 'Confirm Booking' });
    }

    get confirmationHeading(): Locator {
        return this.page.getByRole('heading', {
            name: Messages.BOOKING_CONFIRMED,
        });
    }

    // Booking reference shown on the confirmation card (format `X-XXXXXX`).
    get bookingReference(): Locator {
        return this.page.getByText(/^[A-Z]-[A-Z0-9]{6}$/);
    }

    // ==================== Actions ====================

    /**
     * Opens the page of the event with the given ID.
     *
     * @param {number} eventId - Numeric event ID.
     * @returns {Promise<void>} Resolves when navigation is complete.
     */
    async openEvent(eventId: number): Promise<void> {
        await this.page.goto(
            `${process.env.APP_URL!}${AppRoutes.EVENTS}/${eventId}`,
            { waitUntil: 'domcontentloaded' }
        );
    }

    /**
     * Fills the booking form and confirms the booking. The ticket counter
     * starts at 1, so it is increased `quantity - 1` times.
     *
     * @param {CreateBookingInput} booking - Customer data and ticket quantity.
     * @returns {Promise<void>} Resolves when the form has been submitted.
     */
    async bookTickets(
        booking: Pick<
            CreateBookingInput,
            'customerName' | 'customerEmail' | 'customerPhone' | 'quantity'
        >
    ): Promise<void> {
        for (let ticket = 1; ticket < booking.quantity; ticket++) {
            await this.increaseTicketsButton.click();
        }
        await this.fullNameInput.fill(booking.customerName);
        await this.emailInput.fill(booking.customerEmail);
        await this.phoneInput.fill(booking.customerPhone);
        await this.confirmBookingButton.click();
    }
}
