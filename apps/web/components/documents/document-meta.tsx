import { DocumentItem } from '@vacation/shared';
import { formatDate } from '@/lib/dates';
import { documentKindLabel, formatFileSize } from '@/lib/documents';
import { fullName } from '@/lib/people';

export function DocumentMeta({ document, showUploader }: { document: DocumentItem; showUploader: boolean }) {
  const uploader = document.uploadedBy ? fullName(document.uploadedBy) : null;

  return (
    <p className="text-[13px] text-muted-foreground">
      <span className="font-semibold text-foreground">{documentKindLabel(document)}</span> ·{' '}
      {formatFileSize(document.sizeBytes)} · {document.fileName}
      {showUploader && uploader ? ` · uploaded by ${uploader} on ${formatDate(document.createdAt)}` : ''}
    </p>
  );
}
