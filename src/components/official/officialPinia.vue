<template>
  <!-- <div>
    <div>options store</div>
    <div>state {{ optionsCount }}</div>
    <div>state {{ optionsStore.count }}</div>
    <div>getters {{ optionsCountDouble }}</div>
    <div>getters {{ optionsStore.doubleCount }}</div>
    <button @click="optionsIncrement">actions</button>
    <button @click="optionsPatch">options patch</button>
    <button @click="optionsReset">options reset</button>
  </div> -->
  <div>
    <div>setup store</div>
    <div>state {{ setupStoreCount }}</div>
    <div>state {{ setupStore.count }}</div>
    <div>getters {{ setupStore.trebleCount }}</div>
    <div>getters {{ setupStoreTrebleCount }}</div>
    <button @click="setupStoreIncrement">actions</button>
    <button @click="setupPatch">setup patch</button>
    <button @click="setupReset">setup reset</button>
  </div>
</template>

<script setup lang="ts">
  import { useSetupStore} from '../../pinia'
  import {storeToRefs} from 'pinia'
  // options store
  // const optionsStore = useOptionsStore()
  // console.log('optionsStore', optionsStore)
  // const refOptionsStore = storeToRefs(optionsStore)
  // let optionsCount = refOptionsStore.count
  // let optionsCountDouble = refOptionsStore.doubleCount
  // let optionsIncrement = optionsStore.increment
  // let optionsPatch = () => {
  //   optionsStore.$patch({
  //     count: 22
  //   })
  // }
  // let optionsReset = () => {
  //   optionsStore.$reset()
  // }
  // setup store
  const setupStore = useSetupStore()
  const refSetupStore = storeToRefs(setupStore)
  const setupStoreCount = refSetupStore.count
  const setupStoreTrebleCount = refSetupStore.trebleCount
  let setupStoreIncrement = setupStore.increment
  let setupPatch = () => {
    setupStore.$patch({
      count: 33
    })
  }
  let setupReset = setupStore.$reset
  setupStore.$subscribe((mutation: any, state: any) => {
    console.log('mutation', mutation)
    console.log('state', state)
  })

</script>

<script lang="ts">
export default {
  name: 'App',
  data() {
    return {}
  },
  computed: {
  },
  mounted() {
    
  },
  methods: {
    
  },
}
</script>

<style scoped></style>
