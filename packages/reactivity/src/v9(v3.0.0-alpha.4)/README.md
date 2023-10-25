# V9(v3.0.0-alpha.4)

v3.0.0-alpha.4 相较于 v3.0.0-alpha.2的改动在于

- 在对数据进行`includes`, `indexOf`, `lastIndexOf`操作时，需要将调用者和入参进行`toRaw`操作，否则执行函数的是proxy对象，而不是原始对象，导致在进行对象类型的运算时结果不正确([fix(reactivity): Array methods relying on identity should work with raw values](https://github.com/vuejs/core/commit/aefb7d282ed716923ca1a288a63a83a94af87ebc))

> const arr = reactive({}, obj)
> arr.indexOf(obj) // -1
> arr 内的数据都是proxy对象，而indexOf传入的是原始对象，所以检索不到数据
