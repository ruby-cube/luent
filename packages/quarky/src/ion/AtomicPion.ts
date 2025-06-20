import { isIonizedModel, ionize, toRaw } from "../ionized/ionize";
import { unwatch, watch, Watchable, Watched } from "../watch/Watched";
import { asParticle, Particle, ParticleMorph } from "../compound/Particle";
import { quarkOf, QUARK, Quark, EntityQuark, QuarkOf } from "../Quark";
import { getActiveTracker } from "../ionic/IonicCompound";
import { IonizedModel } from "../ionized/IonizedModel";
import { MutableCapsule } from "../capsule/Capsule";
import { asPionQuark, PionQuark } from "../ionized/Pion";
import { trigger } from "../ReactivitySystem";
import { Traceable } from "../debug/Traceable";
import { MutableIon } from "./Ion";
import { initializeSnapshots } from "../ionized/TimeTraveler";

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
export function isAtomicPionQuark(value: any): value is AtomicPionQuark {
   return value instanceof AtomicPionQuark;
}

/** INTERNAL */
export type $AtomicPionState = MutableIon<unknown> & MutableCapsule & {
   [QUARK]: PionQuark<$AtomicPionState> & ParticleMorph & Watchable
}

/** 
 * INTERNAL 
 * - For reactive ions only. 
 * - Unlike other quark of entities that can only exist if the entity exists,
 * pion quark can exist before the ion is created. 
 * */
export class AtomicPionQuark implements QuarkOf<$AtomicPionState> {

   ionized: boolean = false;

   asWatched?: Watched
   asParticle?: Particle

   watch: () => Watched<Watchable>;
   unwatch: () => void;

   asTraceable: Traceable = new Traceable()

   private _entity: undefined | $AtomicPionState

   get entity() {
      return this._entity ?? (this._entity = createAtomicPion(this.model, this.key, this))
   }

   set entity(pion: $AtomicPionState) {
      this._entity = pion;
   }

   constructor(
      public model: IonizedModel,
      public key: PropertyKey,
   ) {
      this.watch = watch;
      this.unwatch = () => unwatch.call(this)
   }

   trigger = trigger
}


export function createAtomicPion(model: IonizedModel, key: PropertyKey, pionQuark?: AtomicPionQuark): $AtomicPionState {
   const rawTarget = toRaw(model)

   function $atomicPionState() {
      const tracker = getActiveTracker()
      if (tracker)
         return model[key];
      return rawTarget[key]
   }

   $atomicPionState[QUARK] = pionQuark ?? asPionQuark(model, key)

   Object.defineProperty($atomicPionState, 'state', {
      get() {
         return rawTarget[key]
      },
      set(value: unknown) {
         return model[key] = value;
      }
   })

   initializeSnapshots($atomicPionState)

   return $atomicPionState as unknown as $AtomicPionState
}

