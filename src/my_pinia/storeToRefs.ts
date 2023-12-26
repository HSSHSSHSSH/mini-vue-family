import { isVue2 } from './myUtil'
import { StoreGetters, StoreState } from './store'
import { PiniaCustomStateProperties, StoreGeneric } from './type'
import {
  ToRef,
  ToRefs,
  Ref,
  ComputedRef,
  toRefs,
  toRaw,
  isRef,
  isReactive,
  toRef
} from 'vue'

type ToComputedRefs<T> = {
  [K in keyof T]: ToRef<T[K]> extends Ref<infer U>
    ? ComputedRef<U>
    : ToRef<T[K]>
}

export type StoreToRefs<SS extends StoreGeneric> = ToRefs<
  StoreState<SS> & PiniaCustomStateProperties<StoreState<SS>>
> & ToComputedRefs<StoreGetters<SS>>

export function storeToRefs<SS extends StoreGeneric> (
  store: SS
): StoreToRefs<SS> {
  if(isVue2) {
    //@ts-expect-error
    return toRefs(store)
  } else {
    store = toRaw(store)

    const refs = {} as StoreToRefs<SS>
    for(const key in store) {
      const value = store[key]
      if(isRef(value) || isReactive(value)) {
        //@ts-expect-error
        refs[key] = toRef(store, key)
      }
    }
    return refs
  }
}