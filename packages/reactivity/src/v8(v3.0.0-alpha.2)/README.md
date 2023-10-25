# V8(v3.0.0-alpha.2)

v3.0.0-alpha.2 相较于 v3.0.0-alpha.1的改动在于

- 更新了`isRef`的类型重载([types: improve isRef typing (#578)](https://github.com/vuejs/core/commit/985f4c91d9d3f47e1314d230c249b3faf79c6b90))
- 针对于Map、Set等类型，他们的key可能是一个reactive对象，所以在删除时，需要将key的值转为原始类型([fix(reactivity): should delete observe value (#598)](https://github.com/vuejs/core/commit/63a656310676e3927b2e57d813fd6300c0a42590))

> 本项目没有实现Map、Set等类型的响应式，所以Vue的这个改动没有影响到本项目
