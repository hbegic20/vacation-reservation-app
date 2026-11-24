import { NotificationType, VacationStatus } from "@prisma/client";
import { buildRequest } from "../../test/fixtures";
import {
  PrismaMock,
  asPrismaService,
  createPrismaMock,
} from "../../test/prisma-mock";
import { NotificationsService } from "../notifications/notifications.service";
import { RemindersService } from "./reminders.service";

describe("RemindersService", () => {
  let prisma: PrismaMock;
  let notifications: { notifyEmployee: jest.Mock };
  let reminders: RemindersService;
  const morning = new Date("2026-03-08T09:00:00.000Z");

  beforeEach(() => {
    prisma = createPrismaMock();
    notifications = { notifyEmployee: jest.fn().mockResolvedValue(undefined) };
    reminders = new RemindersService(
      asPrismaService(prisma),
      notifications as unknown as NotificationsService,
    );
    prisma.vacationRequest.updateMany.mockResolvedValue({ count: 1 });
  });

  it("reminds employees whose approved vacation starts tomorrow", async () => {
    prisma.vacationRequest.findMany.mockResolvedValue([
      {
        ...buildRequest({ status: VacationStatus.APPROVED }),
        coverUser: { firstName: "Amina", lastName: "Kovač" },
      },
    ]);

    await expect(reminders.sendDueReminders(morning)).resolves.toBe(1);

    expect(prisma.vacationRequest.findMany.mock.calls[0][0].where).toEqual({
      status: VacationStatus.APPROVED,
      absenceType: "VACATION",
      reminderSentAt: null,
      startDate: {
        gte: new Date("2026-03-09T00:00:00.000Z"),
        lt: new Date("2026-03-10T00:00:00.000Z"),
      },
    });
    expect(notifications.notifyEmployee).toHaveBeenCalledWith("employee-1", {
      type: NotificationType.LEAVE_REMINDER,
      title: "Your time off starts tomorrow",
      message:
        "Your vacation 9 Mar 2026 – 13 Mar 2026 starts tomorrow. Set your out-of-office reply and hand over open work to Amina Kovač before you leave.",
      metadata: { requestId: "request-1" },
    });
  });

  it("marks the reminder as sent before notifying", async () => {
    prisma.vacationRequest.findMany.mockResolvedValue([
      { ...buildRequest(), coverUser: null },
    ]);

    await reminders.sendDueReminders(morning);

    expect(prisma.vacationRequest.updateMany).toHaveBeenCalledWith({
      where: { id: "request-1", reminderSentAt: null },
      data: { reminderSentAt: morning },
    });
    expect(notifications.notifyEmployee.mock.calls[0][1].message).toContain(
      "hand over open work before you leave",
    );
  });

  it("skips a request another run already reminded", async () => {
    prisma.vacationRequest.findMany.mockResolvedValue([
      { ...buildRequest(), coverUser: null },
    ]);
    prisma.vacationRequest.updateMany.mockResolvedValue({ count: 0 });

    await expect(reminders.sendDueReminders(morning)).resolves.toBe(0);
    expect(notifications.notifyEmployee).not.toHaveBeenCalled();
  });

  it("waits until the morning before sending", async () => {
    await expect(
      reminders.sendDueReminders(new Date("2026-03-08T05:00:00.000Z")),
    ).resolves.toBe(0);
    expect(prisma.vacationRequest.findMany).not.toHaveBeenCalled();
  });
});
