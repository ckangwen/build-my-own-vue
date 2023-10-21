import { describe, it, expect, vi } from "vitest";
import { reactive, effect } from "@vue/reactivity";
// import { reactive, effect } from ".";

describe("reactive", () => {
  // eslint-disable-next-line max-statements
  it("should allow nested effects", () => {
    const nums = reactive({ num1: 0, num2: 1, num3: 2 });
    const dummy: any = {};

    const childSpy = vi.fn(() => {
      dummy.num1 = nums.num1;
    });
    const parentSpy = vi.fn(() => {
      dummy.num2 = nums.num2;
      effect(childSpy);
      dummy.num3 = nums.num3;
    });
    effect(parentSpy);

    expect(dummy).toEqual({ num1: 0, num2: 1, num3: 2 });
    expect(parentSpy).toHaveBeenCalledTimes(1);
    expect(childSpy).toHaveBeenCalledTimes(1);
    // this should only call the childeffect
    nums.num1 = 4;
    expect(dummy).toEqual({ num1: 4, num2: 1, num3: 2 });
    expect(parentSpy).toHaveBeenCalledTimes(1);
    expect(childSpy).toHaveBeenCalledTimes(2);
    // this calls the parenteffect, which calls the childeffect once
    nums.num2 = 10;
    expect(dummy).toEqual({ num1: 4, num2: 10, num3: 2 });
    expect(parentSpy).toHaveBeenCalledTimes(2);
    expect(childSpy).toHaveBeenCalledTimes(3);
    // this calls the parenteffect, which calls the childeffect once
    nums.num3 = 7;
    expect(dummy).toEqual({ num1: 4, num2: 10, num3: 7 });
    expect(parentSpy).toHaveBeenCalledTimes(3);
    expect(childSpy).toHaveBeenCalledTimes(4);
  });
});