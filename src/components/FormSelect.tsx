interface FormSelectOption {
  value: string;
  label: string;
}

interface FormSelectProps
  extends Omit<React.SelectHTMLAttributes<HTMLSelectElement>, "options"> {
  label: string;
  error?: string;
  options: FormSelectOption[];
}

export function FormSelect({
  label,
  error,
  options,
  className = "",
  ...props
}: FormSelectProps) {
  return (
    <div className="flex flex-col gap-2">
      <label
        htmlFor={props.id}
        className="text-form-label font-medium text-kuroganeSteel"
      >
        {label}
      </label>
      <select
        className={`
          h-form-input-height 
          px-form-padding 
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
          ${error ? "border-form-error" : ""}
          ${className}
        `}
        {...props}
      >
        <option value="">Select a token</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && <span className="text-form-error text-sm">{error}</span>}
    </div>
  );
}
