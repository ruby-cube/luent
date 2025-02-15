import { AnyObject } from "@rue/types";
import { isIonizedModel, ionize, toRaw } from "../ionized/ionize";
import { unwatch, watch, Watchable, Watched } from "../watch/Watched";
import { asParticle, Particle } from "../Compound/Particle";
import { quarkOf, QUARK, Quark, EntityQuark, QuarkOf } from "../Quark";
import { getActiveTracker } from "../ionic/IonicCompound";
import { IonizedModel } from "../ionized/IonizedModel";
import { Ion, isIon, AtomicIon } from "./ion";
import { MutableCapsule } from "../capsule/Capsule";
import { Mutation } from "../actions/Mutable";
import { __DEV__traceMethodCall, Traceable } from "../debug/debug";
import { asPionQuark, PionQuark } from "../ionized/Pion";
import { Atomic } from "./Atomic";

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
   return quarkOf(value) instanceof AtomicPionQuark;
}

/** INTERNAL */
export type $AtomicPionState = AtomicIon & MutableCapsule & {
   [QUARK]: PionQuark<$AtomicPionState> & Atomic
}

/** 
 * INTERNAL 
 * - For reactive ions only. 
 * - Unlike other quark of entities that can only exist if the entity exists,
 * pion quark can exist before the ion is created. 
 * */
export class AtomicPionQuark implements QuarkOf<$AtomicPionState> {

   asReadonly?: Ion
   asReined?: Ion

   ionized: boolean = false;

   asWatched?: Watched
   asParticle?: Particle

   watch: () => Watched<Watchable>;
   unwatch: () => void;

   __DEV__asTraceable: Traceable = new Traceable()
   recordOp: ((mutation: Mutation) => void) | undefined;
   mutation: undefined

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
}


export function createAtomicPion(model: IonizedModel, key: PropertyKey, pionQuark?: AtomicPionQuark): $AtomicPionState {
   const rawTarget = toRaw(model)

   function $propIon() {
      const tracker = getActiveTracker()
      if (tracker)
         return model[key];
      return rawTarget[key]
   }

   $propIon[QUARK] = pionQuark ?? asPionQuark(model, key)

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

