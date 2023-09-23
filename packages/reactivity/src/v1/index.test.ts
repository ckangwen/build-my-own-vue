import { describe } from "node:test";
import { beforeEach, expect, it, vi } from "vitest";
import { effect, reactive, reset } from ".";

describe("reactive and effect", () => {
  beforeEach(() => {
    reset();
  });

  it("effect", () => {
    let dummy = 0;
    const obj = reactive({ a: 1 });
    expect(dummy).toBe(0);

    effect(() => {
      dummy = obj.a;
    });

    expect(dummy).toBe(1);

    obj.a = 2;
    expect(dummy).toBe(2);
  });

  it("effect", () => {
    let dummy = 0;
    const obj = reactive<Record<string, any>>({ a: 1 });
    const fn = vi.fn(() => {
      dummy = obj.a;
    });

    effect(fn);
    obj.a = 2;
    obj.notExistKey = 3;

    // effect 触发了2次
    // 默认执行一次，obj.a = 2 时执行一次
    // obj.notExistKey = 3 时不会触发
    expect(dummy).toBe(2);
    expect(fn).toHaveBeenCalledTimes(2);
  });
});