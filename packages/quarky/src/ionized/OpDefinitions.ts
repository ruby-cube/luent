import { AnyObject } from "@rue/types"
import { ionize, toRaw } from "./ionize"
import { TrackableOpDef } from "./IonizedMethods"
import { getIonizedModel, IonizedModel, maybeIonize } from "./IonizedModel"
import { quarkOf } from "../Quark"
import { asAtomicOp } from "./AtomicOp"
import { trackParticle } from "../compound/Compound"

const toIonizedDecoyOfTargetOrThisArg = (target: AnyObject, args: any[]) => ionizedDecoy(args[1] ?? target)
export const trackModel = (model: IonizedModel) => {
   trackParticle(quarkOf(model))
}
export const trackOp = (model: IonizedModel, op: PropertyKey, args: unknown[]) => {
   trackParticle(asAtomicOp(quarkOf(model), op, args![0]))
}



/**
 * Checks for raw key, then checks for ionized key if raw key fails.
 * If ionized key works, replaces ionized key with raw key.
 * This optimizes .has(key) for future calls. Can be configured for 
 * .has() dependent ops such as delete(), get()
 * @param rawKey 
 * @param target 
 * @returns 
 */
export function hasMaybeIonized(
   rawKey: unknown,
   target: { has(value: unknown): boolean },
   { passRaw, fail, passIonized }: {
      passRaw: (key: unknown) => unknown,
      passIonized: (key: IonizedModel, rawKey: AnyObject) => unknown,
      fail: unknown
   }) {
   if (target.has(rawKey)) {
      return passRaw(rawKey);
   }
   const ionizedKey = getIonizedModel(rawKey);
   if (ionizedKey && target.has(ionizedKey)) {
      return passIonized(ionizedKey, rawKey as AnyObject)
   }
   return fail;
}

   export function deleteOp(this: Set<unknown> | Map<unknown, unknown>, key: unknown) {
      const deleteOp = this.delete.bind(this)
      return hasMaybeIonized(key, this as Set<unknown>, {
      passRaw: deleteOp,
      passIonized: deleteOp,
      fail: false
   })
}





export const trackableOp: TrackableOpDef = {
   track: trackModel
}


export const trackableOpWithCallback: TrackableOpDef = {
   this: ionizedDecoy,
   track: trackModel,
}


export const trackableIterative: TrackableOpDef = {
   this: toIonizedDecoyOfTargetOrThisArg,
   track: trackModel,
}


/**
 * For methods that produce a new version of the original data structure by iterating over the original, eg. array.map()
 */
export const trackableCreativeIterative: TrackableOpDef = {
   this: toIonizedDecoyOfTargetOrThisArg,
   track: trackModel,
   output: (o) => ionize(o)
}


/**
 * For methods that produce a new version of the original data structure, eg. array.toReversed()
 */
export const trackableCreativeOp: TrackableOpDef = {
   track: trackModel,
   output: (o) => ionize(o)
}


/**
 * A method that produces a new version of the original data structure, eg. array.toReversed()
 */
export const trackableCreativeOpWithArgs: TrackableOpDef = {
   input: args => args.map(item => toRaw(item)),
   track: trackModel,
   output: (o) => ionize(o)
}

export const trackableCheckOp: TrackableOpDef = {
   input: (args) => {
      args[0] = toRaw(args[0]);
      return args
   },
   this: rawDecoy,
   track: trackModel
}



// export function maybeIonizeNested(value: any, model: IonizedModel) {
//    return maybeIonize(value)//TODO: encapsulated or readonly
// }


function ionizedDecoy(target: AnyObject) {
   return new Proxy(target, {
      get(target, key) {
         return maybeIonize(target[key])
      },
      set(target, key, value) {
         target[key] = toRaw(value)
         return true;
      }
   })
}

function rawDecoy(target: AnyObject) {
   return new Proxy(target, {
      get(target, key) {
         return toRaw(target[key])
      },
      set(target, key, value) {
         target[key] = toRaw(value)
         return true;
      }
   })
}

