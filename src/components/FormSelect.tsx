interface FormSelectOption {
  value: string;
  label: string;
}

interface FormSelectProps
  extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, "options"> {
  label: string;
  error?: string | { message?: string } | any;
  options: FormSelectOption[];
  compact?: boolean;
  placeholder?: string;
  sizeVariant?: "default" | "small" | "compact";
}

export function FormSelect({
  label,
  error,
  options,
  className = "",
  compact = false,
  sizeVariant = "default",
  placeholder = "Select an option",
  ...props
}: FormSelectProps) {
  const errorMessage =
    typeof error === "object" && error !== null ? error.message : error;

  // Determine size-based classes
  const getSizeClasses = () => {
    if (sizeVariant === "small") {
      return {
        select: "h-8 px-2 py-1 text-xs",
        label: "text-xs",
      };
    } else if (sizeVariant === "compact" || compact) {
      return {
        select: "h-9 px-3 py-1 text-sm",
        label: "text-sm",
      };
    } else {
      return {
        select: "h-form-input-height px-form-padding",
        label: "text-form-label",
      };
    }
  };

  const sizeClasses = getSizeClasses();

  return (
    <div
      className={`flex flex-col ${
        compact || sizeVariant !== "default" ? "gap-1" : "gap-2"
      }`}
    >
      <label
        htmlFor={props.id}
        className={`${sizeClasses.label} font-medium text-kuroganeSteel`}
      >
        {label}
      </label>
      <select
        className={`
          ${sizeClasses.select}
          border 
          border-form-input-border 
          rounded-form 
          bg-shiroWhite 
          text-form-input-text 
          focus:border-form-input-focus 
          focus:outline-none 
          focus:ring-2 
          focus:ring-form-input-focus/20 
          transition-form 
          duration-form
          disabled:bg-form-input-disabled/10
          disabled:text-form-input-disabled
          ${errorMessage ? "border-form-error" : ""}
          ${className}
        `}
        {...props}
      >
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {errorMessage && (
        <span
          className={`text-form-error ${
            compact || sizeVariant !== "default" ? "text-xs" : "text-sm"
          }`}
        >
          {errorMessage}
        </span>
      )}
    </div>
  );
}
