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

// Country code must be ISO 3166-1 alpha-2
const countrySchema = z
  .string()
  .length(2)
  .regex(/^[A-Z]{2}$/, "Must be ISO 3166-1 alpha-2 country code")
  .transform((val) => val.toUpperCase());

// Main shipping information schema
const shippingSchema = z.object({
  // Unique identifier for the order
  orderId: z.string().uuid(),

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
    state: z.string().min(1).max(100),
    postalCode: postalCodeSchema,
    country: countrySchema,
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
    timestamp: z.number().int().positive(),
    origin: z.string().max(50), // e.g., "marketplace-v2"
  }),
});

type ShippingData = z.infer<typeof shippingSchema>;


// Example usage
export const exampleShippingData: ShippingData = {
  orderId: "0xasdfasdftransactionhash",
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
    timestamp: Date.now(),
    origin: "marketplace-v2",
  },
};
