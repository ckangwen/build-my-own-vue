
import { describe } from "node:test";
import { expect, it, vi } from "vitest";
import { effect, reactive } from ".";

describe("v6", () => {
  it("lazy", () => {
    const obj = reactive({ foo: 1 });
    let dummy;
    // eslint-disable-next-line no-return-assign
    const runner = effect(() => (dummy = obj.foo), { lazy: true });
    expect(dummy).toBe(undefined);
  
    expect(runner()).toBe(1);
    expect(dummy).toBe(1);
    obj.foo = 2;
    expect(dummy).toBe(2);
  });
});