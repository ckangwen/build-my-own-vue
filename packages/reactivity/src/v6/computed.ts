import { effect } from ".";

export function computed<T>(getter: () => T) {
  // 缓存上一次计算的值
  let value;
  // 是否需要重新计算
  let dirty = true;
  const effectFn = effect(getter, {
    lazy: true,
    scheduler() {
      // 当effect内部的响应式对象发生变化时，会调用scheduler
      // 这个时候需要将dirty置为true，下次取值时重新计算
      dirty = true;
    }
  });

  const obj = {
    get value() {
      if (dirty) {
        value = effectFn();
        dirty = false;
      }

      return value!;
    }
  };

  return obj;
}