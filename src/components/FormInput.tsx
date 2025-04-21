import React, { forwardRef } from "react";
import { cn } from "../utils/cn"; // Assuming cn handles class merging

interface FormInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
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

/*
Refactoring Thoughts for FormInput.tsx:

1.  Semantic Colors & Theme Values:
    *   Replaced direct color/theme references (e.g., `text-kuroganeSteel`, `border-form-input-border`, `bg-shiroWhite`, `rounded-form`) with values derived from the updated Tailwind config (`text-form-label`, `border-form-input-border`, `bg-form-input-background`, `text-form-error`, `rounded-md`). This ensures the component adapts to the theme.
    *   Specifically used `form.*` colors where appropriate (e.g., `bg-form-input-background`, `text-form-input-text`, `border-form-input-border`, `placeholder:text-form-input-placeholder`).
2.  Focus State:
    *   Updated focus styling to use the standard Tailwind ring utilities (`focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background`). This provides a consistent focus indicator using the theme's `ring` color (`accentGreen`).
    *   Removed the previous `focus:border-form-input-focus` and `focus:ring-form-input-focus/20` as the ring utility handles the focus indication more robustly. Ensured the border color reverts to the default on focus, letting the ring be the primary indicator.
3.  Error State:
    *   Simplified the error border logic to directly use `border-form-error` (which maps to `accentRed`) when `errorMessage` is present.
4.  Disabled State:
    *   Updated disabled styles to use theme colors (`disabled:bg-form-input-disabled/50`, `disabled:text-muted`) for consistency. Added a faint border color for disabled state.
5.  Sizing Logic:
    *   Refactored `getSizeClasses` to use standard Tailwind font/size utilities (`text-xs`, `text-sm`) where possible, making it less reliant on custom theme values (like `text-form-label`, `h-form-input-height`) which were removed or simplified in the theme config.
    *   Used more standard height/padding values (`h-10 px-3 py-2` for default) which align well with Tailwind's defaults (`h-10` is default for form-input in `@tailwindcss/forms`).
    *   Adjusted default gap (`gap-1.5`) and label size (`text-sm`) slightly for potentially better default appearance.
    *   Acknowledged potential redundancy of `compact` prop vs `sizeVariant`.
6.  Accessibility & Structure:
    *   Ensured `id` is passed down or generated using `React.useId()` and correctly applied to both the `label` (`htmlFor`) and `input` (`id`) for proper accessibility.
    *   Used `cn` utility consistently for merging classes.
7.  Removed Redundancy: Removed `transition-form` and `duration-form` as base input transitions are often handled globally or aren't as necessary as button transitions. If needed, standard `transition-colors duration-100` could be added.
*/
