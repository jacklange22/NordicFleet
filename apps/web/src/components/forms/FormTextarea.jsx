// Multiline variant of FormInput. Same visual frame, taller body.

export function FormTextarea({
  label,
  id,
  value,
  onChange,
  placeholder,
  rows = 4,
  error,
  disabled,
  required,
  className = '',
}) {
  const inputId =
    id ||
    (label
      ? `area-${label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`
      : undefined);
  return (
    <label className={`block ${className}`} htmlFor={inputId}>
      {label && (
        <span className="block text-xs uppercase tracking-wider text-text-tertiary mb-1.5">
          {label}
          {required && <span className="text-red ml-1">*</span>}
        </span>
      )}
      <textarea
        id={inputId}
        value={value ?? ''}
        onChange={onChange ? e => onChange(e.target.value, e) : undefined}
        placeholder={placeholder}
        disabled={disabled}
        rows={rows}
        className={
          'w-full bg-bg border rounded-2xl px-4 py-3 text-white text-sm ' +
          'placeholder:text-text-tertiary outline-none resize-y leading-relaxed ' +
          (error ? 'border-red/60' : 'border-border focus:border-red')
        }
      />
      {error && (
        <span className="block text-red text-xs mt-1.5">{error}</span>
      )}
    </label>
  );
}
