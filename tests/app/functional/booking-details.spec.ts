import { ApiEndpoints, Messages } from '../../../enums/app/app';
import { BookingResponse } from '../../../fixtures/api/schemas/app/bookingSchema';
import { expect, test } from '../../../fixtures/pom/test-options';
import { generateBookingInput } from '../../../test-data/factories/app/booking.factory';

const REFUND_CASES = [
    {
        description: 'a single-ticket booking is eligible',
        quantity: 1,
        expectedMessage: Messages.REFUND_ELIGIBLE,
    },
    {
        description: 'a group booking is not eligible',
        quantity: 2,
        expectedMessage: Messages.REFUND_NOT_ELIGIBLE,
    },
] as const;

/*
 * State cleanup: bookings are created against a per-test `createdEvent`,
 * whose teardown deletes the event and, by cascade, its bookings.
 */
test.describe('functional booking details', () => {
    test(
        'should show event, customer and payment details',
        { tag: '@regression' },
        async ({
            apiRequest,
            bookingsPage,
            bookingDetailsPage,
            createdEvent,
        }) => {
            const input = generateBookingInput(createdEvent.id, {
                quantity: 2,
            });
            let bookingRef = '';

            await test.step('GIVEN a booking created through the API', async () => {
                const { status, body } = await apiRequest<BookingResponse>({
                    method: 'POST',
                    url: ApiEndpoints.BOOKINGS,
                    baseUrl: process.env.API_URL,
                    headers: process.env.ACCESS_TOKEN,
                    body: input,
                });
                expect(status).toBe(201);
                bookingRef = body.data.bookingRef;
            });

            await test.step('WHEN the user opens its details from My Bookings', async () => {
                await bookingsPage.openBookingsPage();
                await bookingsPage.openBookingDetails(bookingRef);
            });

            await test.step('THEN the event and customer details are shown', async () => {
                await expect(
                    bookingDetailsPage.heading(createdEvent.title)
                ).toBeVisible();
                await expect(
                    bookingDetailsPage.customerDetailsHeading
                ).toBeVisible();
                await expect(
                    bookingDetailsPage.detail(input.customerName)
                ).toBeVisible();
                await expect(
                    bookingDetailsPage.detail(input.customerEmail)
                ).toBeVisible();
                await expect(
                    bookingDetailsPage.detail(input.customerPhone)
                ).toBeVisible();
            });
        }
    );

    for (const { description, quantity, expectedMessage } of REFUND_CASES) {
        test(
            `should report refund eligibility - ${description}`,
            { tag: '@regression' },
            async ({ apiRequest, bookingDetailsPage, createdEvent }) => {
                await test.step('GIVEN a booking created through the API', async () => {
                    const { status, body } = await apiRequest<BookingResponse>({
                        method: 'POST',
                        url: ApiEndpoints.BOOKINGS,
                        baseUrl: process.env.API_URL,
                        headers: process.env.ACCESS_TOKEN,
                        body: generateBookingInput(createdEvent.id, {
                            quantity,
                        }),
                    });
                    expect(status).toBe(201);
                    await bookingDetailsPage.openBooking(body.data.id);
                });

                await test.step('WHEN the user checks refund eligibility', async () => {
                    await bookingDetailsPage.checkRefundEligibility();
                });

                await test.step('THEN the expected eligibility message is shown', async () => {
                    await expect(bookingDetailsPage.refundResult).toContainText(
                        expectedMessage
                    );
                });
            }
        );
    }
});
