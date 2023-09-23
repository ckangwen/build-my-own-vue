// WeakMap: target -> Map
// Map: key -> Set
interface Effect {
  (): Function;
  /**
   * 与当前副作用函数存在联系的依赖集合
   */
  deps: Deps[];
}
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

// const effectFnDepsMap = new Map()

// WeakMap<target, Map<string, Set<effectFn>>>
export function effect(fn: Function) {
  // 执行 effectFn 之前，需要从所有的依赖集合中删去该 effectFn
  // 包含 effectFn 的依赖集合，可以从 bucket.get(target).get(key) 获取
  // 只有在get或set期间，才能获取到 bucket.get(target).get(key)
  // TODO: 这个设计方式还没有吃透
  const effectFn = (() => {
    cleanup(effectFn);
    // TODO: 为什么要在effectFn内部赋值，如果放在外面会怎么样
    activeEffect = effectFn;
    fn();
  }) as Effect;

  // activeEffect = effectFn;
  effectFn.deps = [];

  effectFn();
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
  let deps = effectsMap.get(key);
  // 如果不存在，就初始化一个
  if (!deps) {
    deps = new Set();
    effectsMap.set(key, deps);
  }

  // {target -> {key -> effectFn}} <- activeEffect
  // 将当前的 effectFn 放入这个对象(target)的这个键名(key)的依赖中
  // 如果这个target.key的值发生了变化，就会从 bucket.get(target).get(key) 中取出所有的 副作用函数
  deps.add(activeEffect);

  // 将该键名的依赖集合与当前副作用函数关联，以便于重置该副作用函数的依赖集合
  activeEffect.deps.push(deps);
}

function trigger(target: object, key: string | symbol) {
  const effects = bucket.get(target)?.get(key);
  if (!effects) {
    return;
  }

  // 重新执行fn的时候会重新收集副作用函数，会导致 effects 无限增加
  const effectsToRun = new Set(effects);
  effectsToRun.forEach(fn => fn());
}

function cleanup(effectFn: Effect) {
  const { deps } = effectFn;
  deps.forEach(dep => {
    dep.delete(effectFn);
  });
  effectFn.deps.length = 0;
}

export function reset() {
  bucket = new WeakMap();
  activeEffect = null;
}