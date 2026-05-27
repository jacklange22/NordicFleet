// Multi-select chip row. Each option has {value, label, sub?}.
// `value` is an array of selected values. Used for picking which
// skis a wax / test log applies to.

export function FormChipMultiselect({
  label,
  options,
  value,
  onChange,
  required,
  emptyMessage = 'No options available',
  className = '',
}) {
  const selected = new Set(value || []);
  const toggle = optValue => {
    if (!onChange) return;
    const next = new Set(selected);
    if (next.has(optValue)) {
      next.delete(optValue);
    } else {
      next.add(optValue);
    }
    onChange([...next]);
  };
  return (
    <div className={className}>
      {label && (
        <span className="block text-xs uppercase tracking-wider text-text-tertiary mb-2">
          {label}
          {required && <span className="text-red ml-1">*</span>}
        </span>
      )}
      {(!options || options.length === 0) ? (
        <p className="text-text-tertiary text-sm italic">{emptyMessage}</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {options.map(opt => {
            const isOn = selected.has(opt.value);
            return (
              <button
                key={opt.value}
                type="button"
                aria-pressed={isOn}
                onClick={() => toggle(opt.value)}
                className={
                  'px-3 py-1.5 rounded-full border text-xs font-semibold tracking-wide transition-colors ' +
                  (isOn
                    ? 'bg-red border-red text-white'
                    : 'bg-transparent border-border-strong text-text-secondary hover:text-white hover:border-white')
                }>
                {opt.label}
                {opt.sub && (
                  <span className="ml-2 text-[10px] opacity-70 font-normal">
                    {opt.sub}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
