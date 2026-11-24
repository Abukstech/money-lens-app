import { describe, expect, it } from "vitest";
import { formatMoney, passwordError, validEmail } from "../src/lib/validation";
describe("Inputs and money", () => {
  it("validates email and enforces the backend password policy", () => {
    expect(validEmail("faith@example.test")).toBe(true);
    expect(validEmail("faith@")).toBe(false);
    expect(passwordError("12345678", "12345678")).toBeTruthy();
    expect(passwordError("long-enough-password", "different")).toBeTruthy();
    expect(
      passwordError("long-enough-password", "long-enough-password"),
    ).toBeNull();
  });
  it("formats decimal strings without precision loss", () => {
    expect(formatMoney("999999999999999999.12")).toBe(
      "₦999,999,999,999,999,999.12",
    );
    expect(formatMoney("125.1")).toBe("₦125.10");
  });
});
