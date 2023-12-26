import { getCurrentScope, onScopeDispose } from 'vue'
import {_Method } from './type'

export const noop = () => {}


export function addSubscription<T extends _Method>(
  subscriptions: T[],
  callback: T,
  detached? :boolean,
  onCleanup: () => void = noop, // 默认值为 noop
){
  subscriptions.push(callback)

  const removeSubscription = () => {
    const idx = subscriptions.indexOf(callback)
    if(idx > -1) {
      subscriptions.splice(idx, 1)
      onCleanup()
    }
  }

  if(!detached && getCurrentScope()) {
    onScopeDispose(removeSubscription)
  }

  return removeSubscription

}

export function triggerSubscriptions<T extends _Method>(
  subscriptions: T[],
  ...args: Parameters<T>
) {
  subscriptions.slice().forEach((callback) => {
    callback(...args)
  })
}