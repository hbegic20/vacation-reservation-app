import type { Metadata } from 'next';
import Link from 'next/link';
import { DocumentAdminActions } from '@/components/documents/document-admin-actions';
import { DocumentMeta } from '@/components/documents/document-meta';
import { DocumentPreview } from '@/components/documents/document-preview';
import { UploadDocumentForm } from '@/components/documents/upload-document-form';
import { PageHeader } from '@/components/layout/page-header';
import { PageShell } from '@/components/layout/page-shell';
import { buttonStyles } from '@/components/ui/button';
import { fetchDocuments } from '@/lib/api';
import { requireAdmin, requireToken } from '@/lib/auth';
import { formatDate } from '@/lib/dates';
import { documentFileHref, documentKind } from '@/lib/documents';
import { plural } from '@/lib/people';
import { cn } from '@/lib/utils';

export const metadata: Metadata = { title: 'Documents' };

export default async function AdminDocumentsPage() {
  const user = await requireAdmin();
  const token = requireToken();
  const documents = await fetchDocuments(token);
  const publishedCount = documents.filter((document) => document.isPublished).length;

  return (
    <PageShell user={user}>
      <PageHeader
        title="Documents"
        description={`${plural(documents.length, 'document')} · ${publishedCount} visible to employees`}
      />
      <div className="flex flex-wrap items-start gap-5">
        <section aria-label="All documents" className="flex min-w-0 flex-[999_1_520px] flex-col gap-4">
          {documents.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-input bg-card px-6 py-12 text-center">
              <p className="font-display text-xl font-semibold">No documents yet</p>
              <p className="mt-1 text-muted-foreground">Upload a policy, handbook or form to share it with employees.</p>
            </div>
          ) : (
            documents.map((document) => (
              <article key={document.id} className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h2 className="font-display text-lg font-semibold">{document.title}</h2>
                    <DocumentMeta document={document} showUploader />
                  </div>
                  <span
                    className={cn(
                      'inline-flex shrink-0 rounded-full px-3 py-1 text-[13px] font-semibold',
                      document.isPublished ? 'bg-success-soft text-success' : 'bg-muted text-muted-foreground'
                    )}
                  >
                    {document.isPublished && document.publishedAt
                      ? `Published ${formatDate(document.publishedAt)}`
                      : 'Draft, only admins see it'}
                  </span>
                </div>
                {document.description ? <p className="text-sm">{document.description}</p> : null}
                <DocumentPreview document={document} />
                <div className="flex flex-wrap items-start justify-between gap-3 border-t border-border pt-4">
                  <div className="flex flex-wrap gap-2">
                    {documentKind(document) === 'word' || documentKind(document) === 'excel' ? null : (
                      <a
                        href={documentFileHref(document.id)}
                        target="_blank"
                        rel="noopener"
                        className={buttonStyles('secondary')}
                      >
                        Open in new tab
                      </a>
                    )}
                    <a href={documentFileHref(document.id, true)} className={buttonStyles('secondary')}>
                      Download
                    </a>
                  </div>
                  <DocumentAdminActions
                    documentId={document.id}
                    title={document.title}
                    isPublished={document.isPublished}
                  />
                </div>
              </article>
            ))
          )}
        </section>
        <section
          aria-labelledby="upload-title"
          className="flex flex-[1_1_320px] flex-col gap-4 rounded-2xl border border-border bg-card p-6 lg:sticky lg:top-24"
        >
          <h2 id="upload-title" className="font-display text-[17px] font-semibold">
            Upload a document
          </h2>
          <UploadDocumentForm />
          <p className="text-[13px] text-muted-foreground">
            Employees get a notification the first time a document is published. See what they see on the{' '}
            <Link href="/notifications" className="font-semibold text-primary-text">
              notifications page
            </Link>{' '}
            once it’s out.
          </p>
        </section>
      </div>
    </PageShell>
  );
}
