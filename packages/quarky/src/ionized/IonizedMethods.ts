import { AnyObject } from "@rue/types"
import { debug } from "@rue/utils"
import { IonizedModel, $atomicPion } from "./IonizedModel"
import { AtomicOp, $atomicOp, getAtomicOps } from "./AtomicOp"
import { quarkOf } from "../Quark"
import { ionize, toRaw } from "./ionize"
import { ionizedArray, ionizedIterable } from "./IonizedArray"
import { IonizedModelQuark } from "./IonizedModelQuark"
import { initUpdate, Update } from "../effect-cycle/ReactivitySystem"
import { ModelState } from "../ion/AtomicIon"

export type Constructor = new (...args: any[]) => any

//TODO: if you don't provide a clone method, you cannot update lazily

export type TrackableOpDef = {
   // trackable ops
   op?: Function,
   input?: (input: any[]) => any[],
   output?: (output: any, model: IonizedModel) => any,
   this?: (target: AnyObject, input: any[]) => AnyObject,
   track: (model: IonizedModel, op: PropertyKey, input: any[]) => void
}
export type TriggeringOpDef = {
   op?: Function,
   input?: (input: any[]) => any[],
   preop?: GetPreopData
   this?: true
   shouldTrigger?: (preopData: any) => boolean
   triggers: (model: IonizedModel, args: any[], preopData: any) => (() => void)[]
   output?: (output: any, model: IonizedModel) => any,
   revert?: Revert,
}

type IonizableMethodDef = TrackableOpDef | TriggeringOpDef

export type GetPreopData = (target: AnyObject, args: any[]) => any;
type Revert = (model: AnyObject, data: { output: any, preopData: any, args: any[] }) => void

export type IonizedMethodsDef = {
   [key: PropertyKey]: IonizableMethodDef
}

export const triggeringPropertySetOp: TriggeringOpDef = {
   op: function set(this: AnyObject, key: PropertyKey, value: unknown) { this[key] = value },
   input: ([key, value]) => [key, toRaw(value)],
   preop: (target, [key, value]) => ({
      key,
      oldState: target[key],
      newState: value
   }),
   shouldTrigger: ({ oldState, newState }) => oldState !== newState, // should both be raw objects
   triggers: (model, [key]) => [
      trigger(model),
      trigger(model, '[[get]]', key as PropertyKey)
   ],
   // output: (o) => maybeIonize(o), //TODO: this is tricky if encapsulation is involved ... you need to pass the parent quark to know what kind of ionization to do
   revert: (model, { preopData: { key, oldState } }) => {
      model[key] = oldState //QUESTION: When reverting, should we revert on the ionized model or the raw target?
   }
}

const ionizedMethodsMap = new Map([
   [Object as Constructor, { '[[set]]': triggeringPropertySetOp } as IonizedMethodsDef | undefined],
   [Array, ionizedArray],
   [[].values().constructor, ionizedIterable]
])

export function isIonizable(constructor: Constructor) {
   return ionizedMethodsMap.has(constructor);
}



export function getIonizedMethodDef(target: AnyObject, methodKey: PropertyKey) { //FIX: this is causing infinite loops e.g. toJSON()
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
   ionizedMethodsMap.set(constructor, def)
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
export function triggerAll(model: IonizedModel, op: PropertyKey): () => void {
   return function triggerAllOps(this: { update: Update }) {
      const ops = getAtomicOps(model, op)
      if (ops)
         for (const [_, op] of ops) {
            prepPendingUpdate(op, this.update)
            op.trigger()
         }
   }
}

export function trigger(model: IonizedModel): () => void
export function trigger(model: IonizedModel, op: '[[get]]', entryKey: PropertyKey): () => void
export function trigger(model: IonizedModel, op: PropertyKey, entryKey: any): () => void
export function trigger(model: IonizedModel, op?: PropertyKey | '[[get]]', entryKey?: any): () => void {
   if (op === '[[get]]') {
      if (!entryKey) throw new Error('must provide property key to trigger [[get]] op')
      return function triggerPion(this: { update: Update }) {
         const pion = $atomicPion(model, entryKey)
         if (pion) {
            prepPendingUpdate(pion, this.update)
            pion.trigger()
         }
      }
   }
   else if (op) {
      return function triggerOp(this: { update: Update }) {
         const atomicOp = $atomicOp(model, op, entryKey)
         if (atomicOp) {
            prepPendingUpdate(atomicOp, this.update)
            atomicOp.trigger()
         }
      }
   }
   return function triggerModel(this: { update: Update }) {
      const quark = quarkOf(model)
      prepPendingUpdate(quark, this.update)
      quark.trigger()
   }
}




function prepPendingUpdate(op: AtomicOp | AtomicPionQuark | IonizedModelQuark, update: Update) {
   // if (update.lazy) {
   //    this.pState = state;

   //    update.queue(() => {
   //       this.state = this.pState;
   //       this.pState = NULL
   //       this.pendingUpdate = null;
   //    })

   //    if (this.pendingUpdate && this.pendingUpdate !== update) {
   //       this.pendingUpdate.cancel()
   //    }
   // }
   // else {
   if (op.pendingUpdate && op.pendingUpdate !== update) {
      console.trace('cancelling', op, update)
      op.pendingUpdate.cancel()
      op.pendingUpdate = null;
      // pion.pState = NULL;
   }
   // pion.state = state;
   // }
   op.pendingUpdate = update
   console.trace('set pending update')
   update.queue(() => {
      console.log('mutate model update done')
      op.pendingUpdate = null
   })
}