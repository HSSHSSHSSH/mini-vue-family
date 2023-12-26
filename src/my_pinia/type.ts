import { UnwrapRef, Ref, WatchOptions, DebuggerEvent, ComputedRef } from "vue"
import { Pinia } from './rootStore'

/**
 * Generic state of a Store
 */
export type StateTree = Record<string | number | symbol, any>

export interface PiniaCustomProperties<
  Id extends string = string,
  S extends StateTree = StateTree,
  G /* extends GettersTree<S> */ = _GettersTree<S>,
  A /* extends ActionsTree */ = _ActionsTree
> {}

export function isPlainObject<S extends StateTree>(
  value: S | unknown
): value is S
export function isPlainObject(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  o: any
): o is StateTree {
  return (
    o &&
    typeof o === 'object' &&
    Object.prototype.toString.call(o) === '[object Object]' &&
    typeof o.toJSON !== 'function'
  )
}
/**
 * Properties that are added to every `store.$state` by `pinia.use()`.
 */
export interface PiniaCustomStateProperties<S extends StateTree = StateTree> {}

export interface DefineStoreOptionsInPlugin<
  Id extends string,
  S extends StateTree,
  G,
  A
> extends Omit<DefineStoreOptions<Id, S, G, A>, 'id' | 'actions'> {
  /**
   * Extracted object of actions. Added by useStore() when the store is built
   * using the setup API, otherwise uses the one passed to `defineStore()`.
   * Defaults to an empty object if no actions are defined.
   */
  actions: A
}

export interface DefineStoreOptionsBase<S extends StateTree, Store> {}

export interface DefineSetupStoreOptions<
  Id extends string,
  // NOTE: Passing SS seems to make TS crash
  S extends StateTree,
  G,
  A /* extends ActionsTree */
> extends DefineStoreOptionsBase<S, Store<Id, S, G, A>> {
  /**
   * Extracted actions. Added by useStore(). SHOULD NOT be added by the user when
   * creating the store. Can be used in plugins to get the list of actions in a
   * store defined with a setup function. Note this is always defined
   */
  actions?: A
}


export interface DefineSetupStoreOptions<
  Id extends string,
  // NOTE: Passing SS seems to make TS crash
  S extends StateTree,
  G,
  A /* extends ActionsTree */
> extends DefineStoreOptionsBase<S, Store<Id, S, G, A>> {
  /**
   * Extracted actions. Added by useStore(). SHOULD NOT be added by the user when
   * creating the store. Can be used in plugins to get the list of actions in a
   * store defined with a setup function. Note this is always defined
   */
  actions?: A
}

export interface StoreDefinition<
  Id extends string = string,
  S extends StateTree = StateTree,
  G /* extends GettersTree<S>*/ = _GettersTree<S>,
  A /* extends ActionsTree */ = _ActionsTree
> {
  /**
   * Returns a store, creates it if necessary.
   *
   * @param pinia - Pinia instance to retrieve the store
   * @param hot - dev only hot module replacement
   */
  (pinia?: Pinia | null | undefined, hot?: StoreGeneric): Store<Id, S, G, A>

  /**
   * Id of the store. Used by map helpers.
   */
  $id: Id

  /**
   * Dev only pinia for HMR.
   *
   * @internal
   */
  _pinia?: Pinia
}

export type _ExtractStateFromSetupStore_Keys<SS> = keyof {
  [K in keyof SS as SS[K] extends _Method | ComputedRef ? never : K]: any
}
export type _UnwrapAll<SS> = { [K in keyof SS]: UnwrapRef<SS[K]> }

export type _ExtractStateFromSetupStore<SS> = SS extends undefined | void
  ? {}
  : _ExtractStateFromSetupStore_Keys<SS> extends keyof SS
  ? _UnwrapAll<Pick<SS, _ExtractStateFromSetupStore_Keys<SS>>>
  : never

  export type _ExtractActionsFromSetupStore_Keys<SS> = keyof {
    [K in keyof SS as SS[K] extends _Method ? K : never]: any
  }
  

/**
 * For internal use **only**
 */
export type _ExtractActionsFromSetupStore<SS> = SS extends undefined | void
  ? {}
  : _ExtractActionsFromSetupStore_Keys<SS> extends keyof SS
  ? Pick<SS, _ExtractActionsFromSetupStore_Keys<SS>>
  : never

  export type _ExtractGettersFromSetupStore_Keys<SS> = keyof {
    [K in keyof SS as SS[K] extends ComputedRef ? K : never]: any
  }

/**
 * For internal use **only**
 */
export type _ExtractGettersFromSetupStore<SS> = SS extends undefined | void
  ? {}
  : _ExtractGettersFromSetupStore_Keys<SS> extends keyof SS
  ? Pick<SS, _ExtractGettersFromSetupStore_Keys<SS>>
  : never

