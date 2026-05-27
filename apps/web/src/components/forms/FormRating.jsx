// 1-10 rating picker rendered as a row of numbered pills. Used on
// the test-log form for glide / kick / stability / climbing ratings.

export function FormRating({
  label,
  value,
  onChange,
  min = 1,
  max = 10,
  className = '',
}) {
  const nums = [];
  for (let n = min; n <= max; n += 1) {
    nums.push(n);
  }
  return (
    <div className={className}>
      {label && (
        <span className="block text-xs uppercase tracking-wider text-text-tertiary mb-2">
          {label}
        </span>
      )}
      <div className="flex flex-wrap gap-1.5" role="radiogroup">
        {nums.map(n => {
          const selected = value === n;
          return (
            <button
              key={n}
              type="button"
              role="radio"
              aria-checked={selected}
              aria-label={`${n}`}
              onClick={() => onChange && onChange(selected ? null : n)}
              className={
                'w-9 h-9 rounded-full border text-sm font-semibold tabular-nums transition-colors ' +
                (selected
                  ? 'bg-red border-red text-white'
                  : 'bg-transparent border-border-strong text-text-secondary hover:text-white hover:border-white')
              }>
              {n}
            </button>
          );
        })}
      </div>
    </div>
  );
}
