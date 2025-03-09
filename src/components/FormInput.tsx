interface FormInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string | { message?: string } | any;
  compact?: boolean;
}

export function FormInput({
  label,
  error,
  className = "",
  compact = false,
  ...props
}: FormInputProps) {
  const errorMessage =
    typeof error === "object" && error !== null ? error.message : error;

  return (
    <div className={`flex flex-col ${compact ? "gap-1" : "gap-2"}`}>
      <label
        htmlFor={props.id}
        className={`${
          compact ? "text-sm" : "text-form-label"
        } font-medium text-kuroganeSteel`}
      >
        {label}
      </label>
      <input
        className={`
          ${compact ? "h-9" : "h-form-input-height"} 
          ${compact ? "px-3 py-1 text-sm" : "px-form-padding"} 
          border 
          border-form-input-border 
          rounded-form 
          bg-shiroWhite 
          text-form-input-text 
          placeholder:text-form-input-placeholder
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
      />
      {errorMessage && (
        <span className={`text-form-error ${compact ? "text-xs" : "text-sm"}`}>
          {errorMessage}
        </span>
      )}
    </div>
  );
}
