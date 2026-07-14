import React, { forwardRef } from "react";
import { cn } from "../utils/cn";

interface FormInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string | { message?: string };
  sizeVariant?: "default" | "small" | "compact";
  compact?: boolean;
}

const SIZE_CLASSES = {
  default: {
    wrapper: "gap-1.5",
    label: "text-xs font-medium",
    input: "h-10 px-3 py-2 text-xs",
    error: "text-xs",
  },
  small: {
    wrapper: "gap-1",
    label: "text-xs",
    input: "h-8 px-2 py-1 text-xs",
    error: "text-xs",
  },
  compact: {
    wrapper: "gap-1",
    label: "text-xs",
    input: "h-9 px-3 py-1 text-xs",
    error: "text-xs",
  },
} as const;

export const FormInput = forwardRef<HTMLInputElement, FormInputProps>(
  function FormInput(
    {
      label,
      error,
      className,
      sizeVariant = "default",
      compact = false,
      id,
      ...props
    },
    ref
  ) {
    const generatedId = React.useId();
    const inputId = id || `form-input-${generatedId}`;
    const errorMessage = typeof error === "string" ? error : error?.message;
    const size = SIZE_CLASSES[compact ? "compact" : sizeVariant];

    return (
      <div className={cn("flex flex-col", size.wrapper)}>
        {label && (
          <label htmlFor={inputId} className={cn(size.label, "text-form-label")}>
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={cn(
            "w-full rounded-md border bg-form-input-background text-form-input-text placeholder:text-form-input-placeholder",
            "focus:border-form-input-border focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 focus:ring-offset-background",
            "disabled:cursor-not-allowed disabled:border-form-input-disabled/20 disabled:bg-form-input-disabled/50 disabled:text-muted",
            errorMessage
              ? "border-form-error"
              : "border-form-input-border",
            size.input,
            className
          )}
          {...props}
        />
        {errorMessage && (
          <span className={cn("text-form-error", size.error)}>
            {errorMessage}
          </span>
        )}
      </div>
    );
  }
);

FormInput.displayName = "FormInput";
