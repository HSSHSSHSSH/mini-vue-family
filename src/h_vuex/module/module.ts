import { forEachValue } from '../util'

export default class Module {
  public runtime: boolean // 是否是动态注册的模块
  public _children: any // 子模块
  public _rawModule: any // 原始模块
  public state: any // 模块的state

  constructor(rawModule: any, runtime = true) {
    this.runtime = runtime
    this._children = Object.create(null)
    this._rawModule = rawModule
    const rawState: Function = rawModule.state
    this.state = (typeof rawState === 'function' ? rawState() : rawState) || {}
  }

  get namespaced() {
    return !!this._rawModule.namespaced
  }

  getChild(key: any) {
    return this._children[key]
  }

  addChild(key: any, module: any) {
    this._children[key] = module
  }

  removeChild(key: any) {
    delete this._children[key]
  }

  hasChild(key: any) {
    return key in this._children
  }

  update(rawModule: any) {
    this._rawModule.namespaced = rawModule.namespaced
    if (rawModule.actions) {
      this._rawModule.actions = rawModule.actions
    }
    if (rawModule.mutations) {
      this._rawModule.mutations = rawModule.mutations
    }
    if (rawModule.getters) {
      this._rawModule.getters = rawModule.getters
    }
  }

  forEachGetter(fn: Function) {
    if (this._rawModule.getters) {
      forEachValue(this._rawModule.getters, fn)
    }
  }

  forEachMutation(fn: Function) {
    if (this._rawModule.mutations) {
      forEachValue(this._rawModule.mutations, fn)
    }
  }

  forEachAction(fn: Function) {
    if (this._rawModule.actions) {
      forEachValue(this._rawModule.actions, fn)
    }
  }
  forEachChild(fn: Function) {
    forEachValue(this._children, fn)
  }
}
