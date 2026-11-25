import { test as base } from '@playwright/test';
import { ApiEndpoints } from '../../enums/app/app';
import { apiRequest } from '../api/plain-function';
import { Event, EventResponseSchema } from '../api/schemas/app/eventSchema';
import { generateEventInput } from '../../test-data/factories/app/event.factory';

/**
 * Helper fixtures for recurring API-driven setup and teardown.
 *
 * Most API calls belong directly in tests via the `apiRequest` fixture; a
 * helper fixture is reserved for multi-step preconditions reused across many
 * spec files, where guaranteed teardown matters.
 *
 * Fixture-level code uses `plain-function.ts` (the raw `request` context),
 * while specs use the `apiRequest` fixture from `test-options.ts`.
 */

/** Helper fixture type definitions. */
export type HelperFixtures = {
    /**
     * A private event owned by the test account, created before the test and
     * deleted after it. EventHub cascades the delete to the event's bookings,
     * so one teardown call also cleans up every booking the test made.
     */
    createdEvent: Event;
};

export const test = base.extend<HelperFixtures>({
    /**
     * Creates an event via API before the test and deletes it afterwards.
     *
     * @param {APIRequestContext} request - Playwright request context (injected automatically).
     * @param {function} use - Playwright fixture lifecycle callback.
     */
    createdEvent: async ({ request }, use) => {
        // ── SETUP ────────────────────────────────────────────────────
        const { body } = await apiRequest({
            request,
            method: 'POST',
            url: ApiEndpoints.EVENTS,
            baseUrl: process.env.API_URL,
            headers: process.env.ACCESS_TOKEN,
            body: generateEventInput(),
        });

        // Validate, don't cast -- a shape mismatch fails here, not mid-test.
        const { data: event } = EventResponseSchema.parse(body);

        // ── YIELD ────────────────────────────────────────────────────
        await use(event);

        // ── TEARDOWN (runs even when the test fails) ─────────────────
        await apiRequest({
            request,
            method: 'DELETE',
            url: `${ApiEndpoints.EVENTS}/${event.id}`,
            baseUrl: process.env.API_URL,
            headers: process.env.ACCESS_TOKEN,
        });
    },
});
