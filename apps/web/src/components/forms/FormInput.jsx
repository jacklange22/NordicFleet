// Text input with the iOS-port look: short uppercase label above,
// dark surface, red focus ring, optional suffix slot (e.g. "cm" /
// "kg" / "°C"). The component is uncontrolled-friendly: pass `value`
// + `onChange` to keep it controlled, or skip both for a vanilla
// HTML field.

export function FormInput({
  label,
  id,
  value,
  onChange,
  type = 'text',
  placeholder,
  suffix,
  error,
  disabled,
  required,
  autoComplete,
  autoCapitalize,
  inputMode,
  className = '',
  ...rest
}) {
  const inputId = id || (label ? `field-${label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}` : undefined);
  return (
    <label className={`block ${className}`} htmlFor={inputId}>
      {label && (
        <span className="block text-xs uppercase tracking-wider text-text-tertiary mb-1.5">
          {label}
          {required && <span className="text-red ml-1">*</span>}
        </span>
      )}
      <div
        className={
          'flex items-center bg-bg border rounded-2xl px-4 ' +
          (error
            ? 'border-red/60'
            : 'border-border focus-within:border-red')
        }>
        <input
          id={inputId}
          type={type}
          value={value ?? ''}
          onChange={
            onChange
              ? e =>
                  // Allow either (value) or (event) signatures so callers
                  // can pass setState directly. We standardize on (value).
                  onChange(e.target.value, e)
              : undefined
          }
          placeholder={placeholder}
          disabled={disabled}
          autoComplete={autoComplete}
          autoCapitalize={autoCapitalize}
          inputMode={inputMode}
          className="flex-1 bg-transparent text-white placeholder:text-text-tertiary outline-none py-3 text-sm"
          {...rest}
        />
        {suffix && (
          <span className="text-text-tertiary text-sm ml-2 select-none">
            {suffix}
          </span>
        )}
      </div>
      {error && (
        <span className="block text-red text-xs mt-1.5">{error}</span>
      )}
    </label>
  );
}
