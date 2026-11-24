import { countWorkingDays, startOfUtcDay, toDateKey } from "./dates";

function utcDate(isoDate: string): Date {
  return new Date(`${isoDate}T00:00:00.000Z`);
}

describe("countWorkingDays", () => {
  it("counts Monday to Friday", () => {
    expect(countWorkingDays(utcDate("2026-03-09"), utcDate("2026-03-13"))).toBe(
      5,
    );
  });

  it("skips weekends inside the range", () => {
    expect(countWorkingDays(utcDate("2026-03-12"), utcDate("2026-03-17"))).toBe(
      4,
    );
  });

  it("returns zero for a weekend-only range", () => {
    expect(countWorkingDays(utcDate("2026-03-14"), utcDate("2026-03-15"))).toBe(
      0,
    );
  });

  it("skips public holidays", () => {
    const holidays = new Set(["2026-05-01"]);

    expect(
      countWorkingDays(utcDate("2026-04-27"), utcDate("2026-05-01"), holidays),
    ).toBe(4);
  });

  it("ignores the time of day on both ends", () => {
    expect(
      countWorkingDays(
        new Date("2026-03-09T23:30:00.000Z"),
        new Date("2026-03-10T01:00:00.000Z"),
      ),
    ).toBe(2);
  });
});

describe("startOfUtcDay and toDateKey", () => {
  it("normalise to the UTC calendar day", () => {
    const date = new Date("2026-03-09T23:30:00.000Z");

    expect(startOfUtcDay(date).toISOString()).toBe("2026-03-09T00:00:00.000Z");
    expect(toDateKey(date)).toBe("2026-03-09");
  });
});
