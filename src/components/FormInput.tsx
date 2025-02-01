interface FormInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

export function FormInput({
  label,
  error,
  className = "",
  ...props
}: FormInputProps) {
  return (
    <div className="flex flex-col gap-2">
      <label
        htmlFor={props.id}
        className="text-form-label font-medium text-kuroganeSteel"
      >
        {label}
      </label>
      <input
        className={`
          h-form-input-height 
          px-form-padding 
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
          ${error ? "border-form-error" : ""}
          ${className}
        `}
        {...props}
      />
      {error && <span className="text-form-error text-sm">{error}</span>}
    </div>
  );
}
