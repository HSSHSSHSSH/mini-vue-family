import { isObject } from "./util"



export const mapState = normalizeNamespace((namespace: any, states:any) => {
  const res: any = {}
  if(!isValidMap(states)) {
    console.error('[h_vuex: mapState states 得是数组或对象')
  }
  normalizeMap(states).forEach(({key, val}) => {
    res[key] = function mappedState() {
      let state = this.$store.state
      let getters = this.$store.getters
      if(namespace) {
        const module = getModuleByNamespace(this.$store, 'mapState', namespace)
        if(!module) {
          return
        }
        state = module.context.state
        getters = module.context.getters
      }
      return typeof val === 'function'
        ? val.call(this, state, getters)
        : state[val]
    }
    res[key].vuex = true
  })
  return res
})

function normalizeNamespace(fn: Function) {
  return (namespace: any, map: any) => {
    if(typeof namespace !== 'string') {
      map = namespace
      namespace = ''
    } else if(namespace.charAt(namespace.length - 1) !== '/') {
      namespace += '/'
    }
    return fn(namespace, map)
  }
}

/**
 * Normalize the map
 * normalizeMap([1, 2, 3]) => [ { key: 1, val: 1 }, { key: 2, val: 2 }, { key: 3, val: 3 } ]
 * normalizeMap({a: 1, b: 2, c: 3}) => [ { key: 'a', val: 1 }, { key: 'b', val: 2 }, { key: 'c', val: 3 } ]
 * @param {Array|Object} map
 * @return {Object}
 */
function normalizeMap (map: any) {
  if (!isValidMap(map)) {
    return []
  }
  return Array.isArray(map)
    ? map.map(key => ({ key, val: key }))
    : Object.keys(map).map(key => ({ key, val: map[key] }))
}


function isValidMap (map: any) {
  return Array.isArray(map) || isObject(map)
}

function getModuleByNamespace (store:any, helper:any, namespace: any) {
  const module = store._modulesNamespaceMap[namespace]
  if (!module) {
    console.error(`[h_vuex] 未找到模块 ${helper}(): ${namespace}`)
  }
  return module
}