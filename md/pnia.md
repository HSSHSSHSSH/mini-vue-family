# Pinia

## createPinia 与 defineStore

### createPinia 做了什么

- 不知道 scope 是干嘛的 todo
- 初始化 pinia 实例
- 将 pinia 实例 注入 app 中

### defineStore 做了什么

- 确定要操作的 pinia 实例
- 创建所需的 optionsStore 或 setupStore 将其存入 pinia 中
- 返回 useStore 函数

### setupStore 的创建流程

- 初始化 pinia store 中的通用数据及方法，如 $subscribe, $onAction 等
- 初始化用户定义的数据，即定义 setup store 是函数返回的数据
- 合并以上两种数据为最终 store

### optionsStore 的创建流程

- 根据用户传入的 options 定义 setup 函数，将 state 转换为 ref，将 getters 转换为 computed，并与组合 actions 为新的对象作为初始用户定义的数据
- 按照 setupStore 的创建流程进行 

### createPinia 与 defineStore 的关联

createPinia 函数创建 pinia 实例，defineStore 函数创建 store 实例并将其存入 pinia 中，并返回 useStore 函数，在使用 store 实例时，调用 useStore 函数，在 pinia 实例中找到对应的 store 并返回
