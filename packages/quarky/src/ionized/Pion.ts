import { Ion } from "../ion/Ion"
import { Quark, quarkOf } from "../Quark"
import { AtomicPionQuark, createAtomicPion } from "../ion/AtomicPion"
import { IonizedModel } from "./IonizedModel"
import { IonizedModelQuark } from "./IonizedModelQuark"
import { createDerivationPion, DerivationPionQuark } from "../ionic/DerivationPion"
import { debug } from "@rue/utils"
import { AnyObject } from "@rue/types"

// export type PionQuark = Quark<string | symbol, $AtomicPionState | $DerivedPionState>

export function asPionQuark(
   model: IonizedModel,
   key: PropertyKey,
) {
   const pionQuark = quarkOf(model).pions.get(key) ?? createPionQuark(model, key)
   if (pionQuark instanceof AtomicPionQuark || pionQuark instanceof DerivationPionQuark)
      return pionQuark;
   debug.error(`[INVALID KEY] ${String(key)} is not a pion`)
}

function createPionQuark(model: IonizedModel, key: PropertyKey) {
   const quark = quarkOf(model)
   const derivation = getPropertyGetter(quark, key)
   const pion = derivation ? new DerivationPionQuark(model, key, derivation) : new AtomicPionQuark(model, key)
   quark.pions.set(key, pion)
   return pion
}

function getPropertyGetter(modelQuark: IonizedModelQuark, key: PropertyKey) {
   let rawTarget = modelQuark.rawTarget
   while (rawTarget.constructor !== Object) {
      const propertyDescriptor = Object.getOwnPropertyDescriptor(rawTarget, key)
      if (propertyDescriptor)
         return propertyDescriptor.get;
      rawTarget = Object.getPrototypeOf(rawTarget)
   }
   return undefined;
}

export function asPion(
   model: IonizedModel,
   key: PropertyKey,
): Ion | undefined {
   const pion = asPionQuark(model, key)
   if (!pion) {
      debug.error(`${String(key)} is not a pion key`)
      return;
   }
   return pion.entity ?? (pion.entity = createPion(model, key, pion))
   //TODO: tidy up pion code... some of it feels redundant, especially setting entity
}

function createPion(model: IonizedModel, key: PropertyKey, pionQuark: Quark & AnyObject) {
   const derivation = pionQuark && 'derivation' in pionQuark ? pionQuark.derivation : getPropertyGetter(quarkOf(model), key)
   return derivation ? createDerivationPion(model, key, pionQuark) : createAtomicPion(model, key, pionQuark)
}

// /**
//  * Observed means tracked and/or watched
//  * @param model 
//  * @param key 
//  */
// export function getObservedPion(
//    model: IonizedModel,
//    key: PropertyKey,
// ) {
//    const pion = quarkOf(model).pions.get(key)
//    return pion && (pion.asWatchedAtom || pion.asParticle) ? pion : undefined
// }

export function $atomicPion(
   model: IonizedModel,
   key: PropertyKey,
) {
   const pion = quarkOf(model).pions.get(key)
   return pion && pion instanceof AtomicPionQuark ? pion : undefined
}

// export function triggerPion(quark: PionQuark | undefined) {
//    quark?.asWatchedAtom?.triggerEffects()
// }
