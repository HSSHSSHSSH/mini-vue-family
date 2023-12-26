import { inject } from 'vue'

export const storeKey = 'h_store'

export function useHStore (key = null) {
  return inject(key !== null ? key : storeKey)
}