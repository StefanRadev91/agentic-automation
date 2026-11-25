import { ApiEndpoints, EventCategory } from '../../../enums/app/app';
import {
    DeleteResponse,
    DeleteResponseSchema,
    EventListResponse,
    EventListResponseSchema,
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
import { generateEventInput } from '../../../test-data/factories/app/event.factory';
import {
    INVALID_EVENT_PRICES,
    INVALID_EVENT_SEATS,
    REQUIRED_EVENT_FIELDS,
} from '../../../test-data/static/app/invalidEvents';

const NON_EXISTENT_EVENT_ID = 999999999;

test.describe('api/events', () => {
    /** IDs of events created by a test; removed in afterEach (cascades bookings). */
    let createdEventIds: number[] = [];

    test.beforeEach(() => {
        createdEventIds = [];
    });

    test.afterEach(async ({ apiRequest }) => {
        for (const id of createdEventIds) {
            await apiRequest({
                method: 'DELETE',
                url: `${ApiEndpoints.EVENTS}/${id}`,
                baseUrl: process.env.API_URL,
                headers: process.env.ACCESS_TOKEN,
            });
        }
    });

    test.describe('list', () => {
        test(
            'should return 200 and a paginated list',
            { tag: '@api' },
            async ({ apiRequest }) => {
                const { status, body } = await apiRequest<EventListResponse>({
                    method: 'GET',
                    url: `${ApiEndpoints.EVENTS}?limit=2`,
                    baseUrl: process.env.API_URL,
                    headers: process.env.ACCESS_TOKEN,
                });

                expect(status).toBe(200);
                expect(EventListResponseSchema.parse(body)).toBeTruthy();
                expect(body.data.length).toBeLessThanOrEqual(2);
                expect(body.pagination.limit).toBe(2);
            }
        );

        test(
            'should return only events of the requested category',
            { tag: '@api' },
            async ({ apiRequest }) => {
                const { status, body } = await apiRequest<EventListResponse>({
                    method: 'GET',
                    url: `${ApiEndpoints.EVENTS}?category=${EventCategory.CONFERENCE}&limit=20`,
                    baseUrl: process.env.API_URL,
                    headers: process.env.ACCESS_TOKEN,
                });

                expect(status).toBe(200);
                expect(EventListResponseSchema.parse(body)).toBeTruthy();
                expect(body.data.length).toBeGreaterThan(0);
                for (const event of body.data) {
                    expect(event.category).toBe(EventCategory.CONFERENCE);
                }
            }
        );

        test(
            'should find a created event by search text',
            { tag: '@api' },
            async ({ apiRequest }) => {
                const input = generateEventInput();

                await test.step('GIVEN an event with a unique title', async () => {
                    const { status, body } = await apiRequest<EventResponse>({
                        method: 'POST',
                        url: ApiEndpoints.EVENTS,
                        baseUrl: process.env.API_URL,
                        headers: process.env.ACCESS_TOKEN,
                        body: input,
                    });
                    expect(status).toBe(201);
                    createdEventIds.push(body.data.id);
                });

                await test.step('WHEN searching by its title', async () => {
                    const { status, body } =
                        await apiRequest<EventListResponse>({
                            method: 'GET',
                            url: `${ApiEndpoints.EVENTS}?search=${encodeURIComponent(input.title)}`,
                            baseUrl: process.env.API_URL,
                            headers: process.env.ACCESS_TOKEN,
                        });

                    expect(status).toBe(200);
                    expect(EventListResponseSchema.parse(body)).toBeTruthy();
                    expect(body.data.map((event) => event.title)).toContain(
                        input.title
                    );
                });
            }
        );

        // The OpenAPI contract does not document 401 for this route; the live
        // API protects it, so the behavior is pinned here.
        test(
            'should return 401 without a token',
            { tag: '@api' },
            async ({ apiRequest }) => {
                const { status, body } = await apiRequest<UnauthorizedResponse>(
                    {
                        method: 'GET',
                        url: ApiEndpoints.EVENTS,
                        baseUrl: process.env.API_URL,
                    }
                );

                expect(status).toBe(401);
                expect(UnauthorizedResponseSchema.parse(body)).toBeTruthy();
            }
        );
    });

    test.describe('create', () => {
        test(
            'should return 201 and the created event',
            { tag: '@api' },
            async ({ apiRequest }) => {
                const input = generateEventInput();

                const { status, body } = await apiRequest<EventResponse>({
                    method: 'POST',
                    url: ApiEndpoints.EVENTS,
                    baseUrl: process.env.API_URL,
                    headers: process.env.ACCESS_TOKEN,
                    body: input,
                });
                expect(status).toBe(201);
                createdEventIds.push(body.data.id);
                expect(EventResponseSchema.parse(body)).toBeTruthy();
                expect(body.data.title).toBe(input.title);
                expect(body.data.availableSeats).toBe(input.totalSeats);
            }
        );

        // FIXME: https://api.eventhub.rahulshettyacademy.com/api/docs - the contract documents `price` as a number, the live API returns a numeric string (e.g. "100").
        test.skip(
            'should return price as a number (contract)',
            { tag: '@api' },
            async ({ apiRequest }) => {
                const { body } = await apiRequest<EventResponse>({
                    method: 'POST',
                    url: ApiEndpoints.EVENTS,
                    baseUrl: process.env.API_URL,
                    headers: process.env.ACCESS_TOKEN,
                    body: generateEventInput(),
                });
                createdEventIds.push(body.data.id);

                expect(typeof body.data.price).toBe('number');
            }
        );

        test(
            'should return 400 for an empty body',
            { tag: '@api' },
            async ({ apiRequest }) => {
                const { status, body } =
                    await apiRequest<ValidationErrorResponse>({
                        method: 'POST',
                        url: ApiEndpoints.EVENTS,
                        baseUrl: process.env.API_URL,
                        headers: process.env.ACCESS_TOKEN,
                        body: {},
                    });

                expect(status).toBe(400);
                expect(ValidationErrorResponseSchema.parse(body)).toBeTruthy();
            }
        );

        for (const field of REQUIRED_EVENT_FIELDS) {
            test(
                `should return 400 when ${field} is omitted`,
                { tag: '@api' },
                async ({ apiRequest }) => {
                    const payload: Record<string, unknown> = {
                        ...generateEventInput(),
                    };
                    delete payload[field];

                    const { status, body } =
                        await apiRequest<ValidationErrorResponse>({
                            method: 'POST',
                            url: ApiEndpoints.EVENTS,
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

        for (const price of INVALID_EVENT_PRICES) {
            test(
                `should return 400 for price ${JSON.stringify(price)}`,
                { tag: '@api' },
                async ({ apiRequest }) => {
                    const { status, body } =
                        await apiRequest<ValidationErrorResponse>({
                            method: 'POST',
                            url: ApiEndpoints.EVENTS,
                            baseUrl: process.env.API_URL,
                            headers: process.env.ACCESS_TOKEN,
                            body: { ...generateEventInput(), price },
                        });

                    expect(status).toBe(400);
                    expect(
                        ValidationErrorResponseSchema.parse(body)
                    ).toBeTruthy();
                }
            );
        }

        for (const totalSeats of INVALID_EVENT_SEATS) {
            test(
                `should return 400 for totalSeats ${JSON.stringify(totalSeats)}`,
                { tag: '@api' },
                async ({ apiRequest }) => {
                    const { status, body } =
                        await apiRequest<ValidationErrorResponse>({
                            method: 'POST',
                            url: ApiEndpoints.EVENTS,
                            baseUrl: process.env.API_URL,
                            headers: process.env.ACCESS_TOKEN,
                            body: { ...generateEventInput(), totalSeats },
                        });

                    expect(status).toBe(400);
                    expect(
                        ValidationErrorResponseSchema.parse(body)
                    ).toBeTruthy();
                }
            );
        }

        test(
            'should return 401 without a token',
            { tag: '@api' },
            async ({ apiRequest }) => {
                const { status, body } = await apiRequest<UnauthorizedResponse>(
                    {
                        method: 'POST',
                        url: ApiEndpoints.EVENTS,
                        baseUrl: process.env.API_URL,
                        body: generateEventInput(),
                    }
                );

                expect(status).toBe(401);
                expect(UnauthorizedResponseSchema.parse(body)).toBeTruthy();
            }
        );
    });

    test.describe('read', () => {
        test(
            'should return 200 and the event',
            { tag: '@api' },
            async ({ apiRequest, createdEvent }) => {
                const { status, body } = await apiRequest<EventResponse>({
                    method: 'GET',
                    url: `${ApiEndpoints.EVENTS}/${createdEvent.id}`,
                    baseUrl: process.env.API_URL,
                    headers: process.env.ACCESS_TOKEN,
                });

                expect(status).toBe(200);
                expect(EventResponseSchema.parse(body)).toBeTruthy();
                expect(body.data.id).toBe(createdEvent.id);
            }
        );

        test(
            'should return 404 for a non-existent event',
            { tag: '@api' },
            async ({ apiRequest }) => {
                const { status, body } = await apiRequest<ErrorResponse>({
                    method: 'GET',
                    url: `${ApiEndpoints.EVENTS}/${NON_EXISTENT_EVENT_ID}`,
                    baseUrl: process.env.API_URL,
                    headers: process.env.ACCESS_TOKEN,
                });

                expect(status).toBe(404);
                expect(ErrorResponseSchema.parse(body)).toBeTruthy();
            }
        );

        // FIXME: https://api.eventhub.rahulshettyacademy.com/api/docs - a non-numeric id should be rejected with a 4xx, the live API answers 500 "Internal server error".
        test.skip(
            'should return 4xx for a non-numeric id',
            { tag: '@api' },
            async ({ apiRequest }) => {
                const { status } = await apiRequest<ErrorResponse>({
                    method: 'GET',
                    url: `${ApiEndpoints.EVENTS}/abc`,
                    baseUrl: process.env.API_URL,
                    headers: process.env.ACCESS_TOKEN,
                });

                expect(status).toBeGreaterThanOrEqual(400);
                expect(status).toBeLessThan(500);
            }
        );
    });

    test.describe('update', () => {
        test(
            'should return 200 and apply the changes',
            { tag: '@api' },
            async ({ apiRequest, createdEvent }) => {
                const changes = generateEventInput({ price: 777 });

                const { status, body } = await apiRequest<EventResponse>({
                    method: 'PUT',
                    url: `${ApiEndpoints.EVENTS}/${createdEvent.id}`,
                    baseUrl: process.env.API_URL,
                    headers: process.env.ACCESS_TOKEN,
                    body: changes,
                });

                expect(status).toBe(200);
                expect(EventResponseSchema.parse(body)).toBeTruthy();
                expect(body.data.title).toBe(changes.title);
                expect(Number(body.data.price)).toBe(777);
            }
        );

        test(
            'should return 400 for an empty body',
            { tag: '@api' },
            async ({ apiRequest, createdEvent }) => {
                const { status, body } =
                    await apiRequest<ValidationErrorResponse>({
                        method: 'PUT',
                        url: `${ApiEndpoints.EVENTS}/${createdEvent.id}`,
                        baseUrl: process.env.API_URL,
                        headers: process.env.ACCESS_TOKEN,
                        body: {},
                    });

                expect(status).toBe(400);
                expect(ValidationErrorResponseSchema.parse(body)).toBeTruthy();
            }
        );

        test(
            'should return 404 for a non-existent event',
            { tag: '@api' },
            async ({ apiRequest }) => {
                const { status, body } = await apiRequest<ErrorResponse>({
                    method: 'PUT',
                    url: `${ApiEndpoints.EVENTS}/${NON_EXISTENT_EVENT_ID}`,
                    baseUrl: process.env.API_URL,
                    headers: process.env.ACCESS_TOKEN,
                    body: generateEventInput(),
                });

                expect(status).toBe(404);
                expect(ErrorResponseSchema.parse(body)).toBeTruthy();
            }
        );
    });

    test.describe('delete', () => {
        test(
            'should return 200 and make the event unavailable',
            { tag: '@api' },
            async ({ apiRequest }) => {
                let eventId = 0;

                await test.step('GIVEN an event', async () => {
                    const { status, body } = await apiRequest<EventResponse>({
                        method: 'POST',
                        url: ApiEndpoints.EVENTS,
                        baseUrl: process.env.API_URL,
                        headers: process.env.ACCESS_TOKEN,
                        body: generateEventInput(),
                    });
                    expect(status).toBe(201);
                    eventId = body.data.id;
                    createdEventIds.push(eventId);
                });

                await test.step('WHEN the event is deleted', async () => {
                    const { status, body } = await apiRequest<DeleteResponse>({
                        method: 'DELETE',
                        url: `${ApiEndpoints.EVENTS}/${eventId}`,
                        baseUrl: process.env.API_URL,
                        headers: process.env.ACCESS_TOKEN,
                    });

                    expect(status).toBe(200);
                    expect(DeleteResponseSchema.parse(body)).toBeTruthy();
                });

                await test.step('THEN fetching it returns 404', async () => {
                    const { status, body } = await apiRequest<ErrorResponse>({
                        method: 'GET',
                        url: `${ApiEndpoints.EVENTS}/${eventId}`,
                        baseUrl: process.env.API_URL,
                        headers: process.env.ACCESS_TOKEN,
                    });

                    expect(status).toBe(404);
                    expect(ErrorResponseSchema.parse(body)).toBeTruthy();
                });
            }
        );

        test(
            'should return 404 for a non-existent event',
            { tag: '@api' },
            async ({ apiRequest }) => {
                const { status, body } = await apiRequest<ErrorResponse>({
                    method: 'DELETE',
                    url: `${ApiEndpoints.EVENTS}/${NON_EXISTENT_EVENT_ID}`,
                    baseUrl: process.env.API_URL,
                    headers: process.env.ACCESS_TOKEN,
                });

                expect(status).toBe(404);
                expect(ErrorResponseSchema.parse(body)).toBeTruthy();
            }
        );
    });
});
