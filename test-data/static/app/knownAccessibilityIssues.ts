/**
 * axe-core rule ids that EventHub currently violates, per page. Active
 * accessibility tests exclude exactly these so any NEW violation still fails;
 * the skipped "no exceptions" test in `accessibility.spec.ts` documents them.
 *
 * Static data files may export only literal values (`as const`).
 */

export const KNOWN_SIGN_IN_ISSUES = ['color-contrast'] as const;

export const KNOWN_EVENTS_ISSUES = ['color-contrast', 'select-name'] as const;

export const KNOWN_BOOKINGS_ISSUES = ['color-contrast'] as const;
