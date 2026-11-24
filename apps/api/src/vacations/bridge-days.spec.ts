import { BridgeSearch, suggestBridgeDays } from "./bridge-days";

function search(overrides: Partial<BridgeSearch>): BridgeSearch {
  return {
    firstDay: "2026-03-01",
    lastDay: "2026-12-31",
    holidays: new Map(),
    blockedDays: new Set(),
    availableDays: 25,
    limit: 5,
    ...overrides,
  };
}

describe("suggestBridgeDays", () => {
  it("bridges a Tuesday holiday with the Monday before it", () => {
    const [suggestion] = suggestBridgeDays(
      search({ holidays: new Map([["2026-03-10", "Test Day"]]) }),
    );

    expect(suggestion).toEqual({
      leaveStart: "2026-03-09",
      leaveEnd: "2026-03-09",
      offStart: "2026-03-07",
      offEnd: "2026-03-10",
      leaveDays: 1,
      daysOff: 4,
      holidays: ["Test Day"],
    });
  });

  it("bridges a Thursday holiday with the Friday after it", () => {
    const [suggestion] = suggestBridgeDays(
      search({ holidays: new Map([["2026-03-12", "Test Day"]]) }),
    );

    expect(suggestion).toMatchObject({
      leaveStart: "2026-03-13",
      leaveEnd: "2026-03-13",
      offStart: "2026-03-12",
      offEnd: "2026-03-15",
      daysOff: 4,
    });
  });

  it("fills a three-day gap before New Year for nine days off", () => {
    const [suggestion] = suggestBridgeDays(
      search({
        firstDay: "2025-12-01",
        lastDay: "2026-01-31",
        holidays: new Map([
          ["2026-01-01", "New Year"],
          ["2026-01-02", "New Year (second day)"],
        ]),
      }),
    );

    expect(suggestion).toEqual({
      leaveStart: "2025-12-29",
      leaveEnd: "2025-12-31",
      offStart: "2025-12-27",
      offEnd: "2026-01-04",
      leaveDays: 3,
      daysOff: 9,
      holidays: ["New Year", "New Year (second day)"],
    });
  });

  it("bridges a Friday holiday with the four days before it", () => {
    const [suggestion] = suggestBridgeDays(
      search({
        holidays: new Map([
          ["2026-05-01", "Labour Day"],
          ["2026-05-02", "Labour Day (second day)"],
        ]),
      }),
    );

    expect(suggestion).toEqual({
      leaveStart: "2026-04-27",
      leaveEnd: "2026-04-30",
      offStart: "2026-04-25",
      offEnd: "2026-05-03",
      leaveDays: 4,
      daysOff: 9,
      holidays: ["Labour Day", "Labour Day (second day)"],
    });
  });

  it("never suggests more than four days of leave", () => {
    const suggestions = suggestBridgeDays(
      search({ holidays: new Map([["2026-03-11", "Wednesday Day"]]) }),
    );

    expect(suggestions).toHaveLength(1);
    expect(suggestions[0].leaveDays).toBeLessThanOrEqual(4);
  });

  it("ignores holidays that fall on a weekend", () => {
    expect(
      suggestBridgeDays(
        search({ holidays: new Map([["2026-03-14", "Saturday Day"]]) }),
      ),
    ).toEqual([]);
  });

  it("falls back to the other side when the best days are already booked", () => {
    const [suggestion] = suggestBridgeDays(
      search({
        holidays: new Map([["2026-03-10", "Test Day"]]),
        blockedDays: new Set(["2026-03-09"]),
      }),
    );

    expect(suggestion).toMatchObject({
      leaveStart: "2026-03-11",
      leaveEnd: "2026-03-13",
      daysOff: 6,
    });
  });

  it("only suggests leave the employee can still afford", () => {
    const [suggestion] = suggestBridgeDays(
      search({
        firstDay: "2025-12-01",
        lastDay: "2026-01-31",
        holidays: new Map([
          ["2026-01-01", "New Year"],
          ["2026-01-02", "New Year (second day)"],
        ]),
        availableDays: 2,
      }),
    );

    expect(suggestion).toBeUndefined();
  });

  it("never suggests leave starting before the first day", () => {
    expect(
      suggestBridgeDays(
        search({
          firstDay: "2026-03-10",
          lastDay: "2026-03-31",
          holidays: new Map([["2026-03-10", "Test Day"]]),
        }),
      ),
    ).toEqual([
      expect.objectContaining({
        leaveStart: "2026-03-11",
        leaveEnd: "2026-03-13",
      }),
    ]);
  });

  it("returns suggestions in date order up to the limit", () => {
    const suggestions = suggestBridgeDays(
      search({
        holidays: new Map([
          ["2026-06-11", "June Day"],
          ["2026-03-10", "March Day"],
          ["2026-09-22", "September Day"],
        ]),
        limit: 2,
      }),
    );

    expect(suggestions.map((suggestion) => suggestion.holidays[0])).toEqual([
      "March Day",
      "June Day",
    ]);
  });
});
