import { z } from 'zod/v4';
import type { output as zOutput } from 'zod/v4';
import { BookingStatus } from '../../../../enums/app/app';
import { EventSchema, PaginationSchema } from './eventSchema';

/*
 * FIXME: `totalPrice` is documented as a number but returned live as a numeric
 * string, and `userId` is returned but undocumented (same drift as Event.price).
 */
export const BookingSchema = z.strictObject({
    id: z.int(),
    eventId: z.int(),
    userId: z.int(),
    customerName: z.string(),
    customerEmail: z.email(),
    customerPhone: z.string(),
    quantity: z.int(),
    totalPrice: z.string().regex(/^\d+(\.\d+)?$/),
    status: z.enum(BookingStatus),
    bookingRef: z.string(),
    createdAt: z.iso.datetime(),
    updatedAt: z.iso.datetime(),
    event: EventSchema,
});

export const BookingResponseSchema = z.strictObject({
    success: z.literal(true),
    data: BookingSchema,
    message: z.string().optional(),
});

export const BookingListResponseSchema = z.strictObject({
    success: z.literal(true),
    data: z.array(BookingSchema),
    pagination: PaginationSchema,
});

/** Request body of POST /bookings. */
export const CreateBookingInputSchema = z.strictObject({
    eventId: z.int().positive(),
    customerName: z.string().min(2),
    customerEmail: z.email(),
    customerPhone: z.string().min(10),
    quantity: z.int().min(1).max(10),
});

export type Booking = zOutput<typeof BookingSchema>;
export type BookingResponse = zOutput<typeof BookingResponseSchema>;
export type BookingListResponse = zOutput<typeof BookingListResponseSchema>;
export type CreateBookingInput = zOutput<typeof CreateBookingInputSchema>;
