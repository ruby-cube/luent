import { Capsule } from "../capsule/Capsule";
import { Particle } from "../Compound/Particle";
import { Traceable } from "../debug/debug";
import { Ion, NonVoid } from "../ion/Ion";
import { IonizedModel } from "../ionized/IonizedModel";
import { asPionQuark, PionQuark } from "../ionized/Pion";
import { QUARK, QuarkOf, quarkOf } from "../Quark";
import { unwatch, watch, Watchable, Watched } from "../watch/Watched";
import { createMaybeMemoizedIon, DERIVATION_ION, ManagedDerivation } from "./DerivationIon";
import { IonicCompound } from "./IonicCompound";


/**
 * INTERNAL
 * @param value 
 * @returns 
 */
export function isDerivationPionQuark(value: any): value is DerivationPionQuark {
   return quarkOf(value) instanceof DerivationPionQuark;
}

/** INTERNAL */
export type $DerivedPionState = Ion & Capsule & {
   [QUARK]: PionQuark<$DerivedPionState> & ManagedDerivation
}

/** 
 * INTERNAL 
 * - For reactive ions only. 
 * - Unlike other quark of entities that can only exist if the entity exists,
 * pion quark can exist before the ion is created. 
 * */
export class DerivationPionQuark implements QuarkOf<$DerivedPionState> {
   type = DERIVATION_ION
   inert: boolean = false
   state: unknown;
   dirty: boolean = false

   asParticle?: Particle
   asCompound?: IonicCompound<{ asCompound?: IonicCompound; } & Watchable> | undefined;

   asWatched?: Watched
   watch: () => Watched<Watchable>;
   unwatch: () => void;

   __DEV__asTraceable: Traceable = new Traceable()

   constructor(
      public model: IonizedModel,
      public key: PropertyKey,
      public derivation: () => NonVoid,
   ) {
      this.watch = watch;
      this.unwatch = () => unwatch.call(this)
   }

   private _entity: undefined | $DerivedPionState

   get entity() {
      return this._entity ?? (this._entity = createDerivationPion(this.model, this.key, this))
   }

   set entity(pion: $DerivedPionState) {
      this._entity = pion;
   }
}

export function createDerivationPion(model: IonizedModel, key: PropertyKey, pionQuark?: DerivationPionQuark): $DerivedPionState {
   const quark = pionQuark ?? asPionQuark(model, key)
   return createMaybeMemoizedIon(quark.derivation, undefined, undefined, pionQuark ?? asPionQuark(model, key))
}

