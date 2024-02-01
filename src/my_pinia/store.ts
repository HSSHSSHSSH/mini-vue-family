import {
  StateTree,
  _GettersTree,
  _ActionsTree,
  DefineStoreOptions,
  StoreDefinition,
  DefineSetupStoreOptions,
  _ExtractStateFromSetupStore,
  _ExtractGettersFromSetupStore,
  StoreGeneric,
  _ExtractActionsFromSetupStore,
  _Method,
  Store,
  DefineStoreOptionsInPlugin,
  SubscriptionCallback,
  StoreOnActionListener,
  _DeepPartial,
  SubscriptionCallbackMutation,
  MutationType,
  isPlainObject,
  _StoreWithState,
  _StoreWithGetters,
  
} from './type'

import { Pinia, piniaSymbol, activePinia, setActivePinia } from './rootStore'
import {
  getCurrentInstance,
  hasInjectionContext,
  inject,
  reactive,
  markRaw,
  EffectScope,
  ref,
  WatchOptions,
  DebuggerEvent,
  UnwrapRef,
  nextTick,
  isRef,
  isReactive,
  Ref,
  watch,
  effectScope,
  ComputedRef,
  toRef,
  toRaw,
  computed,
  toRefs
} from 'vue'
import { IS_CLIENT } from './env'
import { del, isVue2, set } from './myUtil'
import { addSubscription, noop, triggerSubscriptions } from './subscriptions'
import { patchObject } from './hmr'

const { assign } = Object
type _ArrayType<AT> = AT extends Array<infer T> ? T : never
const fallbackRunWithContext = (fn: () => unknown) => fn()
function isComputed<T>(value: ComputedRef<T> | unknown): value is ComputedRef<T>
function isComputed(o: any): o is ComputedRef {
  return !!(isRef(o) && (o as any).effect)
}


export type StoreState<SS> = SS extends Store<
  string,
  infer S,
  _GettersTree<StateTree>,
  _ActionsTree
>
  ? UnwrapRef<S>
  : _ExtractStateFromSetupStore<SS>

  export type StoreGetters<SS> = SS extends Store<
  string,
  StateTree,
  infer G,
  _ActionsTree
>
  ? _StoreWithGetters<G>
  : _ExtractGettersFromSetupStore<SS>

const skipHydrateMap = /*#__PURE__*/ new WeakMap<any, any>()
const skipHydrateSymbol = __DEV__
  ? Symbol('pinia:skipHydration')
  : /* istanbul ignore next */ Symbol()
function shouldHydrate(obj: any) {
  return isVue2
    ? /* istanbul ignore next */ !skipHydrateMap.has(obj)
    : !isPlainObject(obj) || !obj.hasOwnProperty(skipHydrateSymbol)
}

function mergeReactiveObjects<
  T extends Record<any, unknown> | Map<unknown, unknown> | Set<unknown>
>(target: T, patchToApply: _DeepPartial<T>): T {
  if (target instanceof Map && patchToApply instanceof Map) {
    patchToApply.forEach((value, key) => target.set(key, value))
  }

  if (target instanceof Set && patchToApply instanceof Set) {
    patchToApply.forEach(target.add, target)
  }

  for (let key in patchToApply) {
    if (!patchToApply.hasOwnProperty(key)) continue // 避免遍历原型链上的属性
    const subPatch = patchToApply[key]
    const targetValue = target[key]
    if (
      isPlainObject(targetValue) &&
      isPlainObject(subPatch) &&
      target.hasOwnProperty(key) &&
      !isRef(subPatch) &&
      !isReactive(subPatch)
    ) {
      // 是一个普通的对象
      target[key] = mergeReactiveObjects(targetValue, subPatch)
    } else {
      // @ts-expect-error
      target[key] = subPatch
    }
  }

  return target
}

export function defineStore<
  Id extends string,
  S extends StateTree,
  G extends _GettersTree<S>,
  A = {}
>(
  id: Id,
  options: Omit<DefineStoreOptions<Id, S, G, A>, 'id'>,
): StoreDefinition<Id, S, G, A>

