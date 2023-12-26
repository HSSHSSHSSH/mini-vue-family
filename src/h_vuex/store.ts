import { storeKey } from './injectKey'
import { ModuleCollection } from './module/module-collection'
import { genericSubscribe, installModule, resetStoreState, unifyObjectStyle } from './store-util'

class HStore {
  private _committing: boolean // 是否正在提交
  private _actions: any // 所有的actions
  private _actionSubscribers: any // actions的订阅者
  private _mutations: any // 所有的mutations
  private _wrappedGetters: any // 所有的getters
  private _modules: any // 所有的modules
  private _modulesNamespaceMap: any // modules的命名空间
  private _subscribers: any // 订阅者
  private _makeLocalGettersCache: any // getters缓存
  private _scope: any // EffectScope实例
  private _devtools: any // devtools
  private strict: boolean // 是否严格模式
  private _state: any // store的state

  constructor(options: any = {}) {
    // if (__DEV__) {
    //   assert(typeof Promise !== 'undefined', `vuex requires a Promise polyfill in this browser.`)
    //   assert(this instanceof Store, `store must be called with the new operator.`)
    //
    const { plugins = [], strict = false, devtools } = options

    // store internal state
    this._committing = false
    this._actions = Object.create(null)
    this._actionSubscribers = []
    this._mutations = Object.create(null)
    this._wrappedGetters = Object.create(null)
    this._modules = new ModuleCollection(options)
    this._modulesNamespaceMap = Object.create(null)
    this._subscribers = []
    this._makeLocalGettersCache = Object.create(null)
    // EffectScope instance. when registering new getters, we wrap them inside
    // EffectScope so that getters (computed) would not be destroyed on
    // component unmount.
    this._scope = null

    this._devtools = devtools

    // bind commit and dispatch to self
    const store = this
    const { dispatch, commit } = this
    this.dispatch = function boundDispatch(type, payload) {
      return dispatch.call(store, type, payload)
    }
    this.commit = function boundCommit(type, payload, options) {
      return commit.call(store, type, payload, options)
    }

    // strict mode
    this.strict = strict

    const state = this._modules.root.state

    // init root module.
    // this also recursively registers all sub-modules
    // and collects all module getters inside this._wrappedGetters
    installModule(this, state, [], this._modules.root)

    // initialize the store state, which is responsible for the reactivity
    // (also registers _wrappedGetters as computed properties)
    resetStoreState(this, state)

    // apply plugins
    plugins.forEach((plugin: any) => plugin(this))
  }

  install(app: any, injectKey: any) {
    app.provide(injectKey || storeKey, this)
    app.config.globalProperties.$hStore = this

    // const useDevtools = this._devtools !== undefined
    //   ? this._devtools
    //   : __DEV__ || __VUE_PROD_DEVTOOLS__

    // if (useDevtools) {
    //   addDevtools(app, this)
    // }
  }
  // state
  get state() {
    return this._state.data
  }

  set state(v) {
    console.log('vvvv', v)
  }
  // getters

  // mutations

  // actions

  dispatch(_type: any, _payload: any) {
    const {type, payload} = unifyObjectStyle(_type, _payload)
    const action = { type, payload }
    const entry = this._actions[type]
    if (!entry) {
      console.log('没有对应的 action')
      return
    }
    try {
      this._actionSubscribers
      .slice()
      .filter((sub: any) => sub.before)
      .forEach((sub: any) => sub.before(action, this.state))
    } catch (e) {
      console.warn('error in before action subscribe: ', e)
    }
    // 执行 action

    const result = entry.length > 1 
    ? Promise.all(entry.map((handler: any) => handler(payload)))
    : entry[0](payload)

    // 处理 action 的返回值

    return new Promise((resolve, reject) => {
      result.then((res: any) => {
        try {
          this._actionSubscribers
          .filter((sub: any) => sub.after)
          .forEach((sub: any) => sub.after(action, this.state))
        } catch (e) {
          console.warn('error in after action subscribe: ', e)
        }
        resolve(res)
      }).catch((error: any) => {
        try {
          this._actionSubscribers
          .filter((sub: any) => sub.error)
          .forEach((sub: any) => sub.error(action, this.state, error))

        } catch (e) {
          console.warn('error in error handle: ', e)
        }
        reject(error)
      })
    })

  }

  commit(_type: any, _payload: any, _options: any) {
    const { type, payload, options } = unifyObjectStyle(
      _type,
      _payload,
      _options,
    )
    const mutation = { type, payload }
    const entry = this._mutations[type]
    this._withCommit(() => {
      entry.forEach((handler: any) => {
        handler(payload)
      })
    })
    this._subscribers
      .slice()
      .forEach((sub: any) => sub(mutation, this.state))
  }

  subscribe(fn: Function, options: any) {
    console.log('订阅')
    return genericSubscribe(fn, this._subscribers, options)
  }

  subscribeAction(fn: Function, options: any) {
    const subs = typeof fn === 'function' ? { before: fn } : fn
    return genericSubscribe(subs, this._actionSubscribers, options)
  }

  _withCommit (fn: Function) {
    const committing = this._committing
    this._committing = true
    fn()
    this._committing = committing
  }
}

export function createHStore(options: any) {
  return new HStore(options)
}
