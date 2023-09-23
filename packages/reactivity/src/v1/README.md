需要在副作用函数与被操作的属性的字段之间，建立一个联系

```js
const obj = reactive({ a: 1 });
effect(() => {
  dummy = obj.a;
});
```

这段代码存在3个角色

- 被读取的代理对象`obj`，在此将其表示为`target`
- 被读取的属性`a`, 在此将其表示为`key`
- 使用effect函数注册的副作用函数, 在此将其表示为`effectFn`

需要将三者建立如下关系，建立一个树形结构

``` txt
target
├─ key
    ├─ effectFn
```

如果有两个副作用函数同时读取同一个对象的属性

```txt
target
├─ key
    ├─ effectFn1
    ├─ effectFn2
```

如果一个副作用函数读取同一个对象的两个不同属性

```txt
target
├─ key1
    ├─ effectFn
├─ ke2
    ├─ effectFn
```
