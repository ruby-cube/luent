import { AnyObject } from "@rue/types";
import { isIonizedModel, ionize, toRaw } from "./ionize";
import { unwatch, watch, Watchable, Watched } from "../watch/Watched";
import { asParticle, Particle } from "../Compound/Particle";
import { quarksOf, QUARKS, Quarks, EntityQuarks, QuarksOf } from "../Quarks";
import { getActiveTracker } from "../ionic/IonicCompound";
import { IonizedModel } from "./IonizedModel";
import { Atomic, Ion, isIon, WritableIon } from "../ion/Ion";
import { MutableCapsule } from "../capsule/Capsule";
import { Mutation } from "../actions/Mutable";
import { __DEV__traceMethodCall, Traceable } from "../debug/debug";
import { IonizedModelQuarks, PionQuarks } from "./IonizedModelQuarks";

// writable vs non-writable 
// inert vs reactive
// derivation vs direct value

/* 
Writable vs non-writable
- let the ionized model throw the error not the pion. All atomic pions will look writable, but might not actually be

Derivation vs direct value
- Object.getOwnPropertyDescriptors
- inert vs reactive
 */



/**
 * INTERNAL
 * @param value 
 * @returns 
 */
export function isAtomicPion(value: any): value is AtomicPion {
   return quarksOf(value) instanceof AtomicPionQuarks;
}

/** INTERNAL */
export type $AtomicPionState = WritableIon & MutableCapsule & {
   [QUARKS]: Atomic & PionQuarks<$AtomicPionState>
}

/** 
 * INTERNAL 
 * - For reactive ions only. 
 * - Unlike other quarks of entities that can only exist if the entity exists,
 * pion quarks can exist before the ion is created. 
 * */
export type AtomicPion = QuarksOf<$AtomicPionState>


class AtomicPionQuarks implements AtomicPion {

   asReadonly?: Ion
   asReined?: Ion

   asWatched?: Watched
   asParticle?: Particle

   watch: () => Watched<Watchable>;
   unwatch: () => void;

   __DEV__asTraceable: Traceable = new Traceable()
   recordOp: ((mutation: Mutation) => void) | undefined;

   constructor(
      public model: IonizedModel,
      public key: PropertyKey,
   ) {
      this.watch = watch;
      this.unwatch = () => unwatch.call(this)
   }

   private _entity: undefined | $AtomicPionState

   get entity() {
      return this._entity ?? (this._entity = createAtomicPion(this.model, this.key, this))
   }

   set entity(pion: $AtomicPionState) {
      this._entity = pion;
   }
}


export function asPropIon(
   model: AnyObject,
   key: PropertyKey,
): $AtomicPionState {
   const ionicModel = isIonizedModel(model) ? model : ionize(model) //TODO: is there a more performant solution than ionizing non-reactive models? like mapping model to prop ions?
   const rawTarget = toRaw(ionicModel)
   const value = rawTarget[key];

   if (isIon(value)) {
      // absorbed ion
      return value;
   }

   // return existing propIon
   const propIon = getPropIon(ionicModel, key) //TODO: need a map for readonly prop ions too...
   if (propIon) {
      // if (isReinedIonizedModel(ionicModel)) {
      //    readonly(propIon)
      // }
      return propIon as AsPropIon<T, K, M>
   }
   return createPropIon(ionicModel, key) as AsPropIon<T, K, M>
}



function createAtomicPion(model: IonizedModel, key: PropertyKey, pionQuarks?: AtomicPionQuarks): $AtomicPionState {
   const rawTarget = toRaw(model)

   function $propIon() {
      const tracker = getActiveTracker()
      if (tracker)
         return model[key];
      return rawTarget[key]
   }

   $propIon[QUARKS] = pionQuarks ?? asPionQuarks(model, key)

   Object.defineProperty($propIon, 'state', {
      get() {
         return rawTarget[key]
      },
      set(value: unknown) {
         return model[key] = value;
      }
   })

   return $propIon as $AtomicPionState
}

export function asPionQuarks(
   model: IonizedModel,
   key: PropertyKey,
) {
   const quarks = quarksOf(model)
   return quarks.pions.get(key) ?? createPionQuarks(model, key)
}

function createPionQuarks(model: IonizedModel, key: PropertyKey){
   const quarks = quarksOf(model)
   const pion = isGetterProperty(quarks, key) ? new DerivationPionQuarks() : new AtomicPionQuarks(model, key)
   quarks.pions.set(key, pion)
   return pion
}

function isGetterProperty(modelQuarks: IonizedModelQuarks, key: PropertyKey){
   return true; //TODO:
}