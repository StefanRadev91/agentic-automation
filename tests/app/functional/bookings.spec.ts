import { ApiEndpoints, BookingStatus } from '../../../enums/app/app';
import { AuthResponse } from '../../../fixtures/api/schemas/app/authSchema';
import { BookingResponse } from '../../../fixtures/api/schemas/app/bookingSchema';
import { EventResponse } from '../../../fixtures/api/schemas/app/eventSchema';
import { expect, test } from '../../../fixtures/pom/test-options';
import { generateBookingInput } from '../../../test-data/factories/app/booking.factory';
import { generateEventInput } from '../../../test-data/factories/app/event.factory';
import { generateCredentials } from '../../../test-data/factories/app/user.factory';

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

/*
 * "Clear all bookings" wipes every booking of the signed-in account, so it
 * must never run on the account the other tests share. This suite registers
 * its own account and signs in with an empty storage state; it only touches
 * its own data, so it is an ordinary regression test, not @destructive.
 * State cleanup: afterEach deletes the account's event (cascading bookings).
 */
test.describe('functional my bookings - clear all', () => {
    test.use({ storageState: { cookies: [], origins: [] } });

    let ownToken = '';
    let ownEventId = 0;

    test.afterEach(async ({ apiRequest }) => {
        await apiRequest({
            method: 'DELETE',
            url: `${ApiEndpoints.EVENTS}/${ownEventId}`,
            baseUrl: process.env.API_URL,
            headers: ownToken,
        });
    });

    test(
        'should remove every booking of the account',
        { tag: '@regression' },
        async ({ apiRequest, loginPage, bookingsPage }) => {
            const credentials = generateCredentials();

            await test.step('GIVEN an account with two bookings', async () => {
                const registered = await apiRequest<AuthResponse>({
                    method: 'POST',
                    url: ApiEndpoints.REGISTER,
                    baseUrl: process.env.API_URL,
                    body: credentials,
                });
                expect(registered.status).toBe(201);
                ownToken = registered.body.token;

                const event = await apiRequest<EventResponse>({
                    method: 'POST',
                    url: ApiEndpoints.EVENTS,
                    baseUrl: process.env.API_URL,
                    headers: ownToken,
                    body: generateEventInput(),
                });
                expect(event.status).toBe(201);
                ownEventId = event.body.data.id;

                for (let booking = 0; booking < 2; booking++) {
                    const created = await apiRequest<BookingResponse>({
                        method: 'POST',
                        url: ApiEndpoints.BOOKINGS,
                        baseUrl: process.env.API_URL,
                        headers: ownToken,
                        body: generateBookingInput(ownEventId),
                    });
                    expect(created.status).toBe(201);
                }
            });

            await test.step('WHEN the user signs in and clears all bookings', async () => {
                await loginPage.openLoginPage();
                await loginPage.loginAndVerify(
                    credentials.email,
                    credentials.password
                );
                await bookingsPage.openBookingsPage();
                await expect(bookingsPage.bookingCards).toHaveCount(2);
                await bookingsPage.clearAllBookings();
            });

            await test.step('THEN the empty state is shown', async () => {
                await expect(bookingsPage.emptyState).toBeVisible();
                await expect(bookingsPage.bookingCards).toHaveCount(0);
            });
        }
    );
});
