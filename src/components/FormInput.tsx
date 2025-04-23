import React, { forwardRef } from "react";
import { cn } from "../utils/cn"; // Assuming cn handles class merging

interface FormInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string | { message?: string } | any; // Keep flexible error type for now
  // Retain size variants, potentially useful
  sizeVariant?: "default" | "small" | "compact";
  // Note: The 'compact' prop seems redundant if sizeVariant exists, consider removing later
  compact?: boolean;
}

export const FormInput = forwardRef<HTMLInputElement, FormInputProps>(
  function FormInput(
    {
      label,
      error,
      className = "",
      // Default to 'default' size
      sizeVariant = "default",
      // Deprecate 'compact' in favor of sizeVariant? For now, keep logic.
      compact = false,
      id, // Ensure id is passed for label association
      ...props
    },
    ref
  ) {
    // Simplified error message extraction
    const errorMessage =
      error && typeof error === "object" ? error.message : error;

    // Determine size-based classes using standard Tailwind utilities where possible
    const getSizeClasses = () => {
      // Use the explicit compact prop if provided, otherwise use sizeVariant
      const effectiveSize = compact ? "compact" : sizeVariant;

      switch (effectiveSize) {
        case "small":
          return {
            wrapperGap: "gap-1",
            label: "text-xs", // Standard Tailwind size
            input: "h-8 px-2 py-1 text-xs", // Standard Tailwind size
            error: "text-xs", // Standard Tailwind size
          };
        case "compact":
          return {
            wrapperGap: "gap-1",
            label: "text-xs", // Changed from text-sm to text-xs for consistency
            input: "h-9 px-3 py-1 text-xs", // Changed from text-sm to text-xs
            error: "text-xs", // Changed from text-sm to text-xs
          };
        case "default":
        default:
          return {
            wrapperGap: "gap-1.5",
            // Use theme values if defined, otherwise fall back to Tailwind defaults
            label: "text-xs font-medium", // Changed from text-sm to text-xs
            input: "h-10 px-3 py-2 text-xs", // Changed from text-sm to text-xs
            error: "text-xs", // Changed from text-sm to text-xs
          };
      }
    };

    const sizeClasses = getSizeClasses();

    // Generate a unique ID if one isn't provided, crucial for accessibility
    const inputId = id || `form-input-${React.useId()}`;

    return (
      <div className={cn("flex flex-col", sizeClasses.wrapperGap)}>
        <label
          htmlFor={inputId} // Use the generated or passed id
          // Use semantic colors from the theme
          className={cn(sizeClasses.label, "text-form-label")}
        >
          {label}
        </label>
        <input
          ref={ref}
          id={inputId} // Apply the id to the input
          className={cn(
            // Base input styles using theme colors/settings
            "w-full", // Inputs should generally be full width within their container
            "border",
            "rounded-md", // Use theme's default rounding (2px)
            "bg-form-input-background", // Use theme color
            "text-form-input-text", // Use theme color
            "placeholder:text-form-input-placeholder", // Use theme color

            // Focus state using standard ring utilities and theme color
            "focus:outline-none",
            "focus:ring-2",
            "focus:ring-ring", // Use theme's accentGreen ring
            "focus:ring-offset-2",
            "focus:ring-offset-background", // Offset against theme background

            // Border color logic: Red if error, focus color during focus (handled by ring), default otherwise
            errorMessage
              ? "border-form-error" // Use theme error color (accentRed)
              : "border-form-input-border", // Use theme default border color
            "focus:border-form-input-border", // Keep default border color even on focus (ring provides visual cue)

            // Disabled state using theme colors
            "disabled:cursor-not-allowed",
            "disabled:bg-form-input-disabled/50", // Use theme color with opacity
            "disabled:text-muted", // Muted text
            "disabled:border-form-input-disabled/20", // Fainter border

            // Apply size-specific input classes
            sizeClasses.input,

            // Allow overriding classes
            className
          )}
          {...props}
        />
        {errorMessage && (
          <span className={cn("text-form-error", sizeClasses.error)}>
            {errorMessage}
          </span>
        )}
      </div>
    );
  }
);

FormInput.displayName = "FormInput";
