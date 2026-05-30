'use client';

import {useEffect, useState} from 'react';
import Link from 'next/link';
import {usePathname} from 'next/navigation';
import {APP_URL} from '@/lib/urls';

const LINKS = [
  {href: '/features', label: 'Features'},
  {href: '/coaches', label: 'For coaches'},
  {href: '/pricing', label: 'Pricing'},
  {href: '/about', label: 'About'},
];

export function Nav() {
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, {passive: true});
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Close the mobile menu on route change.
  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  return (
    <header
      className={
        'sticky top-0 z-50 transition-colors ' +
        (scrolled
          ? 'bg-bg/80 backdrop-blur border-b border-border'
          : 'bg-transparent border-b border-transparent')
      }>
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <Wordmark />
        </Link>

        <nav className="hidden md:flex items-center gap-8">
          {LINKS.map(l => (
            <Link
              key={l.href}
              href={l.href}
              className={
                'text-sm transition-colors ' +
                (pathname === l.href
                  ? 'text-white font-medium'
                  : 'text-text-secondary hover:text-white')
              }>
              {l.label}
            </Link>
          ))}
        </nav>

        <div className="hidden md:flex items-center gap-4">
          <a
            href={APP_URL}
            className="text-sm text-text-secondary hover:text-white transition-colors">
            Sign in
          </a>
          <a
            href={APP_URL}
            className="inline-flex items-center h-9 px-4 rounded-full bg-red text-white text-sm font-semibold hover:bg-red-pressed transition-colors">
            Open the app
          </a>
        </div>

        <button
          type="button"
          aria-label="Toggle menu"
          aria-expanded={open}
          onClick={() => setOpen(v => !v)}
          className="md:hidden w-10 h-10 -mr-2 inline-flex items-center justify-center text-white">
          <span className="text-xl">{open ? '✕' : '☰'}</span>
        </button>
      </div>

      {open && (
        <div className="md:hidden border-t border-border bg-bg/95 backdrop-blur">
          <nav className="max-w-6xl mx-auto px-6 py-4 flex flex-col gap-3">
            {LINKS.map(l => (
              <Link
                key={l.href}
                href={l.href}
                className="text-text-secondary hover:text-white py-1">
                {l.label}
              </Link>
            ))}
            <a
              href={APP_URL}
              className="mt-2 inline-flex items-center justify-center h-10 px-4 rounded-full bg-red text-white text-sm font-semibold">
              Open the app
            </a>
          </nav>
        </div>
      )}
    </header>
  );
}

export function Wordmark() {
  return (
    <span className="inline-flex items-center gap-2">
      <span
        aria-hidden
        className="w-6 h-6 rounded-md bg-gradient-to-br from-red to-waxtruck"
      />
      <span className="text-lg font-bold tracking-tight">NordicFleet</span>
    </span>
  );
}
