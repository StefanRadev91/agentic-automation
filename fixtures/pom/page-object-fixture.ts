import { test as base } from '@playwright/test';
import { BookingDetailsPage } from '../../pages/app/booking-details.page';
import { BookingsPage } from '../../pages/app/bookings.page';
import { EventDetailsPage } from '../../pages/app/event-details.page';
import { EventsPage } from '../../pages/app/events.page';
import { LoginPage } from '../../pages/app/login.page';

/**
 * Framework fixtures for page objects.
 * Add new page object types here as you create them.
 */
export type FrameworkFixtures = {
    loginPage: LoginPage;
    eventsPage: EventsPage;
    eventDetailsPage: EventDetailsPage;
    bookingsPage: BookingsPage;
    bookingDetailsPage: BookingDetailsPage;
    /** Clears cookies, permissions and the app's web storage so the test starts signed out */
    resetStorageState: () => Promise<void>;
};

/**
 * Extended test with page object fixtures.
 *
 * @example
 * test('example', async ({ eventsPage }) => {
 *     await eventsPage.openEventsPage();
 *     await expect(eventsPage.heading).toBeVisible();
 * });
 */
export const test = base.extend<FrameworkFixtures>({
    loginPage: async ({ page }, use) => {
        await use(new LoginPage(page));
    },

    eventsPage: async ({ page }, use) => {
        await use(new EventsPage(page));
    },

    eventDetailsPage: async ({ page }, use) => {
        await use(new EventDetailsPage(page));
    },

    bookingsPage: async ({ page }, use) => {
        await use(new BookingsPage(page));
    },

    bookingDetailsPage: async ({ page }, use) => {
        await use(new BookingDetailsPage(page));
    },

    resetStorageState: async ({ context, page }, use) => {
        await use(async () => {
            await context.clearCookies();
            await context.clearPermissions();
            // Web storage is per origin: the page must be on the app before
            // localStorage (where this app keeps its token) can be cleared.
            await page.goto(process.env.APP_URL!, {
                waitUntil: 'domcontentloaded',
            });
            await page.evaluate(() => {
                window.localStorage.clear();
                window.sessionStorage.clear();
            });
        });
    },
});