export function defineStore<
  Id extends string,
  S extends StateTree = {},
  G extends _GettersTree<S> = {},
  // cannot extends ActionsTree because we loose the typings
  A /* extends ActionsTree */ = {}
>(options: DefineStoreOptions<Id, S, G, A>): StoreDefinition<Id, S, G, A>

export function defineStore<Id extends string, SS>(
  id: Id,
  storeSetup: () => SS,
  options?: DefineSetupStoreOptions<
    Id,
    _ExtractStateFromSetupStore<SS>,
    _ExtractGettersFromSetupStore<SS>,
    _ExtractActionsFromSetupStore<SS>
  >,
): StoreDefinition<
  Id,
  _ExtractStateFromSetupStore<SS>,
  _ExtractGettersFromSetupStore<SS>,
  _ExtractActionsFromSetupStore<SS>
>

export function defineStore(idOrOptions: any, setup?: any, setupOptions?: any) {
  let id: string
  let options:
    | DefineStoreOptions<
        string,
        StateTree,
        _GettersTree<StateTree>,
        _ActionsTree
      >
    | DefineSetupStoreOptions<
        string,
        StateTree,
        _GettersTree<StateTree>,
        _ActionsTree
      >
  const isSetupStore = typeof setup === 'function'
  if (typeof idOrOptions === 'string') {
    id = idOrOptions
    options = isSetupStore ? setupOptions : setup
  } else {
    options = idOrOptions
    id = idOrOptions.id
    if (__DEV__) {
      console.error('id 得是字符串，潮吗？？')
    }
  }

  function useStore(pinia?: Pinia | null, hot?: StoreGeneric): StoreGeneric {
    const hasContext = hasInjectionContext()

    pinia =
      (__TEST__ && activePinia && activePinia._testing ? null : pinia) ||
      (hasContext ? inject(piniaSymbol, null) : null)

    if (pinia) setActivePinia(pinia)

    if (__DEV__ && !activePinia) {
      // 检测 pinia 是否存在
      console.warn(
        '潮种，有 pinia 吗你就 get, 用 store 之前先给爷调用 app.use(pinia)!! 滚！！',
      )
    }

    pinia = activePinia!

    if (!pinia?._s.has(id)) {
      // 若当前 id 的 store 不存在，则创建
      if (isSetupStore) {
        createSetupStore(id, setup, options, pinia)
      } else {
        createOptionsStore(id, options as any, pinia)
      }

      if (__DEV__) {
        (useStore as any)._pinia = pinia
      }
    }

    const store: StoreGeneric = pinia?._s.get(id)!

    if (__DEV__ && hot) {
      const hotId = '__hot' + id
      const newStore = isSetupStore
        ? createSetupStore(hotId, setup, options, pinia, true)
        : createOptionsStore(hotId, assign({}, options) as any, pinia, true)

      hot._hotUpdate(newStore)

      delete pinia?.state.value[hotId]
      pinia?._s.delete(hotId)
    }

    if (__DEV__ && IS_CLIENT) {
      const currentInstance = getCurrentInstance()
      if (currentInstance && currentInstance.proxy && !hot) {
        const vm = currentInstance.proxy
        const cache: any = '_pStores' in vm ? vm._pStores : (vm._pStores = {})
        cache[id] = store
      }
    }

    return store as any
  }
  useStore.$id = id

  return useStore
}

function createSetupStore<
  Id extends string,
  SS extends Record<any, unknown>,
  S extends StateTree,
  G extends Record<string, _Method>,
  A extends _ActionsTree
