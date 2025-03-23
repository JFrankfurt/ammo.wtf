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
          "transition-all",
          "duration-200",
          "rounded-md",
          "disabled:cursor-not-allowed",
          "disabled:bg-ashiStone",
          "disabled:text-shiroWhite",
          "disabled:opacity-50",
          "disabled:border-none",
          "focus:outline-none",
          "focus:ring-2",
          "focus:ring-opacity-50",

          // Variant-specific styles
          variant === "primary" && [
            "bg-sumiBlack",
            "text-shiroWhite",
            "hover:bg-kuroganeSteel",
            "active:bg-sumiBlack",
            "active:transform",
            "active:scale-[0.98]",
            "shadow-sm",
            "hover:shadow-md",
          ],

          variant === "secondary" && [
            "bg-shiroWhite",
            "text-sumiBlack",
            "border",
            "border-sumiBlack",
            "hover:bg-washiBeige",
            "active:bg-kumoGray",
            "active:transform",
            "active:scale-[0.98]",
            "shadow-sm",
            "hover:shadow-md",
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
