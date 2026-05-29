import Link from 'next/link';
import {Wordmark} from './Nav';

const COLUMNS = [
  {
    title: 'Product',
    links: [
      {href: '/features', label: 'Features'},
      {href: '/coaches', label: 'For coaches'},
      {href: '/pricing', label: 'Pricing'},
    ],
  },
  {
    title: 'Company',
    links: [
      {href: '/about', label: 'About'},
      {href: '/privacy', label: 'Privacy'},
      {href: '/terms', label: 'Terms'},
    ],
  },
];

export function Footer() {
  const year = new Date().getFullYear();
  return (
    <footer className="border-t border-border mt-24">
      <div className="max-w-6xl mx-auto px-6 py-12 grid gap-10 sm:grid-cols-2 md:grid-cols-4">
        <div className="md:col-span-2">
          <Wordmark />
          <p className="text-text-secondary text-sm mt-4 max-w-xs leading-relaxed">
            The ski-and-wax logbook for nordic racers and coaches. Built by
            skiers who got tired of losing their wax notes.
          </p>
        </div>
        {COLUMNS.map(col => (
          <div key={col.title}>
            <h3 className="text-xs uppercase tracking-wider text-text-tertiary mb-3">
              {col.title}
            </h3>
            <ul className="space-y-2">
              {col.links.map(l => (
                <li key={l.href}>
                  <Link
                    href={l.href}
                    className="text-sm text-text-secondary hover:text-white transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-border">
        <div className="max-w-6xl mx-auto px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-text-tertiary text-xs">
            © {year} NordicFleet. All rights reserved.
          </p>
          <p className="text-text-tertiary text-xs">
            Made for cold mornings and fast skis.
          </p>
        </div>
      </div>
    </footer>
  );
}