export interface DefineSetupStoreOptions<
  Id extends string,
  // NOTE: Passing SS seems to make TS crash
  S extends StateTree,
  G,
  A /* extends ActionsTree */
> extends DefineStoreOptionsBase<S, Store<Id, S, G, A>> {
  /**
   * Extracted actions. Added by useStore(). SHOULD NOT be added by the user when
   * creating the store. Can be used in plugins to get the list of actions in a
   * store defined with a setup function. Note this is always defined
   */
  actions?: A
}

export interface DefineStoreOptions<
  Id extends string,
  S extends StateTree,
  G /* extends GettersTree<S> */,
  A /* extends Record<string, StoreAction> */
> extends DefineStoreOptionsBase<S, Store<Id, S, G, A>> {
  /**
   * Unique string key to identify the store across the application.
   */
  id: Id

  /**
   * Function to create a fresh state. **Must be an arrow function** to ensure
   * correct typings!
   */
  state?: () => S

  /**
   * Optional object of getters.
   */
  getters?: G &
    ThisType<UnwrapRef<S> & _StoreWithGetters<G> & PiniaCustomProperties> &
    _GettersTree<S>

  /**
   * Optional object of actions.
   */
  actions?: A &
    ThisType<
      A &
        UnwrapRef<S> &
        _StoreWithState<Id, S, G, A> &
        _StoreWithGetters<G> &
        PiniaCustomProperties
    >

  /**
   * Allows hydrating the store during SSR when complex state (like client side only refs) are used in the store
   * definition and copying the value from `pinia.state` isn't enough.
   *
   * @example
   * If in your `state`, you use any `customRef`s, any `computed`s, or any `ref`s that have a different value on
   * Server and Client, you need to manually hydrate them. e.g., a custom ref that is stored in the local
   * storage:
   *
   * ```ts
   * const useStore = defineStore('main', {
   *   state: () => ({
   *     n: useLocalStorage('key', 0)
   *   }),
   *   hydrate(storeState, initialState) {
   *     // @ts-expect-error: https://github.com/microsoft/TypeScript/issues/43826
   *     storeState.n = useLocalStorage('key', 0)
   *   }
   * })
   * ```
   *
   * @param storeState - the current state in the store
   * @param initialState - initialState
   */
  hydrate?(storeState: UnwrapRef<S>, initialState: UnwrapRef<S>): void
}

export type StoreGeneric = Store<
  string,
  StateTree,
  _GettersTree<StateTree>,
  _ActionsTree
>

export type _StoreWithGetters<G> = {
  readonly [k in keyof G]: G[k] extends (...args: any[]) => infer R
  ? R
  : UnwrapRef<G[k]>
}

export type Store<
  Id extends string = string,
  S extends StateTree = {},
  G = {},
  A = {}
> = _StoreWithState<Id, S, G, A> & 
    UnwrapRef<S> &
    _StoreWithGetters<G> &
    (_ActionsTree extends A ? {} : A) &
    PiniaCustomProperties<Id, S, G, A> &
    PiniaCustomStateProperties<S>

export type _GettersTree<S extends StateTree> = Record<
  string,
  | ((state: UnwrapRef<S> & UnwrapRef<PiniaCustomStateProperties<S>>) => any)
  | (() => any)
>

export type _ActionsTree = Record<string, _Method>
export type _Method = (...args: any[]) => any

export interface StoreProperties<Id extends string> {
  // store 的唯一 id
  $id: Id,
  // store 附属的 pinia 实例
  _p: Pinia,
  /**
   * Used by devtools plugin to retrieve getters. Removed in production.
   *
   * @internal
   */
  _getters?: string[],
  // 是否为 options API (猜测)
  _isOptionsApi: boolean,
  /**
   * Used by devtools plugin to retrieve properties added with plugins. Removed
   * in production. Can be used by the user to add property keys of the store
   * that should be displayed in devtools.
   */
  _customProperties: Set<string>,
   /**
   * Handles a HMR replacement of this store. Dev Only.
   *
   * @internal
   */
   _hotUpdate(useStore: StoreGeneric): void

   _hotUpdating: boolean
  // dev only
   _hmrPayload: {
    state: string[]
    hotState: Ref<StateTree>
    actions: _ActionsTree
    getters: _ActionsTree
  }

}

export type _DeepPartial<T> = { [K in keyof T]?: _DeepPartial<T[K]> }

export type SubscriptionCallback<S> = (
  /**
   * Object with information relative to the store mutation that triggered the
   * subscription.
   */
  mutation: SubscriptionCallbackMutation<S>,

  /**
   * State of the store when the subscription is triggered. Same as
   * `store.$state`.
   */
  state: UnwrapRef<S>
) => void

export interface _StoreWithState <
  Id extends string,
  S extends StateTree,
  G,
  A
