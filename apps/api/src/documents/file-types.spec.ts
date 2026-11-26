import { sampleFiles } from "../../test/document-files";
import {
  contentDisposition,
  detectFileType,
  isPreviewable,
  safeFileName,
} from "./file-types";

describe("detectFileType", () => {
  it.each([
    ["pdf", "application/pdf", true],
    ["png", "image/png", true],
    ["jpeg", "image/jpeg", true],
    ["webp", "image/webp", true],
    [
      "docx",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      false,
    ],
    [
      "xlsx",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      false,
    ],
  ] as const)("recognises %s from its bytes", (name, mimeType, previewable) => {
    expect(detectFileType(sampleFiles[name])).toMatchObject({
      mimeType,
      previewable,
    });
  });

  it("rejects files whose content does not match a supported type", () => {
    expect(detectFileType(sampleFiles.text)).toBeNull();
    expect(detectFileType(sampleFiles.zip)).toBeNull();
  });

  it("only allows inline preview for PDFs and images", () => {
    expect(isPreviewable("application/pdf")).toBe(true);
    expect(isPreviewable("image/webp")).toBe(true);
    expect(
      isPreviewable(
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      ),
    ).toBe(false);
    expect(isPreviewable("text/html")).toBe(false);
  });
});

describe("safeFileName", () => {
  it("keeps the name but uses the detected extension", () => {
    expect(safeFileName("Holiday policy 2027.PDF", "pdf")).toBe(
      "Holiday policy 2027.pdf",
    );
    expect(safeFileName("invoice.exe", "pdf")).toBe("invoice.pdf");
  });

  it("drops folders and characters that are unsafe in headers", () => {
    expect(safeFileName('../../etc/"pass<wd>"\u0007.png', "png")).toBe(
      "passwd.png",
    );
    expect(safeFileName("C:\\Users\\me\\plan.docx", "docx")).toBe("plan.docx");
  });

  it("falls back to a default name", () => {
    expect(safeFileName(".pdf", "pdf")).toBe("document.pdf");
  });
});

describe("contentDisposition", () => {
  it("adds an ASCII fallback and a UTF-8 encoded name", () => {
    expect(contentDisposition("inline", "Godišnji odmor.pdf")).toBe(
      `inline; filename="Godi_nji odmor.pdf"; filename*=UTF-8''Godi%C5%A1nji%20odmor.pdf`,
    );
  });
});
