import { createPinia, defineStore } from 'pinia';
import {computed, ref} from 'vue'

const pinia = createPinia();

// export const useOptionsStore = defineStore('myOptions', {
//   state:() => {
//     return {
//       count: 1
//     }
//   },
//   getters: {
//     doubleCount(state) {
//       return state.count * 2;
//     }
//   },
//   actions: {
//     increment() {
//       console.log('乌迪尔', this)
//       this.count++;
//     }
//   }
// })

export const useSetupStore = defineStore('mySetup', () => {
  const count = ref(3)
  const trebleCount = computed(() => count.value * 3)
  const increment = () => {
    count.value+=5
  }
  const $reset = () => {
    count.value = 3
  }
  return {
    count,
    trebleCount,
    increment,
    $reset
  }
})


export default pinia;