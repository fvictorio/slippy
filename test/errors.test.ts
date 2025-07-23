import { describe, expect, it } from "vitest";
import { SlippyErrorCode } from "../src/errors.js";

describe("Errors", () => {
  it("should start codes with SLIPPY_", () => {
    const errorCodes = Object.values(SlippyErrorCode);
    errorCodes.forEach((code) => {
      expect(code).toMatch(/^SLIPPY_/);
    });
  });
});
