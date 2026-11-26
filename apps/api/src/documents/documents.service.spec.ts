import { BadRequestException, NotFoundException } from "@nestjs/common";
import { NotificationType, UserRole } from "@prisma/client";
import { sampleFiles } from "../../test/document-files";
import {
  PrismaMock,
  asPrismaService,
  createPrismaMock,
} from "../../test/prisma-mock";
import { NotificationsService } from "../notifications/notifications.service";
import { DocumentsService, maxDocumentBytes } from "./documents.service";

const admin = {
  id: "admin-1",
  email: "admin@company.com",
  role: UserRole.ADMIN,
};
const employee = {
  id: "employee-1",
  email: "john.employee@company.com",
  role: UserRole.EMPLOYEE,
};

function upload(buffer: Buffer, originalname = "Policy.pdf") {
  return { originalname, size: buffer.length, buffer };
}

describe("DocumentsService", () => {
  let prisma: PrismaMock;
  let notifications: { notifyAllEmployees: jest.Mock };
  let documentsService: DocumentsService;

  beforeEach(() => {
    prisma = createPrismaMock();
    notifications = {
      notifyAllEmployees: jest.fn().mockResolvedValue(undefined),
    };
    documentsService = new DocumentsService(
      asPrismaService(prisma),
      notifications as unknown as NotificationsService,
    );
  });

  describe("list", () => {
    it("shows admins every document, newest upload first", async () => {
      prisma.document.findMany.mockResolvedValue([]);

      await documentsService.list(admin);

      const query = prisma.document.findMany.mock.calls[0][0];
      expect(query.where).toEqual({});
      expect(query.orderBy).toEqual({ createdAt: "desc" });
      expect(query.select).not.toHaveProperty("content");
    });

    it("shows employees only published documents, newest first", async () => {
      prisma.document.findMany.mockResolvedValue([]);

      await documentsService.list(employee);

      const query = prisma.document.findMany.mock.calls[0][0];
      expect(query.where).toEqual({ isPublished: true });
      expect(query.orderBy).toEqual({ publishedAt: "desc" });
    });
  });

  describe("create", () => {
    it("stores a draft with the detected type and a safe file name", async () => {
      prisma.document.create.mockResolvedValue({ id: "doc-1" });

      await documentsService.create(
        "admin-1",
        { title: "Holiday policy", description: "" },
        upload(sampleFiles.pdf, "../Holiday policy.exe"),
      );

      expect(prisma.document.create.mock.calls[0][0].data).toEqual({
        title: "Holiday policy",
        description: null,
        fileName: "Holiday policy.pdf",
        mimeType: "application/pdf",
        sizeBytes: sampleFiles.pdf.length,
        content: sampleFiles.pdf,
        uploadedById: "admin-1",
      });
    });

    it("rejects a missing or empty file", async () => {
      await expect(
        documentsService.create("admin-1", { title: "Policy" }, undefined),
      ).rejects.toThrow(new BadRequestException("Choose a file to upload"));
      await expect(
        documentsService.create(
          "admin-1",
          { title: "Policy" },
          upload(Buffer.alloc(0)),
        ),
      ).rejects.toBeInstanceOf(BadRequestException);
    });

    it("rejects files whose content is not a supported type", async () => {
      await expect(
        documentsService.create(
          "admin-1",
          { title: "Policy" },
          upload(sampleFiles.text, "policy.pdf"),
        ),
      ).rejects.toThrow(/Upload a PDF, PNG, JPG, WebP, Word/);
      expect(prisma.document.create).not.toHaveBeenCalled();
    });

    it("rejects files over 10 MB", async () => {
      await expect(
        documentsService.create(
          "admin-1",
          { title: "Policy" },
          {
            originalname: "big.pdf",
            size: maxDocumentBytes + 1,
            buffer: sampleFiles.pdf,
          },
        ),
      ).rejects.toThrow("Files can be at most 10 MB");
    });
  });

  describe("update", () => {
    it("notifies employees the first time a document is published", async () => {
      prisma.document.findUnique.mockResolvedValue({
        isPublished: false,
        publishedAt: null,
      });
      prisma.document.update.mockResolvedValue({
        id: "doc-1",
        title: "Holiday policy",
        description: null,
      });

      await documentsService.update("doc-1", { isPublished: true });

      expect(prisma.document.update.mock.calls[0][0].data).toMatchObject({
        isPublished: true,
        publishedAt: expect.any(Date),
      });
      expect(notifications.notifyAllEmployees).toHaveBeenCalledWith({
        type: NotificationType.DOCUMENT_PUBLISHED,
        title: "New document: Holiday policy",
        message: "A new document is available in Documents.",
        metadata: { documentId: "doc-1" },
      });
    });

    it("does not notify again when a document is re-published", async () => {
      prisma.document.findUnique.mockResolvedValue({
        isPublished: false,
        publishedAt: new Date("2026-11-01T10:00:00.000Z"),
      });
      prisma.document.update.mockResolvedValue({
        id: "doc-1",
        title: "Policy",
      });

      await documentsService.update("doc-1", { isPublished: true });

      expect(
        prisma.document.update.mock.calls[0][0].data.publishedAt,
      ).toBeUndefined();
      expect(notifications.notifyAllEmployees).not.toHaveBeenCalled();
    });

    it("throws for an unknown document", async () => {
      prisma.document.findUnique.mockResolvedValue(null);

      await expect(
        documentsService.update("missing", { title: "New title" }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe("remove", () => {
    it("deletes an existing document", async () => {
      prisma.document.findUnique.mockResolvedValue({ id: "doc-1" });

      await expect(documentsService.remove("doc-1")).resolves.toEqual({
        success: true,
      });
      expect(prisma.document.delete).toHaveBeenCalledWith({
        where: { id: "doc-1" },
      });
    });

    it("throws for an unknown document", async () => {
      prisma.document.findUnique.mockResolvedValue(null);

      await expect(documentsService.remove("missing")).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  describe("getFile", () => {
    it("only lets employees open published documents", async () => {
      prisma.document.findFirst.mockResolvedValue(null);

      await expect(
        documentsService.getFile(employee, "draft-1"),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(prisma.document.findFirst.mock.calls[0][0].where).toEqual({
        id: "draft-1",
        isPublished: true,
      });
    });

    it("lets admins open drafts", async () => {
      prisma.document.findFirst.mockResolvedValue({ content: sampleFiles.pdf });

      await documentsService.getFile(admin, "draft-1");

      expect(prisma.document.findFirst.mock.calls[0][0].where).toEqual({
        id: "draft-1",
      });
    });
  });
});
