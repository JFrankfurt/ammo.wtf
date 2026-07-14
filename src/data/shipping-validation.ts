import { z } from "zod";

// Base schemas for reusable components
const phoneSchema = z
  .string()
  .regex(/^\+?[1-9]\d{1,14}$/, "Invalid phone number format")
  .transform((val) => val.replace(/\D/g, ""));

const emailSchema = z
  .string()
  .email()
  .transform((val) => val.toLowerCase().trim());

const postalCodeSchema = z
  .string()
  .min(3)
  .max(10)
  .regex(/^[A-Z0-9 -]*$/i, "Invalid postal code format");

export const RESTRICTED_STATE_CODES = [
  "CA",
  "CT",
  "IL",
  "MA",
  "NJ",
  "NY",
] as const;

export const SHIPPING_STATE_CODES = [
  "AL",
  "AZ",
  "AR",
  "CO",
  "DE",
  "FL",
  "GA",
  "ID",
  "IN",
  "IA",
  "KS",
  "KY",
  "LA",
  "ME",
  "MD",
  "MI",
  "MN",
  "MS",
  "MO",
  "MT",
  "NE",
  "NV",
  "NH",
  "NM",
  "NC",
  "ND",
  "OH",
  "OK",
  "OR",
  "PA",
  "RI",
  "SC",
  "SD",
  "TN",
  "TX",
  "UT",
  "VT",
  "VA",
  "WA",
  "WV",
  "WI",
  "WY",
] as const;

export const SHIPPING_STATE_OPTIONS = SHIPPING_STATE_CODES.map((state) => ({
  value: state,
  label: state,
}));

const stateSchema = z
  .string()
  .transform((state) => state.toUpperCase().trim())
  .refine(
    (state): state is (typeof SHIPPING_STATE_CODES)[number] =>
      SHIPPING_STATE_CODES.includes(
        state as (typeof SHIPPING_STATE_CODES)[number]
      ),
    {
      message:
        "Select an eligible state. Shipping is unavailable in CA, CT, IL, MA, NJ, and NY.",
    }
  );

// Main shipping information schema
export const shippingSchema = z.object({
  // Recipient information
  recipient: z.object({
    name: z.string().min(1).max(100),
    email: emailSchema,
    phone: phoneSchema.optional(),
  }),

  // Shipping address
  address: z.object({
    street1: z.string().min(1).max(100),
    street2: z.string().max(100).optional(),
    city: z.string().min(1).max(100),
    state: stateSchema,
    postalCode: postalCodeSchema,
    country: z.literal("US"),
  }),

  // Additional shipping preferences
  preferences: z.object({
    requireSignature: z.boolean().default(true),
    insurance: z.boolean().default(false),
    specialInstructions: z.string().max(500).optional(),
  }),

  // Metadata for versioning and tracking
  metadata: z.object({
    version: z.literal("1.0"), // Schema version
    origin: z.string().max(50), // e.g., "marketplace-v2"
  }),
});

export type ShippingData = z.infer<typeof shippingSchema>;
