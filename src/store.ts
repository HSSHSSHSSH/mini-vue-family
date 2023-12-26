import { createStore  } from 'vuex'


const moduleA = {
    namespaced: true,
    state() {
      return {
        count: 1,
        id: 'A'
      }
    },
    mutations: {
      increment(state: any) {
        console.log('moduleA increment')
        state.count++
      },
     
    },
    getters: {
      getter1: (state: any, getters: any, rootState: any) => {
        return state.count * 10
      },
      getter2: (state: any) => {
        return state.count * 20
      }
    },
    actions: {
      increment({ commit }: any) {
        console.log('moduleA dispatch')
        commit('increment')
      },
      add: {
        root: true,
        handler: ({ commit }: any) => {
          console.log('addddd')
          commit('increment')
        }
      }
    }
}

const moduleB = {
  state() {
    return {
      count: 2,
      id: 'B'
    }
  },
  mutations: {
    increment(state: any) {
      console.log('moduleB increment')
      state.count++
    }
  },
  getters: {
    getter3: (state: any) => {
      return state.count * 30
    },
    getter4: (state: any) => {
      return state.count * 40
    }
  },
  actions: {
    increment({ commit }: any) {
      console.log('moduleB dispatch')
      commit('increment')
    }
  
  }
}


const store = createStore({
  modules: {
    a: moduleA,
    b: moduleB
  },
  state() {
    return {
      count: 3,
      name: 'root',
      isRoot: true,
    }
  },
  mutations: {
    increment(state: any) {
      state.count++
    },
    double(state: any) {
      state.count *= 2
      console.log('double 处理完成')
    }
  },
  getters: {
    getter5: (state: any) => {
      return state.count * 50
    },
    getter6: (state: any) => {
      return state.count * 60
    }
  },
  actions: {
    increment({ commit }: any) {
      console.log('root dispatch')
      commit('increment')
    }
  }
})


export default store