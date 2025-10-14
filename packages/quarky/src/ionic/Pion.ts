import { Ion } from "../ion/Ion"
import { Quark, quarkOf } from "../abstract/Quark"
import { IonicProxy } from "./Ionic"
import { ModelQuark } from "./ModelQuark"
import { debug } from "@rue/utils"
import { AnyObject } from "@rue/types"
import { PionState } from "../ion/AtomicIon"

// export type PionQuark = Quark<string | symbol, $AtomicPionState | $DerivedPionState>

// function asPionQuark(
//    model: IonicProxy,
//    key: PropertyKey,
// ) {
//    const pionQuark = quarkOf(model).pions[key] ?? new AtomicPionQuark(new PionState())
//    if (pionQuark instanceof AtomicPionQuark)
//       return pionQuark;
//    debug.error(`[INVALID KEY] ${String(key)} is not a pion`)
// }

// function createPionQuark(model: IonicProxy, key: PropertyKey) {
//    const quark = quarkOf(model)
//    const derivation = getPropertyGetter(quark, key)
//    const pion = derivation ? new DerivationPionQuark(model, key, derivation) : new AtomicPionQuark(model, key)
//    quark.registerPion(key, pion)
//    return pion
// }

// function getPropertyGetter(modelQuark: ModelQuark, key: PropertyKey) {
//    let rawTarget = modelQuark.rawTarget
//    while (rawTarget.constructor !== Object) {
//       const propertyDescriptor = Object.getOwnPropertyDescriptor(rawTarget, key)
//       if (propertyDescriptor)
//          return propertyDescriptor.get;
//       rawTarget = Object.getPrototypeOf(rawTarget)
//    }
//    return undefined;
// }

// export function asPion(
//    model: IonicProxy,
//    key: PropertyKey,
// ): Ion | undefined {
//    const pion = asPionQuark(model, key)
//    if (!pion) {
//       debug.error(`${String(key)} is not a pion key`)
//       return;
//    }
//    return pion.entity ?? (pion.entity = createPion(model, key, pion))
//    // TODO: tidy up pion code... some of it feels redundant, especially setting entity
// }

// function createPion(model: IonicProxy, key: PropertyKey, pionQuark: Quark & AnyObject) {
//    const derivation = pionQuark && 'derivation' in pionQuark ? pionQuark.derivation : getPropertyGetter(quarkOf(model), key)
//    return derivation ? createDerivationPion(model, key, pionQuark) : createAtomicPion(model, key, pionQuark)
// }

// /**
//  * Observed means tracked and/or watched
//  * @param model 
//  * @param key 
//  */
// export function getObservedPion(
//    model: IonicProxy,
//    key: PropertyKey,
// ) {
//    const pion = quarkOf(model).pions.get(key)
//    return pion && (pion.asWatched || pion.asParticle) ? pion : undefined
// }



// export function triggerPion(quark: PionQuark | undefined) {
//    quark?.asWatched?.triggerEffects()
// }
