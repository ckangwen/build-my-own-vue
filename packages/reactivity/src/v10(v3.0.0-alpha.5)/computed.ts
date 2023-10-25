import { isFunction } from "@vue/shared";
import { Ref, UnwrapRef, TriggerOpTypes, TrackOpTypes, ReactiveEffect } from "../v9(v3.0.0-alpha.4)/index";
import { effect, trigger, track } from "./effect";

// NEW https://github.com/vuejs/core/issues/733
export type ComputedGetter<T> = (ctx?: any) => T;
export type ComputedSetter<T> = (v: T) => void;

export interface WritableComputedRef<T> extends Ref<T> {
  readonly effect: ReactiveEffect<T>;
}

export interface WritableComputedOptions<T> {
  get: ComputedGetter<T>;
  set: ComputedSetter<T>;
}

export interface ComputedRef<T = any> extends WritableComputedRef<T> {
  readonly value: UnwrapRef<T>;
}

export function computed<T>(getter: ComputedGetter<T>): ComputedRef<T>;
export function computed<T>(options: WritableComputedOptions<T>): WritableComputedRef<T>;
export function computed<T>(getterOrOptions: ComputedGetter<T> | WritableComputedOptions<T>) {
  let getter: ComputedGetter<T>;
  let setter: ComputedSetter<T>;

  if (isFunction(getterOrOptions)) {
    getter = getterOrOptions;
    setter = () => {
      console.warn("Write operation failed: computed value is readonly");
    };
  } else {
    getter = getterOrOptions.get;
    setter = getterOrOptions.set;
  }

  let dirty = true;
  let value: T;
  // eslint-disable-next-line @typescript-eslint/no-shadow
  let computed: ComputedRef<T>;

  const runner = effect(getter, {
    lazy: true,
    computed: true,
    scheduler: () => {
      // NEW  https://github.com/vuejs/core/pull/710
      // 在 computed 的依赖项变化时，等同于 computed 被修改，需要重新计算，即调用 trigger
      if (!dirty) {
        dirty = true;
        trigger(computed, TriggerOpTypes.SET, "value");
      }
    }
  });

  computed = {
    _isRef: true,
    // expose effect so computed can be stopped
    effect: runner,
    get value() {
      if (dirty) {
        value = runner();
        dirty = false;
      }

      // NEW trackChildRun => track
      // 在访问 computed 的时候，收集依赖
      track(computed, TrackOpTypes.GET, "value");
      return value;
    },
    set value(newValue: T) {
      setter(newValue);
    }
  } as any;

  return computed;
}

// DEPRECATED
// function trackChildRun(childRunner: ReactiveEffect) {
//   if (activeEffect === undefined) {
//     return;
//   }
//   for (let i = 0; i < childRunner.deps.length; i++) {
//     const dep = childRunner.deps[i];
//     if (!dep.has(activeEffect)) {
//       dep.add(activeEffect);
//       activeEffect.deps.push(dep);
//     }
//   }
// }