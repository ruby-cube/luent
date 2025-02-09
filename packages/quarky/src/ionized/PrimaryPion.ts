import { AnyObject } from "@rue/types";
import {  isIonizedModel, ionize, IonizedModel, toRaw } from "./ionize";
import { asWatched, Watched } from "../watch/Watched";
import { asParticle, Particle } from "../Compound/Particle";
import { quarksOf, QUARKS, Quarks } from "../Quarks";
import { isIon } from "../muon/Muon";
import { getActiveTracker } from "../ionic/IonicCompound";


//TODO: Whether a Pion is Writable or not depends of if the property is writable
// If a property is non-writable, simply return a derivation function instead of a proper pion

export function isPropIon(value: any): value is PropIon {
   return quarksOf(value) instanceof MetaPropIon;
}

export type PropIon<T = any, M = undefined> = M extends undefined ? {
   (): T
   // set: (newValue: T) => T
   [QUARKS]: MetaPropIon
} : M & {
   (): T
   // set: (newValue: T) => T
   [QUARKS]: MetaPropIon
}

type TransferredMethods<T, M> = {
   [K in keyof M]: M[K] extends true ? T[K extends keyof T ? K : never] : T[M[K] extends keyof T ? M[K] : never]
}

// export type ReadonlyPropIon<T = any, M = undefined> = M extends undefined ? {
//     (selected?: true): T
//     [QUARKS]: MetaPropIon
// } : M & {
//     (selected?: true): T
//     [QUARKS]: MetaPropIon
// }

export type PropIonCapsule<T = any, M extends AnyObject = AnyObject> = {
   (): T
   [QUARKS]: MetaPropIon
} & M


// type AsPropIon<T, K extends keyof T, M> = PropIon<T[K], M>

const entryKeyValidators: ((model: AnyObject, key: PropertyKey) => boolean)[] = [];

export function registerEntryKeyValidator(isEntryKey: (model: AnyObject, key: PropertyKey) => boolean) {
   entryKeyValidators.push(isEntryKey);
}


function isEntryKey(rawModel: AnyObject, key: PropertyKey) {
   for (const validator of entryKeyValidators) {
      const is = validator(rawModel, key)
      if (is) return true;
   }
   return false;
}

class MetaPropIon implements Quarks{
 
   asReadonly?: PropIon
   // asObservedProp!: ObservedProp

   //to fulfill MetaWritableIon interface
   asReined = undefined
   isEntryKey = false;

   constructor(
      public o: PropIon,
      public model: IonizedModel,
      public key: PropertyKey,
      public inert: boolean = false
   ) {
      quarksOf(model).registerPropIon(key, o)
      this.isEntryKey = isEntryKey(toRaw(model), key)
   }
   entity: object;
   type: string | symbol;

   asWatched?: Watched
   asParticle?: Particle
   private isIndex: boolean = false

   watch() {
      if (this.asWatched) return;
      const metaModel = quarksOf(this.model)
      if (this.isEntryKey)
         metaModel.addObservedEntryKey(this.key);

      const watchSubject = this.asWatched = asWatched(this.o)

      watchSubject.onUnwatched(() => {
         if (watchSubject.watchCount === 0 && this.asParticle?.derivations.size === 0) {
            this.discard()
         }
      })
   }

   track() {
      if (this.asParticle) return;

      const atom = this.asParticle = asParticle(this.o)

      if (this.isEntryKey)
         quarksOf(this.model).addObservedEntryKey(this.key)

      atom.onUntracked(() => {
         if (this.asWatched?.watchCount === 0 && atom.derivations.size === 0) {
            this.discard()
         }
      })
   }

   discard() {
      const metaModel = quarksOf(this.model)
      const key = this.key
      if (this.isEntryKey) metaModel.deleteObservedEntryKey(key)
      metaModel.unregisterPropIon(key)
   }
}

type AsPropIon<T extends AnyObject, K extends keyof T, M> = PropIon<T[K], M extends AnyObject ? { [K in keyof TransferredMethods<T, M>]: TransferredMethods<T, M>[K] } : undefined>

// writable .state  --depending on if frog is readonly or mutable (or reined ?)

export function asPropIon<T extends AnyObject, K extends keyof T, M>(
   model: T,
   key: K,
): AsPropIon<T, K, M> {
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

export function getPropIon(
   ionicModel: IonizedModel,
   key: PropertyKey
) {
   return quarksOf(ionicModel).getPropIon(key)
}

function createPropIon(ionicModel: AnyObject, key: PropertyKey): PropIon {
   const rawTarget = toRaw(ionicModel)

   function $propIon() {
      reregisterIfNeeded($propIon, ionicModel, key)
      const tracker = getActiveTracker()
      if (tracker)
         return ionicModel[key];
      return rawTarget[key]
   }

   $propIon[QUARKS] = new MetaPropIon(<PropIon>$propIon, ionicModel, key)

   //TODO: only include state if ionicModel is not readonly
   Object.defineProperty($propIon, 'state', {
      get() {
         return rawTarget[key]
      },
      set(value: unknown) {
         ionicModel[key] = value;
      }
   })

   return $propIon as PropIon
   // return isReinedIonizedModel(ionicModel) ? reinIon($propIon as PropIon, READONLY) : $propIon //FIX: isn't it already protected?
}

function reregisterIfNeeded($propIon: PropIon, ionicModel: AnyObject, rawKey: PropertyKey) {
   const metaIonizedModel = quarksOf(ionicModel);
   if (!metaIonizedModel.getPropIon(rawKey)) {
      if (__DEV__) console.warn(`[CASE RESEARCH] I'm curious how often and in what cases this happens: $propIon for ${key.toString()} in${JSON.stringify(rawTarget)} is no longer observed, but there's still an active reference to it`)
      metaIonizedModel.registerPropIon(rawKey, $propIon as PropIon) // This means $propIon is not being watched and is not an atom anywhere, but it's still being used
   }
}

export function asTrackedProp(
   ionicModel: IonizedModel,
   key: PropertyKey
) {
   const prop = getPropIon(ionicModel, key) ?? createPropIon(ionicModel, key)
   const meta = quarksOf(prop)
   meta.track()
   return prop;
}

export function asWatchedProp(
   ionicModel: IonizedModel,
   key: PropertyKey
) {
   const prop = getPropIon(ionicModel, key) ?? createPropIon(ionicModel, key)
   const meta = quarksOf(prop)
   meta.watch()
   return prop;
}

export function getObservedProp( // observed means watched and/or tracked
   ionicModel: IonizedModel,
   key: PropertyKey
) {
   const prop = getPropIon(ionicModel, key);
   if (!prop) return undefined;
   const meta = quarksOf(prop);
   if (meta.asWatched || meta.asParticle) return prop;
   return undefined;
}

