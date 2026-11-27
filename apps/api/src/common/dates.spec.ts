import {
  countWorkingDays,
  eachDateKey,
  startOfUtcDay,
  toDateKey,
} from "./dates";

function utcDate(isoDate: string): Date {
  return new Date(`${isoDate}T00:00:00.000Z`);
}

describe("eachDateKey", () => {
  it("lists every calendar day in the range, both ends included", () => {
    expect(eachDateKey(utcDate("2026-02-27"), utcDate("2026-03-02"))).toEqual([
      "2026-02-27",
      "2026-02-28",
      "2026-03-01",
      "2026-03-02",
    ]);
  });

  it("returns one key when start and end are the same day", () => {
    expect(
      eachDateKey(utcDate("2026-03-09"), new Date("2026-03-09T18:30:00.000Z")),
    ).toEqual(["2026-03-09"]);
  });

  it("returns nothing when the end is before the start", () => {
    expect(eachDateKey(utcDate("2026-03-10"), utcDate("2026-03-09"))).toEqual(
      [],
    );
  });
});

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
