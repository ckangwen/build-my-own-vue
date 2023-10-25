import { describe, test, expect } from "vitest";
import { reactive } from "./reactive";

describe("reactive", () => {
  test("Array identity methods should work with raw values", () => {
    const raw = {};
    const arr = reactive([{}, {}]);
    arr.push(raw);

    expect(arr.indexOf(raw)).toBe(2);
    expect(arr.indexOf(raw, 3)).toBe(-1);
    expect(arr.includes(raw)).toBe(true);
    expect(arr.includes(raw, 3)).toBe(false);
    expect(arr.lastIndexOf(raw)).toBe(2);
    expect(arr.lastIndexOf(raw, 1)).toBe(-1);

    // should work also for the observed version
    const observed = arr[2];
    expect(arr.indexOf(observed)).toBe(2);
    expect(arr.indexOf(observed, 3)).toBe(-1);
    expect(arr.includes(observed)).toBe(true);
    expect(arr.includes(observed, 3)).toBe(false);
    expect(arr.lastIndexOf(observed)).toBe(2);
    expect(arr.lastIndexOf(observed, 1)).toBe(-1);
  });
});