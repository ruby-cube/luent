import { Capsule } from "../capsule/Capsule";
import { Traceable } from "../debug/Traceable";
import { Effect } from "../effect-cycle/EffectQueue";
import { Ion } from "../ion/Ion";
import { IonizedModel } from "../ionized/IonizedModel";
import { asPionQuark } from "../ionized/Pion";
import { Quark, QUARK, QuarkOf, quarkOf } from "../Quark";
import { WatchedAtom } from "../watch/WatchedAtom";
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

const DERIVATION_PION = 'derivation pion' as const

/** INTERNAL */
export type $DerivedPionState = Ion
   & Capsule
   & {
      [QUARK]: Quark<typeof DERIVATION_PION, $DerivedPionState> & ManagedDerivation
   }

/** 
 * INTERNAL 
 * - For reactive ions only. 
 * - Unlike other quark of entities that can only exist if the entity exists,
 * pion quark can exist before the ion is created. 
 * */
export class DerivationPionQuark implements QuarkOf<$DerivedPionState> {
   quarkType = DERIVATION_ION
   inert: boolean = false
   state: unknown;
   stale: boolean = false
   markStale: Effect | undefined

   asCompound: IonicCompound | undefined;

   asWatchedAtom?: WatchedAtom

   asTraceable: Traceable = new Traceable()

   constructor(
      public model: IonizedModel,
      public key: PropertyKey,
      public derivation: () => unknown,
   ) {
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
   const quark = pionQuark ?? asPionQuark(model, key) as DerivationPionQuark
   return createMaybeMemoizedIon(quark.derivation, undefined, undefined, quark)
}

