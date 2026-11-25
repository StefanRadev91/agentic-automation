import { ApiEndpoints, BookingStatus, Messages } from '../../../enums/app/app';
import { BookingResponse } from '../../../fixtures/api/schemas/app/bookingSchema';
import { expect, test } from '../../../fixtures/pom/test-options';
import { generateBookingInput } from '../../../test-data/factories/app/booking.factory';

/*
 * State cleanup: the booking is made on a per-test `createdEvent`, whose
 * teardown deletes the event and, by cascade, the booking.
 */
test.describe('e2e booking flow', () => {
    test(
        'should book tickets through the UI and see them in My Bookings and the API',
        { tag: '@e2e' },
        async ({
            apiRequest,
            eventsPage,
            eventDetailsPage,
            bookingsPage,
            createdEvent,
        }) => {
            const booking = generateBookingInput(createdEvent.id, {
                quantity: 2,
            });
            let bookingRef = '';

            await test.step('GIVEN the user finds the event in the list', async () => {
                await eventsPage.openEventsPage();
                await eventsPage.search(createdEvent.title);
                // wait for the filtered list to settle before clicking
                await expect(eventsPage.eventCards).toHaveCount(1);
                await eventsPage.openEvent(createdEvent.title);
                await expect(
                    eventDetailsPage.heading(createdEvent.title)
                ).toBeVisible();
            });

            await test.step('WHEN the user books two tickets', async () => {
                await eventDetailsPage.bookTickets(booking);
                await expect(
                    eventDetailsPage.confirmationHeading
                ).toBeVisible();
                bookingRef =
                    (await eventDetailsPage.bookingReference.textContent()) ??
                    '';
                expect(bookingRef).not.toBe('');
            });

            await test.step('THEN the booking is listed in My Bookings', async () => {
                await eventDetailsPage.nav.openBookings();
                const card = bookingsPage.bookingCard(bookingRef);
                await expect(card).toBeVisible();
                await expect(card).toContainText(createdEvent.title);
                await expect(card).toContainText(
                    `${booking.quantity} ${Messages.TICKETS}`
                );
            });

            await test.step('THEN the API confirms the booking and the seat count', async () => {
                const { status, body } = await apiRequest<BookingResponse>({
                    method: 'GET',
                    url: `${ApiEndpoints.BOOKINGS_BY_REF}/${bookingRef}`,
                    baseUrl: process.env.API_URL,
                    headers: process.env.ACCESS_TOKEN,
                });

                expect(status).toBe(200);
                expect(body.data.status).toBe(BookingStatus.CONFIRMED);
                expect(body.data.quantity).toBe(2);
                expect(body.data.customerEmail).toBe(booking.customerEmail);
            });
        }
    );
});
