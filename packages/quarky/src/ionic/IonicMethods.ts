import { AnyObject } from "@rue/types"
import { debug, isObject } from "@rue/utils"
import { getIonizedModel, IonicProxy, ProxyKey } from "./Ionic"
import { quarkOf } from "../abstract/Quark"
import { Update } from "../reactivity/Update"
import { ModelQuark } from "./IonicModel"
import { ionize } from "./ionize"
import { inTrackedScope, track } from "../reactivity/Compound"
import { AtomicIonQuark } from "../ion/AtomicIon"
import { trigger } from "../reactivity/Atom"
import { CollectiveQuark } from "./IonicCollective"

export type Constructor = new (...args: any[]) => any

// TODO: if you don't provide a clone method, you cannot update lazily

// export const MemberType = {
//    TRACKABLE: 0,
//    MUTATING: 1,
//    PROPERTY: 3
// } as const

// type CreateOp = (method: Function, target: AnyObject, ionized: IonicProxy, opKey: ProxyKey, config: OpTransforms) =>
//    (...args: any[]) => any


// export const useIonicOp = {
//    [MemberType.TRACKABLE]: useTrackableOp as CreateOp,
//    [MemberType.MUTATING]: useMutatingOp as CreateOp,
// }

// a `trackable op` is a method like 'values()' or 'entries()' that tracks the entire ionic model as a watch subject rather than a specific entry or property
// export function useTrackableOp(
//    method: Function,
//    state: { get(): AnyObject },
//    proxy: IonicProxy,
//    opKey: ProxyKey,
//    config: TrackableOpDef,
// ) {
//    const { track, op = method, input = noTransform, output = noTransform } = config
//    const trackableOp = function (...args: any[]) {
//       const _args = input(args);
//       if (inTrackedScope())
//          track?.(proxy, opKey, _args)
//       return output(op.apply(state.get(), _args), proxy)
//    }
//    Object.defineProperty(trackableOp, 'name', opKey)
//    return trackableOp
// }

// function noTransform(value: any) {
//    return value;
// }




// export function setState(this: AtomicIonQuark, value: unknown) {

//    this.state.set(newState)

//    trigger(this, this.state.pendingUpdate!)

//    return newState;
// }


// function useMutatingOp(
//    collectiveQuark: CollectiveQuark,
//    state: { get(): AnyObject, mutate: (fn: (model: AnyObject) => void) => unknown, pendingUpdate: Update },
//    opKey: ProxyKey,
//    op: Function,
//    trigger: (collectiveQuark: CollectiveQuark, update: Update) => void
// ) {
//    const mutate = function (...args: any) {

//       const output = state.mutate((target) => op.apply(target, args));

//       trigger(collectiveQuark, state.pendingUpdate) // 

//       return output;
//    }
//    Object.defineProperty(mutate, 'name', opKey)
//    return mutate
// }

// function CollectiveTriggerKit(customTrigger: undefined | (() => void)) {
//    let shouldTrigger = false;

//    function publicTrigger() {
//       shouldTrigger = true;
//    }

//    function internalTrigger(collectiveQuark: CollectiveQuark, update: Update) {
//       if (shouldTrigger) {
//          trigger(collectiveQuark, update);
//          customTrigger?.apply({
//             trigger(op: PropertyKey, entryKey?: unknown) {
//                if (this.trigger.length === 1) {
//                   const ops = getTrackedOps(collectiveQuark, op)
//                   if (ops)
//                      for (const [_, op] of ops) {
//                         trigger(op, update)
//                      }
//                }
//                else {
//                   trigger(getTrackedOp(collectiveQuark, op, entryKey), update)
//                }
//             }
//          })
//       }

//       shouldTrigger = false;
//    }

//    return [internalTrigger, publicTrigger]
// }

// export class Mutation {

//    constructor(
//       public target: AnyObject,
//       public op: '[[set]]' | PropertyKey,
//       public input: [PropertyKey, unknown] | unknown[],
//    ) { }

//    apply() {
//       if (this.op === '[[set]]') {
//          const key = this.input[0] as PropertyKey
//          const value = this.input[1]
//          this.target[key] = value
//       }
//       else {
//          this.target[this.op](...this.input)
//       }
//    }
// }


// class TriggerableModel {

//    constructor(
//       private quark: ModelQuark,
//       private update: Update
//    ) {

//    }

//    trigger() {
//       this.quark.trigger(this.update) // TODO: only trigger if watched? but what about preventing overlapping mutations?
//    }

//    // triggerProperty(key: PropertyKey) {
//    //    Object.getOwnPropertyDescriptor(this.quark.proxyProto, key)
//    //    const pion = $atomicPion(this.quark, key)
//    //    if (pion) {
//    //       initModelUpdate(pion, this.update)
//    //       pion.trigger()
//    //    }
//    // }

//    triggerOp(op: PropertyKey, entryKey: unknown) {
//       getTrackedOp(this.quark, op, entryKey)?.trigger(this.update)
//    }

