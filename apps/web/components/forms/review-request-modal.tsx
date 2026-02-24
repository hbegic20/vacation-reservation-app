'use client';

import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';
import { Button } from '../ui/button';
import { ModerateRequestForm } from './moderate-request-form';

interface ReviewRequestModalProps {
  requestId: string;
  title: string;
  subtitle: string;
}

export function ReviewRequestModal({ requestId, title, subtitle }: ReviewRequestModalProps) {
  const [open, setOpen] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open || !panelRef.current) {
      return;
    }

    gsap.fromTo(
      panelRef.current,
      { y: 14, opacity: 0, scale: 0.98 },
      { y: 0, opacity: 1, scale: 1, duration: 0.25, ease: 'power2.out' }
    );
  }, [open]);

  return (
    <>
      <Button type="button" variant="secondary" onClick={() => setOpen(true)}>
        Review Request
      </Button>
      {open ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4" onClick={() => setOpen(false)}>
          <div
            ref={panelRef}
            className="w-full max-w-lg rounded-2xl border border-border bg-card p-5 shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="mb-4 flex items-start justify-between gap-4">
              <div>
                <h3 className="text-lg font-semibold">{title}</h3>
                <p className="text-sm text-muted-foreground">{subtitle}</p>
              </div>
              <Button type="button" variant="ghost" onClick={() => setOpen(false)}>
                Close
              </Button>
            </div>
            <ModerateRequestForm requestId={requestId} />
          </div>
        </div>
      ) : null}
    </>
  );
}
