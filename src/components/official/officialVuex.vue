<template>
  <div>
    官方 vuex demo
    <div>stateA: {{ stateA.count }} {{ stateA.id }}</div>
    <div>stateB: {{ stateB.count }} {{ stateA.id }}</div>
    <button @click="myDispatch">dispatch</button>
  </div>
</template>

<script setup lang='ts'>
import { useStore, mapState } from 'vuex';
const store:any = useStore();

console.log('store', store);

const stateA = store.state.a;
const stateB = store.state.b;

const storeStateA = mapState(['count', 'name']);
console.log('storeStateA', storeStateA);



const myDispatch = () => {
  store.dispatch('a/increment');
}




</script>

<script lang="ts">
  // export default {
  //   computed: {
  //     ...mapState(['count', 'name'])
  //   },
  //   mounted() {
  //     console.log('storeStateA', this.count, this.name)
  //   }
  // }
</script>

<style scoped>

</style>