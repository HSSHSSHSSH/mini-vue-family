


export function forEachValue (obj: any, fn: Function) {
  Object.keys(obj).forEach(key => {
    fn(obj[key], key)
  })
}


export function partial (fn: Function, arg: any) {
  return function () {
    return fn(arg)
  }
}


export function isObject (obj: any) {
  return obj !== null && typeof obj === 'object'
}

export function isPromise (val: any) {
  return val && typeof val.then === 'function'
}