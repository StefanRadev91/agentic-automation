/**
 * EventHub application constants.
 * Every UI message is verified against the live application
 * (https://eventhub.rahulshettyacademy.com).
 */

/** UI messages */
export enum Messages {
    LOGIN_ERROR = 'Invalid email or password',
    EMAIL_INVALID = 'Enter a valid email',
    PASSWORD_TOO_SHORT = 'Password must be at least 6 characters',
    BOOKING_CONFIRMED = 'Booking Confirmed! 🎉',
    NO_BOOKINGS = 'No bookings yet',
    TICKETS = 'tickets',
    REFUND_ELIGIBLE = 'Eligible for refund',
    REFUND_NOT_ELIGIBLE = 'Not eligible for refund',
}

/** UI route paths */
export enum AppRoutes {
    LOGIN = '/login',
    REGISTER = '/register',
    EVENTS = '/events',
    BOOKINGS = '/bookings',
}

/** API endpoint paths (relative to API_URL, which already contains /api) */
export enum ApiEndpoints {
    REGISTER = '/auth/register',
    LOGIN = '/auth/login',
    ME = '/auth/me',
    EVENTS = '/events',
    BOOKINGS = '/bookings',
    BOOKINGS_BY_REF = '/bookings/ref',
    HEALTH = '/health',
    CONFIG = '/config',
}

/** Event categories accepted by the API and offered in the UI filter */
export enum EventCategory {
    CONFERENCE = 'Conference',
    CONCERT = 'Concert',
    SPORTS = 'Sports',
    WORKSHOP = 'Workshop',
    FESTIVAL = 'Festival',
}

/** Cities offered in the events list filter */
export enum EventCity {
    MUMBAI = 'Mumbai',
    BANGALORE = 'Bangalore',
    DELHI = 'Delhi',
    HYDERABAD = 'Hyderabad',
    CHENNAI = 'Chennai',
    PUNE = 'Pune',
}

/** Booking lifecycle states */
export enum BookingStatus {
    CONFIRMED = 'confirmed',
    CANCELLED = 'cancelled',
}

/**
 * Auth state files written by the setup projects
 * (`tests/app/auth-api.setup.ts` and `tests/app/auth.setup.ts`).
 */
export enum StorageStatePaths {
    APP = '.auth/app/appStorageState.json',
    TEST_USER = '.auth/app/testUser.json',
}
