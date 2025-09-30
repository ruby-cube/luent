import { AnyObject } from "@rue/types"
import { debug, isObject } from "@rue/utils"
import { getIonizedModel, IonizedModel, ProxyKey } from "./IonizedModel"
import { quarkOf } from "../Quark"
import { initUpdate, popUpdate, pushUpdate, Update} from "../reactivity/UpdateCycle"
import { ModelQuark } from "./ModelQuark"
import { $atomicOp, getAtomicOps } from "./AtomicOp"
import { emitSignal } from "../debug/debug"
import { ionize } from "./ionize"
import { trackParticle } from "../compound/Compound"
import { AtomicIonQuark } from "../ion/AtomicIon"

export type Constructor = new (...args: any[]) => any

//TODO: if you don't provide a clone method, you cannot update lazily

export const OpType = {
   TRACKABLE: 0,
   MUTATING: 1,
} as const

type CreateOp = (method: Function, target: AnyObject, ionized: IonizedModel, opKey: ProxyKey, config: OpTransforms) =>
   (...args: any[]) => any


export const useIonicOp = {
   [OpType.TRACKABLE]: useTrackableOp as CreateOp,
   [OpType.MUTATING]: useMutatingOp as CreateOp,
}

// a `trackable op` is a method like 'values()' or 'entries()' that tracks the entire ionic model as a watch subject rather than a specific entry or property
export function useTrackableOp(
   method: Function,
   state: { active: AnyObject },
   ionized: IonizedModel,
   opKey: ProxyKey,
   config: TrackableOpDef,
) {
   const { track, op = method, input = noTransform, output = noTransform } = config

   const o = {
      [opKey](...args: any[]) {
         if (__DEV__) emitSignal();
         const _args = input(args);
         track?.(ionized, opKey, _args)
         return output(op.apply(state.active, _args), ionized)
      }
   }
   //@ts-expect-error
   return o[opKey]
}

function noTransform(value: any) {
   return value;
}

export function initModelUpdate(quark: ModelQuark) {
   const update = initUpdate()
   const state = quark.state

   update.onComplete(() => {
      state.commitChange()
   })

   update.onCancel(() => {
      state.cancelChange()
   })

   return update;
}



function useMutatingOp(
   method: Function,
   state: { active: AnyObject },
   model: IonizedModel,
   opKey: ProxyKey,
   config: MutatingOpDef
) {
   const { trigger, input: transformInput = noTransform, output: transformOutput = noTransform, op = method } = config

   const quark = quarkOf(model)

   const o = {
      [opKey](...args: any) {
         const target = state.active;

         const _args = transformInput(args)
         const preop = config.preop?.(target, _args)

         const update = initModelUpdate(quark)

         let output: any;
         try {
            pushUpdate(update)
            output = transformOutput(op.apply(target, _args), model); // perform mutation
         }
         finally {
            popUpdate()

            // storeSnapshot(quark)

            // recordMutation(quark.asMutable, new Mutation(
            //    model,
            //    opKey,
            //    _args,
            //    output,
            //    preop
            // ))

            trigger?.(new TriggerableModel(quark, update), preop);

            return output;
         }

      }
   }
   //@ts-expect-error
   return o[opKey]
}

class TriggerableModel {

   constructor(
      private quark: ModelQuark,
      private update: Update
   ) {

   }

   trigger() {
      this.quark.trigger(this.update) //TODO: only trigger if watched? but what about preventing overlapping mutations?
   }

   // triggerProperty(key: PropertyKey) {
   //    Object.getOwnPropertyDescriptor(this.quark.proxyProto, key)
   //    const pion = $atomicPion(this.quark, key)
   //    if (pion) {
   //       initModelUpdate(pion, this.update)
   //       pion.trigger()
   //    }
   // }

   triggerOp(op: PropertyKey, entryKey: unknown) {
      $atomicOp(this.quark, op, entryKey)?.trigger(this.update)
   }

   triggerAllOps(op: PropertyKey) {
      const ops = getAtomicOps(this.quark, op)
      if (ops)
         for (const [_, op] of ops) {
            op.trigger(this.update)
         }
   }
}

