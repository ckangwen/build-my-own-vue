import { isObject, hasOwn, isSymbol, hasChanged } from "@vue/shared";
import { TrackOpTypes, TriggerOpTypes } from "./operations";
import { isRef } from "./ref";
import { reactive, readonly, toRaw } from "./reactive";
import { LOCKED } from "./lock";
import { ITERATE_KEY, track, trigger } from "./effect";

// JS 内置的 symbols，需要跳过
// 与 https://github.com/nx-js/observer-util/blob/master/src/handlers.js#L9 类似
// 可以再做优化，参照 https://github.com/vuejs/core/blob/v3.3.5/packages/reactivity/src/baseHandlers.ts#L36
const builtInSymbols = new Set(
  Object.getOwnPropertyNames(Symbol)
    .map(key => (Symbol as any)[key])
    .filter(isSymbol)
);


function createGetter(isReadonly = false, shallow = false) {
  return function get(target: object, key: string | symbol, receiver: object) {
    const res = Reflect.get(target, key, receiver);

    // 如果是 symbol，且是内置的 symbol，就不需要进行依赖追踪
    if (isSymbol(key) && builtInSymbols.has(key)) {
      return res;
    }

    if (shallow) {
      track(target, TrackOpTypes.GET, key);
      return res;
    }
    // reactive 内 嵌套 ref
    if (isRef(res)) {
      return res.value;
    }

    track(target, TrackOpTypes.GET, key);

    // 如果是对象，就递归调用 reactive
    return isObject(res)
      ? isReadonly
        ? readonly(res)
        : reactive(res)
      : res;

  };
}

function createSetter(isReadonly = false, shallow = false) {
  return function set(
    target: object,
    key: string | symbol,
    value: unknown,
    receiver: object
  ): boolean {
    if (isReadonly && LOCKED) {
      console.warn(
        `Set operation on key "${String(key)}" failed: target is readonly.`,
        target
      );

      return true;
    }

    const oldValue = (target as any)[key];
    // TODO
    if (!shallow) {
      value = toRaw(value);
      if (isRef(oldValue) && !isRef(value)) {
        oldValue.value = value;
        return true;
      }
    } else {
      // in shallow mode, objects are set as-is regardless of reactive or not
    }

    // 如果是原先没有的 key，就是新增
    const hadKey = hasOwn(target, key);
    const result = Reflect.set(target, key, value, receiver);


    // 紧在自身调用时触发，不包括原型链上的
    if (target === toRaw(receiver)) {
      const extraInfo = { oldValue, newValue: value };

      if (!hadKey) {
        trigger(target, TriggerOpTypes.ADD, key, extraInfo);
      } else if (hasChanged(value, oldValue)) {
        trigger(target, TriggerOpTypes.SET, key, extraInfo);
      }
    }
    return result;
  };
}

const get = createGetter();
const readonlyGet = createGetter(true);

const set = createSetter();
const readonlySet = createSetter(true);


function deleteProperty(target: object, key: string | symbol): boolean {
  const hadKey = hasOwn(target, key);
  const oldValue = (target as any)[key];
  const result = Reflect.deleteProperty(target, key);

  // 只有在自身有这个 key 时，才需要触发依赖更新
  if (result && hadKey) {
    trigger(target, TriggerOpTypes.DELETE, key, { oldValue });
  }
  return result;
}


function has(target: object, key: string | symbol): boolean {
  const result = Reflect.has(target, key);
  track(target, TrackOpTypes.HAS, key);
  return result;
}

function ownKeys(target: object): Array<string | symbol> {
  track(target, TrackOpTypes.ITERATE, ITERATE_KEY);
  return Reflect.ownKeys(target);
}


export const mutableHandlers: ProxyHandler<object> = {
  get,
  set,
  deleteProperty,
  has,
  ownKeys
};

export const readonlyHandlers: ProxyHandler<object> = {
  get: readonlyGet,
  set: readonlySet,
  has,
  ownKeys,
  deleteProperty(target: object, key: string | symbol): boolean {
    if (LOCKED) {
      console.warn(
        `Delete operation on key "${String(
          key
        )}" failed: target is readonly.`,
        target
      );
      return true;
    }
    return deleteProperty(target, key);
  }
};
