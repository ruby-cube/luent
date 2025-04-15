import type { AnyObject } from "@rue/types"
import { __DEV__getTrace } from "../../../flask/debug"
import { CustomIonizedModelConfig, IonizedModel } from "./IonizedModel"
import { unwatch, watch, Watchable, Watched } from "../watch/Watched"
import { ParticleMorph, Particle } from "../compound/Particle"
import { IonizedCompound } from "./IonizedCompound"
import { EntityQuark, Quark, QuarkOf } from "../Quark"
import { Mutable, Mutation } from "../Mutable"
import { PionQuark } from "./Pion"
import { trigger } from "../ReactivitySystem"
import { Traceable } from "../debug/Traceable"
import { AtomicOp, TrackedOps } from "./AtomicOp"
import { debug } from "@rue/utils"




// type OpMap = Map<EntryKey, AtomicOp>
// type OpName = string
// type EntryKey = any




// type IonizedModelQuark = Quark<IonizedModel>
// & Watchable
// & CapsuleQuark
// & ParticleMorph
// & CompoundMorph<IonizedCompound>

export class IonizedModelQuark implements QuarkOf<IonizedModel> {

   asReined?: object
   asReadonly?: object
   asTraceable: Traceable

   constructor(
      public entity: IonizedModel,
      public rawTarget: AnyObject,
      public methods: AnyObject | undefined,
      public structureConfigs: CustomIonizedModelConfig[]
   ) {
      this.asTraceable = new Traceable()
      this.watch = () => {
         this.trackAbsorbedIons()
         return watch.call(this)
      }
      this.unwatch = () => unwatch.call(this)
   }

   asMutable: Mutable = new Mutable()

   asCompound?: IonizedCompound
   asParticle?: Particle | undefined
   asWatched?: Watched<Watchable> | undefined

   watch: (this: Watchable) => Watched<Watchable>
   unwatch: () => void

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

   trackAbsorbedIons() {
      if (this.asCompound) return;
      const derivation = this.asCompound || (this.asCompound = new IonizedCompound(this))
      derivation.collectAbsorbedIons(this.entity!)
      // this.undirty()
   }

   trigger = trigger

   pions: Map<PropertyKey, PionQuark | TrackedOps> = new Map()

   registerPion(key: PropertyKey, pion: PionQuark) {
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
         const configs = this.structureConfigs;
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

