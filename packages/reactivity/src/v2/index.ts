// WeakMap: target -> Map
// Map: key -> Set
type Effect = Function;
type Deps = Set<Effect>;
type KeyToDepsMap = Map<string | symbol, Deps>;
type TargetConnectionMap = WeakMap<object, KeyToDepsMap>;
let bucket: TargetConnectionMap = new WeakMap();

let activeEffect: Effect | null = null;

export function reactive<T extends object>(raw: T): T {
  const proxy = new Proxy(raw, {
    get(target, key) {
      track(target, key);

      return Reflect.get(target, key);
    },
    set(target, key, val) {
      const res = Reflect.set(target, key, val);
      trigger(target, key);
      return res;
    }
  });

  return proxy;
}

export function effect(fn: Function) {
  activeEffect = fn;
  fn();
}

function track(target: object, key: string | symbol) {
  if (!activeEffect) {
    return;
  }

  // 从桶中获取这个对象的依赖关系 {target -> {key -> effectFn}}
  let effectsMap = bucket.get(target);
  // 如果不存在，就初始化一个
  if (!effectsMap) {
    effectsMap = new Map();
    bucket.set(target, effectsMap);
  }

  // 获取依赖这个 key 的 effectFn集合
  let currentKeyEffects = effectsMap.get(key);
  // 如果不存在，就初始化一个
  if (!currentKeyEffects) {
    currentKeyEffects = new Set();
    effectsMap.set(key, currentKeyEffects);
  }

  // {target -> {key -> effectFn}} <- activeEffect
  // 将当前的 effectFn 放入这个对象(target)的这个键名(key)的依赖中
  // 如果这个target.key的值发生了变化，就会从 bucket.get(target).get(key) 中取出所有的 副作用函数
  currentKeyEffects.add(activeEffect);
}

function trigger(target: object, key: string | symbol) {
  const effects = bucket.get(target)?.get(key);
  effects?.forEach(fn => fn());
}

export function reset() {
  bucket = new WeakMap();
  activeEffect = null;
}