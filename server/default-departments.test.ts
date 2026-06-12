import { describe, it, expect } from "vitest";
import { DEFAULT_BRANCH_DEPARTMENTS } from "./db";

describe("default branch departments", () => {
  it("creates exactly the four required departments", () => {
    expect(DEFAULT_BRANCH_DEPARTMENTS.map((d) => d.name)).toEqual([
      "Branch Management",
      "Reception",
      "Doctors",
      "Nursing",
    ]);
  });

  it("includes an Arabic name for every default department", () => {
    for (const d of DEFAULT_BRANCH_DEPARTMENTS) {
      expect(d.nameAr.trim().length).toBeGreaterThan(0);
    }
  });
});
