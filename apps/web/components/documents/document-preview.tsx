import Image from 'next/image';
import { DocumentItem } from '@vacation/shared';
import { documentFileHref, documentKind } from '@/lib/documents';

export function DocumentPreview({ document }: { document: DocumentItem }) {
  const kind = documentKind(document);

  if (kind === 'image') {
    return (
      <div className="relative h-56 overflow-hidden rounded-xl border border-border bg-muted">
        <Image
          src={documentFileHref(document.id)}
          alt={document.title}
          fill
          unoptimized
          sizes="(min-width: 768px) 600px, 100vw"
          className="object-contain"
        />
      </div>
    );
  }

  if (kind === 'pdf') {
    return (
      <details className="group rounded-xl border border-border">
        <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between px-4 text-sm font-semibold [&::-webkit-details-marker]:hidden">
          <span className="group-open:hidden">Show preview</span>
          <span className="hidden group-open:inline">Hide preview</span>
          <span aria-hidden="true" className="text-muted-foreground transition-transform group-open:rotate-180">
            ▾
          </span>
        </summary>
        <iframe
          src={documentFileHref(document.id)}
          title={`Preview of ${document.title}`}
          loading="lazy"
          className="h-[32rem] w-full rounded-b-xl border-t border-border bg-white"
        />
      </details>
    );
  }

  return (
    <p className="rounded-xl bg-muted px-4 py-3 text-sm text-muted-foreground">
      Word and Excel files can’t be previewed in the browser. Download to open them.
    </p>
  );
}
