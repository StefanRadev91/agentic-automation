import { EventCategory } from '../../../enums/app/app';
import { expect, test } from '../../../fixtures/pom/test-options';

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
                for (const card of await eventsPage.eventCards.all()) {
                    await expect(card).toContainText(EventCategory.CONFERENCE);
                }
            });
        }
    );
});