> extends StoreProperties<Id> {

  $state: UnwrapRef<S> & PiniaCustomStateProperties<S>

  $patch(partialState: _DeepPartial<UnwrapRef<S>>) :void

  $patch<F extends (state: UnwrapRef<S>) => any>(
    stateMutator: ReturnType<F> extends Promise<any> ? never : F
  ): void

  $reset(): void

  $subscribe(
    callback: SubscriptionCallback<S>,
    options?: { detached?: boolean } & WatchOptions
  ): () => void

  $onAction(
    callback: StoreOnActionListener<Id, S, G, A>,
    detached?: boolean
  ): () => void

  $dispose(): void

  _r?: boolean
}

export type StoreOnActionListener<
  Id extends string,
  S extends StateTree,
  G /* extends GettersTree<S> */,
  A /* extends ActionsTree */
> = (
  context: StoreOnActionListenerContext<
    Id,
    S,
    G,
    // {} creates a type of never due to how StoreOnActionListenerContext is defined
    {} extends A ? _ActionsTree : A
  >
) => void

export type StoreOnActionListenerContext<
  Id extends string,
  S extends StateTree,
  G /* extends GettersTree<S> */,
  A /* extends ActionsTree */
> = _ActionsTree extends A
  ? _StoreOnActionListenerContext<StoreGeneric, string, _ActionsTree>
  : {
      [Name in keyof A]: Name extends string
        ? _StoreOnActionListenerContext<Store<Id, S, G, A>, Name, A>
        : never
    }[keyof A]


    export interface _StoreOnActionListenerContext<
  Store,
  ActionName extends string,
  A
> {
  /**
   * Name of the action
   */
  name: ActionName

  /**
   * Store that is invoking the action
   */
  store: Store

  /**
   * Parameters passed to the action
   */
  args: A extends Record<ActionName, _Method>
    ? Parameters<A[ActionName]>
    : unknown[]

  /**
   * Sets up a hook once the action is finished. It receives the return value
   * of the action, if it's a Promise, it will be unwrapped.
   */
  after: (
    callback: A extends Record<ActionName, _Method>
      ? (resolvedReturn: _Awaited<ReturnType<A[ActionName]>>) => void
      : () => void
  ) => void

  /**
   * Sets up a hook if the action fails. Return `false` to catch the error and
   * stop it from propagating.
   */
  onError: (callback: (error: unknown) => void) => void
}


export type SubscriptionCallbackMutation<S> =
  | SubscriptionCallbackMutationDirect
  | SubscriptionCallbackMutationPatchObject<S>
  | SubscriptionCallbackMutationPatchFunction


  export type _Awaited<T> = T extends null | undefined
  ? T // special case for `null | undefined` when not in `--strictNullChecks` mode
  : T extends object & { then(onfulfilled: infer F): any } // `await` only unwraps object types with a callable `then`. Non-object types are not unwrapped
  ? F extends (value: infer V, ...args: any) => any // if the argument to `then` is callable, extracts the first argument
    ? _Awaited<V> // recursively unwrap the value
    : never // the argument to `then` was not callable
  : T // non-object or non-thenable

  export interface SubscriptionCallbackMutationDirect
  extends _SubscriptionCallbackMutationBase {
  type: MutationType.direct

  events: DebuggerEvent
}


export interface SubscriptionCallbackMutationPatchObject<S>
  extends _SubscriptionCallbackMutationBase {
  type: MutationType.patchObject

  events: DebuggerEvent[]

  /**
   * Object passed to `store.$patch()`.
   */
  payload: _DeepPartial<S>
}

/**
 * Context passed to a subscription callback when `store.$patch()` is called
 * with a function.
 */
export interface SubscriptionCallbackMutationPatchFunction
  extends _SubscriptionCallbackMutationBase {
  type: MutationType.patchFunction

  events: DebuggerEvent[]

  /**
   * Object passed to `store.$patch()`.
   */
  // payload: DeepPartial<UnwrapRef<S>>
}

export interface _SubscriptionCallbackMutationBase {
  /**
   * Type of the mutation.
   */
  type: MutationType

  /**
   * `id` of the store doing the mutation.
   */
  storeId: string

  /**
   * 🔴 DEV ONLY, DO NOT use for production code. Different mutation calls. Comes from
   * https://vuejs.org/guide/extras/reactivity-in-depth.html#reactivity-debugging and allows to track mutations in
   * devtools and plugins **during development only**.
   */
  events?: DebuggerEvent[] | DebuggerEvent
}


export enum MutationType {
  /**
   * Direct mutation of the state:
   *
   * - `store.name = 'new name'`
   * - `store.$state.name = 'new name'`
   * - `store.list.push('new item')`
   */
  direct = 'direct',

  /**
   * Mutated the state with `$patch` and an object
   *
   * - `store.$patch({ name: 'newName' })`
   */
  patchObject = 'patch object',

  /**
   * Mutated the state with `$patch` and a function
   *
   * - `store.$patch(state => state.name = 'newName')`
   */
  patchFunction = 'patch function',

  // maybe reset? for $state = {} and $reset
}