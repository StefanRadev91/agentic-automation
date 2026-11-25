import { ApiEndpoints, BookingStatus } from '../../../enums/app/app';
import {
    BookingListResponse,
    BookingListResponseSchema,
    BookingResponse,
    BookingResponseSchema,
} from '../../../fixtures/api/schemas/app/bookingSchema';
import {
    DeleteResponse,
    DeleteResponseSchema,
    EventResponse,
    EventResponseSchema,
} from '../../../fixtures/api/schemas/app/eventSchema';
import {
    ErrorResponse,
    ErrorResponseSchema,
    UnauthorizedResponse,
    UnauthorizedResponseSchema,
    ValidationErrorResponse,
    ValidationErrorResponseSchema,
} from '../../../fixtures/api/schemas/util/errorResponseSchema';
import { expect, test } from '../../../fixtures/pom/test-options';
import { generateBookingInput } from '../../../test-data/factories/app/booking.factory';
import {
    INVALID_BOOKING_QUANTITIES,
    REQUIRED_BOOKING_FIELDS,
} from '../../../test-data/static/app/invalidEvents';

const NON_EXISTENT_ID = 999999999;

/*
 * State cleanup: every test books against its own `createdEvent`. The fixture
 * deletes that event afterwards and EventHub cascades the delete to the
 * event's bookings, so no booking outlives its test.
 */
