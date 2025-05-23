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

const RESTRICTED_STATES = [
  "NY",
  "IL",
  "MA",
  "NJ",
  "CT",
  "CA",
  "NEW YORK",
  "ILLINOIS",
  "MASSACHUSETTS",
  "NEW JERSEY",
  "CONNECTICUT",
  "CALIFORNIA",
];

const stateSchema = z
  .string()
  .min(1)
  .max(100)
  .transform((state) => state.toUpperCase().trim())
  .refine((state) => !RESTRICTED_STATES.includes(state), {
    message:
      "We cannot ship to NY, IL, MA, NJ, CT, or CA due to regulatory restrictions",
  });

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

type ShippingData = z.infer<typeof shippingSchema>;

// Example usage
export const exampleShippingData: ShippingData = {
  recipient: {
    name: "John Doe",
    email: "john.doe@example.com",
    phone: "+1234567890",
  },
  address: {
    street1: "123 Main St",
    street2: "Apt 4B",
    city: "Anytown",
    state: "State",
    postalCode: "12345",
    country: "US",
  },
  preferences: {
    requireSignature: true,
    insurance: true,
    specialInstructions: "Please leave with doorman",
  },
  metadata: {
    version: "1.0",
    origin: "marketplace-v2",
  },
};