>(
  $id: Id,
  setup: () => SS,
  options:
    | DefineSetupStoreOptions<Id, S, G, A>
    | DefineStoreOptions<Id, S, G, A> = {},
  pinia: Pinia,
  hot?: boolean,
  isOptionsStore?: boolean,
): Store<Id, S, G, A> {
  let scope!: EffectScope
  const optionsForPlugin: DefineStoreOptionsInPlugin<Id, S, G, A> = assign(
    { actions: {} as A },
    options,
  )

  if (__DEV__ && !pinia._e.active) {
    throw new Error('Pinia destroyed')
  }

  const $subscribeOptions: WatchOptions = {
    deep: true
  }

  if (__DEV__ && !isVue2) {
    $subscribeOptions.onTrigger = (event) => {
      if(isListening) {
        debuggerEvents = event
      } else if(isListening === false && !store._hotUpdating) {
        if(Array.isArray(debuggerEvents)) {
          debuggerEvents.push(event)
        } else {
          console.warn('debugger 得是一个 数组，这貌似是一个 pinia 内部 bug')
        }
      }
    }
  }

  // 内部 state 处理
  /**
   * isListening 与 isSyncListening 的作用
   * 在 $patch 与 partialStore（Store 实例的通用数据方法） 中使用
   * 在 subscribe 中使用
   */
  let isListening: boolean // 在最后设置为 true
  let isSyncListening: boolean // 在最后设置为 true
  let subscriptions: SubscriptionCallback<S>[] = [] // state 的订阅函数
  let actionsSubscriptions: StoreOnActionListener<Id, S, G, A>[] = [] // action 的订阅函数
  let debuggerEvents: DebuggerEvent[] | DebuggerEvent
  const initialState = pinia.state.value[$id] as UnwrapRef<S> | undefined

  // 避免 options store 被 setup 赋值
  if (!isOptionsStore && !initialState && (!__DEV__ || !hot)) {
    if (isVue2) {
      set(pinia.state.value, $id, {})
    } else {
      pinia.state.value[$id] = {}
    }
  }

  const hotState = ref({} as S)

  // 避免触发太多 listeners
  let activeListener: Symbol | undefined
  // 定义 patch 函数，功能为更新 state
  function $patch(stateMutation: (state: UnwrapRef<S>) => void): void
  function $patch(partialState: _DeepPartial<UnwrapRef<S>>): void
  function $patch(
    partialStateOrMutator:
      | _DeepPartial<UnwrapRef<S>>
      | ((state: UnwrapRef<S>) => void),
  ) {
    let subscriptionMutation: SubscriptionCallbackMutation<S>
    isListening = isSyncListening = false
    if (__DEV__) {
      debuggerEvents = []
    }
    if (typeof partialStateOrMutator === 'function') {
      partialStateOrMutator(pinia.state.value[$id] as UnwrapRef<S>)
      subscriptionMutation = {
        type: MutationType.patchFunction,
        storeId: $id,
        events: debuggerEvents as DebuggerEvent[],
      }
    } else {
      mergeReactiveObjects(pinia.state.value[$id], partialStateOrMutator)
      subscriptionMutation = {
        type: MutationType.patchObject,
        payload: partialStateOrMutator,
        storeId: $id,
        events: debuggerEvents as DebuggerEvent[],
      }
    }

    const myListenerId = (activeListener = Symbol())

    nextTick().then(() => {
      if (activeListener === myListenerId) {
        isListening = true
      }
    })
    isSyncListening = true
    triggerSubscriptions(
      subscriptions,
      subscriptionMutation,
      pinia.state.value[$id] as UnwrapRef<S>,
    )
  }
  // $reset 函数只存在 options store 中, 用于重置 state
  const $reset = isOptionsStore
    ? function $reset() {
        const { state } = options as DefineStoreOptions<Id, S, G, A>
        const newState = state ? state() : {}
        //@ts-expect-error
        this.$patch(($state: any) => {
          assign($state, newState)
        })
      }
    : __DEV__
    ? () => {
        console.warn('潮种，你在 setup store 里调用 $reset 有意思吗？要不是测试环境我特么抽你！')
      }
    : () => {
      console.warn('潮种，你在 setup store 里调用 $reset 有意思吗？')
    }

  // 定义 $dispose 函数，用于销毁 store
  function $dispose() {
    scope.stop()
    subscriptions = []
    actionsSubscriptions = []
    pinia._s.delete($id)
  }
  // wrapAction 函数，用于包装需要处理 subscription 的 action

  function wrapAction(name: string, action: _Method) {
    return function (this: any) {
      setActivePinia(pinia)
      const args = Array.from(arguments) // 用于保存 action 的参数

      const afterCallbackList: Array<(resolvedReturn: any) => any> = [] // 用于保存 action 执行后的回调函数
      const onErrorCallbackList: Array<(error: unknown) => unknown> = [] // 用于保存 action 执行出错时的回调函数
      function after(callback: _ArrayType<typeof afterCallbackList>) {
        // 用于注册 action 执行后的回调函数
        afterCallbackList.push(callback)
      }
      function onError(callback: _ArrayType<typeof onErrorCallbackList>) {
        // 用于注册 action 执行出错时的回调函数
        onErrorCallbackList.push(callback)
      }
      //@ts-expect-error
      triggerSubscriptions(actionsSubscriptions, {
        args,
        name,
        store,
        after,
        onError,
      })

      let ret: unknown

      try {
        ret = action.apply(this && this.$id === $id ? this : store, args)
      } catch (error) {
        triggerSubscriptions(onErrorCallbackList, error)
        throw error
      }

      if (ret instanceof Promise) {
        return ret
          .then((value) => {
            // 触发 afterCallbackList 中的回调函数
            triggerSubscriptions(afterCallbackList, value)
            return value
          })
          .catch((error) => {
            // 触发 onErrorCallbackList 中的回调函数
            triggerSubscriptions(onErrorCallbackList, error)
            throw error
          })
      }

      // 触发 afterCallbackList 中的回调函数

      triggerSubscriptions(afterCallbackList, ret)
      return ret
    }
  }

  // 用于确定最终 store 结构的合成材料
  const _hmrPayload = /*#__PURE__*/ markRaw({
    actions: {} as Record<string, any>,
    getters: {} as Record<string, Ref>,
    state: [] as string[],
    hotState,
  })

  // 另一个用于确定最终 store 结构的合成材料
  const partialStore = {
    _p: pinia,
    $id,
    $onAction: addSubscription.bind(null, actionsSubscriptions),
    $patch,
    $reset,
    $subscribe(callback, options = {}) {
      const removeSubscription = addSubscription(
        subscriptions,
        callback,
        options.detached,
        () => stopWatcher(),
      )

      const stopWatcher = scope.run(() => // 在移除监听时做的操作
        watch(
          () => pinia.state.value[$id] as UnwrapRef<S>,
          (state: any) => {
            if (options.flush === 'sync' ? isSyncListening : isListening) {
              callback(
                {
                  storeId: $id,
                  type: MutationType.direct,
                  events: debuggerEvents as DebuggerEvent,
                },
                state,
              )
            }
          },
          assign({}, $subscribeOptions, options),
        ),
      )!
      return removeSubscription
    },
    $dispose,
  } as _StoreWithState<Id, S, G, A>
  /* istanbul ignore if */
  if (isVue2) {
    // start as non ready
    partialStore._r = false
  }

  // 合成最终 store 结构
  const store: Store<Id, S, G, A> = (reactive(
    __DEV__ || (__USE_DEVTOOLS__ && IS_CLIENT)
      ? assign(
          { _hmrPayload, _customProperties: markRaw(new Set<string>()) },
          partialStore,
        )
      : partialStore,
  ) as unknown) as Store<Id, S, G, A>
  // 避免无线循环
  pinia._s.set($id, store as Store)

  const runWithContext =
    (pinia._a && pinia._a.runWithContext) || fallbackRunWithContext
  
  // 用于创建 setup store 确保正确的响应式与上下文环境？？？
  const setupStore = runWithContext(() =>
    pinia._e.run(() => (scope = effectScope()).run(setup)!),
  )!

  // 循环已存在的 actions 令其支持 $onActions
  /**
   * store 与 setupStore 的区别
   * 可认为 setupStore 是 用户定义的数据
   * store 中是 pinia._s 中需要的数据与函数
   * 只是一种为方便操作的写法
   */
  for(const key in setupStore){
    const prop = setupStore[key]
    if((isRef(prop) && !isComputed(prop)) || isReactive(prop)) { // 若是 ref 或 reactive
      // 将其看作一些需要序列化的 state
      if(__DEV__ && hot) {
        // 若是热更新，则将其保存到 hotState 中
        set(hotState.value, key, toRef(setupStore as any, key))
      } else if(!isOptionsStore) {
        // ??
        if(initialState && shouldHydrate(prop)) {
          if(isRef(prop)) {
            prop.value = initialState[key]
          } else {
            //@ts-expect-error prop 是 unknown 类型
            mergeReactiveObjects(prop, initialState[key])
          }
        }

        if(isVue2) {
          set(pinia.state.value[$id], key, prop)
        } else {
          pinia.state.value[$id][key] = prop
        }
      }
      if(__DEV__){
        _hmrPayload.state.push(key)
      }
    } else if(typeof prop === 'function') { // 若是 function
      //@ts-expect-error
      const actionValue = __DEV__ && hot ? prop : wrapAction(key, prop)
      if(isVue2) {
        set(setupStore, key, actionValue)
      } else {
        // @ts-expect-error
        setupStore[key] = actionValue 
      }

      if(__DEV__) {
        _hmrPayload.actions[key] = prop
      }
      //@ts-expect-error
      optionsForPlugin.actions![key] = prop
    } else if(__DEV__) {
      if(isComputed(prop)) {
        _hmrPayload.getters[key] = prop
        //@ts-expect-error
        ? options.getters[key]
        : prop

        if(IS_CLIENT) {
          const getters: string[] = 
            (setupStore._getters as string[]) ||
            //@ts-expect-error
            ((setupStore._getters = markRaw([])) as string[])
          getters.push(key)
        }

      }
    }
  }

  // 注册 state, getters, actions 属性
  if(isVue2) {
    Object.keys(setupStore).forEach((key) => {
      set(store, key, setupStore[key])
    })
  } else {
    // 兼容 storeToRefs()
    assign(store, setupStore)
    assign(toRaw(store), setupStore)
  }

  Object.defineProperty(store, '$state', {
    get: () => (__DEV__ && hot ? hotState.value : pinia.state.value[$id]),
    set: (state: any) => {
      if(__DEV__ && hot) {
        throw new Error('潮种，你在 setup store 里调用 $state 有意思吗？')
      }
      $patch(($state) => {
        assign($state, state) 
      })
    }
  })

  if(__DEV__) {
    //q: newStore 与 store 的区别
    //a: newStore 是热更新后的 store
    store._hotUpdate = markRaw((newStore: any) => {
      store._hotUpdating = true
      newStore._hmrPayload.state.forEach((stateKey:any) => {
        if(stateKey in store.$state) {
          const newStateTarget = newStore.$state[stateKey]
          const oldStateSource = store.$state[stateKey]
          if(
            typeof newStateTarget === 'object' &&
            isPlainObject(newStateTarget) &&
            isPlainObject(oldStateSource)
          ) {
            patchObject(newStateTarget, oldStateSource)
          } else {
            newStore.$state[stateKey] = oldStateSource
          }
        }
        set(store,stateKey, toRef(newStore.$state, stateKey))
      })
      // 删除已移除的属性
      Object.keys(store.$state).forEach((stateKey: any) => {
        if(!(stateKey in newStore)) {
          del(store, stateKey)
        }
      })

      isListening = false
      isSyncListening = false
      pinia.state.value[$id] = toRef(newStore._hmrPayload, 'hotState')
      isSyncListening = true
      nextTick().then(() => {
        isListening = true
      })

      // 处理 actions
      for(const actionName in newStore._hmrPayload.action) {
        const action: _Method = newStore[actionName]
        set(store, actionName, wrapAction(actionName, action))
      }

      // 处理 getters
      for(const getterName in newStore._hmrPayload.getters) {
        const getter: _Method = newStore._hmrPayload.getters[getterName]
        const getterValue = isOptionsStore
          ? computed(() => {
            setActivePinia(pinia)
            return getter.call(store, store)
          }): getter

        set(store, getterName, getterValue)
      }

      // 删除已移除的 getters
      Object.keys(store._hmrPayload.getters).forEach((key) => {
        if(!(key in newStore._hmrPayload.getters)) {
          del(store, key)
        }
      })
      
      // 删除旧的 actions
      Object.keys(store._hmrPayload.actions).forEach((key) => {
        if(!(key in newStore._hmrPayload.actions)) {
          del(store, key)
        }
      })

      store._hmrPayload = newStore._hmrPayload
      store._getters = newStore._getters
      store._hotUpdating = false



    })
  }

  if(__USE_DEVTOOLS__ && IS_CLIENT) {
    const nonEnumerable = {
      writable: true,
      configurable: true,
      enumerable: false,
    };
    (['_p', '_hmrPayload', '_getters', '_customProperties'] as const).forEach(
      (p: any) => {
        Object.defineProperty(
          store,
          p,
          assign({value: store[p]}, nonEnumerable),
        )
      }
    )
  }

  if (isVue2) {
    // mark the store as ready before plugins
    store._r = true
  }

  // 用于注册插件
  pinia._p.forEach((extender) => {
    if(__USE_DEVTOOLS__ && IS_CLIENT) {
      const extensions = scope.run(() => {
        extender({
          store: store as Store,
          app: pinia._a,
          pinia,
          options: optionsForPlugin
        })
      })!
      Object.keys(extensions || {}).forEach((key) => {
        store._customProperties.add(key)
      })
    } else {
      assign(
        store,
        scope.run(() => 
          extender({
            store: store as Store,
            app: pinia._a,
            pinia,
            options: optionsForPlugin
          })
        )!
      )
    }
  })

  if(
    __DEV__ &&
    store.$state &&
    typeof store.$state === 'object' &&
    typeof store.$state.constructor === 'function' &&
    !store.$state.constructor.toString().includes('[native code]')
  ) {
    console.warn('state 得是一个普普通通的对象')
  }

  // 仅当 store 为 options store 时，混合 $state 和 initialState
  if(
    initialState &&
    isOptionsStore &&
    (options as DefineStoreOptions<Id, S, G, A>).hydrate
  ) {
    (options as DefineStoreOptions<Id, S, G, A>).hydrate!(
      store.$state,
      initialState
    )
  }
  isListening = true
  isSyncListening = true

  return store
}


