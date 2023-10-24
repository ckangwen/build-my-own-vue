/* eslint-disable @typescript-eslint/no-shadow */
import { EMPTY_OBJ, extend, isArray } from "@vue/shared";
import { TrackOpTypes, TriggerOpTypes } from "./operations";

// 依赖集合
// 即需要随响应式数据变化更新重新执行的函数的集合
type Dep = Set<ReactiveEffect>;
type KeyToDepMap = Map<any, Dep>;
const targetMap = new WeakMap<any, KeyToDepMap>();


export interface ReactiveEffect<T = any> {
  (): T;
  _isEffect: true;
  active: boolean;
  raw: () => T;
  deps: Dep[];
  options: ReactiveEffectOptions;
}

export interface ReactiveEffectOptions {
  lazy?: boolean;
  computed?: boolean;
  scheduler?: (run: Function) => void;
  onTrack?: (event: DebuggerEvent) => void;
  onTrigger?: (event: DebuggerEvent) => void;
  onStop?: () => void;
}

export type DebuggerEvent = {
  effect: ReactiveEffect;
  target: object;
  type: TrackOpTypes | TriggerOpTypes;
  key: any;
} & DebuggerEventExtraInfo;

export interface DebuggerEventExtraInfo {
  newValue?: any;
  oldValue?: any;
  oldTarget?: Map<any, any> | Set<any>;
}

export const ITERATE_KEY = Symbol("iterate");

export function isEffect(fn: any): fn is ReactiveEffect {
  return fn && fn._isEffect === true;
}

// effect函数执行栈，解决在effect嵌套时，activeEffect 指向不正确的问题
// 详细可见 V4 版本
const effectStack: ReactiveEffect[] = [];
// 当前正在执行的effect函数，始终指向effectStack的最后一个元素
// eslint-disable-next-line import/no-mutable-exports
export let activeEffect: ReactiveEffect | undefined = effectStack[effectStack.length - 1];

export function effect<T = any>(fn: () => T, options: ReactiveEffectOptions = EMPTY_OBJ): ReactiveEffect<T> {
  if (isEffect(fn)) {
    fn = fn.raw;
  }

  const effect = createReactiveEffect(fn, options);
  if (!options.lazy) {
    effect();
  }

  return effect;
}


// NEW
function createReactiveEffect<T = any>(fn: () => T, options: ReactiveEffectOptions): ReactiveEffect<T> {
  const effect = function reactiveEffect(...args: unknown[]): unknown {
    return run(effect, fn, args);
  } as ReactiveEffect;
  effect._isEffect = true;
  effect.active = true;
  effect.raw = fn;
  effect.deps = [];
  effect.options = options;
  return effect;
}

function run(
  effect: ReactiveEffect,
  fn: Function,
  args: unknown[]
) {
  // 如果已经停止了对原始函数内依赖的监听，则直接执行原始函数
  if (!effect.active) {
    return fn(...args);
  }
  // 否则
  if (!effectStack.includes(effect)) {
    // 从全局的依赖集合中删除该effect
    cleanup(effect);

    try {
      effectStack.push(effect);
      activeEffect = effect;
      return fn(...args);
    } finally {
      effectStack.pop();
      activeEffect = effectStack[effectStack.length - 1];
    }
  }
}

function cleanup(effect: ReactiveEffect) {
  const { deps } = effect;
  if (deps.length) {
    for (let i = 0; i < deps.length; i++) {
      deps[i].delete(effect);
    }
    deps.length = 0;
  }
}

// NEW
let shouldTrack = true;

export function pauseTracking() {
  shouldTrack = false;
}

export function resumeTracking() {
  shouldTrack = true;
}

export function track(target: object, type: TrackOpTypes, key: unknown) {
  if (!shouldTrack || activeEffect === undefined) {
    return;
  }

  let depsMap = targetMap.get(target);
  if (depsMap === undefined) {
    targetMap.set(target, (depsMap = new Map()));
  }
  let dep = depsMap.get(key);
  if (dep === undefined) {
    depsMap.set(key, (dep = new Set()));
  }
  if (!dep.has(activeEffect)) {
    dep.add(activeEffect);
    activeEffect.deps.push(dep);

    // NEW
    if (activeEffect.options.onTrack) {
      activeEffect.options.onTrack({
        effect: activeEffect,
        target,
        type,
        key
      });
    }
  }
}


export function trigger(
  target: object,
  type: TriggerOpTypes,
  key?: unknown,
  extraInfo?: DebuggerEventExtraInfo
) {
  const depsMap = targetMap.get(target);
  if (depsMap === undefined) {
    return;
  }

  const effects = new Set<ReactiveEffect>();
  const computedRunners = new Set<ReactiveEffect>();
  // NEW
  if (type === TriggerOpTypes.CLEAR) {
    // collection being cleared, trigger all effects for target
    depsMap.forEach(dep => {
      addRunners(effects, computedRunners, dep);
    });
  } else {
    // schedule runs for SET | ADD | DELETE
    if (key !== undefined) {
      addRunners(effects, computedRunners, depsMap.get(key));
    }
    // also run for iteration key on ADD | DELETE
    if (type === TriggerOpTypes.ADD || type === TriggerOpTypes.DELETE) {
      const iterationKey = isArray(target) ? "length" : ITERATE_KEY;
      addRunners(effects, computedRunners, depsMap.get(iterationKey));
    }
  }
  const run = (effect: ReactiveEffect) => {
    scheduleRun(effect, target, type, key, extraInfo);
  };
  // 考虑到 在普通的 effect 中可能会使用 computed
  // 所以需要先执行 computed 的 effect，使得读取到最新的值
  computedRunners.forEach(run);
  effects.forEach(run);
}


function addRunners(
  effects: Set<ReactiveEffect>,
  computedRunners: Set<ReactiveEffect>,
  effectsToAdd: Set<ReactiveEffect> | undefined
) {
  if (effectsToAdd !== undefined) {
    effectsToAdd.forEach(effect => {
      if (effect.options.computed) {
        computedRunners.add(effect);
      } else {
        effects.add(effect);
      }
    });
  }
}

function scheduleRun(
  effect: ReactiveEffect,
  target: object,
  type: TriggerOpTypes,
  key: unknown,
  extraInfo?: DebuggerEventExtraInfo
) {
  if (effect.options.onTrigger) {
    const event: DebuggerEvent = {
      effect,
      target,
      key,
      type
    };
    effect.options.onTrigger(extraInfo ? extend(event, extraInfo) : event);
  }
  if (effect.options.scheduler) {
    effect.options.scheduler(effect);
  } else {
    effect();
  }
}

export function stop(effect: ReactiveEffect) {
  if (effect.active) {
    cleanup(effect);
    if (effect.options.onStop) {
      effect.options.onStop();
    }
    effect.active = false;
  }
}
