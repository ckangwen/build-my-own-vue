import { describe } from "node:test";
import { expect, it, vi } from "vitest";
import { effect, reactive } from ".";

describe("v5", () => {
  it("scheduler", () => {
    let dummy;
    const scheduler = vi.fn();
    const obj = reactive({ foo: 1 });
    effect(
      () => {
        dummy = obj.foo;
      },
      { scheduler }
    );
    expect(scheduler).not.toHaveBeenCalled();
    expect(dummy).toBe(1);
    // should be called on first trigger
    obj.foo++;
    expect(scheduler).toHaveBeenCalledTimes(1);
    // should not run yet
    expect(dummy).toBe(1);
  });
});