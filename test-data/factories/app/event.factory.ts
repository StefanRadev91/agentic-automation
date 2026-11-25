import { faker } from '@faker-js/faker';
import { EventCategory } from '../../../enums/app/app';
import {
    CreateEventInput,
    CreateEventInputSchema,
} from '../../../fixtures/api/schemas/app/eventSchema';

/**
 * Generates a valid POST /events payload with randomized content.
 * The event date is always in the future and unique titles prevent
 * collisions between parallel workers.
 *
 * @param {Partial<CreateEventInput>} overrides - Optional values replacing the generated ones.
 * @returns {CreateEventInput} Payload validated against `CreateEventInputSchema`.
 *
 * @example
 * const event = generateEventInput({ totalSeats: 5 });
 */
export const generateEventInput = (
    overrides?: Partial<CreateEventInput>
): CreateEventInput => {
    const event: CreateEventInput = {
        title: `${faker.word.adjective()} ${faker.word.noun()} ${faker.string.alphanumeric(6)}`,
        description: faker.lorem.sentence(),
        category: faker.helpers.enumValue(EventCategory),
        venue: faker.location.streetAddress(),
        city: faker.location.city(),
        eventDate: faker.date.future({ years: 1 }).toISOString(),
        price: faker.number.int({ min: 10, max: 500 }),
        totalSeats: faker.number.int({ min: 20, max: 200 }),
        ...overrides,
    };

    return CreateEventInputSchema.parse(event);
};