test.describe('api/bookings', () => {
    test.describe('create', () => {
        test(
            'should return 201 and a confirmed booking with a reference',
            { tag: '@api' },
            async ({ apiRequest, createdEvent }) => {
                const input = generateBookingInput(createdEvent.id, {
                    quantity: 2,
                });

                const { status, body } = await apiRequest<BookingResponse>({
                    method: 'POST',
                    url: ApiEndpoints.BOOKINGS,
                    baseUrl: process.env.API_URL,
                    headers: process.env.ACCESS_TOKEN,
                    body: input,
                });

                expect(status).toBe(201);
                expect(BookingResponseSchema.parse(body)).toBeTruthy();
                expect(body.data.status).toBe(BookingStatus.CONFIRMED);
                expect(body.data.quantity).toBe(2);
                expect(Number(body.data.totalPrice)).toBe(
                    Number(createdEvent.price) * 2
                );
            }
        );

        test(
            'should decrease the available seats of the event',
            { tag: '@api' },
            async ({ apiRequest, createdEvent }) => {
                await test.step('WHEN 3 tickets are booked', async () => {
                    const { status } = await apiRequest<BookingResponse>({
                        method: 'POST',
                        url: ApiEndpoints.BOOKINGS,
                        baseUrl: process.env.API_URL,
                        headers: process.env.ACCESS_TOKEN,
                        body: generateBookingInput(createdEvent.id, {
                            quantity: 3,
                        }),
                    });
                    expect(status).toBe(201);
                });

                await test.step('THEN the event has 3 fewer seats', async () => {
                    const { status, body } = await apiRequest<EventResponse>({
                        method: 'GET',
                        url: `${ApiEndpoints.EVENTS}/${createdEvent.id}`,
                        baseUrl: process.env.API_URL,
                        headers: process.env.ACCESS_TOKEN,
                    });

                    expect(status).toBe(200);
                    expect(EventResponseSchema.parse(body)).toBeTruthy();
                    expect(body.data.availableSeats).toBe(
                        createdEvent.availableSeats - 3
                    );
                });
            }
        );

        test(
            'should return 400 for an empty body',
            { tag: '@api' },
            async ({ apiRequest }) => {
                const { status, body } =
                    await apiRequest<ValidationErrorResponse>({
                        method: 'POST',
                        url: ApiEndpoints.BOOKINGS,
                        baseUrl: process.env.API_URL,
                        headers: process.env.ACCESS_TOKEN,
                        body: {},
                    });

                expect(status).toBe(400);
                expect(ValidationErrorResponseSchema.parse(body)).toBeTruthy();
            }
        );

        for (const field of REQUIRED_BOOKING_FIELDS) {
            test(
                `should return 400 when ${field} is omitted`,
                { tag: '@api' },
                async ({ apiRequest, createdEvent }) => {
                    const payload: Record<string, unknown> = {
                        ...generateBookingInput(createdEvent.id),
                    };
                    delete payload[field];

                    const { status, body } =
                        await apiRequest<ValidationErrorResponse>({
                            method: 'POST',
                            url: ApiEndpoints.BOOKINGS,
                            baseUrl: process.env.API_URL,
                            headers: process.env.ACCESS_TOKEN,
                            body: payload,
                        });

                    expect(status).toBe(400);
                    expect(
                        ValidationErrorResponseSchema.parse(body)
                    ).toBeTruthy();
                    expect(
                        body.details.map((detail) => detail.field)
                    ).toContain(field);
                }
            );
        }

        for (const quantity of INVALID_BOOKING_QUANTITIES) {
            test(
                `should return 400 for quantity ${quantity}`,
                { tag: '@api' },
                async ({ apiRequest, createdEvent }) => {
                    const { status, body } =
                        await apiRequest<ValidationErrorResponse>({
                            method: 'POST',
                            url: ApiEndpoints.BOOKINGS,
                            baseUrl: process.env.API_URL,
                            headers: process.env.ACCESS_TOKEN,
                            body: {
                                ...generateBookingInput(createdEvent.id),
                                quantity,
                            },
                        });

                    expect(status).toBe(400);
                    expect(
                        ValidationErrorResponseSchema.parse(body)
                    ).toBeTruthy();
                }
            );
        }

        test(
            'should return 404 for a non-existent event',
            { tag: '@api' },
            async ({ apiRequest }) => {
                const { status, body } = await apiRequest<ErrorResponse>({
                    method: 'POST',
                    url: ApiEndpoints.BOOKINGS,
                    baseUrl: process.env.API_URL,
                    headers: process.env.ACCESS_TOKEN,
                    body: generateBookingInput(NON_EXISTENT_ID),
                });

                expect(status).toBe(404);
                expect(ErrorResponseSchema.parse(body)).toBeTruthy();
            }
        );

        test(
            'should return 401 without a token',
            { tag: '@api' },
            async ({ apiRequest, createdEvent }) => {
                const { status, body } = await apiRequest<UnauthorizedResponse>(
                    {
                        method: 'POST',
                        url: ApiEndpoints.BOOKINGS,
                        baseUrl: process.env.API_URL,
                        body: generateBookingInput(createdEvent.id),
                    }
                );

                expect(status).toBe(401);
                expect(UnauthorizedResponseSchema.parse(body)).toBeTruthy();
            }
        );
    });

    test.describe('read', () => {
        test(
            'should return a booking by id and by reference',
            { tag: '@api' },
            async ({ apiRequest, createdEvent }) => {
                let booking: BookingResponse['data'];

                await test.step('GIVEN a booking', async () => {
                    const { status, body } = await apiRequest<BookingResponse>({
                        method: 'POST',
                        url: ApiEndpoints.BOOKINGS,
                        baseUrl: process.env.API_URL,
                        headers: process.env.ACCESS_TOKEN,
                        body: generateBookingInput(createdEvent.id),
                    });
                    expect(status).toBe(201);
                    booking = body.data;
                });

                await test.step('WHEN fetched by id', async () => {
                    const { status, body } = await apiRequest<BookingResponse>({
                        method: 'GET',
                        url: `${ApiEndpoints.BOOKINGS}/${booking.id}`,
                        baseUrl: process.env.API_URL,
                        headers: process.env.ACCESS_TOKEN,
                    });

                    expect(status).toBe(200);
                    expect(BookingResponseSchema.parse(body)).toBeTruthy();
                    expect(body.data.bookingRef).toBe(booking.bookingRef);
                });

                await test.step('WHEN fetched by reference', async () => {
                    const { status, body } = await apiRequest<BookingResponse>({
                        method: 'GET',
                        url: `${ApiEndpoints.BOOKINGS_BY_REF}/${booking.bookingRef}`,
                        baseUrl: process.env.API_URL,
                        headers: process.env.ACCESS_TOKEN,
                    });

                    expect(status).toBe(200);
                    expect(BookingResponseSchema.parse(body)).toBeTruthy();
                    expect(body.data.id).toBe(booking.id);
                });
            }
        );

        test(
            'should return 404 for a non-existent id',
            { tag: '@api' },
            async ({ apiRequest }) => {
                const { status, body } = await apiRequest<ErrorResponse>({
                    method: 'GET',
                    url: `${ApiEndpoints.BOOKINGS}/${NON_EXISTENT_ID}`,
                    baseUrl: process.env.API_URL,
                    headers: process.env.ACCESS_TOKEN,
                });

                expect(status).toBe(404);
                expect(ErrorResponseSchema.parse(body)).toBeTruthy();
            }
        );

        test(
            'should return 404 for an unknown reference',
            { tag: '@api' },
            async ({ apiRequest }) => {
                const { status, body } = await apiRequest<ErrorResponse>({
                    method: 'GET',
                    url: `${ApiEndpoints.BOOKINGS_BY_REF}/EVT-NOTREAL`,
                    baseUrl: process.env.API_URL,
                    headers: process.env.ACCESS_TOKEN,
                });

                expect(status).toBe(404);
                expect(ErrorResponseSchema.parse(body)).toBeTruthy();
            }
        );

        test(
            'should list bookings filtered by event',
            { tag: '@api' },
            async ({ apiRequest, createdEvent }) => {
                await test.step('GIVEN a booking on the event', async () => {
                    const { status } = await apiRequest<BookingResponse>({
                        method: 'POST',
                        url: ApiEndpoints.BOOKINGS,
                        baseUrl: process.env.API_URL,
                        headers: process.env.ACCESS_TOKEN,
                        body: generateBookingInput(createdEvent.id),
                    });
                    expect(status).toBe(201);
                });

                await test.step('THEN the filtered list contains only that event', async () => {
                    const { status, body } =
                        await apiRequest<BookingListResponse>({
                            method: 'GET',
                            url: `${ApiEndpoints.BOOKINGS}?eventId=${createdEvent.id}&status=${BookingStatus.CONFIRMED}`,
                            baseUrl: process.env.API_URL,
                            headers: process.env.ACCESS_TOKEN,
                        });

                    expect(status).toBe(200);
                    expect(BookingListResponseSchema.parse(body)).toBeTruthy();
                    expect(body.data).toHaveLength(1);
                    expect(body.data[0].eventId).toBe(createdEvent.id);
                });
            }
        );

        test(
            'should return 401 without a token',
            { tag: '@api' },
            async ({ apiRequest }) => {
                const { status, body } = await apiRequest<UnauthorizedResponse>(
                    {
                        method: 'GET',
                        url: ApiEndpoints.BOOKINGS,
                        baseUrl: process.env.API_URL,
                    }
                );

                expect(status).toBe(401);
                expect(UnauthorizedResponseSchema.parse(body)).toBeTruthy();
            }
        );
    });

    test.describe('cancel', () => {
        test(
            'should return 200 and remove the booking',
            { tag: '@api' },
            async ({ apiRequest, createdEvent }) => {
                let bookingId = 0;

                await test.step('GIVEN a booking', async () => {
                    const { status, body } = await apiRequest<BookingResponse>({
                        method: 'POST',
                        url: ApiEndpoints.BOOKINGS,
                        baseUrl: process.env.API_URL,
                        headers: process.env.ACCESS_TOKEN,
                        body: generateBookingInput(createdEvent.id),
                    });
                    expect(status).toBe(201);
                    bookingId = body.data.id;
                });

                await test.step('WHEN the booking is cancelled', async () => {
                    const { status, body } = await apiRequest<DeleteResponse>({
                        method: 'DELETE',
                        url: `${ApiEndpoints.BOOKINGS}/${bookingId}`,
                        baseUrl: process.env.API_URL,
                        headers: process.env.ACCESS_TOKEN,
                    });

                    expect(status).toBe(200);
                    expect(DeleteResponseSchema.parse(body)).toBeTruthy();
                });

                await test.step('THEN cancelling it again returns 404', async () => {
                    const { status, body } = await apiRequest<ErrorResponse>({
                        method: 'DELETE',
                        url: `${ApiEndpoints.BOOKINGS}/${bookingId}`,
                        baseUrl: process.env.API_URL,
                        headers: process.env.ACCESS_TOKEN,
                    });

                    expect(status).toBe(404);
                    expect(ErrorResponseSchema.parse(body)).toBeTruthy();
                });
            }
        );

        test(
            'should return 404 for a non-existent booking',
            { tag: '@api' },
            async ({ apiRequest }) => {
                const { status, body } = await apiRequest<ErrorResponse>({
                    method: 'DELETE',
                    url: `${ApiEndpoints.BOOKINGS}/${NON_EXISTENT_ID}`,
                    baseUrl: process.env.API_URL,
                    headers: process.env.ACCESS_TOKEN,
                });

                expect(status).toBe(404);
                expect(ErrorResponseSchema.parse(body)).toBeTruthy();
            }
        );
    });
});
