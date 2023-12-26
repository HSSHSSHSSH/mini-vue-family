import { effectScope, Ref, ref, markRaw, App} from 'vue'
import { StateTree } from './type'
import { Pinia, setActivePinia, piniaSymbol, PiniaPlugin } from './rootStore'
import { StoreGeneric } from './type'
import { isVue2 } from './myUtil'

export function createPinia(): Pinia {
  // 不知道这个scope是干嘛的
  const scope = effectScope(true)
  const state = scope.run<Ref<Record<string, StateTree>>>(() =>
    ref<Record<string, StateTree>>({})
  )!
  let _p: Pinia['_p'] = []
  let toBeInstalled: PiniaPlugin[] = []

  const pinia : Pinia = markRaw({
    install(app: App) {
      // 保存当前 pinia 实例
      setActivePinia(pinia)
      if(!isVue2) {
        // 注入 pinia 实例
        app.provide(piniaSymbol, pinia)
        app.config.globalProperties.$hPinia = pinia
        // 注册 plugin
        toBeInstalled.forEach((plugin) => _p.push(plugin))
        toBeInstalled = []
      }
    },

    use(plugin: PiniaPlugin){
      if(!this._a && !isVue2) {
        toBeInstalled.push(plugin)
      } else {
        _p.push(plugin)
      }
      return this
    },
    _p,
    // @ts-expect-error
    _a: null,
    _e: scope,
    _s: new Map<string, StoreGeneric>(),
    state,
  })
  return pinia
}