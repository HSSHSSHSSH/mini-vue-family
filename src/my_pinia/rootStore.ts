import { App, Ref, EffectScope, InjectionKey } from 'vue'
import {
  StateTree,
  PiniaCustomProperties,
  PiniaCustomStateProperties,
  Store,
  _GettersTree,
  _ActionsTree,
  DefineStoreOptionsInPlugin,
  StoreGeneric
} from './type'

export interface PiniaPluginContext<
  Id extends string = string,
  S extends StateTree = StateTree,
  G = _GettersTree<S>,
  A = _ActionsTree
> {
  // pinia 实例
  pinia: Pinia
  // 当前 app
  app: App
  // 当前 store 的名字
  store: Store<Id, S, G, A>
  // 定义 store 时的 options
  options: DefineStoreOptionsInPlugin<Id, S, G, A>
}

export interface Pinia {

  install: (app: App) => void

  // root state
  state: Ref<Record<string, StateTree>>

  // 为每一个 store 添加 plugin
  use(plugin: PiniaPlugin): Pinia

  // 已注册的 plugin
  _p: PiniaPlugin[]

  // 与 Pinia 实例关联的 Aoo
  _a: App

  // Effect scope the pinia is attached to
  _e: EffectScope

  // pinia 注册的 store
  _s: Map<string, StoreGeneric>

  // 测试模式？？ （猜测）
  _testing: boolean
}

export interface PiniaPlugin {
  (context: PiniaPluginContext): Partial<
    PiniaCustomProperties & PiniaCustomStateProperties
  > | void
}

// 全局变量 存储当前活跃的 pinia 实例, 类似 currentInstance
export let activePinia: Pinia | undefined

// @ts-expect-error
export const setActivePinia: _SetActivePinia = (pinia) => (activePinia = pinia)

interface _SetActivePinia {
  (pinia: Pinia): Pinia
  (pinia: undefined) : undefined
  (pinia: Pinia | undefined): Pinia | undefined
}

export const piniaSymbol = (
  __DEV__ ? Symbol('pinia') : /* istanbul ignore next */ Symbol()
) as InjectionKey<Pinia>


export interface PiniaPlugin {
  (context: PiniaPluginContext): Partial<
    PiniaCustomProperties & PiniaCustomStateProperties
  > | void
}