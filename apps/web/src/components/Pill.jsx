// Pill / tag / chip - variants mirror the mobile Pill atom.

const VARIANT = {
  solid: 'bg-red text-white border-red',
  outline: 'bg-transparent text-white border-border-strong',
  ghost: 'bg-white/5 text-text-secondary border-transparent',
};

export function Pill({variant = 'ghost', children, className = ''}) {
  return (
    <span
      className={`inline-flex items-center px-3 py-1 rounded-full border text-xs font-semibold tracking-wide ${VARIANT[variant]} ${className}`}>
      {children}
    </span>
  );
}
