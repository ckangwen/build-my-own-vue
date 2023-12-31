# V4

- 新增了`effectStack`，用于解决在effect嵌套时，内层effect会覆盖外层effect的问题
- 更新了`activeEffect`的赋值逻辑，在effectFn执行完毕后再次赋值，指向`effectStack`栈顶的副作用函数(即从内层的effectFn指向外层的effectFn)，使其能够支持effect嵌套

## 嵌套的effect与effect栈

如果effect不支持嵌套会发生什么

```js
effect(function effectFn1() {
  console.log("effectFn1 执行");

  effect(function effectFn2() {
    console.log("effectFn2 执行");
    tmp2 = obj.bar;
  })

  tmp1 = obj.foo;
})
```

当我们修改obj.foo时会触发effectFn1执行，由于effectFn2嵌套在effectFn1里，所以会间接触发effectFn2执行
而当修改obj.bar时，只会触发effectFn2

实际结果

```txt
effectFn1 执行
effectFn2 执行
effectFn2 执行
```

第一次是 effectFn1初始执行
第二次是 effectFn2初始执行
第三次期望的是effectFn1因修改obj.foo而重新执行，但是却使得effectFn2重新执行

问题出现在`activeEffect`上

```ts
export function effect(fn: Function) {
  const effectFn = (() => {
    cleanup(effectFn);
    activeEffect = effectFn;
    fn();
  }) as Effect;

  effectFn.deps = [];
  effectFn();
}
```

我们用全局变量`activeEffect`来存储通过effect函数注册的副作用函数，
这意味着同一时刻`activeEffect`所存储的副作用函数只能有一个
当副作用函数发生嵌套时，**内层副作用函数的执行会覆盖`activeEffect`的值**
并且永远不会恢复到原先的值

这个时候如果再有响应式数据进行依赖收集，
即使这个响应式数据是在外层副作用函数中读取的，
他们收集到的副作用函数也会时内层副作用函数

为了解决这个问题，需要一个副作用函数栈

```ts
export function effect(fn: Function) {
  const effectFn = (() => {
    cleanup(effectFn);
    activeEffect = effectFn;
    effectStack.push(effectFn);
    fn();
    effectStack.pop();
    activeEffect = effectStack[effectStack.length - 1];
  }) as Effect;

  effectFn.deps = [];

  effectFn();
}
```

在副作用函数执行时，将当前副作用函数压入栈中，
待副作用函数执行完毕后将其从栈中弹出，
并始终让 activeEffect 指向栈顶的副作用函数

## 避免无限递归循环

```js
effect(() => {
  obj.foo = obj.foo + 1;
})
```

如果在`effect`内存在自增操作，既读取又赋值，那么会导致无限调用effectFn

1. effect(fn) -> fn()
2. get handler -> track()
3. set handler -> trigger() -> fn()
4. get handler -> track()
5. ...

**问题原因是读取和赋值是在同一个副作用函数内进行的**
此时无论是`track`时要收集的副作用函数，还是`trigger`时要触发执行的副作用函数，都是同一个`activeEffect`

基于此，我们可以在`trigger`发生时增加条件：如果`trigger`触发执行的副作用函数与当前正在执行的副作用函数相同，则不触发执行

```ts
function trigger(target: object, key: string | symbol) {
  const effects = bucket.get(target)?.get(key);
  if (!effects) {
    return;
  }

  // 重新执行fn的时候会重新收集副作用函数，会导致 effects 无限增加
  const effectsToRun = new Set<Effect>();
  effects.forEach(fn => {
    // 如果正在执行的函数 与 将要执行的副作用函数 相同，则忽略，否则会出现无限调用这个函数的问题
    if (fn !== activeEffect) {
      effectsToRun.add(fn);
    }
  });
  effectsToRun.forEach(fn => fn());
}
```

这样就能够避免无限递归调用了
