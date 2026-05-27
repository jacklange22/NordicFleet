'use client';

// Overlay + centered card. Click outside to close. ESC to close. The
// child content is responsible for its own actions (Save / Cancel
// buttons, etc.) — Modal only handles the chrome.

import {useEffect} from 'react';

export function Modal({open, onClose, title, children, footer, size = 'md'}) {
  useEffect(() => {
    if (!open) return undefined;
    const handler = e => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose && onClose();
      }
    };
    document.addEventListener('keydown', handler);
    // Prevent body scroll while modal is open.
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handler);
      document.body.style.overflow = prevOverflow;
    };
  }, [open, onClose]);

  if (!open) {
    return null;
  }

  const widths = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/70"
      onClick={onClose}
      role="presentation">
      <div
        className={`w-full ${widths[size] || widths.md} bg-surface border border-border rounded-2xl shadow-2xl`}
        onClick={e => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-label={title || 'Dialog'}>
        {title && (
          <div className="px-6 pt-5 pb-3 border-b border-border">
            <h2 className="text-lg font-bold tracking-tight">{title}</h2>
          </div>
        )}
        <div className="px-6 py-5">{children}</div>
        {footer && (
          <div className="px-6 pb-5 pt-3 border-t border-border flex flex-wrap items-center justify-end gap-3">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
