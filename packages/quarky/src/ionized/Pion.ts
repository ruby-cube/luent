import { Ion } from "../ion/Ion"
import { EntityQuark, quarkOf } from "../Quark"
import { AtomicPionQuark, createAtomicPion } from "../ion/AtomicPion"
import { IonizedModel } from "./IonizedModel"
import { IonizedModelQuark } from "./IonizedModelQuark"
import { createDerivationPion, DerivationPionQuark } from "../ionic/DerivationPion"
import { Watchable } from "../watch/EffectCycle"
import { MaybeParticle } from "../Compound/Particle"

export type PionQuark<T = AtomicPionQuark | DerivationPionQuark> = EntityQuark<T> & Watchable & MaybeParticle

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