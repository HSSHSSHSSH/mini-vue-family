import { createPinia, defineStore } from './my_pinia'
import { ref, computed } from 'vue'

const  h_pinia = createPinia()

export const useHOptionsStore = defineStore('hOptions', {
  state:() => {
    return {
      count: 1
    }
  },
  getters: {
    doubleCount(state: any) {
      return state.count * 2;
    }
  },
  actions: {
    increment() {
      this.count++;
      console.log('蛙叫你', this)
    }
  }
})

export const useHSetupStore = defineStore('hSetup', () => {
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

export default h_pinia