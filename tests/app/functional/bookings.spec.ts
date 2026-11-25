import { ApiEndpoints, BookingStatus } from '../../../enums/app/app';
import { BookingResponse } from '../../../fixtures/api/schemas/app/bookingSchema';
import { expect, test } from '../../../fixtures/pom/test-options';
import { generateBookingInput } from '../../../test-data/factories/app/booking.factory';

/*
 * State cleanup: bookings are created against a per-test `createdEvent`,
 * whose teardown deletes the event and, by cascade, its bookings.
 */
test.describe('functional my bookings', () => {
    test(
        'should list a booking made through the API',
        { tag: '@regression' },
        async ({ apiRequest, bookingsPage, createdEvent }) => {
            let bookingRef = '';

            await test.step('GIVEN a booking created through the API', async () => {
                const { status, body } = await apiRequest<BookingResponse>({
                    method: 'POST',
                    url: ApiEndpoints.BOOKINGS,
                    baseUrl: process.env.API_URL,
                    headers: process.env.ACCESS_TOKEN,
                    body: generateBookingInput(createdEvent.id),
                });
                expect(status).toBe(201);
                bookingRef = body.data.bookingRef;
            });

            await test.step('WHEN the user opens My Bookings', async () => {
                await bookingsPage.openBookingsPage();
            });

            await test.step('THEN the booking is listed as confirmed', async () => {
                const card = bookingsPage.bookingCard(bookingRef);
                await expect(card).toBeVisible();
                await expect(card).toContainText(createdEvent.title);
                await expect(card).toContainText(BookingStatus.CONFIRMED);
            });
        }
    );

    test(
        'should cancel a booking',
        { tag: '@regression' },
        async ({ apiRequest, bookingsPage, createdEvent }) => {
            let bookingRef = '';

            await test.step('GIVEN a booking created through the API', async () => {
                const { status, body } = await apiRequest<BookingResponse>({
                    method: 'POST',
                    url: ApiEndpoints.BOOKINGS,
                    baseUrl: process.env.API_URL,
                    headers: process.env.ACCESS_TOKEN,
                    body: generateBookingInput(createdEvent.id),
                });
                expect(status).toBe(201);
                bookingRef = body.data.bookingRef;
                await bookingsPage.openBookingsPage();
                await expect(
                    bookingsPage.bookingCard(bookingRef)
                ).toBeVisible();
            });

            await test.step('WHEN the user cancels it and confirms the dialog', async () => {
                await bookingsPage.cancelBooking(bookingRef);
            });

            await test.step('THEN the booking disappears from the list', async () => {
                await expect(bookingsPage.bookingCard(bookingRef)).toHaveCount(
                    0
                );
            });
        }
    );
});
