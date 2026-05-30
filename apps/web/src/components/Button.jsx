// Primary / secondary / ghost button. Mirrors apps/mobile's Button
// atom - same red, same pill shape at lg/md, same disabled opacity.

const SIZE = {
  lg: 'h-13 px-6 text-base',
  md: 'h-11 px-5 text-sm',
  sm: 'h-9 px-4 text-xs',
};

const VARIANT = {
  primary: 'bg-red text-white hover:bg-red-pressed',
  secondary: 'bg-transparent border border-border-strong text-white hover:bg-surface',
  ghost: 'bg-transparent text-text-secondary hover:text-white',
  danger: 'bg-red text-white hover:bg-red-pressed',
};

export function Button({
  variant = 'primary',
  size = 'md',
  fullWidth,
  disabled,
  loading,
  className = '',
  children,
  ...rest
}) {
  const cls = [
    'inline-flex items-center justify-center gap-2 rounded-full font-semibold transition-colors',
    SIZE[size],
    VARIANT[variant],
    fullWidth && 'w-full',
    (disabled || loading) && 'opacity-50 cursor-not-allowed',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <button className={cls} disabled={disabled || loading} {...rest}>
      {loading ? '…' : children}
    </button>
  );
}
