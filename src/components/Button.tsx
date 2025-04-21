import { ButtonHTMLAttributes, forwardRef } from "react";
import { cn } from "../utils/cn";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "destructive";
  fullWidth?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { className, variant = "primary", fullWidth = false, disabled, ...props },
    ref
  ) => {
    const textColor = disabled
      ? "text-muted"
      : variant === "primary"
      ? "text-background"
      : "text-foreground";

    return (
      <button
        ref={ref}
        disabled={disabled}
        className={cn(
          "px-3 py-1",
          "text-xs",
          "transition-colors",
          "duration-100",
          "rounded-none",
          "border",
          "border-border",
          "focus:outline-none",
          "focus:ring-2",
          "focus:ring-ring",
          "focus:ring-offset-2",
          "focus:ring-offset-background",
          "disabled:cursor-not-allowed",
          "disabled:bg-muted/50",
          "disabled:text-muted",
          "disabled:border-transparent",
          !disabled && [
            variant === "primary" && [
              "bg-primary",
              textColor,
              "border-primary",
              "hover:bg-primary/90",
              "active:bg-primary/80",
            ],
            variant === "secondary" && [
              "bg-secondary",
              textColor,
              "border-secondary",
              "hover:bg-secondary/90",
              "active:bg-secondary/80",
            ],
            variant === "destructive" && [
              "bg-destructive",
              textColor,
              "border-destructive",
              "hover:bg-destructive/90",
              "active:bg-destructive/80",
            ],
          ],
          !disabled && ["active:transform", "active:scale-[0.99]"],
          fullWidth && "w-full",
          className
        )}
        {...props}
      />
    );
  }
);

Button.displayName = "Button";