function createOptionsStore<
  Id extends string,
  S extends StateTree,
  G extends _GettersTree<S>,
  A extends _ActionsTree
>(
  id: Id,
  options: DefineStoreOptions<Id, S, G, A>,
  pinia: Pinia,
  hot?: boolean
){
  const {state, actions, getters} = options
  const initialState: StateTree | undefined = pinia.state.value[id]

  let store: Store<Id, S, G, A>
  function setup () {
    if(!initialState && (!__DEV__ || !hot)) {
      if(isVue2) {
        set(pinia.state.value, id, state? state() : {})
      } else {
        pinia.state.value[id] = state? state() : {}
      }
    }

    const localState = 
      __DEV__ && hot 
        ? toRefs(ref(state ? state() : {}).value)
        : toRefs(pinia.state.value[id])

    return assign(
      localState,
      actions,
      Object.keys(getters || {}).reduce((computedGetters, name)  => {
        if(__DEV__ && name in localState) {

        }

        computedGetters[name] = markRaw(
          computed(() => {
            setActivePinia(pinia)
            const store = pinia._s.get(id)!
            if(isVue2 && !store._r) return
            //@ts-expect-error
            return getters![name].call(store, store)
          })
        )
        return computedGetters
      }, {} as Record<string, ComputedRef>)
    )

  }

  store = createSetupStore(id, setup, options, pinia, hot, true)
  return store as any
}