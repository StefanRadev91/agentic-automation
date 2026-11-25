import { faker } from '@faker-js/faker';
import {
    CreateBookingInput,
    CreateBookingInputSchema,
} from '../../../fixtures/api/schemas/app/bookingSchema';

/**
 * Generates a valid POST /bookings payload for the given event.
 *
 * @param {number} eventId - ID of the event to book.
 * @param {Partial<CreateBookingInput>} overrides - Optional values replacing the generated ones.
 * @returns {CreateBookingInput} Payload validated against `CreateBookingInputSchema`.
 *
 * @example
 * const booking = generateBookingInput(event.id, { quantity: 3 });
 */
export const generateBookingInput = (
    eventId: number,
    overrides?: Partial<CreateBookingInput>
): CreateBookingInput => {
    const booking: CreateBookingInput = {
        eventId,
        customerName: faker.person.fullName(),
        // lowercase: EventHub normalizes the stored email
        customerEmail: faker.internet
            .email({ provider: 'example.com' })
            .toLowerCase(),
        customerPhone: `+359${faker.string.numeric(9)}`,
        quantity: faker.number.int({ min: 1, max: 3 }),
        ...overrides,
    };

    return CreateBookingInputSchema.parse(booking);
};
