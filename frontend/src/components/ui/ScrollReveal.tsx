import type { CSSProperties, PropsWithChildren } from 'react';
import { useEffect, useRef, useState } from 'react';

type ScrollRevealProps = PropsWithChildren<{
  className?: string;
  delay?: number;
  from?: 'up' | 'start' | 'end' | 'scale';
}>;

export function ScrollReveal({
  children,
  className = '',
  delay = 0,
  from = 'up',
}: ScrollRevealProps) {
  const elementRef = useRef<HTMLDivElement | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const element = elementRef.current;
    if (!element) return;

    if (
      window.matchMedia('(prefers-reduced-motion: reduce)').matches ||
      !('IntersectionObserver' in window)
    ) {
      setVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        setVisible(true);
        observer.disconnect();
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.12 },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      className={`scroll-reveal scroll-reveal--${from} ${visible ? 'is-visible' : ''} ${className}`}
      ref={elementRef}
      style={{ '--reveal-delay': `${delay}ms` } as CSSProperties}
    >
      {children}
    </div>
  );
}
