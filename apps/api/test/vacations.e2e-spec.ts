import { VacationStatus } from "@prisma/client";
import request from "supertest";
import { buildRequest, buildUser, publicUser } from "./fixtures";
import { resetPrismaMock } from "./prisma-mock";
import { TestApp, bearer, createTestApp } from "./test-app";

describe("Vacation endpoints", () => {
  let testApp: TestApp;

  const http = () => request(testApp.app.getHttpServer());
  const asEmployee = () => bearer(testApp.employeeToken);
  const asAdmin = () => bearer(testApp.adminToken);

  beforeAll(async () => {
    testApp = await createTestApp();
  });

  beforeEach(() => {
    resetPrismaMock(testApp.prisma);
    testApp.prisma.user.findMany.mockResolvedValue([]);
  });

  afterAll(async () => {
    await testApp.app.close();
  });

  describe("POST /api/vacations", () => {
    const body = {
      startDate: "2026-03-09",
      endDate: "2026-03-13",
      reason: "Family trip",
    };

    it("lets an employee request time off", async () => {
      testApp.prisma.user.findUnique.mockResolvedValue(buildUser());
      testApp.prisma.vacationRequest.create.mockResolvedValue({
        ...buildRequest(),
        user: publicUser(buildUser()),
      });

      const response = await http()
        .post("/api/vacations")
        .set(asEmployee())
        .send(body)
        .expect(201);

      expect(response.body).toMatchObject({
        id: "request-1",
        status: "PENDING",
      });
      expect(
        testApp.prisma.vacationRequest.create.mock.calls[0][0].data.userId,
      ).toBe("employee-1");
    });

    it("returns 400 when the end date is before the start date", async () => {
      const response = await http()
        .post("/api/vacations")
        .set(asEmployee())
        .send({ ...body, endDate: "2026-03-01" })
        .expect(400);

      expect(response.body.message).toContain(
        "endDate must be greater than or equal to startDate",
      );
    });

    it("returns 400 for an invalid date and a missing reason", async () => {
      await http()
        .post("/api/vacations")
        .set(asEmployee())
        .send({ startDate: "not-a-date", endDate: "2026-03-13" })
        .expect(400);
    });

    it("returns 400 when the allowance is exceeded", async () => {
      testApp.prisma.user.findUnique.mockResolvedValue(
        buildUser({ vacationDaysTotal: 25, vacationDaysUsed: 24 }),
      );

      const response = await http()
        .post("/api/vacations")
        .set(asEmployee())
        .send(body)
        .expect(400);

      expect(response.body.message).toBe("Not enough remaining vacation days");
    });

    it("returns 409 when the dates overlap existing time off", async () => {
      testApp.prisma.user.findUnique.mockResolvedValue(buildUser());
      testApp.prisma.vacationRequest.findFirst.mockResolvedValue(
        buildRequest({ status: VacationStatus.APPROVED }),
      );

      const response = await http()
        .post("/api/vacations")
        .set(asEmployee())
        .send(body)
        .expect(409);

      expect(response.body.message).toBe(
        "These dates overlap approved time off from 9 Mar 2026 – 13 Mar 2026.",
      );
    });

    it("returns 403 for admins", async () => {
      await http().post("/api/vacations").set(asAdmin()).send(body).expect(403);
    });

    it("returns 401 without a token", async () => {
      await http().post("/api/vacations").send(body).expect(401);
    });
  });

  describe("GET /api/vacations", () => {
    it("returns every request for admins", async () => {
      testApp.prisma.vacationRequest.findMany.mockResolvedValue([
        buildRequest(),
      ]);

      const response = await http()
        .get("/api/vacations")
        .set(asAdmin())
        .expect(200);

      expect(response.body).toHaveLength(1);
      expect(
        testApp.prisma.vacationRequest.findMany.mock.calls[0][0].where,
      ).toBeUndefined();
    });

    it("returns only the employee's own requests", async () => {
      testApp.prisma.vacationRequest.findMany.mockResolvedValue([]);

      await http().get("/api/vacations").set(asEmployee()).expect(200);

      expect(
        testApp.prisma.vacationRequest.findMany.mock.calls[0][0].where,
      ).toEqual({
        userId: "employee-1",
      });
    });

    it("returns 401 without a token", async () => {
      await http().get("/api/vacations").expect(401);
    });
  });

  describe("GET /api/vacations/approved", () => {
    it("returns approved requests", async () => {
      testApp.prisma.vacationRequest.findMany.mockResolvedValue([]);

      await http().get("/api/vacations/approved").set(asAdmin()).expect(200);

      expect(
        testApp.prisma.vacationRequest.findMany.mock.calls[0][0].where,
      ).toEqual({
        status: VacationStatus.APPROVED,
      });
    });

    it("returns 403 for employees so they cannot see colleagues' leave", async () => {
      await http().get("/api/vacations/approved").set(asEmployee()).expect(403);

      expect(testApp.prisma.vacationRequest.findMany).not.toHaveBeenCalled();
    });

    it("returns 401 without a token", async () => {
      await http().get("/api/vacations/approved").expect(401);
    });
  });

  describe("GET /api/vacations/team", () => {
    it("returns teammates' absences without reasons or types", async () => {
      testApp.prisma.user.findUnique.mockResolvedValue({
        department: "Engineering",
      });
      testApp.prisma.vacationRequest.findMany.mockResolvedValue([
        {
          id: "request-2",
          startDate: new Date("2026-03-10T00:00:00.000Z"),
          endDate: new Date("2026-03-11T00:00:00.000Z"),
          user: { id: "employee-2", firstName: "Amina", lastName: "Kovač" },
        },
      ]);

      const response = await http()
        .get("/api/vacations/team?from=2026-03-09&to=2026-03-15")
        .set(asEmployee())
        .expect(200);

      expect(response.body).toEqual([
        {
          id: "request-2",
          startDate: "2026-03-10T00:00:00.000Z",
          endDate: "2026-03-11T00:00:00.000Z",
          person: { id: "employee-2", firstName: "Amina", lastName: "Kovač" },
        },
      ]);
    });

    it("returns 400 when a date is missing", async () => {
      await http()
        .get("/api/vacations/team?from=2026-03-09")
        .set(asEmployee())
        .expect(400);
    });

    it("returns 400 when the range is reversed", async () => {
      await http()
        .get("/api/vacations/team?from=2026-03-15&to=2026-03-09")
        .set(asEmployee())
        .expect(400);
    });

    it("returns 401 without a token", async () => {
      await http()
        .get("/api/vacations/team?from=2026-03-09&to=2026-03-15")
        .expect(401);
    });
  });

  describe("PATCH /api/vacations/:id/cancel", () => {
    function givenOwnRequest(status: VacationStatus, startDate: string) {
      testApp.prisma.vacationRequest.findFirst.mockResolvedValue({
        ...buildRequest({
          status,
          startDate: new Date(`${startDate}T00:00:00.000Z`),
          endDate: new Date(`${startDate}T00:00:00.000Z`),
          workingDays: 1,
        }),
        user: { firstName: "John", lastName: "Employee" },
      });
      testApp.prisma.vacationRequest.update.mockResolvedValue(
        buildRequest({ status: VacationStatus.CANCELLED }),
      );
    }

    it("cancels approved future time off and refunds the days", async () => {
      givenOwnRequest(VacationStatus.APPROVED, "2099-06-01");

      const response = await http()
        .patch("/api/vacations/request-1/cancel")
        .set(asEmployee())
        .expect(200);

      expect(response.body.status).toBe("CANCELLED");
      expect(testApp.prisma.user.update.mock.calls[0][0].data).toEqual({
        vacationDaysUsed: { decrement: 1 },
      });
    });

    it("returns 400 for approved time off that has already started", async () => {
      givenOwnRequest(VacationStatus.APPROVED, "2020-01-06");

      await http()
        .patch("/api/vacations/request-1/cancel")
        .set(asEmployee())
        .expect(400);
    });

    it("returns 404 for someone else's request", async () => {
      testApp.prisma.vacationRequest.findFirst.mockResolvedValue(null);

      await http()
        .patch("/api/vacations/request-9/cancel")
        .set(asEmployee())
        .expect(404);
    });

    it("returns 403 for admins", async () => {
      await http()
        .patch("/api/vacations/request-1/cancel")
        .set(asAdmin())
        .expect(403);
    });
  });

  describe("GET /api/vacations/summary", () => {
    it("returns the employee summary", async () => {
      testApp.prisma.user.findUnique.mockResolvedValue(buildUser());
      testApp.prisma.vacationRequest.findMany.mockResolvedValue([]);

      const response = await http()
        .get("/api/vacations/summary")
        .set(asEmployee())
        .expect(200);

      expect(response.body).toEqual({
        remainingVacationDays: 17,
        upcomingVacations: [],
        requestHistory: [],
      });
    });

    it("returns 401 without a token", async () => {
      await http().get("/api/vacations/summary").expect(401);
    });
  });

  describe("GET /api/vacations/calendar", () => {
    it("returns calendar days for admins", async () => {
      testApp.prisma.vacationRequest.findMany.mockResolvedValue([
        {
          ...buildRequest({
            startDate: new Date("2026-02-12T00:00:00.000Z"),
            endDate: new Date("2026-02-12T00:00:00.000Z"),
          }),
          user: publicUser(buildUser()),
        },
      ]);

      const response = await http()
        .get("/api/vacations/calendar?year=2026")
        .set(asAdmin())
        .expect(200);

      expect(response.body).toEqual([
        expect.objectContaining({ date: "2026-02-12" }),
      ]);
    });

    it("returns 400 for an invalid year", async () => {
      await http()
        .get("/api/vacations/calendar?year=abc")
        .set(asAdmin())
        .expect(400);
    });

    it("returns 403 for employees", async () => {
      await http()
        .get("/api/vacations/calendar?year=2026")
        .set(asEmployee())
        .expect(403);
    });
  });

  describe("POST /api/vacations/sick", () => {
    const body = {
      userId: "employee-1",
      startDate: "2026-02-12",
      endDate: "2026-02-12",
      reason: "Flu",
    };

    it("lets an admin record sick leave", async () => {
      testApp.prisma.user.findFirst.mockResolvedValue(buildUser());
      testApp.prisma.vacationRequest.create.mockResolvedValue({
        ...buildRequest({ absenceType: "SICK", status: "APPROVED" }),
        user: publicUser(buildUser()),
      });

      await http()
        .post("/api/vacations/sick")
        .set(asAdmin())
        .send(body)
        .expect(201);
    });

    it("returns 400 when the employee is missing from the body", async () => {
      await http()
        .post("/api/vacations/sick")
        .set(asAdmin())
        .send({
          startDate: body.startDate,
          endDate: body.endDate,
          reason: body.reason,
        })
        .expect(400);
    });

    it("returns 404 for an unknown employee", async () => {
      testApp.prisma.user.findFirst.mockResolvedValue(null);

      await http()
        .post("/api/vacations/sick")
        .set(asAdmin())
        .send(body)
        .expect(404);
    });

    it("returns 403 for employees", async () => {
      await http()
        .post("/api/vacations/sick")
        .set(asEmployee())
        .send(body)
        .expect(403);
    });
  });

  describe.each(["approve", "reject"])(
    "PATCH /api/vacations/:id/%s",
    (action) => {
      it(`lets an admin ${action} a pending request`, async () => {
        testApp.prisma.vacationRequest.findUnique.mockResolvedValue({
          ...buildRequest(),
          user: buildUser(),
        });
        testApp.prisma.vacationRequest.update.mockResolvedValue(buildRequest());
        testApp.prisma.user.findUnique.mockResolvedValue(buildUser());

        await http()
          .patch(`/api/vacations/request-1/${action}`)
          .set(asAdmin())
          .send({ adminComment: "Noted" })
          .expect(200);

        expect(
          testApp.prisma.vacationRequest.update.mock.calls[0][0].data
            .adminComment,
        ).toBe("Noted");
      });

      it("returns 400 for a comment over 500 characters", async () => {
        await http()
          .patch(`/api/vacations/request-1/${action}`)
          .set(asAdmin())
          .send({ adminComment: "x".repeat(501) })
          .expect(400);

        expect(
          testApp.prisma.vacationRequest.findUnique,
        ).not.toHaveBeenCalled();
      });

      it("returns 404 for an unknown request", async () => {
        testApp.prisma.vacationRequest.findUnique.mockResolvedValue(null);

        await http()
          .patch(`/api/vacations/missing/${action}`)
          .set(asAdmin())
          .send({})
          .expect(404);
      });

      it("returns 403 for employees", async () => {
        await http()
          .patch(`/api/vacations/request-1/${action}`)
          .set(asEmployee())
          .send({})
          .expect(403);
      });
    },
  );
});
