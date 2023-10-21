# V3

该版本主要是解决在分之前换场景下可能会出现的遗留副作用函数的问题。

- 在effectFn上新增`deps`属性，`deps`是与effectFn存在联系的依赖集合(即`bucket -> target -> key`结构)。目的是为了从`bucket`中删除所有的当前副作用函数。
  > 设计成一个数据结构，是因为一个副作用函数可能会依赖多个响应式数据对象，对应多个Set
- 在`track`内，将依赖集合`deps`添加到`activeEffect.deps`中。
- 在执行副作用函数之前，先从该副作用函数内所有的响应式数据对象的依赖集合中，删除该副作用函数。即重新收集该副作用函数内的依赖结构。
- 新增 `cleanup` 函数，该函数用于清空副作用函数的依赖集合。

## 分支切换可能会产生遗留的副作用函数

假设存在如下片段

```js
const data = {
  ok: true,
  text: "hello world"
}
const obj = reactive(data)
effect(() => {
  document.body.innerText = obj.ok ? obj.text : "not"
})
```

当`obj.ok`的值发生变化时，代码执行的分支也会跟着变化

---

初始情况下，上述代码的副作用函数与响应式数据之间的联系如下

```txt
target
├─ ok
    ├─ effectFn
├─ text
    ├─ effectFn
```

当obj.ok的值修改为false，并触发副作用函数重新执行后，
由于此时字段obj.text不会被读取，
只会触发obj.ok的读取操作，
所以理想情况下副作用函数不应该被字段obj.text所对应的依赖集合收集

但是目前还做不到这一点
也就是说，当我们把字段obj.ok的值修改为false，副作用函数重新执行，document.innerText的值是"not"
如果再上市修改obj.text的值，这**仍然会导致副作用函数重新执行**，
但是这次重新执行是没有必要的，因为obj.ok依旧为false，document.innerText的值依旧是"not"
**这就产生了遗留的副作用函数，而遗留的副作用函数会导致不必要的更新**

``` ts
function trigger(target: object, key: string | symbol) {
  // 执行 `obj.text = 'xxx'` 时，会把到初始情况下存储的副作用函数(初始时obj.ok是true，所以能够访问obj.text)，取出并执行
  const effects = bucket.get(target)?.get(key);
  effects?.forEach(fn => fn());
}
```

## 疑问

为什么要把依赖集合放在副作用函数的`deps`属性上，为什么不创建一个新的的`WeakMap<Effect, Deps[]>`，以副作用函数为键值
