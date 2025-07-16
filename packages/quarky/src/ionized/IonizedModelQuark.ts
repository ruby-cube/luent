import type { AnyObject } from "@rue/types"
import { __DEV__getTrace } from "../../../flask/debug"
import { IonizedModel } from "./IonizedModel"
import { trigger, WatchedAtom } from "../watch/WatchedAtom"
import { Quark, QuarkOf } from "../Quark"
import { Mutable, Mutation } from "../Mutable"
import { Traceable } from "../debug/Traceable"
import { AtomicOp, TrackedOps } from "./AtomicOp"
import { debug } from "@rue/utils"
import { getIonizedMethodDef } from "./IonizedMethods"
import { isIonizedModel, toRaw } from "./ionize"




// type OpMap = Map<EntryKey, AtomicOp>
// type OpName = string
// type EntryKey = any




// type IonizedModelQuark = Quark<IonizedModel>
// & Watchable
// & CapsuleQuark
// & ParticleMorph
// & CompoundMorph<IonizedCompound>

// INERT MAP:
// inert
// withInertItems
// withInertEntries
// withInertKeys

// inertCollection:
// - items
// - entries
// - keys

export const InertCollection = {
   NA: 0,
   ITEMS: 1,
   ENTRIES: 2,
   KEYS: 3
} as const

export type InertCollectionType = (typeof InertCollection)[keyof typeof InertCollection]

const IONIZED_MODEL = 'ionized model' as const

export class IonizedModelQuark implements QuarkOf<IonizedModel> {
   quarkType = IONIZED_MODEL
   asTraceable: Traceable

   constructor(
      public entity: IonizedModel,
      public rawTarget: AnyObject,
      // public inertMap: MarkMap | InertCollectionType | undefined,
   ) {
      this.asTraceable = new Traceable()
      // this.watch = () => {
      //    this.trackAbsorbedIons() //FIX: find where to put this
      //    return watch.call(this)
      // }
      // this.unwatch = () => unwatch.call(this)
   }

   asMutable: Mutable = new Mutable()

   asWatchedAtom: WatchedAtom | undefined

   // watch: (this: Watchable) => WatchedAtom<Watchable>
   // unwatch: () => void

   private appendedProperties: Set<PropertyKey> = new Set()

   isNewProperty(key: PropertyKey) {
      return !(key in this.rawTarget) && !this.appendedProperties.has(key)
   }

   registerNewProperty(key: PropertyKey) {
      this.appendedProperties.add(key)
      // this.markDirty()
   }

   // private hasNewAbsorbedIons: boolean = true;
   // private markDirty() {
   //    this.hasNewAbsorbedIons = true
   // }
   // private undirty() {
   //    this.hasNewAbsorbedIons = false;
   // }

   // absorbedIons?: IterableSet<ParticleMorph> 

   // trackAbsorbedIons() {
   //    if (this.asCompound) return;
   //    const derivation = this.asCompound || (this.asCompound = new IonizedCompound(this))
   //    derivation.collectAbsorbedIons(this.entity!)
   //    if (this.asCompound.atoms.size === 0) this.asCompound = undefined // prevents watch from marking model as no reactivity
   //    // this.undirty()
   //    return derivation.atoms;
   // }

   trigger = trigger

   pions: Map<PropertyKey, Quark | TrackedOps> = new Map()

   registerPion(key: PropertyKey, pion: Quark) {
      this.pions.set(key, pion)
   }

   registerOp(key: PropertyKey, entryKey: any, atomicOp: AtomicOp) {
      const ops = this.pions.get(key) ?? new Map();
      if (!(ops instanceof Map)) {
         debug.error(`${String(key)} is not an op`)
         return;
      }
      this.pions.set(key, ops);
      ops.set(entryKey, atomicOp)
   }

   // unregisterPion(key: PropertyKey){
   //    this.pions.delete(key)
   // }



   //TODO: Do I really need observed entry keys??  Do I need to unregister pion?

   // allows collections to efficiently trigger observed props/ops when a sweeping mutation like clear() or .length = 0 occurs
   // observedEntryKeys?: Set<PropertyKey>

   // addObservedEntryKey(entryKey: any) {
   //    if (!this.observedEntryKeys) this.observedEntryKeys = new Set()
   //    this.observedEntryKeys.add(entryKey)
   // }

   // deleteObservedEntryKey(entryKey: any) {
   //    if (!this.observedEntryKeys) return;
   //    this.observedEntryKeys.delete(entryKey)
   // }

   // traceTriggers?: Set<PropertyKey> = __DEV__ ? new Set() : undefined
   // origin?: string
   // __DEV__labels?: Set<string>

   reversionOps: Map<string, (mutation: Mutation) => true> = new Map()

   revertOp(mutation: Mutation) {
      const op = mutation.op
      this.reversionOps.get(op)?.(mutation) || (this.reversionOps.set(op, (mutation: Mutation) => {
         const initialized = true;
         const configs = getIonizedMethodDef(this.rawTarget, op);
         if (configs)
            for (const config of configs) {
               const mutatingOps = config.mutatingOps
               if (mutatingOps && op in mutatingOps) {
                  const mutatingOp = mutatingOps[op]
                  if (!mutatingOp) continue;
                  mutatingOp.revert?.(mutation.target, mutation)
                  return initialized;
               }
            }
         return initialized;
      }))
   }
}



// export type Collection<K = any, V = any> = Set<K> | Array<K> | Map<K, V>

// export class MetaIonicCollection<T extends Collection = Collection> extends IonizedModelQuark<T> {
//     constructor(rawTarget: T, methods: AnyObject = {}) {
//         super(rawTarget, methods)
//     }

//     observedEntryKeys = new Set()

//     addObservedEntryKey(entryKey: any) {
//         this.observedEntryKeys.add(entryKey)
//     }

//     deleteObservedEntryKey(entryKey: any) {
//         this.observedEntryKeys.delete(entryKey)
//     }
// }

// export function isCollection(target: unknown): target is Collection {
//     return target instanceof Array || target instanceof Set || target instanceof Map
// }

