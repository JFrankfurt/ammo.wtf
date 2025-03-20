import React from "react";

type ChipType = "category" | "caliber" | "weight" | "manufacturer" | "symbol";

interface TokenPropertyChipProps {
  type: ChipType;
  value: string | number;
  className?: string;
}

/**
 * A chip component for displaying token properties with consistent styling
 * Uses different colors based on property type
 */
export const TokenPropertyChip: React.FC<TokenPropertyChipProps> = ({
  type,
  value,
  className = "",
}) => {
  if (!value) return null;

  // Base classes for all chips
  const baseClasses = "px-2 py-0.5 rounded-full text-xs font-medium";

  // Determine style based on type
  let typeClasses = "";
  let displayValue = value;

  switch (type) {
    case "category":
      typeClasses = "bg-gray-100 text-gray-700";
      break;
    case "caliber":
      typeClasses = "bg-blue-50 text-blue-700";
      break;
    case "weight":
      typeClasses = "bg-amber-50 text-amber-700";
      displayValue = `${value} gr`;
      break;
    case "manufacturer":
      typeClasses = "bg-green-50 text-green-700";
      break;
    case "symbol":
      typeClasses = "bg-purple-50 text-purple-700";
      break;
    default:
      typeClasses = "bg-gray-100 text-gray-600";
  }

  return (
    <span className={`${baseClasses} ${typeClasses} ${className}`}>
      {displayValue}
    </span>
  );
};
