import { Ion } from "../ion/Ion"
import { EntityQuark, quarkOf } from "../Quark"
import { $AtomicPionState, AtomicPionQuark, createAtomicPion } from "../ion/AtomicPion"
import { IonizedModel } from "./IonizedModel"
import { IonizedModelQuark } from "./IonizedModelQuark"
import { $DerivedPionState, createDerivationPion, DerivationPionQuark } from "../ionic/DerivationPion"
import { ParticleMorph } from "../Compound/Particle"
import { Watchable } from "../watch/Watched"

export type PionQuark<T = $AtomicPionState | $DerivedPionState> = EntityQuark<T> & Watchable & ParticleMorph

export function asPionQuark(
   model: IonizedModel,
   key: PropertyKey,
) {
   const quark = quarkOf(model)
   return quark.pions.get(key) ?? createPionQuark(model, key)
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
   while (rawTarget !== Object) {
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
): Ion {
   const pion = asPionQuark(model, key)
   return pion.entity ?? (pion.entity = createPion(model, key, pion))
}

function createPion(model: IonizedModel, key: PropertyKey, pionQuark: PionQuark) {
   const derivation = pionQuark && 'derivation' in pionQuark ? pionQuark.derivation : getPropertyGetter(quarkOf(model), key)
   return derivation ? createDerivationPion(model, key, <DerivationPionQuark>pionQuark) : createAtomicPion(model, key, <AtomicPionQuark>pionQuark)
}

/**
 * Observed means tracked and/or watched
 * @param model 
 * @param key 
 */
export function getObservedPion(
   model: IonizedModel,
   key: PropertyKey,
) {
   const pion = quarkOf(model).pions.get(key)
   return pion && (pion.asWatched || pion.asParticle) ? pion : undefined
}