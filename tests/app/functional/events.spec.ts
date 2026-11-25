import { ApiEndpoints, EventCategory, EventCity } from '../../../enums/app/app';
import { EventResponse } from '../../../fixtures/api/schemas/app/eventSchema';
import { expect, test } from '../../../fixtures/pom/test-options';
import { generateEventInput } from '../../../test-data/factories/app/event.factory';

test.describe('functional events', () => {
    test.beforeEach(async ({ eventsPage }) => {
        await eventsPage.openEventsPage();
    });

    test(
        'should list upcoming events',
        { tag: '@smoke' },
        async ({ eventsPage }) => {
            await test.step('THEN the heading and at least one event card are shown', async () => {
                await expect(eventsPage.heading).toBeVisible();
                await expect(eventsPage.eventCards).not.toHaveCount(0);
            });
        }
    );

    test(
        'should find a created event by search text',
        { tag: '@regression' },
        async ({ eventsPage, createdEvent }) => {
            await test.step('WHEN the user searches for the event title', async () => {
                await eventsPage.search(createdEvent.title);
            });

            await test.step('THEN only that event is listed', async () => {
                await expect(eventsPage.eventCards).toHaveCount(1);
                await expect(
                    eventsPage.eventCard(createdEvent.title)
                ).toBeVisible();
            });
        }
    );

    test(
        'should show an empty list when nothing matches the search',
        { tag: '@regression' },
        async ({ eventsPage }) => {
            await test.step('WHEN the user searches for a non-existent event', async () => {
                await eventsPage.search('zzzz-no-such-event-zzzz');
            });

            await test.step('THEN no event cards are shown', async () => {
                await expect(eventsPage.eventCards).toHaveCount(0);
            });
        }
    );

    test(
        'should filter events by category',
        { tag: '@regression' },
        async ({ eventsPage }) => {
            await test.step('WHEN the user selects the Conference category', async () => {
                await eventsPage.filterByCategory(EventCategory.CONFERENCE);
            });

            await test.step('THEN only Conference events are listed', async () => {
                await expect(eventsPage.eventCards).not.toHaveCount(0);
                await expect(
                    eventsPage.eventCards.filter({
                        hasNotText: EventCategory.CONFERENCE,
                    })
                ).toHaveCount(0);
            });
        }
    );
});

/*
 * The city filter only lists cities that have events for the signed-in
 * account, and the shared sample data changes, so the test creates its own
 * event in the city it filters by.
 * State cleanup: afterEach deletes that event.
 */
test.describe('functional events - city filter', () => {
    let cityEventId = 0;

    test.afterEach(async ({ apiRequest }) => {
        await apiRequest({
            method: 'DELETE',
            url: `${ApiEndpoints.EVENTS}/${cityEventId}`,
            baseUrl: process.env.API_URL,
            headers: process.env.ACCESS_TOKEN,
        });
    });

    test(
        'should filter events by city',
        { tag: '@regression' },
        async ({ apiRequest, eventsPage }) => {
            const input = generateEventInput({ city: EventCity.PUNE });

            await test.step('GIVEN an event held in Pune', async () => {
                const { status, body } = await apiRequest<EventResponse>({
                    method: 'POST',
                    url: ApiEndpoints.EVENTS,
                    baseUrl: process.env.API_URL,
                    headers: process.env.ACCESS_TOKEN,
                    body: input,
                });
                expect(status).toBe(201);
                cityEventId = body.data.id;
                await eventsPage.openEventsPage();
            });

            await test.step('WHEN the user selects the Pune city', async () => {
                await eventsPage.filterByCity(EventCity.PUNE);
            });

            await test.step('THEN the event is listed and every card is in Pune', async () => {
                await expect(eventsPage.eventCard(input.title)).toBeVisible();
                await expect(
                    eventsPage.eventCards.filter({ hasNotText: EventCity.PUNE })
                ).toHaveCount(0);
            });
        }
    );
});
