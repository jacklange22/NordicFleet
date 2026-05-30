// Single-select horizontal pill row. Mirrors the mobile ChipGroup
// behaviour: tap a pill to toggle the selection on / tap again to
// clear. Use it for enum-style fields - technique, snow type, binder.

export function FormPillSelector({
  label,
  options,
  value,
  onChange,
  required,
  className = '',
}) {
  const normalized = (options || []).map(opt =>
    typeof opt === 'string' ? {value: opt, label: opt} : opt,
  );
  return (
    <div className={className}>
      {label && (
        <span className="block text-xs uppercase tracking-wider text-text-tertiary mb-2">
          {label}
          {required && <span className="text-red ml-1">*</span>}
        </span>
      )}
      <div className="flex flex-wrap gap-2" role="radiogroup">
        {normalized.map(opt => {
          const selected =
            value && value.toString().toLowerCase() === opt.value.toString().toLowerCase();
          return (
            <button
              key={opt.value}
              type="button"
              role="radio"
              aria-checked={selected}
              onClick={() =>
                onChange && onChange(selected ? '' : opt.value)
              }
              className={
                'px-3 py-1.5 rounded-full border text-xs font-semibold tracking-wide transition-colors ' +
                (selected
                  ? 'bg-red border-red text-white'
                  : 'bg-transparent border-border-strong text-text-secondary hover:text-white hover:border-white')
              }>
              {opt.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
