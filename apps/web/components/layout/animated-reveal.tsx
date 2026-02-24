'use client';

import { ReactNode, useLayoutEffect, useRef } from 'react';
import gsap from 'gsap';

export function AnimatedReveal({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (!ref.current) {
      return;
    }

    gsap.fromTo(
      ref.current,
      { y: 10, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.35, ease: 'power2.out' }
    );
  }, []);

  return <div ref={ref}>{children}</div>;
}
