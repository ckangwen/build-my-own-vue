import { isObject, makeMap, toRawType } from "@vue/shared";
import { mutableHandlers, readonlyHandlers } from "./baseHandlers";


// WeakMaps that store {raw <-> observed} pairs.
const rawToReactive = new WeakMap<any, any>();
const reactiveToRaw = new WeakMap<any, any>();
const rawToReadonly = new WeakMap<any, any>();
const readonlyToRaw = new WeakMap<any, any>();
// WeakSets for values that are marked readonly or non-reactive during
// observable creation.
const readonlyValues = new WeakSet<any>();
const nonReactiveValues = new WeakSet<any>();

type UnwrapNestedRefs<T> = T;
export function reactive<T extends object>(target: T): UnwrapNestedRefs<T>;
export function reactive(target: object) {
  // 如果是 readonly 的，直接返回
  if (isReadonly(target)) {
    return target;
  }
  // target is explicitly marked as readonly by user
  // 如果通过`markReadonly`被标记为了 readonly，则返回 readonly 化的对象
  if (readonlyValues.has(target)) {
    return readonly(target);
  }

  return createReactiveObject(
    target,
    rawToReactive,
    reactiveToRaw,
    mutableHandlers,
  );
}

export function readonly<T extends object>(
  target: T
): Readonly<UnwrapNestedRefs<T>> {
  // 如果已经 reactive 过了，则取出原始对象，再进行 readonly
  if (reactiveToRaw.has(target)) {
    target = reactiveToRaw.get(target);
  }

  return createReactiveObject(
    target,
    rawToReadonly,
    readonlyToRaw,
    readonlyHandlers,
  );
}

function createReactiveObject(
  target: unknown,
  rawToProxy: WeakMap<any, any>,
  proxyToRaw: WeakMap<any, any>,
  baseHandlers: ProxyHandler<any>,
) {
  // 只对对象进行代理
  if (!isObject(target)) {
    console.warn(`value cannot be made reactive: ${String(target)}`);
    return target;
  }


  // 如果原始对象已经被代理过了，就直接返回代理对象
  let observed = rawToProxy.get(target);
  if (observed !== undefined) {
    return observed;
  }

  // 如果传入的是代理后的对象，则直接返回
  if (proxyToRaw.has(target)) {
    return target;
  }

  if (!canObserve(target)) {
    return target;
  }

  const handlers = baseHandlers;

  // 进行代理
  observed = new Proxy(target, handlers);
  // 保存原始对象和代理对象的映射
  rawToProxy.set(target, observed);
  proxyToRaw.set(observed, target);

  // 返回代理后的对象
  return observed;
}

const isObservableType = makeMap("Object,Array,Map,Set,WeakMap,WeakSet");

const canObserve = (value: any): boolean => (
  !value._isVue &&
    !value._isVNode &&
    isObservableType(toRawType(value)) &&
    !nonReactiveValues.has(value)
);

export function isReactive(value: unknown): boolean {
  return reactiveToRaw.has(value) || readonlyToRaw.has(value);
}

export function isReadonly(value: unknown): boolean {
  return readonlyToRaw.has(value);
}

export function toRaw<T>(observed: T): T {
  return reactiveToRaw.get(observed) || readonlyToRaw.get(observed) || observed;
}

export function markReadonly<T>(value: T): T {
  readonlyValues.add(value);
  return value;
}

export function markNonReactive<T>(value: T): T {
  nonReactiveValues.add(value);
  return value;
}
