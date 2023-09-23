const bucket = new Set<Function>();

let activeEffect: Function | null = null;

export function reactive<T extends object>(raw: T): T {
  const proxy = new Proxy(raw, {
    get(target, key) {
      if (activeEffect) {
        bucket.add(activeEffect);
      }
      return Reflect.get(target, key);
    },
    set(target, key, val) {
      const res = Reflect.set(target, key, val);
      bucket.forEach(fn => fn());

      return res;
    }
  });

  return proxy;
}

export function effect(fn: Function) {
  activeEffect = fn;
  fn();
}

export function reset() {
  bucket.clear();
  activeEffect = null;
}