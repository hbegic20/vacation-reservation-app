export interface DetectedFileType {
  mimeType: string;
  extension: string;
  previewable: boolean;
}

const zipSignature = Buffer.from([0x50, 0x4b, 0x03, 0x04]);

const signatures: {
  matches: (bytes: Buffer) => boolean;
  type: DetectedFileType;
}[] = [
  {
    matches: (bytes) => bytes.subarray(0, 5).toString("latin1") === "%PDF-",
    type: { mimeType: "application/pdf", extension: "pdf", previewable: true },
  },
  {
    matches: (bytes) =>
      bytes
        .subarray(0, 8)
        .equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])),
    type: { mimeType: "image/png", extension: "png", previewable: true },
  },
  {
    matches: (bytes) =>
      bytes.subarray(0, 3).equals(Buffer.from([0xff, 0xd8, 0xff])),
    type: { mimeType: "image/jpeg", extension: "jpg", previewable: true },
  },
  {
    matches: (bytes) =>
      bytes.subarray(0, 4).toString("latin1") === "RIFF" &&
      bytes.subarray(8, 12).toString("latin1") === "WEBP",
    type: { mimeType: "image/webp", extension: "webp", previewable: true },
  },
  {
    matches: (bytes) =>
      bytes.subarray(0, 4).equals(zipSignature) && bytes.includes("word/"),
    type: {
      mimeType:
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      extension: "docx",
      previewable: false,
    },
  },
  {
    matches: (bytes) =>
      bytes.subarray(0, 4).equals(zipSignature) && bytes.includes("xl/"),
    type: {
      mimeType:
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      extension: "xlsx",
      previewable: false,
    },
  },
];

export function detectFileType(bytes: Buffer): DetectedFileType | null {
  return signatures.find(({ matches }) => matches(bytes))?.type ?? null;
}

export function isPreviewable(mimeType: string): boolean {
  return signatures.some(
    ({ type }) => type.mimeType === mimeType && type.previewable,
  );
}

export function safeFileName(originalName: string, extension: string): string {
  const baseName = originalName.split(/[\\/]/).pop() ?? "";
  const withoutExtension = baseName.replace(/\.[^.]*$/, "");
  const cleaned = withoutExtension
    .normalize("NFC")
    .replace(/[\u0000-\u001f\u007f"<>:|?*]/g, "")
    .trim()
    .slice(0, 150);
  return `${cleaned || "document"}.${extension}`;
}

export function contentDisposition(
  disposition: "inline" | "attachment",
  fileName: string,
): string {
  const asciiFallback = fileName
    .replace(/[^\x20-\x7e]/g, "_")
    .replace(/"/g, "");
  return `${disposition}; filename="${asciiFallback}"; filename*=UTF-8''${encodeURIComponent(fileName)}`;
}
