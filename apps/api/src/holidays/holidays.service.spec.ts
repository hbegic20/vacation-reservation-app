import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from "@nestjs/common";
import {
  PrismaMock,
  asPrismaService,
  createPrismaMock,
} from "../../test/prisma-mock";
import { HolidaysService } from "./holidays.service";

describe("HolidaysService", () => {
  let prisma: PrismaMock;
  let holidaysService: HolidaysService;

  beforeEach(() => {
    prisma = createPrismaMock();
    holidaysService = new HolidaysService(asPrismaService(prisma));
  });

  describe("listForYear", () => {
    it("queries the whole UTC year in date order", async () => {
      await holidaysService.listForYear(2026);

      expect(prisma.publicHoliday.findMany).toHaveBeenCalledWith({
        where: {
          date: {
            gte: new Date("2026-01-01T00:00:00.000Z"),
            lt: new Date("2027-01-01T00:00:00.000Z"),
          },
        },
        orderBy: { date: "asc" },
      });
    });

    it.each([1999, 2101, Number.NaN])("rejects the invalid year %p", (year) => {
      expect(() => holidaysService.listForYear(year)).toThrow(
        BadRequestException,
      );
    });
  });

  describe("create", () => {
    it("stores the holiday at UTC midnight with a trimmed name", async () => {
      prisma.publicHoliday.findUnique.mockResolvedValue(null);
      prisma.publicHoliday.create.mockResolvedValue({ id: "holiday-1" });

      await holidaysService.create({
        date: new Date("2026-11-25T15:00:00.000Z"),
        name: "  Statehood Day ",
      });

      expect(prisma.publicHoliday.create).toHaveBeenCalledWith({
        data: {
          date: new Date("2026-11-25T00:00:00.000Z"),
          name: "Statehood Day",
        },
      });
    });

    it("rejects a second holiday on the same day", async () => {
      prisma.publicHoliday.findUnique.mockResolvedValue({
        id: "holiday-1",
        name: "Labour Day",
      });

      await expect(
        holidaysService.create({
          date: new Date("2026-05-01T00:00:00.000Z"),
          name: "Another",
        }),
      ).rejects.toThrow(
        new ConflictException("2026-05-01 is already a holiday (Labour Day)"),
      );
    });
  });

  describe("remove", () => {
    it("deletes an existing holiday", async () => {
      prisma.publicHoliday.findUnique.mockResolvedValue({ id: "holiday-1" });

      await expect(holidaysService.remove("holiday-1")).resolves.toEqual({
        success: true,
      });
      expect(prisma.publicHoliday.delete).toHaveBeenCalledWith({
        where: { id: "holiday-1" },
      });
    });

    it("throws for an unknown holiday", async () => {
      prisma.publicHoliday.findUnique.mockResolvedValue(null);

      await expect(holidaysService.remove("missing")).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });
  });

  it("counts working days without the holidays stored in the range", async () => {
    prisma.publicHoliday.findMany.mockResolvedValue([
      { date: new Date("2026-05-01T00:00:00.000Z") },
    ]);

    await expect(
      holidaysService.countWorkingDays(
        new Date("2026-04-27T00:00:00.000Z"),
        new Date("2026-05-01T00:00:00.000Z"),
      ),
    ).resolves.toBe(4);
  });
});
