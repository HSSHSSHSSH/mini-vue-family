<template>
  <div>
    哇的 pinia demo
  </div>
  <!-- <div>
    <div>h options store</div>
    <div>h_pinia count: {{ hOptionsStoreCount }}</div>
    <div>h_pinia doubleCount {{ hOptionsStoreDoubleCount }}</div>
    <button @click="hOptionsStoreIncrement">h_pinia actions increment</button>
    <button @click="hOptionsStorePatch">h options patch</button>
    <button @click="hOptionsStoreReset">h options reset</button>
  </div> -->
  <div>
    <div> h setupStore </div>
    <div> state {{ setupStoreCount }} </div>
    <div> state {{ setupStore.count }} </div>
    <div> getters {{ setupStore.trebleCount }} </div>
    <div>getters {{ setupStoreTrebleCount }} </div>
    <button @click="setupStoreIncrement">actions</button>
    <button @click="setupPatch">setup patch</button>
    <button @click="setupReset">setup reset</button>
    <button @click="addSubscription">添加订阅</button>
    <button @click="removeSubscription">移除订阅</button>
  </div>
</template>

<script setup lang="ts">
import { useHOptionsStore, useHSetupStore } from '../../hPinia'
import { storeToRefs } from '../../my_pinia'
// options store
// const hOptionsStore = useHOptionsStore()
// console.log('hOptionsStore', hOptionsStore)
// const refHOptionsStore = storeToRefs(hOptionsStore)
// console.log('ref options store', refHOptionsStore)
// const hOptionsStoreCount = refHOptionsStore.count
// const hOptionsStoreDoubleCount = refHOptionsStore.doubleCount
// const hOptionsStoreIncrement = hOptionsStore.increment
// let hOptionsStorePatch = () => {
//   hOptionsStore.$patch({
//     count: 22,
//   })
// }
// let hOptionsStoreReset = () => {
//   hOptionsStore.$reset()
// }
// hOptionsStore.$subscribe(() => {
//   console.log('响应 h_store 中 state 的变化')
// })
// hOptionsStore.$onAction(() => {
//   console.log('响应 h_store 中 action 的变化')
// })

// setup store
const setupStore = useHSetupStore()
const refSetupStore = storeToRefs(setupStore)
const setupStoreCount = refSetupStore.count
const setupStoreTrebleCount = refSetupStore.trebleCount
let setupStoreIncrement = setupStore.increment
let setupPatch = () => {
  setupStore.$patch({
    count: 33,
  })
}
let setupReset = setupStore.$reset
let removeSubscription: any = () => {}
function addSubscription() {
  removeSubscription = setupStore.$subscribe((mutation: any, state: any) => {
    console.log('响应 h_store 中 state 的变化', mutation, state)
  })
}
// function addSubscription() {
//   setupStore.$onAction(() => {
//     console.log('响应 h_store 中 action 的变化')
//   })
// }
</script>

<style scoped></style>
