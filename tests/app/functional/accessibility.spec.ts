import { expect, test } from '../../../fixtures/pom/test-options';
import { scanAccessibility } from '../../../helpers/util/accessibility';
import {
    KNOWN_BOOKINGS_ISSUES,
    KNOWN_EVENTS_ISSUES,
    KNOWN_SIGN_IN_ISSUES,
} from '../../../test-data/static/app/knownAccessibilityIssues';

/*
 * Each active test ignores only the violations listed in
 * knownAccessibilityIssues.ts, so a NEW serious or critical WCAG 2.x A/AA
 * violation fails the run. The skipped test at the bottom is the strict
 * version with no exceptions.
 */
test.describe('functional accessibility', () => {
    test(
        'sign-in page has no new serious accessibility violations',
        { tag: '@regression' },
        async ({ page, resetStorageState, loginPage }) => {
            await resetStorageState();
            await loginPage.openLoginPage();
            await expect(loginPage.signInHeading).toBeVisible();

            expect(await scanAccessibility(page, KNOWN_SIGN_IN_ISSUES)).toEqual(
                []
            );
        }
    );

    test(
        'events page has no new serious accessibility violations',
        { tag: '@regression' },
        async ({ page, eventsPage }) => {
            await eventsPage.openEventsPage();
            await expect(eventsPage.heading).toBeVisible();
            await expect(eventsPage.eventCards).not.toHaveCount(0);

            expect(await scanAccessibility(page, KNOWN_EVENTS_ISSUES)).toEqual(
                []
            );
        }
    );

    test(
        'my bookings page has no new serious accessibility violations',
        { tag: '@regression' },
        async ({ page, bookingsPage }) => {
            await bookingsPage.openBookingsPage();
            await expect(bookingsPage.heading).toBeVisible();

            expect(
                await scanAccessibility(page, KNOWN_BOOKINGS_ISSUES)
            ).toEqual([]);
        }
    );

    // FIXME: https://dequeuniversity.com/rules/axe/html/4.10/color-contrast - text on all three pages fails WCAG AA contrast; the events filters (select-name: https://dequeuniversity.com/rules/axe/html/4.10/select-name) have no accessible name.
    test.skip(
        'pages meet WCAG 2.x A/AA with no exceptions',
        { tag: '@regression' },
        async ({ page, eventsPage, bookingsPage }) => {
            await eventsPage.openEventsPage();
            await expect(eventsPage.eventCards).not.toHaveCount(0);
            expect(await scanAccessibility(page)).toEqual([]);

            await bookingsPage.openBookingsPage();
            await expect(bookingsPage.heading).toBeVisible();
            expect(await scanAccessibility(page)).toEqual([]);
        }
    );
});