//    triggerAllOps(op: PropertyKey) {
//       const ops = getTrackedOps(this.quark, op)
//       if (ops)
//          for (const [_, op] of ops) {
//             op.trigger(this.update)
//          }
//    }
// }

type OpTransforms = {
   op?: Function, // customized
   input?: (input: any[]) => any[],
   output?: (output: any, model: IonicProxy) => any,
}

export type TrackableOpDef = {
   type: typeof MemberType.TRACKABLE,
   privateState?: true,
   track?: (model: IonicProxy, op: PropertyKey, input: any[]) => void // FIX: 'model' | 'op'
} & OpTransforms

export type MutatingOpDef = {
   type: typeof MemberType.MUTATING,
   privateState?: true,
   preop?: GetPreopData
   trigger?: (model: TriggerableModel, preopData: any) => void // this.triggerModel() this.triggerOp()
   revert?: Revert,
} & OpTransforms

// export type PropertyDef = {
//    type: typeof MemberType.PROPERTY
//    track?: (this: AtomicIonQuark) => void
//    trigger?: (this: AtomicIonQuark) => void
// }

type IonizableMethodDef = TrackableOpDef | MutatingOpDef | { get?: TrackableOpDef, set?: MutatingOpDef } | PropertyDef

export type GetPreopData = (target: AnyObject, args: any[]) => any;
type Revert = (model: AnyObject, data: { output: any, preopData: any, args: any[] }) => void

export type IonizedMethodsDef = {
   '@initEach'(item: any, target: AnyObject, transform: (value: unknown) => unknown, index: number): void
   '@getHookKey'(key: PropertyKey): PropertyKey
} & {
   [key: Exclude<PropertyKey, '@initEach' | '@getHookKey'>]: PropertyDef | MethodDef
}

// export const triggeringPropertySetOp: MutatingOpDef = {
//    op: function set(this: AnyObject, key: PropertyKey, value: unknown) { this[key] = value },
//    input: ([key, value]) => [key, toRaw(value)],
//    preop: (target, [key, value]) => ({
//       key,
//       oldState: target[key],
//       newState: value
//    }),
//    shouldTrigger: ({ oldState, newState }) => oldState !== newState, // should both be raw objects
//    triggers: (model, [key]) => [
//       trigger(model),
//       trigger(model, '[[get]]', key as PropertyKey)
//    ],
//    // output: (o) => maybeIonize(o), // TODO: this is tricky if encapsulation is involved ... you need to pass the parent quark to know what kind of ionization to do
//    revert: (model, { preopData: { key, oldState } }) => {
//       model[key] = oldState //QUESTION: When reverting, should we revert on the ionized model or the raw target?
//    }
// }

interface ConfigurableThis {
   raw: AnyObject,
   ionic: AnyObject,
   config: AnyObject | undefined
}

export interface TrackableThis extends ConfigurableThis {
   trackModel(): void,
   track(op: string, key: unknown): void
}

export interface TriggerableThis extends ConfigurableThis {
   triggerModel(): void,
   trigger(op: string, key: unknown): void
   triggerAll(op: string): void
}

export type PropertyDef = {
   get?(this: TrackableThis): unknown
   set?(this: TriggerableThis, value: unknown): unknown
}

export type MethodDef = (this: TrackableThis & TriggerableThis, ...args: any[]) => any

const ionicMethodsMap: Map<Constructor, IonizedMethodsDef> = new Map()

// export function isIonizable(constructor: Constructor) {
//    return ionicMethodsMap.has(constructor);
// }



export function getIonizedMemberDef(target: AnyObject, methodKey: PropertyKey) { //FIX: this is causing infinite loops e.g. toJSON()
   let constructor = target.constructor as Constructor
   let _target = target;
   while (constructor !== Object) {
      if (Object.hasOwn(target, methodKey)) {
         return ionicMethodsMap.get(constructor)?.[methodKey]
      }
      const def = ionicMethodsMap.get(constructor)?.[methodKey]
      if (def) {
         return def;
      }
      _target = Object.getPrototypeOf(_target)
      constructor = _target.constructor as Constructor
   }
   // return ionicMethodsMap.get(Object)?.['[[set]]']
}

export function defineIonicStructure(constructor: Constructor, def?: IonizedMethodsDef) {
   const existingDef = ionicMethodsMap.get(constructor)
   if (existingDef && def) debug.warn(`Overriding existing Ionized Methods defintion for ${constructor.name}`)
   if (existingDef) return;
   if (def) ionicMethodsMap.set(constructor, def)
}

export function getIonicDef(constructor: Constructor) {
   return ionicMethodsMap.get(constructor)
}

/**
 * example:
 * {
 *    triggers: (model, args) => [
 *       trigger(model, '[[get]]', 'size'),
 *       trigger(model, 'has', args[0]),
 *       trigger(model)
 *    ]
 * }
 *  */
// export function triggerAll(model: IonicProxy, op: PropertyKey): () => void {
//    return function triggerAllOps(this: { update: Update }) {
//       const ops = getTrackedOps(model, op)
//       if (ops)
//          for (const [_, op] of ops) {
//             initModelUpdate(op, this.update)
//             op.trigger()
//          }
//    }
// }

