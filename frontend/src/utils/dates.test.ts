import { describe, expect, it } from "vitest";
import { parseBackendDate, toLocalDateIso } from "./dates";

describe("backend date parsing", () => {
  it("preserves date-only values in the local calendar", () => {
    const parsed = parseBackendDate("2026-09-07");

    expect(parsed).not.toBeNull();
    expect(parsed?.getFullYear()).toBe(2026);
    expect(parsed?.getMonth()).toBe(8);
    expect(parsed?.getDate()).toBe(7);
  });

  it("normalizes backend date values without shifting the day", () => {
    expect(toLocalDateIso("2026-02-28")).toBe("2026-02-28");
  });
});
