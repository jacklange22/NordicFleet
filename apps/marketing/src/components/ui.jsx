// Small presentational primitives shared across marketing pages.

export function Container({className = '', children}) {
  return (
    <div className={`max-w-6xl mx-auto px-6 ${className}`}>{children}</div>
  );
}

export function Eyebrow({children, color = 'red'}) {
  const cls = color === 'waxtruck' ? 'text-waxtruck' : 'text-red';
  return (
    <span
      className={`inline-block text-xs font-semibold uppercase tracking-[0.18em] ${cls}`}>
      {children}
    </span>
  );
}

export function FeatureCard({icon, title, children}) {
  return (
    <div className="rounded-2xl border border-border bg-surface p-6 h-full">
      {icon && (
        <div className="w-11 h-11 rounded-xl bg-surface-elevated border border-border flex items-center justify-center text-xl mb-4">
          {icon}
        </div>
      )}
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-text-secondary text-sm leading-relaxed">{children}</p>
    </div>
  );
}

export function Stat({value, label}) {
  return (
    <div>
      <div className="text-3xl font-bold tracking-tight tabular-nums">
        {value}
      </div>
      <div className="text-text-tertiary text-sm mt-1">{label}</div>
    </div>
  );
}

// A legal-page shell: max-prose width, readable line height, section
// styling that keeps headings scannable.
export function LegalLayout({title, updated, children}) {
  return (
    <Container className="py-16 sm:py-20">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-4xl font-bold tracking-tight">{title}</h1>
        {updated && (
          <p className="text-text-tertiary text-sm mt-3">
            Last updated {updated}
          </p>
        )}
        <div className="mt-10 space-y-8 legal-body">{children}</div>
      </div>
    </Container>
  );
}

export function LegalSection({heading, children}) {
  return (
    <section>
      <h2 className="text-xl font-semibold mb-3">{heading}</h2>
      <div className="space-y-3 text-text-secondary leading-relaxed">
        {children}
      </div>
    </section>
  );
}
