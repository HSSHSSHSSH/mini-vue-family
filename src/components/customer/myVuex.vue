<template>
  <div>
    h_vex demo
    <div> sttaeA: {{ stateA.count }}  {{ stateA.id }}</div>
    <div> sttaeB: {{ stateB.count }} {{ stateA.id }}</div>
    <button @click="myDispatch">dispatch</button>

  </div>
</template>

<script setup lang='ts'>
import { useHStore, mapState } from '../../h_vuex'
import { computed } from 'vue'
const hStore: any = useHStore()
console.log('hStore', hStore)
const stateA = hStore.state.a
const stateB = hStore.state.b
const myDispatch = () => {
  hStore.dispatch('a/increment')
}

const storeStateA = mapState('a', ['count', 'id'])
const count = computed(storeStateA.count)
console.log('count', count)
</script>

<script lang="ts">

export default {
  computed: {
    ...mapState('a',{
      count: (state:any) => state.count,
      id: (state:any) => state.id,
    })
  },

  beforeCreate() {
    console.log('beforeCreate', this)
  },
  created() {
    console.log('created', this)
  },
  mounted() {
    console.log('mounted', this)
  }
}

</script>


<style scoped>

</style>