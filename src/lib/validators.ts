import { z } from "zod";
import { PARTY_SIZE_MAX, PARTY_SIZE_MIN } from "@/lib/booking-party-limits";

export const bookingFormSchema = z.object({
  activityId: z.string().uuid({ message: "Activity is required" }),
  employeeId: z.string().uuid().optional().nullable(),
  locationId: z.string().uuid().optional().nullable(),
  customerName: z
    .string()
    .trim()
    .min(2, "Please enter your full name")
    .max(120),
  customerEmail: z.string().trim().toLowerCase().email("Enter a valid email"),
  customerPhone: z
    .string()
    .trim()
    .min(6, "Enter a valid phone number")
    .max(40),
  partySize: z
    .number({ invalid_type_error: "Party size is required" })
    .int()
    .min(PARTY_SIZE_MIN, `Party size must be at least ${PARTY_SIZE_MIN}`)
    .max(
      PARTY_SIZE_MAX,
      `Party size cannot exceed ${PARTY_SIZE_MAX}; contact us for larger groups`,
    ),
  preferredDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Pick a valid date")
    .refine((v) => {
      const d = new Date(`${v}T00:00:00`);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return d >= today;
    }, "Date must be today or later"),
  preferredTime: z
    .string()
    .regex(/^\d{2}:\d{2}$/, "Pick a valid time")
    .optional()
    .or(z.literal("")),
  preferredTimeEnd: z
    .string()
    .regex(/^\d{2}:\d{2}$/, "Pick a valid end time")
    .optional()
    .or(z.literal("")),
  specialRequests: z.string().max(2000).optional().or(z.literal("")),
});

export type BookingFormInput = z.infer<typeof bookingFormSchema>;

export const customBookingRequestSchema = z.object({
  customerName: z.string().trim().min(2, "Please enter your full name").max(120),
  customerEmail: z.string().trim().toLowerCase().email("Enter a valid email"),
  customerPhone: z.string().trim().min(6, "Enter a valid phone number").max(40),
  preferredDate: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Pick a valid date")
    .optional()
    .or(z.literal("")),
  preferredTime: z
    .string()
    .regex(/^\d{2}:\d{2}$/, "Pick a valid time")
    .optional()
    .or(z.literal("")),
  partySize: z.coerce
    .number()
    .int()
    .min(PARTY_SIZE_MIN, `Party size must be at least ${PARTY_SIZE_MIN}`)
    .max(
      PARTY_SIZE_MAX,
      `Party size cannot exceed ${PARTY_SIZE_MAX}; contact us for larger groups`,
    ),
  locationId: z.string().uuid().optional().nullable().or(z.literal("")),
  budgetNotes: z.string().max(240).optional().or(z.literal("")),
  requestDetails: z
    .string()
    .trim()
    .min(12, "Tell us at least a bit more about your custom trip")
    .max(4000),
  flexibility: z.enum(["fixed", "flexible"]).default("flexible"),
});

export type CustomBookingRequestInput = z.infer<typeof customBookingRequestSchema>;

export const adminLoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

export type AdminLoginInput = z.infer<typeof adminLoginSchema>;

export const activityFormSchema = z.object({
  id: z.string().uuid().optional(),
  slug: z
    .string()
    .trim()
    .min(2)
    .max(80)
    .regex(/^[a-z0-9-]+$/, "Use lowercase letters, numbers and dashes"),
  categoryId: z.string().uuid(),
  subcategoryId: z.string().uuid().optional().or(z.literal("")),
  name: z.string().trim().min(2).max(160),
  shortDescription: z.string().max(280).optional().or(z.literal("")),
  description: z.string().max(20000).optional().or(z.literal("")),
  durationMinutes: z.coerce.number().int().min(0).optional(),
  pricePhp: z.coerce.number().min(0).optional(),
  minParty: z.coerce.number().int().min(PARTY_SIZE_MIN).max(PARTY_SIZE_MAX).default(PARTY_SIZE_MIN),
  maxParty: z.coerce.number().int().min(PARTY_SIZE_MIN).max(PARTY_SIZE_MAX).default(PARTY_SIZE_MAX),
  imageUrl: z.string().url().optional().or(z.literal("")),
  availabilityStart: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Pick a valid start date")
    .optional()
    .or(z.literal("")),
  availabilityEnd: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, "Pick a valid end date")
    .optional()
    .or(z.literal("")),
  isPublished: z.coerce.boolean().default(false),
  isFeatured: z.coerce.boolean().default(false),
  sortOrder: z.coerce.number().int().default(0),
  locationIds: z.array(z.string().uuid()).default([]),
})
  .refine(
    (data) => {
      if (!data.availabilityStart || !data.availabilityEnd) return true;
      return data.availabilityEnd >= data.availabilityStart;
    },
    {
      message: "End date must be on or after start date",
      path: ["availabilityEnd"],
    },
  )
  .refine((data) => data.maxParty >= data.minParty, {
    message: "Max party must be at least min party",
    path: ["maxParty"],
  });

export type ActivityFormInput = z.infer<typeof activityFormSchema>;
