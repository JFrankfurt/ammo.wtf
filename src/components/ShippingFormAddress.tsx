import { UseFormRegister, FieldErrors } from "react-hook-form";
import { z } from "zod";
import { shippingSchema } from "../data/shipping-validation";
import { FormInput } from "./FormInput";
import { FormSelect } from "./FormSelect";
import { Button } from "./Button";

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
    <>
      <div className="space-y-2 md:space-y-3">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-1 md:gap-2">
          <div className="md:col-span-2">
            <FormInput
              label="Full Name"
              id="recipient.name"
              type="text"
              placeholder="John Doe"
              error={errors.recipient?.name?.message}
              {...register("recipient.name")}
              required
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
              required
              sizeVariant="small"
            />
          </div>

          <div className="md:col-span-1">
            <FormInput
              label="Phone"
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
              required
              sizeVariant="small"
            />
          </div>

          <div className="md:col-span-2">
            <FormInput
              label="Apartment, suite, etc. (optional)"
              id="address.street2"
              type="text"
              placeholder="Apt 4B"
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
              placeholder="New York"
              error={errors.address?.city?.message}
              {...register("address.city")}
              required
              sizeVariant="small"
            />
          </div>

          <div className="md:col-span-1">
            <FormSelect
              label="State"
              id="address.state"
              error={errors.address?.state?.message}
              {...register("address.state")}
              required
              sizeVariant="small"
              options={[
                { value: "", label: "Select State" },
                { value: "AL", label: "AL" },
                { value: "AZ", label: "AZ" },
                { value: "AR", label: "AR" },
                { value: "CO", label: "CO" },
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
              required
              sizeVariant="small"
            />
          </div>

          <div className="md:col-span-1 flex items-center">
            <input
              type="checkbox"
              id="preferences.requireSignature"
              className="h-3 w-3 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              {...register("preferences.requireSignature")}
            />
            <label
              htmlFor="preferences.requireSignature"
              className="ml-2 block text-xs text-gray-700"
            >
              Require signature
            </label>
          </div>

          <div className="md:col-span-1 flex items-center">
            <input
              type="checkbox"
              id="preferences.insurance"
              className="h-3 w-3 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              {...register("preferences.insurance")}
            />
            <label
              htmlFor="preferences.insurance"
              className="ml-2 block text-xs text-gray-700"
            >
              Add insurance
            </label>
          </div>

          <div className="md:col-span-2 flex flex-col">
            <label
              htmlFor="preferences.specialInstructions"
              className="text-xs font-medium text-kuroganeSteel"
            >
              Special Instructions (optional)
            </label>
            <textarea
              id="preferences.specialInstructions"
              placeholder="Any special delivery instructions..."
              className="h-12 px-2 py-1 text-xs border border-form-input-border rounded-form bg-shiroWhite text-form-input-text placeholder:text-form-input-placeholder focus:border-form-input-focus focus:outline-none focus:ring-2 focus:ring-form-input-focus/20 transition-form duration-form"
              {...register("preferences.specialInstructions")}
            />
            {errors.preferences?.specialInstructions?.message && (
              <span className="text-form-error text-xs">
                {errors.preferences?.specialInstructions?.message}
              </span>
            )}
          </div>
        </div>

        {/* Legal Notice */}
        <div className="mt-2 p-1.5 bg-blue-50 rounded text-xs text-blue-800 flex items-start">
          <span className="font-medium mr-1">Notice:</span>
          <span>
            By submitting, you confirm you are legally eligible to receive
            ammunition in your jurisdiction.
          </span>
        </div>

        {/* Action Buttons */}
        <div className="mt-2 flex flex-col-reverse sm:flex-row sm:justify-between gap-2">
          <Button
            type="button"
            variant="secondary"
            onClick={onBack}
            disabled={isSubmitting}
            className="w-full sm:w-auto text-sm py-1.5"
          >
            Back
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full sm:w-auto text-sm py-1.5"
          >
            {isSubmitting ? "Processing..." : "Complete Order"}
          </Button>
        </div>
      </div>
    </>
  );
};
