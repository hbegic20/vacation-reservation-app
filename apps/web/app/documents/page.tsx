import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { DocumentMeta } from '@/components/documents/document-meta';
import { DocumentPreview } from '@/components/documents/document-preview';
import { PageHeader } from '@/components/layout/page-header';
import { PageShell } from '@/components/layout/page-shell';
import { buttonStyles } from '@/components/ui/button';
import { fetchDocuments } from '@/lib/api';
import { requireToken, requireUser } from '@/lib/auth';
import { formatDate } from '@/lib/dates';
import { documentFileHref, documentKind } from '@/lib/documents';

export const metadata: Metadata = { title: 'Documents' };

export default async function DocumentsPage() {
  const user = await requireUser();
  if (user.role === 'ADMIN') {
    redirect('/admin/documents');
  }

  const token = requireToken();
  const documents = await fetchDocuments(token);

  return (
    <PageShell user={user} width="medium">
      <PageHeader title="Documents" description="Policies, handbooks and forms shared by your admins." />
      {documents.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-input bg-card px-6 py-12 text-center">
          <p className="font-display text-xl font-semibold">Nothing here yet</p>
          <p className="mt-1 text-muted-foreground">You’ll get a notification when a new document is shared.</p>
        </div>
      ) : (
        <ol className="flex flex-col gap-4">
          {documents.map((document) => (
            <li key={document.id}>
              <article className="flex flex-col gap-4 rounded-2xl border border-border bg-card p-5">
                <div>
                  {document.publishedAt ? (
                    <p className="text-[13px] font-semibold text-primary-text">
                      Shared {formatDate(document.publishedAt)}
                    </p>
                  ) : null}
                  <h2 className="mt-1 font-display text-xl font-semibold">{document.title}</h2>
                  <DocumentMeta document={document} showUploader={false} />
                </div>
                {document.description ? <p className="text-sm">{document.description}</p> : null}
                <DocumentPreview document={document} />
                <div className="flex flex-wrap gap-2">
                  <a href={documentFileHref(document.id, true)} className={buttonStyles('primary')}>
                    Download
                  </a>
                  {documentKind(document) === 'word' || documentKind(document) === 'excel' ? null : (
                    <a href={documentFileHref(document.id)} target="_blank" rel="noopener" className={buttonStyles('secondary')}>
                      Open in new tab
                    </a>
                  )}
                </div>
              </article>
            </li>
          ))}
        </ol>
      )}
    </PageShell>
  );
}
