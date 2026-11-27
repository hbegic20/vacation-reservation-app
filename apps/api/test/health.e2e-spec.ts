import request from "supertest";
import { TestApp, createTestApp } from "./test-app";

describe("Health endpoint", () => {
  let testApp: TestApp;

  beforeAll(async () => {
    testApp = await createTestApp();
  });

  afterAll(async () => {
    await testApp.app.close();
  });

  it("reports ok without a token or a database query", async () => {
    const response = await request(testApp.app.getHttpServer())
      .get("/api/health")
      .expect(200);

    expect(response.body).toEqual({ status: "ok" });
    expect(testApp.prisma.user.findUnique).not.toHaveBeenCalled();
  });

  it("rejects other methods", async () => {
    await request(testApp.app.getHttpServer()).post("/api/health").expect(404);
  });
});