type OpTransforms = {
   op?: Function, // customized
   input?: (input: any[]) => any[],
   output?: (output: any, model: IonizedModel) => any,
}

export type TrackableOpDef = {
   type: typeof OpType.TRACKABLE,
   privateState?: true,
   track?: (model: IonizedModel, op: PropertyKey, input: any[]) => void
} & OpTransforms

export type MutatingOpDef = {
   type: typeof OpType.MUTATING,
   privateState?: true,
   preop?: GetPreopData
   trigger?: (model: TriggerableModel, preopData: any) => void
   revert?: Revert,
} & OpTransforms

export type PropertyDef = {
   getterTask?: (this: AtomicIonQuark)=>void
   setterTask?: (this: AtomicIonQuark)=>void
}

type IonizableMethodDef = TrackableOpDef | MutatingOpDef | { get?: TrackableOpDef, set?: MutatingOpDef } | PropertyDef

export type GetPreopData = (target: AnyObject, args: any[]) => any;
type Revert = (model: AnyObject, data: { output: any, preopData: any, args: any[] }) => void

export type IonizedMethodsDef = {
   [key: PropertyKey]: IonizableMethodDef
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
//    // output: (o) => maybeIonize(o), //TODO: this is tricky if encapsulation is involved ... you need to pass the parent quark to know what kind of ionization to do
//    revert: (model, { preopData: { key, oldState } }) => {
//       model[key] = oldState //QUESTION: When reverting, should we revert on the ionized model or the raw target?
//    }
// }

const ionizedMethodsMap = new Map()

// export function isIonizable(constructor: Constructor) {
//    return ionizedMethodsMap.has(constructor);
// }



export function getIonizedMemberDef(target: AnyObject, methodKey: PropertyKey) { //FIX: this is causing infinite loops e.g. toJSON()
   let constructor = target.constructor as Constructor
   let _target = target;
   while (constructor !== Object) {
      if (Object.hasOwn(target, methodKey)) {
         return ionizedMethodsMap.get(constructor)?.[methodKey]
      }
      const def = ionizedMethodsMap.get(constructor)?.[methodKey]
      if (def) {
         return def;
      }
      _target = Object.getPrototypeOf(_target)
      constructor = _target.constructor as Constructor
   }
   // return ionizedMethodsMap.get(Object)?.['[[set]]']
}

export function enlistIonizedMethods(constructor: Constructor, def?: IonizedMethodsDef) {
   const existingDef = ionizedMethodsMap.get(constructor)
   if (existingDef && def) debug.warn(`Overriding existing Ionized Methods defintion for ${constructor.name}`)
   if (existingDef) return;
   if (def) ionizedMethodsMap.set(constructor, def)
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
// export function triggerAll(model: IonizedModel, op: PropertyKey): () => void {
//    return function triggerAllOps(this: { update: Update }) {
//       const ops = getAtomicOps(model, op)
//       if (ops)
//          for (const [_, op] of ops) {
//             initModelUpdate(op, this.update)
//             op.trigger()
//          }
//    }
// }

// export function trigger(model: IonizedModel): () => void
// export function trigger(model: IonizedModel, op: '[[get]]', entryKey: PropertyKey): () => void
// export function trigger(model: IonizedModel, op: PropertyKey, entryKey: any): () => void
// export function trigger(model: IonizedModel, op?: PropertyKey | '[[get]]', entryKey?: any): () => void {
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
//          const atomicOp = $atomicOp(model, op, entryKey)
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
export const trackModel = (model: IonizedModel) => {
   trackParticle(quarkOf(model))
}
export function trackOp(model: IonizedModel, op: PropertyKey, args: unknown[]) {
   quarkOf(model).trackOp(op, args![0])
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
//       passIonized: (key: IonizedModel, rawKey: AnyObject) => unknown,
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
   type: OpType.TRACKABLE,
     privateState: true,
   track: trackModel,
   output: (o) => ionize(o)
}

export const trackableOp: TrackableOpDef = {
   type: OpType.TRACKABLE,
     privateState: true,
   track: trackModel
}