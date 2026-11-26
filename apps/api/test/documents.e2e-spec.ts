import request from "supertest";
import { sampleFiles } from "./document-files";
import { resetPrismaMock } from "./prisma-mock";
import { TestApp, bearer, createTestApp } from "./test-app";

describe("Document endpoints", () => {
  let testApp: TestApp;

  const http = () => request(testApp.app.getHttpServer());
  const asEmployee = () => bearer(testApp.employeeToken);
  const asAdmin = () => bearer(testApp.adminToken);

  beforeAll(async () => {
    testApp = await createTestApp();
  });

  beforeEach(() => {
    resetPrismaMock(testApp.prisma);
  });

  afterAll(async () => {
    await testApp.app.close();
  });

  describe("POST /api/documents", () => {
    it("lets an admin upload a PDF as a draft", async () => {
      testApp.prisma.document.create.mockImplementation(({ data }) =>
        Promise.resolve({ id: "doc-1", ...data, content: undefined }),
      );

      const response = await http()
        .post("/api/documents")
        .set(asAdmin())
        .field("title", "Holiday policy 2027")
        .field("description", "Rules for next year")
        .attach("file", sampleFiles.pdf, {
          filename: "policy.pdf",
          contentType: "application/pdf",
        })
        .expect(201);

      expect(response.body).toMatchObject({
        id: "doc-1",
        title: "Holiday policy 2027",
        mimeType: "application/pdf",
        fileName: "policy.pdf",
      });
      expect(
        testApp.prisma.document.create.mock.calls[0][0].data.uploadedById,
      ).toBe("admin-1");
    });

    it("returns 400 when the title is missing", async () => {
      await http()
        .post("/api/documents")
        .set(asAdmin())
        .attach("file", sampleFiles.pdf, "policy.pdf")
        .expect(400);
    });

    it("returns 400 for a file that only pretends to be a PDF", async () => {
      const response = await http()
        .post("/api/documents")
        .set(asAdmin())
        .field("title", "Fake")
        .attach("file", sampleFiles.text, {
          filename: "fake.pdf",
          contentType: "application/pdf",
        })
        .expect(400);

      expect(response.body.message).toMatch(/Upload a PDF/);
      expect(testApp.prisma.document.create).not.toHaveBeenCalled();
    });

    it("returns 413 for files over 10 MB", async () => {
      await http()
        .post("/api/documents")
        .set(asAdmin())
        .field("title", "Huge")
        .attach(
          "file",
          Buffer.concat([sampleFiles.pdf, Buffer.alloc(10 * 1024 * 1024)]),
          "huge.pdf",
        )
        .expect(413);
    });

    it("returns 403 for employees", async () => {
      await http()
        .post("/api/documents")
        .set(asEmployee())
        .field("title", "Sneaky")
        .attach("file", sampleFiles.pdf, "policy.pdf")
        .expect(403);
    });
  });

  describe("GET /api/documents", () => {
    it("lists only published documents for employees", async () => {
      testApp.prisma.document.findMany.mockResolvedValue([{ id: "doc-1" }]);

      await http().get("/api/documents").set(asEmployee()).expect(200);

      expect(testApp.prisma.document.findMany.mock.calls[0][0].where).toEqual({
        isPublished: true,
      });
    });

    it("returns 401 without a token", async () => {
      await http().get("/api/documents").expect(401);
    });
  });

  describe("GET /api/documents/:id/file", () => {
    it("serves a PDF inline with safe headers", async () => {
      testApp.prisma.document.findFirst.mockResolvedValue({
        fileName: "Holiday policy.pdf",
        mimeType: "application/pdf",
        sizeBytes: sampleFiles.pdf.length,
        content: sampleFiles.pdf,
      });

      const response = await http()
        .get("/api/documents/doc-1/file")
        .set(asEmployee())
        .expect(200);

      expect(response.headers["content-type"]).toBe("application/pdf");
      expect(response.headers["content-disposition"]).toMatch(/^inline;/);
      expect(response.headers["x-content-type-options"]).toBe("nosniff");
      expect(response.headers["cache-control"]).toBe("private, no-store");
      expect(Buffer.from(response.body).equals(sampleFiles.pdf)).toBe(true);
    });

    it("always downloads Word files and honours ?download=1", async () => {
      testApp.prisma.document.findFirst.mockResolvedValue({
        fileName: "plan.docx",
        mimeType:
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        sizeBytes: sampleFiles.docx.length,
        content: sampleFiles.docx,
      });

      const response = await http()
        .get("/api/documents/doc-2/file")
        .set(asEmployee())
        .expect(200);

      expect(response.headers["content-disposition"]).toMatch(/^attachment;/);

      testApp.prisma.document.findFirst.mockResolvedValue({
        fileName: "policy.pdf",
        mimeType: "application/pdf",
        sizeBytes: sampleFiles.pdf.length,
        content: sampleFiles.pdf,
      });
      const pdfDownload = await http()
        .get("/api/documents/doc-1/file?download=1")
        .set(asEmployee())
        .expect(200);

      expect(pdfDownload.headers["content-disposition"]).toMatch(
        /^attachment;/,
      );
    });

    it("returns 404 when an employee asks for a draft", async () => {
      testApp.prisma.document.findFirst.mockResolvedValue(null);

      await http()
        .get("/api/documents/draft-1/file")
        .set(asEmployee())
        .expect(404);
    });
  });

  describe("PATCH /api/documents/:id", () => {
    it("publishes a document", async () => {
      testApp.prisma.document.findUnique.mockResolvedValue({
        isPublished: false,
        publishedAt: null,
      });
      testApp.prisma.document.update.mockResolvedValue({
        id: "doc-1",
        title: "Policy",
        isPublished: true,
      });
      testApp.prisma.user.findMany.mockResolvedValue([{ id: "employee-1" }]);

      await http()
        .patch("/api/documents/doc-1")
        .set(asAdmin())
        .send({ isPublished: true })
        .expect(200);

      expect(testApp.prisma.notification.createMany).toHaveBeenCalled();
    });

    it("returns 400 for a non-boolean publish flag", async () => {
      await http()
        .patch("/api/documents/doc-1")
        .set(asAdmin())
        .send({ isPublished: "yes" })
        .expect(400);
    });

    it("returns 403 for employees", async () => {
      await http()
        .patch("/api/documents/doc-1")
        .set(asEmployee())
        .send({ isPublished: true })
        .expect(403);
    });
  });

  describe("DELETE /api/documents/:id", () => {
    it("deletes a document", async () => {
      testApp.prisma.document.findUnique.mockResolvedValue({ id: "doc-1" });

      await http().delete("/api/documents/doc-1").set(asAdmin()).expect(200);
    });

    it("returns 404 for an unknown document", async () => {
      testApp.prisma.document.findUnique.mockResolvedValue(null);

      await http().delete("/api/documents/missing").set(asAdmin()).expect(404);
    });
  });
});
