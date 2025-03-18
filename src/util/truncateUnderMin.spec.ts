import { truncateUnderMin } from "./truncateUnderMin";

describe("truncateUnderMin", () => {
  it("should truncate seconds and milliseconds from a Date object", () => {
    const inputDate = new Date("2023-10-01T12:34:56.789Z");
    const expectedDate = new Date("2023-10-01T12:34:00.000Z");

    const result = truncateUnderMin(inputDate);

    expect(result).toEqual(expectedDate);
  });

  it("should not modify the original date object", () => {
    const inputDate = new Date("2023-10-01T12:34:56.789Z");
    const originalDate = new Date(inputDate);

    truncateUnderMin(inputDate);

    expect(inputDate).toEqual(originalDate);
  });

  it("should handle dates with no seconds or milliseconds", () => {
    const inputDate = new Date("2023-10-01T12:34:00.000Z");
    const expectedDate = new Date("2023-10-01T12:34:00.000Z");

    const result = truncateUnderMin(inputDate);

    expect(result).toEqual(expectedDate);
  });

  it("should handle dates in different time zones", () => {
    const inputDate = new Date("2023-10-01T12:34:56.789+02:00");
    const expectedDate = new Date("2023-10-01T12:34:00.000+02:00");

    const result = truncateUnderMin(inputDate);

    expect(result.toISOString()).toEqual(expectedDate.toISOString());
  });

  it("should handle invalid date inputs gracefully", () => {
    const invalidDate = new Date("invalid-date");

    expect(() => truncateUnderMin(invalidDate)).toThrowError("Invalid Date");
  });
});
