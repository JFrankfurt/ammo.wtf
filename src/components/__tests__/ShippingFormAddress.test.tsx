import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { ShippingFormAddress } from "../ShippingFormAddress";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { shippingSchema } from "../../data/shipping-validation";
import { FormDataWithRequiredFields } from "../ShippingFormAddress";
import { act } from "react";

// Create a real-world test component that uses the actual form components
const RealWorldFormWrapper = ({ onSubmit = jest.fn() }) => {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    getValues,
    trigger,
  } = useForm<FormDataWithRequiredFields>({
    resolver: zodResolver(shippingSchema),
    mode: "onChange", // This is important - match the real component
    defaultValues: {
      recipient: {
        name: "",
        email: "",
        phone: undefined,
      },
      address: {
        street1: "",
        street2: undefined,
        city: "",
        state: "",
        postalCode: "",
        country: "US" as const,
      },
      preferences: {
        requireSignature: true,
        insurance: true,
        specialInstructions: "",
      },
      metadata: {
        version: "1.0" as const,
        origin: "test",
      },
    },
  });

  // Expose form methods for testing
  (window as any).testHelpers = {
    setValue,
    getValues,
    trigger,
    handleSubmit: (callback: any) => handleSubmit(callback)(),
    errors,
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} data-testid="shipping-form">
      <ShippingFormAddress
        register={register}
        errors={errors}
        isSubmitting={isSubmitting}
        onBack={jest.fn()}
      />
      <button type="submit" data-testid="submit-button">
        Submit
      </button>
    </form>
  );
};

// Mock the Button component
jest.mock("../Button", () => ({
  Button: ({
    children,
    ...props
  }: {
    children: React.ReactNode;
    [key: string]: any;
  }) => <button {...props}>{children}</button>,
}));

describe("ShippingFormAddress Real-World Tests", () => {
  it("renders the form fields", () => {
    render(<RealWorldFormWrapper />);

    expect(screen.getByLabelText("Full Name")).toBeInTheDocument();
    expect(screen.getByLabelText("Email")).toBeInTheDocument();
    expect(screen.getByLabelText("Phone")).toBeInTheDocument();
    expect(screen.getByLabelText("Street Address")).toBeInTheDocument();
    expect(
      screen.getByLabelText("Apartment, suite, etc. (optional)")
    ).toBeInTheDocument();
    expect(screen.getByLabelText("City")).toBeInTheDocument();
    expect(screen.getByLabelText("State")).toBeInTheDocument();
    expect(screen.getByLabelText("ZIP Code")).toBeInTheDocument();
    expect(screen.getByLabelText("Require signature")).toBeInTheDocument();
    expect(screen.getByLabelText("Add insurance")).toBeInTheDocument();
    expect(
      screen.getByLabelText("Special Instructions (optional)")
    ).toBeInTheDocument();
  });

  it("shows validation errors when submitting empty form", async () => {
    render(<RealWorldFormWrapper />);

    // Submit the empty form
    fireEvent.click(screen.getByTestId("submit-button"));

    // Wait for validation errors to appear
    await waitFor(() => {
      // Check for validation errors
      const errorElements = screen.getAllByText(
        /must contain at least|invalid|required/i
      );
      expect(errorElements.length).toBeGreaterThan(0);
    });
  });

  it("simulates real user interaction and validates filled fields correctly", async () => {
    const onSubmit = jest.fn();
    render(<RealWorldFormWrapper onSubmit={onSubmit} />);

    // Simulate real user interaction by typing into fields
    fireEvent.change(screen.getByLabelText("Full Name"), {
      target: { value: "John Doe" },
    });

    fireEvent.change(screen.getByLabelText("Email"), {
      target: { value: "john@example.com" },
    });

    // Use a valid phone number format
    fireEvent.change(screen.getByLabelText("Phone"), {
      target: { value: "+12345678901" },
    });

    fireEvent.change(screen.getByLabelText("Street Address"), {
      target: { value: "123 Main St" },
    });

    fireEvent.change(screen.getByLabelText("City"), {
      target: { value: "Anytown" },
    });

    // Select a state that's not restricted
    const stateSelect = screen.getByLabelText("State");
    fireEvent.change(stateSelect, { target: { value: "TX" } });

    fireEvent.change(screen.getByLabelText("ZIP Code"), {
      target: { value: "12345" },
    });

    // Wait for validation to complete after each field change
    await waitFor(() => {
      // Log the current form state for debugging
      console.log(
        "Form errors after filling:",
        (window as any).testHelpers.errors
      );

      // Check that there are no validation errors for filled fields
      const nameError = screen.queryByText(/required|must contain/i, {
        selector: `span.text-form-error`,
      });
      const emailError = screen.queryByText(/required|invalid email/i, {
        selector: `span.text-form-error`,
      });
      const phoneError = screen.queryByText(/invalid phone/i, {
        selector: `span.text-form-error`,
      });
      const streetError = screen.queryByText(/required|must contain/i, {
        selector: `span.text-form-error`,
      });
      const cityError = screen.queryByText(/required|must contain/i, {
        selector: `span.text-form-error`,
      });
      const stateError = screen.queryByText(/required|cannot ship/i, {
        selector: `span.text-form-error`,
      });
      const zipError = screen.queryByText(/required|invalid postal/i, {
        selector: `span.text-form-error`,
      });

      expect(nameError).toBeNull();
      expect(emailError).toBeNull();
      expect(phoneError).toBeNull();
      expect(streetError).toBeNull();
      expect(cityError).toBeNull();
      expect(stateError).toBeNull();
      expect(zipError).toBeNull();
    });

    // Submit the form
    fireEvent.submit(screen.getByTestId("shipping-form"));

    // Wait for submission to complete
    await waitFor(() => {
      // Check that onSubmit was called
      expect(onSubmit).toHaveBeenCalled();

      // Verify no error messages are displayed for filled fields
      expect(
        screen.queryByText(/required|invalid/i, {
          selector: `span.text-form-error`,
        })
      ).not.toBeInTheDocument();
    });
  });

  it("validates fields in real-time as the user types", async () => {
    render(<RealWorldFormWrapper />);

    // Type into a field
    const nameInput = screen.getByLabelText("Full Name");
    fireEvent.change(nameInput, { target: { value: "J" } });

    // Wait for validation
    await waitFor(() => {
      // Should not show "Required" error for a field with content
      const nameError = screen.queryByText("Required", {
        selector: `[for="recipient.name"] + input + span`,
      });
      expect(nameError).toBeNull();
    });

    // Clear the field
    fireEvent.change(nameInput, { target: { value: "" } });

    // Wait for validation
    await waitFor(() => {
      // Should show validation error when field is emptied
      const errorElements = screen.getAllByText(
        /must contain at least|invalid|required/i
      );
      expect(errorElements.length).toBeGreaterThan(0);
    });
  });
});
