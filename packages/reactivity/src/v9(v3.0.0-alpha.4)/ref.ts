import { isObject } from "@vue/shared";
import { ComputedRef, track, trigger, TrackOpTypes, TriggerOpTypes } from "../v8(v3.0.0-alpha.2)/index";
import { isReactive, reactive } from "./reactive";

const isRefSymbol = Symbol("isRef");

type UnwrapArray<T> = { [P in keyof T]: UnwrapRef<T[P]> };

// Recursively unwraps nested value bindings.
export type UnwrapRef<T> = {
  cRef: T extends ComputedRef<infer V> ? UnwrapRef<V> : T;
  ref: T extends Ref<infer V> ? UnwrapRef<V> : T;
  array: T extends Array<infer V> ? Array<UnwrapRef<V>> & UnwrapArray<T> : T;
  object: { [K in keyof T]: UnwrapRef<T[K]> };
}[T extends ComputedRef<any>
  ? "cRef"
  : T extends Ref
    ? "ref"
    : T extends any[]
      ? "array"
      : T extends Function
        ? "ref" // bail out on types that shouldn't be unwrapped
        : T extends object ? "object" : "ref"];

export interface Ref<T = any> {
  // This field is necessary to allow TS to differentiate a Ref from a plain
  // object that happens to have a "value" field.
  // However, checking a symbol on an arbitrary object is much slower than
  // checking a plain property, so we use a _isRef plain property for isRef()
  // check in the actual implementation.
  // The reason for not just declaring _isRef in the interface is because we
  // don't want this internal field to leak into userland autocompletion -
  // a private symbol, on the other hand, achieves just that.
  [isRefSymbol]: true;
  value: UnwrapRef<T>;
}

function convert<T>(val: T): T {
  return isObject(val) ? reactive(val) : val;
}

export function isRef(r: any): r is Ref {
  return r ? r._isRef === true : false;
}

export function ref<T extends Ref>(raw: T): T;
export function ref<T>(raw: T): Ref<T>;
export function ref<T = any>(): Ref<T>;
export function ref(raw?: unknown) {
  if (isRef(raw)) {
    return raw;
  }
  raw = convert(raw);
  const r = {
    _isRef: true,
    get value() {
      track(r, TrackOpTypes.GET, "value");
      return raw;
    },
    set value(newVal) {
      raw = convert(newVal);
      trigger(
        r,
        TriggerOpTypes.SET,
        "value",
        { newValue: newVal }
      );
    }
  };
  return r;
}

export function toRefs<T extends object>(
  object: T
): { [K in keyof T]: Ref<T[K]> } {
  if (!isReactive(object)) {
    console.warn(`toRefs() expects a reactive object but received a plain one.`);
  }
  const ret: any = {};
  for (const key in object) {
    ret[key] = toProxyRef(object, key);
  }
  return ret;
}

function toProxyRef<T extends object, K extends keyof T>(
  object: T,
  key: K
): Ref<T[K]> {
  return {
    _isRef: true,
    get value(): any {
      return object[key];
    },
    set value(newVal) {
      object[key] = newVal;
    }
  } as any;
}
