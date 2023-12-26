import { forEachValue } from "../util"
import Module from "./module"



export class ModuleCollection {
  public root: any // 根模块
  constructor(rawRootModule: any) {
    // register root module (Vuex.Store options)
    this.register([], rawRootModule, false)
  }

  register(path: any, rawModule: any, runtime = true) {
    const newModule = new Module(rawModule, runtime)
    if(path.length === 0) {
      this.root = newModule
    } else {
      // 创建父子关系
      const parent = this.get(path.slice(0, -1))
      parent.addChild(path[path.length - 1], newModule)
    }

    // 处理子模块
    if(rawModule.modules) {
      forEachValue(rawModule.modules, (rawChildModule: any, key: any) => {
        this.register(path.concat(key), rawChildModule, runtime)
      })
    }
  }

  getNamespace (path: any) {
    let module = this.root
    return path.reduce((namespace:any, key: any) => {
      module = module.getChild(key)
      return namespace + (module.namespaced ? key + '/' : '')
    }, '')
  }

  get (path: any) {
    return path.reduce((module: any, key: any) => {
      return module.getChild(key)
    }, this.root)
  }

} 