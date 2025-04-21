import React from "react";

type ChipType = "category" | "caliber" | "weight" | "manufacturer" | "symbol";

interface TokenPropertyChipProps {
  type: ChipType;
  value: string | number;
  className?: string;
}

/**
 * A chip component for displaying token properties with consistent styling
 * Uses different colors based on property type - Refactored for hacker vibe (muted, mono)
 */
export const TokenPropertyChip: React.FC<TokenPropertyChipProps> = ({
  type,
  value,
  className = "",
}) => {
  if (!value) return null;

  // Base classes for all chips - Use font-mono for technical feel
  const baseClasses = "px-2 py-0.5 rounded-full text-xs font-mono";

  // Determine style based on type
  // Use a consistent muted style instead of type-specific colors
  const typeClasses = "bg-muted/20 text-muted";
  let displayValue = value;

  // Append 'gr' for weight, if applicable
  if (type === "weight") {
    displayValue = `${value} gr`;
  }
  // Styling is now consistent and defined above.
  // const typeClasses = "bg-muted/20 text-muted";

  // // switch (type) { ... } // Old color logic removed

  return (
    <span className={`${baseClasses} ${typeClasses} ${className}`}>
      {displayValue}
    </span>
  );
};
