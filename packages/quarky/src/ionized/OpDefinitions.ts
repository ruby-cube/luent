import { AnyObject } from "@rue/types"
import { ionize, toRaw } from "./ionize"
import { TrackableOpDef } from "./makeIonizable"
import { IonizedModel, maybeIonize } from "./IonizedModel"

const toIonizedDecoyOfTargetOrThisArg = (target: AnyObject, args: any[]) => ionizedDecoy(args[1] ?? target)
export const trackModel = (model: IonizedModel) => [model] as [IonizedModel]

export const trackableGetOp: TrackableOpDef = {
   input: (args) => (args[0] = toRaw(args[0]), args),
   track: (model, op, args) => [model, op, args],
   output: maybeIonizeNested
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
   input: (args) => (args[0] = toRaw(args[0]), args),
   this: rawDecoy,
   track: trackModel
}



export function maybeIonizeNested(value: any, model: IonizedModel){
      return maybeIonize(value)//TODO: encapsulated or readonly
}


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