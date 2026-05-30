'use client';

// Minimal toast system.
//   - ToastProvider wraps the app.
//   - useToast() returns { success, error, info } that take a string
//     or {title, body, duration}. Returns the toast id.
//   - Toasts stack top-right and auto-dismiss after ~2.4s.
//
// Mirrors the iOS app's Toast.show({type, text1, text2}) API in
// spirit - different shape, same affordances.

import {createContext, useCallback, useContext, useEffect, useRef, useState} from 'react';

const ToastContext = createContext(null);

const DEFAULT_DURATION = 2400;

export function ToastProvider({children}) {
  const [toasts, setToasts] = useState([]);
  const idRef = useRef(0);

  const dismiss = useCallback(id => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  const push = useCallback(
    (type, input) => {
      const id = idRef.current + 1;
      idRef.current = id;
      const config =
        typeof input === 'string' ? {title: input} : input || {};
      const toast = {
        id,
        type,
        title: config.title || '',
        body: config.body || '',
        duration: config.duration ?? DEFAULT_DURATION,
      };
      setToasts(prev => [...prev, toast]);
      if (toast.duration > 0) {
        setTimeout(() => dismiss(id), toast.duration);
      }
      return id;
    },
    [dismiss],
  );

  const api = {
    success: input => push('success', input),
    error: input => push('error', input),
    info: input => push('info', input),
    dismiss,
  };

  return (
    <ToastContext.Provider value={api}>
      {children}
      <ToastViewport toasts={toasts} onDismiss={dismiss} />
    </ToastContext.Provider>
  );
}

function ToastViewport({toasts, onDismiss}) {
  if (toasts.length === 0) {
    return null;
  }
  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 max-w-sm w-full pointer-events-none">
      {toasts.map(t => (
        <ToastItem key={t.id} toast={t} onDismiss={() => onDismiss(t.id)} />
      ))}
    </div>
  );
}

function ToastItem({toast, onDismiss}) {
  const [entered, setEntered] = useState(false);
  useEffect(() => {
    requestAnimationFrame(() => setEntered(true));
  }, []);
  const tone =
    toast.type === 'success'
      ? 'border-success/40 bg-success/10'
      : toast.type === 'error'
        ? 'border-red/40 bg-red/10'
        : 'border-border bg-surface';
  return (
    <div
      role="status"
      onClick={onDismiss}
      className={
        'pointer-events-auto cursor-pointer border rounded-2xl px-4 py-3 shadow-xl backdrop-blur-md ' +
        tone +
        ' transition-all duration-200 ' +
        (entered ? 'translate-x-0 opacity-100' : 'translate-x-4 opacity-0')
      }>
      <div className="flex items-start gap-3">
        <span
          className={
            'w-2 h-2 rounded-full mt-2 flex-shrink-0 ' +
            (toast.type === 'success'
              ? 'bg-success'
              : toast.type === 'error'
                ? 'bg-red'
                : 'bg-text-secondary')
          }
        />
        <div className="flex-1 min-w-0">
          {toast.title && (
            <p className="text-white text-sm font-semibold leading-snug">
              {toast.title}
            </p>
          )}
          {toast.body && (
            <p className="text-text-secondary text-xs mt-0.5 leading-snug">
              {toast.body}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) {
    // Defensive fallback: log to console + no-op. Prevents pages from
    // crashing during dev if the Provider is missing.
    return {
      success: msg => console.log('[toast.success]', msg),
      error: msg => console.error('[toast.error]', msg),
      info: msg => console.log('[toast.info]', msg),
      dismiss: () => {},
    };
  }
  return ctx;
}
