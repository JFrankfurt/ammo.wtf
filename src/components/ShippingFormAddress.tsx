import { UseFormRegister, FieldErrors } from "react-hook-form";
import { z } from "zod";
import { shippingSchema } from "../data/shipping-validation";
import { FormInput } from "./FormInput";
import { FormSelect } from "./FormSelect";
import { Button } from "./Button";
import { cn } from "../utils/cn";

// Define a more flexible form data type that works with both components
export type FormDataWithRequiredFields = {
  recipient: {
    name: string;
    email: string;
    phone: string | undefined;
  };
  address: {
    street1: string;
    street2: string | undefined;
    city: string;
    state: string;
    postalCode: string;
    country: "US";
  };
  preferences: {
    requireSignature: boolean;
    insurance: boolean;
    specialInstructions: string;
  };
  metadata: {
    version: "1.0";
    origin: string;
  };
};

interface ShippingFormAddressProps {
  register: UseFormRegister<FormDataWithRequiredFields>;
  errors: FieldErrors<FormDataWithRequiredFields>;
  isSubmitting: boolean;
  onBack: () => void;
}

export const ShippingFormAddress = ({
  register,
  errors,
  isSubmitting,
  onBack,
}: ShippingFormAddressProps) => {
  return (
    <div className="space-y-4 md:space-y-6">
      {/* Form Fields Section - Uses themed FormInput/FormSelect */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
        <div className="md:col-span-2">
          <FormInput
            label="Full Name"
            id="recipient.name"
            type="text"
            placeholder="John Doe"
            error={errors.recipient?.name?.message}
            {...register("recipient.name")}
            sizeVariant="small"
          />
        </div>

        <div className="md:col-span-1">
          <FormInput
            label="Email"
            id="recipient.email"
            type="email"
            placeholder="john@example.com"
            error={errors.recipient?.email?.message}
            {...register("recipient.email")}
            sizeVariant="small"
          />
        </div>

        <div className="md:col-span-1">
          <FormInput
            label="Phone (Optional)"
            id="recipient.phone"
            type="tel"
            placeholder="(555) 555-5555"
            error={errors.recipient?.phone?.message}
            {...register("recipient.phone")}
            sizeVariant="small"
          />
        </div>

        <div className="md:col-span-2">
          <FormInput
            label="Street Address"
            id="address.street1"
            type="text"
            placeholder="123 Main St"
            error={errors.address?.street1?.message}
            {...register("address.street1")}
            sizeVariant="small"
          />
        </div>

        <div className="md:col-span-2">
          <FormInput
            label="Apt, Suite, etc. (Optional)"
            id="address.street2"
            type="text"
            placeholder="Unit 4B"
            error={errors.address?.street2?.message}
            {...register("address.street2")}
            sizeVariant="small"
          />
        </div>

        <div className="md:col-span-1">
          <FormInput
            label="City"
            id="address.city"
            type="text"
            placeholder="Terminal City"
            error={errors.address?.city?.message}
            {...register("address.city")}
            sizeVariant="small"
          />
        </div>

        <div className="md:col-span-1">
          <FormSelect
            label="State"
            id="address.state"
            error={errors.address?.state?.message}
            {...register("address.state")}
            sizeVariant="small"
            options={[
              { value: "", label: "Select State" },
              { value: "AL", label: "AL" },
              { value: "AZ", label: "AZ" },
              { value: "AR", label: "AR" },
              { value: "CA", label: "CA" },
              { value: "CO", label: "CO" },
              { value: "CT", label: "CT" },
              { value: "DE", label: "DE" },
              { value: "FL", label: "FL" },
              { value: "GA", label: "GA" },
              { value: "ID", label: "ID" },
              { value: "IN", label: "IN" },
              { value: "IA", label: "IA" },
              { value: "KS", label: "KS" },
              { value: "KY", label: "KY" },
              { value: "LA", label: "LA" },
              { value: "ME", label: "ME" },
              { value: "MD", label: "MD" },
              { value: "MI", label: "MI" },
              { value: "MN", label: "MN" },
              { value: "MS", label: "MS" },
              { value: "MO", label: "MO" },
              { value: "MT", label: "MT" },
              { value: "NE", label: "NE" },
              { value: "NV", label: "NV" },
              { value: "NH", label: "NH" },
              { value: "NM", label: "NM" },
              { value: "NC", label: "NC" },
              { value: "ND", label: "ND" },
              { value: "OH", label: "OH" },
              { value: "OK", label: "OK" },
              { value: "OR", label: "OR" },
              { value: "PA", label: "PA" },
              { value: "RI", label: "RI" },
              { value: "SC", label: "SC" },
              { value: "SD", label: "SD" },
              { value: "TN", label: "TN" },
              { value: "TX", label: "TX" },
              { value: "UT", label: "UT" },
              { value: "VT", label: "VT" },
              { value: "VA", label: "VA" },
              { value: "WA", label: "WA" },
              { value: "WV", label: "WV" },
              { value: "WI", label: "WI" },
              { value: "WY", label: "WY" },
            ]}
          />
        </div>

        <div className="md:col-span-1">
          <FormInput
            label="ZIP Code"
            id="address.postalCode"
            type="text"
            placeholder="10001"
            error={errors.address?.postalCode?.message}
            {...register("address.postalCode")}
            sizeVariant="small"
          />
        </div>

        {/* Preferences Section - Themed */}
        <div className="md:col-span-2 pt-3 mt-1 border-t border-border">
          <h4 className="font-medium text-muted mb-2 text-xs font-mono">
            Shipping Preferences
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <div className="flex items-center">
              <input
                type="checkbox"
                id="preferences.requireSignature"
                className="h-3.5 w-3.5 accent-accentGreen focus:ring-ring border-border bg-input rounded-none"
                {...register("preferences.requireSignature")}
              />
              <label
                htmlFor="preferences.requireSignature"
                className="ml-2 block text-muted text-xs font-mono"
              >
                Require signature
              </label>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="preferences.insurance"
                className="h-3.5 w-3.5 accent-accentGreen focus:ring-ring border-border bg-input rounded-none"
                {...register("preferences.insurance")}
              />
              <label
                htmlFor="preferences.insurance"
                className="ml-2 block text-muted text-xs font-mono"
              >
                Add insurance
              </label>
            </div>
          </div>
        </div>

        <div className="md:col-span-2">
          <label
            htmlFor="preferences.specialInstructions"
            className="block font-medium text-muted mb-1 text-xs font-mono"
          >
            Special Instructions (optional)
          </label>
          <textarea
            id="preferences.specialInstructions"
            placeholder="Leave package at back door..."
            rows={2}
            className={cn(
              "w-full",
              "px-2 py-1",
              "text-xs font-mono",
              "border border-border",
              "rounded-none",
              "bg-input",
              "text-foreground",
              "placeholder:text-muted",
              "focus:outline-none focus:ring-1 focus:ring-ring focus:border-ring",
              "transition-colors duration-100"
            )}
            {...register("preferences.specialInstructions")}
          />
          {errors.preferences?.specialInstructions?.message && (
            <span className="text-xs text-destructive mt-1 block">
              {errors.preferences?.specialInstructions?.message}
            </span>
          )}
        </div>
      </div>

      {/* Legal Notice - Themed */}
      <div className="p-3 bg-muted/10 border border-border rounded-none text-xs text-muted flex items-start">
        <svg
          className="h-4 w-4 text-muted mr-2 flex-shrink-0 mt-0.5"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M11.25 11.25l.041-.02a.75.75 0 011.063.852l-.708 2.836a.75.75 0 001.063.853l.041-.021M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9-3.75h.008v.008H12V8.25z"
          />
        </svg>
        <span className="font-mono">
          By submitting, you confirm you are legally eligible to receive
          ammunition in your jurisdiction.
        </span>
      </div>

      {/* Action Buttons - Use themed Button */}
      <div className="flex flex-col-reverse sm:flex-row sm:justify-between gap-3 pt-3 border-t border-border">
        <Button
          type="button"
          variant="secondary"
          onClick={onBack}
          disabled={isSubmitting}
        >
          Back
        </Button>
        <Button type="submit" variant="primary" disabled={isSubmitting}>
          {isSubmitting ? (
            <div className="flex items-center justify-center">
              <svg
                className="animate-spin h-4 w-4 mr-2 text-background"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  d="M12 2 L12 5 M12 19 L12 22 M5 12 L2 12 M22 12 L19 12 M19.07 4.93 L16.95 7.05 M7.05 16.95 L4.93 19.07 M19.07 19.07 L16.95 16.95 M7.05 7.05 L4.93 4.93"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
              <span className="font-mono">Processing...</span>
            </div>
          ) : (
            "Complete Shipping"
          )}
        </Button>
      </div>
    </div>
  );
};
