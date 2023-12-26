import { reactive, effectScope, computed } from 'vue'
import { forEachValue, isObject, isPromise, partial } from './util'



export function genericSubscribe (fn: any, subs: Array<Function>, options: any) {
  if(subs.indexOf(fn) < 0) {
    options && options.prepend
    ? subs.unshift(fn)
    : subs.push(fn)
  }

  return () => { // 返回取消订阅函数
    const i = subs.indexOf(fn)
    if (i > -1) {
      subs.splice(i, 1)
    }
  }
}


export function resetStoreState(store: any, state: any) {
  // 初始化 hStore 的 getters
  store.getters = {}
  // 初始化本地 getters 缓存
  store._makeLocalGettersCache = Object.create(null)
  const wrappedGetters = store._wrappedGetters
  const computedObj: any = {}
  const computedCache: any = {}
  const scope = effectScope()
  scope.run(() => {
    forEachValue(wrappedGetters, (fn: Function, key: any) => {
      computedObj[key] = partial(fn, store)
      computedCache[key] = computed(() => computedObj[key]())
      Object.defineProperty(store.getters, key, {
        get: () => computedCache[key].value,
        enumerable: true, // for local getters
      })
    })
  })

  // 初始化 hStore 的 state
  store._state = reactive({
    data: state,
  })
}

function makeLocalContext(store: any, namespace: any, path: any) {
  const noNamespace = namespace === ''
  const local = {
    dispatch: noNamespace ? store.dispatch : (_type: any, _payload: any, _options: any) => {
      const args = unifyObjectStyle(_type, _payload, _options)
      const { payload, options } = args
      if(!options || !options.root) {
        _type = namespace + _type
        if(!store._actions[_type]) {
          console.error(`[vuex] unknown local action type: ${args.type}, global type: ${_type}`)
          return
        }
      }
      console.log('---local dispatch', _type, payload)
      return store.dispatch(_type, payload)
    },
    commit: noNamespace ? store.commit : (_type: any, _payload: any, _options: any) => {
      const args = unifyObjectStyle(_type, _payload, _options)
      let {type} = args
      const {payload, options} = args
      if(!options || !options.root) {
        type = namespace + type
        if(!store._mutations[type]) {
          console.error(`[vuex] unknown local mutation type: ${args.type}, global type: ${type}`)
          return
        }
      }
      store.commit(type, payload, options)
    },
  }

  // getters and state object must be gotten lazily
  // because they will be changed by state update
  Object.defineProperties(local, {
    getters: {
      get: noNamespace
        ? () => store.getters
        : () => makeLocalGetters(store, namespace)
    },
    state: {
      get: () => getNestedState(store.state, path)
    }
  })
  return local
}

function makeLocalGetters(store: any, namespace: any) {
  if (!store._makeLocalGettersCache[namespace]) {
    const gettersProxy: any = {}
    const splitPos = namespace.length
    Object.keys(store.getters).forEach(type => {
      // skip if the target getter is not match this namespace
      if (type.slice(0, splitPos) !== namespace) return

      // extract local getter type
      const localType = type.slice(splitPos)

      // Add a port to the getters proxy.
      // Define as getter property because
      // we do not want to evaluate the getters in this time.
      Object.defineProperty(gettersProxy, localType, {
        get: () => store.getters[type],
        enumerable: true,
      })
    })
    store._makeLocalGettersCache[namespace] = gettersProxy
  }

  return store._makeLocalGettersCache[namespace]
}

export function getNestedState (state:any, path: any) {
  return path.reduce((state:any, key: any) => state[key], state)
}

export function installModule(
  store: any,
  rootState: any,
  path: any,
  module: any,
  hot?: any,
) {
  const isRoot = !path.length
  const namespace = store._modules.getNamespace(path)
  if (module.namespaced) {
    // 处理带命名空间的模块
    if(store._modulesNamespaceMap[namespace]) {
      console.error(`[vuex] duplicate namespace ${namespace} for the namespaced module ${path.join('/')}`)
    }
    store._modulesNamespaceMap[namespace] = module
    

  }
  if (!isRoot && !hot) {
    // 处理热更新
    const parentState = getNestedState(rootState, path.slice(0, -1))
    const moduleName = path[path.length - 1]
    store._withCommit(() => {
      if(moduleName in parentState) {
        return console.error(`[vuex] state field "${moduleName}" was overridden by a module with the same name at "${path.join('.')}"`)
      }
      parentState[moduleName] = module.state
    })    
  }

  const local = (module.context = makeLocalContext(store, namespace, path))

  module.forEachGetter((getter: any, key: any) => {
    const namespacedType = namespace + key
    registerGetter(store, namespacedType, getter, local)
  })
  module.forEachMutation((mutation: any, key: any) => {
    const namespacedType = namespace + key
    registerMutation(store, namespacedType, mutation, local)
  })
  module.forEachAction((action: any, key: any) => {
    const type = action.root ? key : namespace + key
    const handler = action.handler || action
    registerAction(store, type, handler, local)
  })
  // 循环处理 modules
  module.forEachChild((child: any, key: any) => {
    installModule(store, rootState, path.concat(key), child, hot)
  })
}


function registerGetter(store: any, type: any, rawGetter: any, local: any) {
  store._wrappedGetters[type] = function wrappedGetter(store: any) {
    return rawGetter(
      local.state, // local state
      local.getters, // local getters
      store.state, // root state
      store.getters, // root getters
    )
  }
}


function registerMutation (store:any, type:any, handler: any, local:any) {
  const entry = store._mutations[type] || (store._mutations[type] = [])
  entry.push(function wrappedMutationHandler (payload: any) {
    handler.call(store, local.state, payload) // 将local state 注入 mutation 中
  })
}

function registerAction (store:any, type:any, handler:any, local:any) {
  const entry = store._actions[type] || (store._actions[type] = [])
  entry.push(function wrappedActionHandler (payload: any) {
    let res = handler.call(
      store,
      {
        dispatch: local.dispatch,
        commit: local.commit,
        getters: local.getters,
        state: local.state,
        rootGetters: store.getters,
        rootState: store.state,
      },
      payload,
    )
    if (!isPromise(res)) {
      res = Promise.resolve(res)
    }
    return res
  })
}


export function unifyObjectStyle (type: any, payload: any, options?: any) {
  if (isObject(type) && type.type) {
    options = payload
    payload = type
    type = type.type
  }


  return { type, payload, options }
}