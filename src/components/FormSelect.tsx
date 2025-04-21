import React, { forwardRef } from "react";
import { cn } from "../utils/cn"; // Assuming cn handles class merging

interface FormSelectOption {
  value: string;
  label: string;
}

interface FormSelectProps
  extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, "options"> {
  label: string;
  error?: string | { message?: string } | any; // Keep flexible error type
  options: FormSelectOption[]; // Ensure options are provided
  placeholder?: string; // Optional placeholder
  // Retain size variants
  sizeVariant?: "default" | "small" | "compact";
  // Note: Consider removing 'compact' prop later
  compact?: boolean;
}

export const FormSelect = forwardRef<HTMLSelectElement, FormSelectProps>(
  function FormSelect(
    {
      label,
      error,
      options,
      className = "",
      sizeVariant = "default",
      compact = false,
      placeholder = "Select an option", // Default placeholder text
      id, // Ensure id is passed for label association
      ...props
    },
    ref
  ) {
    // Simplified error message extraction
    const errorMessage =
      error && typeof error === "object" ? error.message : error;

    // Determine size-based classes (similar logic to FormInput)
    const getSizeClasses = () => {
      const effectiveSize = compact ? "compact" : sizeVariant;

      switch (effectiveSize) {
        case "small":
          return {
            wrapperGap: "gap-1",
            label: "text-xs",
            select: "h-8 pl-2 pr-8 py-1 text-xs", // Added padding-right for dropdown arrow
            error: "text-xs",
          };
        case "compact":
          return {
            wrapperGap: "gap-1",
            label: "text-xs",
            select: "h-9 pl-3 pr-8 py-1 text-xs", // Added padding-right, changed text-sm to text-xs
            error: "text-xs", // Changed text-sm to text-xs
          };
        case "default":
        default:
          return {
            wrapperGap: "gap-1.5",
            label: "text-xs font-medium", // Changed text-sm to text-xs
            select: "h-10 pl-3 pr-8 py-2 text-xs", // Added padding-right, changed text-sm to text-xs
            error: "text-xs", // Changed text-sm to text-xs
          };
      }
    };

    const sizeClasses = getSizeClasses();

    // Generate a unique ID if one isn't provided
    const selectId = id || `form-select-${React.useId()}`;

    return (
      <div className={cn("flex flex-col", sizeClasses.wrapperGap)}>
        <label
          htmlFor={selectId} // Use the generated or passed id
          // Use semantic colors from the theme
          className={cn(sizeClasses.label, "text-form-label")}
        >
          {label}
        </label>
        {/* Add a relative container for potential custom arrow overlay later */}
        <div className="relative w-full">
          <select
            ref={ref}
            id={selectId} // Apply the id to the select
            className={cn(
              // Base select styles using theme colors/settings
              "w-full",
              "appearance-none", // Remove default browser arrow styling
              "border",
              "rounded-md", // Use theme's default rounding (2px)
              "bg-form-input-background", // Use theme color
              "text-form-input-text", // Use theme color

              // Focus state using standard ring utilities and theme color
              "focus:outline-none",
              "focus:ring-2",
              "focus:ring-ring", // Use theme's accentGreen ring
              "focus:ring-offset-2",
              "focus:ring-offset-background", // Offset against theme background

              // Border color logic: Red if error, default otherwise
              errorMessage
                ? "border-form-error" // Use theme error color (accentRed)
                : "border-form-input-border", // Use theme default border color
              "focus:border-form-input-border", // Keep default border on focus

              // Disabled state using theme colors
              "disabled:cursor-not-allowed",
              "disabled:bg-form-input-disabled/50", // Use theme color with opacity
              "disabled:text-muted", // Muted text
              "disabled:border-form-input-disabled/20", // Fainter border

              // Apply size-specific select classes (includes padding for arrow)
              sizeClasses.select,

              // Allow overriding classes
              className
            )}
            {...props}
          >
            {/* Add placeholder option if provided */}
            {placeholder && <option value="">{placeholder}</option>}
            {options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          {/* Basic SVG Arrow - Style with text color */}
          {/* Positioned absolutely within the relative container */}
          <div
            className={cn(
              "pointer-events-none",
              "absolute inset-y-0 right-0 flex items-center pr-2",
              "text-form-input-text", // Match input text color
              "disabled:text-muted" // Muted color when disabled (needs sibling selector or JS)
              // Note: Disabling arrow based on select's disabled state might require more complex CSS/JS
            )}
          >
            <svg
              className="h-4 w-4" // Adjust size as needed
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden="true"
            >
              <path
                fillRule="evenodd"
                d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </div>
        </div>
        {errorMessage && (
          <span className={cn("text-form-error", sizeClasses.error)}>
            {errorMessage}
          </span>
        )}
      </div>
    );
  }
);

FormSelect.displayName = "FormSelect";

/*
Refactoring Thoughts for FormSelect.tsx:

1.  Theme Alignment: Similar to FormInput, replaced hardcoded theme values with semantic references from the Tailwind config (`bg-form-input-background`, `text-form-label`, `border-form-input-border`, `rounded-md`, etc.).
2.  Focus State: Implemented the standard `focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background` pattern for consistent focus indication using the theme's `ring` color.
3.  Error & Disabled States: Applied theme colors (`border-form-error`, `disabled:bg-form-input-disabled/50`, `disabled:text-muted`) for error and disabled states, mirroring the FormInput changes.
4.  Sizing: Used the same `getSizeClasses` logic as FormInput, adapting the class names for the `<select>` element and adding right padding (`pr-8`) to the size classes to accommodate the custom dropdown arrow. **Standardized all text sizes to `text-xs` for consistency and a denser UI feel.**
5.  Custom Arrow:
    *   Added `appearance-none` to the `<select>` element to hide the default browser dropdown arrow.
    *   Added a `relative` div wrapper around the select and arrow.
    *   Included an absolutely positioned `div` containing a basic SVG arrow. This arrow is styled using `text-form-input-text` to match the select's text color.
    *   This provides a consistent arrow appearance across browsers, fitting the custom theme better than default browser styles. Styling the arrow in a disabled state purely with CSS might be tricky without `:has()` support or JS.
6.  Accessibility: Ensured `id` is handled correctly using `React.useId()` for `label` (`htmlFor`) and `select` (`id`) association.
7.  Placeholder: Added logic to include the `placeholder` as the first, disabled option if provided.
8.  Structure: Used `cn` utility and maintained similar structure to FormInput for consistency.
*/
