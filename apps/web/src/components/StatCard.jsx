// Big-number-and-label stat tile — Whoop-style. Mirror of the mobile
// StatCard atom.

export function StatCard({value, label, accent}) {
  const valueColor = accent === 'red' ? 'text-red' : 'text-white';
  return (
    <div className="bg-surface border border-border rounded-2xl p-5 min-h-[96px] flex flex-col justify-center">
      <span
        className={`tabular-nums text-3xl font-bold leading-none mb-2 ${valueColor}`}>
        {value}
      </span>
      <span className="text-xs uppercase tracking-wider text-text-tertiary font-medium">
        {label}
      </span>
    </div>
  );
}
