import { AnyObject } from "@rue/types"
import { debug } from "@rue/utils"
import { IonizedModel } from "./IonizedModel"
import { getAtomicPion } from "./Pion"
import { AtomicOp, getAtomicOp, getAtomicOps } from "./AtomicOp"
import { quarkOf } from "../Quark"
import { ionize, toRaw } from "./ionize"
import { ionizableArrayDef } from "./IonizedArray"

type Constructor = new (...args: any[]) => any

export type TrackableOpDef = {
   // trackable ops
   createOp?: (target: AnyObject, key: PropertyKey, ionized?: IonizedModel) => Function,
   input?: (input: any[]) => any[],
   output?: (output: any, model: IonizedModel) => any,
   this?: (target: AnyObject, input: any[]) => AnyObject,
   track: (model: IonizedModel, op: PropertyKey, input: any[]) => [IonizedModel] | [IonizedModel, PropertyKey, any[]] // track op
}
export type TriggeringOpDef = {
   createOp?: (target: AnyObject, key: PropertyKey, ionized?: IonizedModel) => Function,
   input?: (input: any[]) => any[],
   preop?: GetPreopData
   shouldTrigger?: (preopData: any) => boolean
   triggers: (model: IonizedModel, args: any[], preopData: any) => (() => void)[]
   output?: (output: any, model: IonizedModel) => any,
   revert?: Revert
}

type IonizableMethodDef = TrackableOpDef | TriggeringOpDef

export type GetPreopData = (target: AnyObject, args: any[]) => any;
type Revert = (model: AnyObject, data: { output: any, preopData: any, args: any[] }) => void

export type IonizableClassDef = {
   [key: PropertyKey]: IonizableMethodDef
}

export const triggeringPropertySetOp: TriggeringOpDef = {
   createOp: (target) => (key: PropertyKey, value: unknown) => target[key] = value,
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

const ionizableClassesMap = new Map([
   [Object as Constructor, { '[[set]]': triggeringPropertySetOp } as IonizableClassDef | undefined],
   [Array, ionizableArrayDef]
])

export function isIonizable(constructor: Constructor) {
   return ionizableClassesMap.has(constructor);
}

export function getIonizableMethodDef(target: AnyObject, methodKey: PropertyKey) { //FIX: this is causing infinite loops e.g. toJSON()
   let constructor = target.constructor as Constructor
   let _target = target;
   while (constructor !== Object) {
      if (Object.hasOwn(target, methodKey)) {
         return ionizableClassesMap.get(constructor)?.[methodKey]
      }
      const def = ionizableClassesMap.get(constructor)?.[methodKey]
      if (def) {
         return def;
      }
      _target = Object.getPrototypeOf(_target)
      constructor = _target.constructor as Constructor
   }
   // return ionizableClassesMap.get(Object)?.['[[set]]']
}

export function makeIonizable(constructor: Constructor, def?: IonizableClassDef) {
   const existingDef = ionizableClassesMap.get(constructor)
   if (existingDef && def) debug.warn(`Overriding existing Ionizable class defintion`)
   if (existingDef) return;
   ionizableClassesMap.set(constructor, def)
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
   return () => {
      const ops = getAtomicOps(model, op)
      if (ops)
         for (const [_, op] of ops) {
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
      return () => getAtomicPion(model, entryKey)?.trigger()
   }
   else if (op) {
      return () => getAtomicOp(model, op, entryKey)?.trigger()
   }
   return () => quarkOf(model).trigger()
}



// if (__DEV__) emitSignal();
//       const value = toRaw(arg)
//       getActiveTracker()?.track(asAtomicOp(model, op, value))
//       return maybeIonize(fn.call(target, value))
