import {
  isPlainObject
} from './type'

import { isRef, isReactive } from 'vue'
import {isVue2, set} from './myUtil'
//将旧的状态合并到新的状态中
export function patchObject(
  newState: Record<string, any>,
  oldState: Record<string, any>
): Record<string, any> {
  // no need to go through symbols because they cannot be serialized anyway
  for (const key in oldState) {
    const subPatch = oldState[key]

    // skip the whole sub tree
    if (!(key in newState)) {
      continue
    }

    const targetValue = newState[key]
    if (
      isPlainObject(targetValue) &&
      isPlainObject(subPatch) &&
      !isRef(subPatch) &&
      !isReactive(subPatch)
    ) {
      newState[key] = patchObject(targetValue, subPatch)
    } else {
      // objects are either a bit more complex (e.g. refs) or primitives, so we
      // just set the whole thing
      if (isVue2) {
        set(newState, key, subPatch)
      } else {
        newState[key] = subPatch
      }
    }
  }

  return newState
}