// export function trigger(model: IonicProxy): () => void
// export function trigger(model: IonicProxy, op: '[[get]]', entryKey: PropertyKey): () => void
// export function trigger(model: IonicProxy, op: PropertyKey, entryKey: any): () => void
// export function trigger(model: IonicProxy, op?: PropertyKey | '[[get]]', entryKey?: any): () => void {
//    if (op === '[[get]]') {
//       if (!entryKey) throw new Error('must provide property key to trigger [[get]] op')
//       return function triggerPion(this: { update: Update }) {
//          const pion = $atomicPion(model, entryKey)
//          if (pion) {
//             initModelUpdate(pion, this.update)
//             pion.trigger()
//          }
//       }
//    }
//    else if (op) {
//       return function triggerOp(this: { update: Update }) {
//          const atomicOp = getTrackedOp(model, op, entryKey)
//          if (atomicOp) {
//             initModelUpdate(atomicOp, this.update)
//             atomicOp.trigger()
//          }
//       }
//    }
//    return function triggerModel(this: { update: Update }) {
//       const quark = quarkOf(model)
//       initModelUpdate(quark, this.update)
//       quark.trigger()
//    }
// }




// function initModelUpdate(op: AtomicQuark | ModelQuark, update: Update) {
//    // if (update.lazy) {
//    //    this.pState = state;

//    //    update.onComplete(() => {
//    //       this.value = this.pState;
//    //       this.pState = NULL
//    //       this.pendingUpdate = null;
//    //    })

//    //    if (this.pendingUpdate && this.pendingUpdate !== update) {
//    //       this.pendingUpdate.cancel()
//    //    }
//    // }
//    // else {
//    if (op.pendingUpdate && op.pendingUpdate !== update) {
//       console.trace('cancelling', op, update)
//       op.pendingUpdate.cancel()
//       op.pendingUpdate = null;
//       // pion.pState = NULL;
//    }
//    // pion.value = state;
//    // }
//    op.pendingUpdate = update
//    console.trace('set pending update')
//    update.onComplete(() => {
//       console.log('mutate model update done')
//       op.pendingUpdate = null
//    })
// }


// const toIonizedDecoyOfTargetOrThisArg = (target: AnyObject, args: any[]) => ionizedDecoy(args[1] ?? target)
export const trackModel = (model: IonicProxy) => {
   track(quarkOf(model))
}

export function trackOp(modelQuark: ModelQuark, op: PropertyKey, key: any) {
   track(asTrackedOp(modelQuark, op, key))
}



// /**
//  * Checks for raw key, then checks for ionized key if raw key fails.
//  * If ionized key works, replaces ionized key with raw key.
//  * This optimizes .has(key) for future calls. Can be configured for 
//  * .has() dependent ops such as delete(), get()
//  * @param rawKey 
//  * @param target 
//  * @returns 
//  */
// export function hasMaybeIonized(
//    rawKey: unknown,
//    target: { has(value: unknown): boolean },
//    { passRaw, fail, passIonized }: {
//       passRaw: (key: unknown) => unknown,
//       passIonized: (key: IonicProxy, rawKey: AnyObject) => unknown,
//       fail: unknown
//    }) {
//    if (target.has(rawKey)) {
//       return passRaw(rawKey);
//    }
//    const ionizedKey = getIonizedModel(rawKey);
//    if (ionizedKey && target.has(ionizedKey)) {
//       return passIonized(ionizedKey, rawKey as AnyObject)
//    }
//    return fail;
// }
type ReplaceWithRaw = (target: AnyObject, ionizedKey: AnyObject, rawKey: AnyObject) => void
export type HasOp = (key: unknown) => boolean

export function useHasOp(replaceWithRaw: ReplaceWithRaw) {

   function hasIonized(target: { has: HasOp }, rawKey: AnyObject) {
      const ionizedKey = getIonizedModel(rawKey)
      if (ionizedKey) {
         const hasIonized = target.has(ionizedKey)
         if (hasIonized) {
            replaceWithRaw(target, ionizedKey, rawKey)
            return true;
         }
         return false;
      }
      return false; // ionized version doesn't exist
   }

   return function has(this: { has: HasOp }, key: unknown) {
      if (isObject(key)) {
         return this.has(key) || hasIonized(this, key)
      }
      return this.has(key)
   }
}

export function useDeleteOp(hasOp: HasOp) {
   return function deleteOp(this: { delete: HasOp }, key: unknown) {
      const has = hasOp.apply(this, [key])
      if (has) return this.delete(key)
      return false;
   }
}

/**
 * For methods that produce a new version of the original data structure, eg. array.toReversed()
 */
export const trackableCreativeOp: TrackableOpDef = {
   type: MemberType.TRACKABLE,
   privateState: true,
   track: trackModel,
   output: (o) => ionize(o)
}

export const trackableOp: TrackableOpDef = {
   type: MemberType.TRACKABLE,
   privateState: true,
   track: trackModel,
   // track(){
   //    this.trackModel()
   // }
}