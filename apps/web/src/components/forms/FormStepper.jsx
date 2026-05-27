// + / − counter with a centered number. Used for "kick layers" and
// "glide layers" on the wax log form. Min and max clamp the value.

export function FormStepper({
  label,
  value = 0,
  onChange,
  min = 0,
  max = 99,
  className = '',
}) {
  const clamp = n => Math.max(min, Math.min(max, n));
  const dec = () => onChange && onChange(clamp((value || 0) - 1));
  const inc = () => onChange && onChange(clamp((value || 0) + 1));
  return (
    <div className={className}>
      {label && (
        <span className="block text-xs uppercase tracking-wider text-text-tertiary mb-2">
          {label}
        </span>
      )}
      <div className="inline-flex items-center bg-bg border border-border rounded-2xl overflow-hidden">
        <button
          type="button"
          onClick={dec}
          disabled={value <= min}
          aria-label="Decrease"
          className="w-10 h-10 text-text-secondary hover:text-white disabled:text-text-tertiary disabled:opacity-40">
          −
        </button>
        <span className="w-12 text-center text-white text-base tabular-nums select-none">
          {value}
        </span>
        <button
          type="button"
          onClick={inc}
          disabled={value >= max}
          aria-label="Increase"
          className="w-10 h-10 text-text-secondary hover:text-white disabled:text-text-tertiary disabled:opacity-40">
          +
        </button>
      </div>
    </div>
  );
}
