import { z } from 'zod/v4';
import type { output as zOutput } from 'zod/v4';
import { EventCategory } from '../../../../enums/app/app';

/*
 * FIXME: the OpenAPI contract documents `price` as a number, but the live API
 * returns it as a numeric string (e.g. "300"). The schema follows the live
 * response; the contract-conformance test is skipped in
 * tests/app/api/events.spec.ts until the API is fixed.
 * `isStatic` and `userId` are also returned live but undocumented.
 */
export const EventSchema = z.strictObject({
    id: z.int(),
    title: z.string(),
    description: z.string(),
    category: z.string(),
    venue: z.string(),
    city: z.string(),
    eventDate: z.iso.datetime(),
    price: z.string().regex(/^\d+(\.\d+)?$/),
    totalSeats: z.int(),
    availableSeats: z.int(),
    imageUrl: z.string().nullable(),
    isStatic: z.boolean(),
    userId: z.int().nullable(),
    createdAt: z.iso.datetime(),
    updatedAt: z.iso.datetime(),
});

export const PaginationSchema = z.strictObject({
    total: z.int(),
    page: z.int(),
    limit: z.int(),
    totalPages: z.int(),
});

export const EventResponseSchema = z.strictObject({
    success: z.literal(true),
    data: EventSchema,
    message: z.string().optional(),
});

export const EventListResponseSchema = z.strictObject({
    success: z.literal(true),
    data: z.array(EventSchema),
    pagination: PaginationSchema,
});

export const DeleteResponseSchema = z.strictObject({
    success: z.literal(true),
    message: z.string(),
});

/** Request body of POST /events and PUT /events/{id}. */
export const CreateEventInputSchema = z.strictObject({
    title: z.string().min(1),
    description: z.string().optional(),
    category: z.enum(EventCategory),
    venue: z.string().min(1),
    city: z.string().min(1),
    eventDate: z.iso.datetime(),
    price: z.number().nonnegative(),
    totalSeats: z.int().positive(),
    imageUrl: z.string().optional(),
});

export type Event = zOutput<typeof EventSchema>;
export type EventResponse = zOutput<typeof EventResponseSchema>;
export type EventListResponse = zOutput<typeof EventListResponseSchema>;
export type DeleteResponse = zOutput<typeof DeleteResponseSchema>;
export type CreateEventInput = zOutput<typeof CreateEventInputSchema>;
