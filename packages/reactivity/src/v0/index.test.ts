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

    // effect 触发了3次
    // 默认执行一次，obj.a = 2 时执行一次，obj.notExistKey = 3 时执行一次
    // 其中 obj.notExistKey = 3 这一次在effect中没有被收集到依赖，但是依旧触发了effect
    expect(dummy).toBe(2);
    expect(fn).toHaveBeenCalledTimes(3);
  });
});