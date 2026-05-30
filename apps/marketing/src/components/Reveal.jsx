'use client';

import {useEffect, useRef, useState} from 'react';

/**
 * Scroll-reveal wrapper, fades + rises its children into view once, the
 * first time they cross the viewport. Falls back to immediately-visible
 * if IntersectionObserver is unavailable or the user prefers reduced
 * motion (the CSS handles the latter).
 *
 * Props: as (element, default 'div'), delay (ms), className, ...rest
 */
export function Reveal({as: Tag = 'div', delay = 0, className = '', children, ...rest}) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    if (typeof IntersectionObserver === 'undefined') {
      setVisible(true);
      return undefined;
    }
    const obs = new IntersectionObserver(
      entries => {
        entries.forEach(e => {
          if (e.isIntersecting) {
            setVisible(true);
            obs.disconnect();
          }
        });
      },
      {threshold: 0.12, rootMargin: '0px 0px -40px 0px'},
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, []);

  return (
    <Tag
      ref={ref}
      className={`reveal ${visible ? 'is-visible' : ''} ${className}`}
      style={delay ? {transitionDelay: `${delay}ms`} : undefined}
      {...rest}>
      {children}
    </Tag>
  );
}
