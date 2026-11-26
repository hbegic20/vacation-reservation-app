import { DocumentItem } from '@vacation/shared';

type DocumentKind = 'pdf' | 'image' | 'word' | 'excel' | 'file';

const kindLabels: Record<DocumentKind, string> = {
  pdf: 'PDF',
  image: 'Image',
  word: 'Word',
  excel: 'Excel',
  file: 'File'
};

export function documentKind(document: Pick<DocumentItem, 'mimeType'>): DocumentKind {
  if (document.mimeType === 'application/pdf') {
    return 'pdf';
  }
  if (document.mimeType.startsWith('image/')) {
    return 'image';
  }
  if (document.mimeType.includes('wordprocessingml')) {
    return 'word';
  }
  return document.mimeType.includes('spreadsheetml') ? 'excel' : 'file';
}

export function documentKindLabel(document: Pick<DocumentItem, 'mimeType'>): string {
  return kindLabels[documentKind(document)];
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  if (bytes < 1024 * 1024) {
    return `${Math.round(bytes / 1024)} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function documentFileHref(documentId: string, download = false): string {
  return `/documents/${encodeURIComponent(documentId)}/file${download ? '?download=1' : ''}`;
}

export const acceptedDocumentTypes =
  '.pdf,.png,.jpg,.jpeg,.webp,.docx,.xlsx,application/pdf,image/png,image/jpeg,image/webp,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';
