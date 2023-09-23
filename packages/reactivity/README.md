## effect

`effect`可以称为副作用函数
effect函数的执行会直接或影响其他函数的执行，这时候我们说effect函数产生了副作用函数

## 响应式数据

假设存在如下代码

```js
const obj = { text: "hello world" };
function effect() {
  document.innerText = obj.text;
}
```

当`obj.text`发生变化的时候，我们希望`effect`函数能够执行
如果能实现这个功能，我们就说`obj`是响应式数据

## 响应式数据的基本实现

执行`effect`的时候会触发`obj.text`的读取操作，我们可以把副作用函数effect存储到一个"桶"里
当`obj.text`发生变化的时候，我们再从"桶"里取出`effect`函数并执行

## 依赖

依赖是存储在"桶"里的副作用函数的集合
当响应式数据发生变化的时候，会从"桶"里取出依赖并执行
依赖 = 包含有响应式数据的副作用函数
