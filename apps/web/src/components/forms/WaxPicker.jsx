'use client';

// Typeahead picker over WAX_DICTIONARY from @nordicfleet/core.
// - Free-text fallback: if the user types and submits a value that
//   doesn't match an entry, the value is stored as the bare string
//   and waxId is null. The wax log validator is happy with both.
// - Mirrors mobile WaxPicker — same dictionary, same fallback.

import {useEffect, useMemo, useRef, useState} from 'react';
import {searchWaxes} from '@nordicfleet/core';

const MAX_SUGGESTIONS = 8;

export function WaxPicker({
  label,
  value,
  waxId,
  onChange,
  placeholder = 'Type to search — e.g. VR40 or Marathon Yellow',
  type, // optional filter passed to searchWaxes (e.g. 'glide' / 'kick')
  category, // optional category filter (kick/paraffin/topcoat/structure)
  disabled,
  className = '',
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState(value || '');
  const containerRef = useRef(null);

  // Keep local input synced when the parent updates value externally
  // (e.g. after a setState that resets the form).
  useEffect(() => {
    setQuery(value || '');
  }, [value]);

  // Click-outside to close the suggestion list.
  useEffect(() => {
    if (!open) return undefined;
    const handler = e => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  const suggestions = useMemo(() => {
    return category
      ? searchWaxes(query, {category, limit: MAX_SUGGESTIONS})
      : searchWaxes(query, {type, limit: MAX_SUGGESTIONS});
  }, [query, type, category]);

  const handlePick = wax => {
    setQuery(wax.fullName);
    setOpen(false);
    if (onChange) {
      onChange({value: wax.fullName, waxId: wax.id});
    }
  };

  const handleChange = next => {
    setQuery(next);
    setOpen(true);
    if (onChange) {
      // Plain text → no waxId (free-form entry).
      onChange({value: next, waxId: null});
    }
  };

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      {label && (
        <span className="block text-xs uppercase tracking-wider text-text-tertiary mb-1.5">
          {label}
        </span>
      )}
      <input
        type="text"
        value={query}
        onChange={e => handleChange(e.target.value)}
        onFocus={() => setOpen(true)}
        placeholder={placeholder}
        disabled={disabled}
        autoComplete="off"
        spellCheck={false}
        className="w-full bg-bg border border-border rounded-2xl px-4 py-3 text-white text-sm placeholder:text-text-tertiary focus:border-red outline-none"
      />
      {waxId && !open && (
        <span className="absolute right-3 top-9 text-success text-xs select-none">
          ✓
        </span>
      )}
      {open && suggestions.length > 0 && (
        <ul className="absolute z-20 mt-1 w-full bg-surface-elevated border border-border rounded-2xl shadow-xl max-h-72 overflow-auto">
          {suggestions.map(wax => (
            <li key={wax.id}>
              <button
                type="button"
                onClick={() => handlePick(wax)}
                className="w-full text-left px-4 py-2.5 hover:bg-bg flex items-baseline gap-3 border-b border-border last:border-b-0">
                <div className="flex-1 min-w-0">
                  <div className="text-white text-sm font-medium truncate">
                    {wax.fullName}
                  </div>
                  {wax.tempRange && (
                    <div className="text-text-tertiary text-[11px] mt-0.5">
                      {wax.tempRange.min !== null
                        ? `${wax.tempRange.min}°`
                        : '—'}
                      {' to '}
                      {wax.tempRange.max !== null
                        ? `${wax.tempRange.max}°`
                        : '—'}
                    </div>
                  )}
                </div>
                <span className="text-text-tertiary text-[10px] uppercase tracking-wider">
                  {wax.type}
                </span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
