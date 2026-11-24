describe("test environment", () => {
  it("runs in a non-UTC time zone so UTC date handling is exercised", () => {
    expect(new Date("2026-03-09T00:00:00.000Z").getDate()).toBe(8);
  });
});
