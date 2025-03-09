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
      <div className="space-y-3 md:space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-3">
          {/* Recipient Information */}
          <div className="md:col-span-2">
            <h3 className="text-sm md:text-base font-medium text-gray-700 mb-2">
              Recipient Information
            </h3>
          </div>

          <div className="md:col-span-2">
            <FormInput
              label="Full Name"
              id="recipient.name"
              type="text"
              placeholder="John Doe"
              error={errors.recipient?.name?.message}
              {...register("recipient.name")}
              required
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
            />
          </div>

          <div className="md:col-span-1">
            <FormInput
              label="Phone (optional)"
              id="recipient.phone"
              type="tel"
              placeholder="(555) 555-5555"
              error={errors.recipient?.phone?.message}
              {...register("recipient.phone")}
            />
          </div>

          {/* Shipping Address */}
          <div className="md:col-span-2 pt-2 md:pt-3">
            <h3 className="text-sm md:text-base font-medium text-gray-700 mb-2">
              Shipping Address
            </h3>
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
            />
          </div>

          <div className="md:col-span-1">
            <FormSelect
              label="State"
              id="address.state"
              error={errors.address?.state?.message}
              {...register("address.state")}
              required
              options={[
                { value: "", label: "Select State" },
                { value: "AL", label: "Alabama" },
                { value: "AK", label: "Alaska" },
                { value: "AZ", label: "Arizona" },
                { value: "AR", label: "Arkansas" },
                { value: "CA", label: "California" },
                { value: "CO", label: "Colorado" },
                { value: "CT", label: "Connecticut" },
                { value: "DE", label: "Delaware" },
                { value: "FL", label: "Florida" },
                { value: "GA", label: "Georgia" },
                { value: "HI", label: "Hawaii" },
                { value: "ID", label: "Idaho" },
                { value: "IL", label: "Illinois" },
                { value: "IN", label: "Indiana" },
                { value: "IA", label: "Iowa" },
                { value: "KS", label: "Kansas" },
                { value: "KY", label: "Kentucky" },
                { value: "LA", label: "Louisiana" },
                { value: "ME", label: "Maine" },
                { value: "MD", label: "Maryland" },
                { value: "MA", label: "Massachusetts" },
                { value: "MI", label: "Michigan" },
                { value: "MN", label: "Minnesota" },
                { value: "MS", label: "Mississippi" },
                { value: "MO", label: "Missouri" },
                { value: "MT", label: "Montana" },
                { value: "NE", label: "Nebraska" },
                { value: "NV", label: "Nevada" },
                { value: "NH", label: "New Hampshire" },
                { value: "NJ", label: "New Jersey" },
                { value: "NM", label: "New Mexico" },
                { value: "NY", label: "New York" },
                { value: "NC", label: "North Carolina" },
                { value: "ND", label: "North Dakota" },
                { value: "OH", label: "Ohio" },
                { value: "OK", label: "Oklahoma" },
                { value: "OR", label: "Oregon" },
                { value: "PA", label: "Pennsylvania" },
                { value: "RI", label: "Rhode Island" },
                { value: "SC", label: "South Carolina" },
                { value: "SD", label: "South Dakota" },
                { value: "TN", label: "Tennessee" },
                { value: "TX", label: "Texas" },
                { value: "UT", label: "Utah" },
                { value: "VT", label: "Vermont" },
                { value: "VA", label: "Virginia" },
                { value: "WA", label: "Washington" },
                { value: "WV", label: "West Virginia" },
                { value: "WI", label: "Wisconsin" },
                { value: "WY", label: "Wyoming" },
                { value: "DC", label: "District of Columbia" },
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
            />
          </div>

          <div className="md:col-span-1">
            <FormSelect
              label="Country"
              id="address.country"
              error={errors.address?.country?.message}
              {...register("address.country")}
              required
              options={[{ value: "US", label: "United States" }]}
              disabled
            />
          </div>

          {/* Shipping Preferences */}
          <div className="md:col-span-2 pt-2 md:pt-3">
            <h3 className="text-sm md:text-base font-medium text-gray-700 mb-2">
              Shipping Preferences
            </h3>
          </div>

          <div className="md:col-span-1 flex items-center">
            <input
              type="checkbox"
              id="preferences.requireSignature"
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              {...register("preferences.requireSignature")}
            />
            <label
              htmlFor="preferences.requireSignature"
              className="ml-2 block text-xs md:text-sm text-gray-700"
            >
              Require signature on delivery
            </label>
          </div>

          <div className="md:col-span-1 flex items-center">
            <input
              type="checkbox"
              id="preferences.insurance"
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              {...register("preferences.insurance")}
            />
            <label
              htmlFor="preferences.insurance"
              className="ml-2 block text-xs md:text-sm text-gray-700"
            >
              Add shipping insurance
            </label>
          </div>

          <div className="md:col-span-2">
            <FormInput
              label="Special Instructions (optional)"
              id="preferences.specialInstructions"
              type="textarea"
              placeholder="Any special delivery instructions..."
              error={errors.preferences?.specialInstructions?.message}
              {...register("preferences.specialInstructions")}
            />
          </div>
        </div>

        {/* Legal Notice */}
        <div className="mt-3 md:mt-4 p-2 md:p-3 bg-blue-50 rounded-lg text-xs md:text-sm text-blue-800">
          <p className="mb-1 font-medium">Important Notice:</p>
          <p>
            By submitting this form, you confirm that you are legally eligible
            to receive ammunition in your jurisdiction and that all information
            provided is accurate.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="mt-4 md:mt-6 flex flex-col-reverse sm:flex-row sm:justify-between gap-2 md:gap-3">
          <Button
            type="button"
            variant="secondary"
            onClick={onBack}
            disabled={isSubmitting}
            className="w-full sm:w-auto"
          >
            Back
          </Button>
          <Button
            type="submit"
            disabled={isSubmitting}
            className="w-full sm:w-auto"
          >
            {isSubmitting ? "Processing..." : "Complete Order"}
          </Button>
        </div>
      </div>
    </>
  );
};
