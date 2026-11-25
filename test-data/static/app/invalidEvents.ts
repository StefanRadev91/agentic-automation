/**
 * Domain-specific invalid inputs for EventHub event and booking tests.
 *
 * - `REQUIRED_EVENT_FIELDS` / `REQUIRED_BOOKING_FIELDS` — fields whose omission
 *   must produce a 400 with a per-field validation detail.
 * - `INVALID_BOOKING_QUANTITIES` — quantities outside the documented 1..10 range.
 * - `INVALID_EVENT_PRICES` / `INVALID_EVENT_SEATS` — boundary violations.
 *
 * Static data files may export only literal values (`as const`).
 */

export const REQUIRED_EVENT_FIELDS = [
    'title',
    'category',
    'venue',
    'city',
    'eventDate',
    'price',
    'totalSeats',
] as const;

export const REQUIRED_BOOKING_FIELDS = [
    'eventId',
    'customerName',
    'customerEmail',
    'customerPhone',
    'quantity',
] as const;

export const INVALID_BOOKING_QUANTITIES = [0, -1, 11, 1.5] as const;

export const INVALID_EVENT_PRICES = [-1, 'free', null] as const;

export const INVALID_EVENT_SEATS = [0, -5, 1.5, 'many', null] as const;
