// Native <select> wrapped in the same dark frame as FormInput.
// Options is either [{value, label}] or [string, ...] (which gets
// expanded automatically).

export function FormSelect({
  label,
  id,
  value,
  onChange,
  options,
  placeholder,
  error,
  disabled,
  required,
  className = '',
}) {
  const inputId =
    id ||
    (label
      ? `select-${label.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`
      : undefined);
  const normalized = (options || []).map(opt =>
    typeof opt === 'string' ? {value: opt, label: opt} : opt,
  );
  return (
    <label className={`block ${className}`} htmlFor={inputId}>
      {label && (
        <span className="block text-xs uppercase tracking-wider text-text-tertiary mb-1.5">
          {label}
          {required && <span className="text-red ml-1">*</span>}
        </span>
      )}
      <select
        id={inputId}
        value={value ?? ''}
        onChange={onChange ? e => onChange(e.target.value, e) : undefined}
        disabled={disabled}
        className={
          'w-full bg-bg border rounded-2xl px-4 py-3 text-white text-sm ' +
          'outline-none appearance-none ' +
          (error ? 'border-red/60' : 'border-border focus:border-red')
        }>
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {normalized.map(opt => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && (
        <span className="block text-red text-xs mt-1.5">{error}</span>
      )}
    </label>
  );
}
