import { describe } from "node:test";
import { beforeEach, expect, it, vi } from "vitest";
import { effect, reactive, reset } from ".";

describe("v3", () => {
  beforeEach(() => {
    reset();
  });

  it("should not be triggered by mutating a property, which is used in an inactive branch", () => {
    let dummy;
    const obj = reactive({ prop: "value", run: true });

    const conditionalSpy = vi.fn(() => {
      dummy = obj.run ? obj.prop : "other";
    });
    effect(conditionalSpy);

    expect(dummy).toBe("value");
    expect(conditionalSpy).toHaveBeenCalledTimes(1);
    obj.run = false;
    expect(dummy).toBe("other");
    expect(conditionalSpy).toHaveBeenCalledTimes(2);
    obj.prop = "value2";
    expect(dummy).toBe("other");
    expect(conditionalSpy).toHaveBeenCalledTimes(2);
  });

  it("should discover new branches while running automatically", () => {
    let dummy;
    const obj = reactive({ prop: "value", run: false });

    const conditionalSpy = vi.fn(() => {
      dummy = obj.run ? obj.prop : "other";
    });
    effect(conditionalSpy);

    expect(dummy).toBe("other");
    expect(conditionalSpy).toHaveBeenCalledTimes(1);
    obj.prop = "Hi";
    expect(dummy).toBe("other");
    expect(conditionalSpy).toHaveBeenCalledTimes(1);
    obj.run = true;
    expect(dummy).toBe("Hi");
    expect(conditionalSpy).toHaveBeenCalledTimes(2);
    obj.prop = "World";
    expect(dummy).toBe("World");
    expect(conditionalSpy).toHaveBeenCalledTimes(3);
  });
});