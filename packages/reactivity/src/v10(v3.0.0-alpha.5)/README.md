# V10(v3.0.0-alpha.5)

v3.0.0-alpha.5 相较于 v3.0.0-alpha.4的改动在于

- [perf(reactivity): better computed tracking (#710)](https://github.com/vuejs/core/commit/8874b21a7e2383a8bb6c15a7095c1853aa5ae705)
  > 使用`track`和`trigger`来优化`computed` 依赖收集与触发更新。
- [fix(reactivity): avoid cross-component dependency leaks in setup()](https://github.com/vuejs/core/commit/d9d63f21b1e6f99f2fb63d736501095b131e5ad9)
  > 在`setup`函数执行之前,停止依赖收集,避免因多个组件同时初始化导致依赖收集混乱
- [fix(computed): support arrow function usage for computed option](https://github.com/vuejs/core/commit/2fb7a63943d9d995248cb6d2d4fb5f22ff2ac000)
  > `ComputedGetter`类型支持接收一个参数，因为Vue的`computed`选项的getter函数的第一个参数应该是能够访问到vue示例的
- [fix(reactivity): trigger iteration effect on Map.set](https://github.com/vuejs/core/commit/e1c9153b9ed71f9b2e1ad4f9018c51d239e7dcd0)
  > 解决在`Map`中使用`set`方法时，对Map的迭代操作没有触发更新的问题
- [fix(reactivity): effect should handle self dependency mutations](https://github.com/vuejs/core/commit/e8e67729cb7649d736be233b2a5e00768dd6f4ba)
  > 避免因在 effect 中使用自增操作导致无限循环调用
