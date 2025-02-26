import { ButtonHTMLAttributes, forwardRef } from "react";
import { cn } from "../utils/cn";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary";
  fullWidth?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = "primary", fullWidth = false, ...props }, ref) => {
    return (
      <button
        ref={ref}
        className={cn(
          // Base styles
          "px-4 py-2",
          "font-medium",
          "transition-form",
          "duration-form",
          "disabled:cursor-not-allowed",
          "disabled:bg-ashiStone",
          "disabled:text-shiroWhite",
          "disabled:opacity-50",
          "disabled:border-none",

          // Variant-specific styles
          variant === "primary" && [
            "bg-sumiBlack",
            "text-shiroWhite",
            "hover:bg-kuroganeSteel",
            "active:bg-sumiBlack",
            "shadow-form",
          ],

          variant === "secondary" && [
            "bg-shiroWhite",
            "text-sumiBlack",
            "border",
            "border-sumiBlack",
            "hover:bg-washiBeige",
            "active:bg-kumoGray",
            "shadow-form",
          ],

          // Full width option
          fullWidth && "w-full",

          className
        )}
        {...props}
      />
    );
  }
);

Button.displayName = "Button";
