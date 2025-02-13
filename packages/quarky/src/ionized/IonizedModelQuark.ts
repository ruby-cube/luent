import type { AnyObject } from "@rue/types"
import { __DEV__getTrace } from "../../../flask/debug"
import { Traceable } from "../debug/debug"
import { CustomIonizedModelConfig, IonizedModel } from "./IonizedModel"
import { unwatch, watch, Watchable, Watched } from "../watch/Watched"
import { ParticleMorph, Particle } from "../Compound/Particle"
import { MaybeCompound } from "../Compound/Compound"
import { IonizedCompound } from "./IonizedCompound"
import { EntityQuark, Quark, QuarkOf } from "../Quark"
import { Capsule } from "../capsule/Capsule"
import { Mutation } from "../actions/Mutable"
import { PionQuark } from "./Pion"
import { IterableSet } from "@rue/utils"




// type OpMap = Map<EntryKey, AtomicOp>
// type OpName = string
// type EntryKey = any




// type IonizedModelQuark = Quark<IonizedModel>
// & Watchable
// & CapsuleQuark
// & ParticleMorph
// & MaybeCompound<IonizedCompound>

export class IonizedModelQuark
   implements Watchable, QuarkOf<Capsule>, ParticleMorph, MaybeCompound<IonizedCompound> {

   asReined?: object
   asReadonly?: object
   __DEV__asTraceable = new Traceable()

   constructor(
      public entity: IonizedModel,
      public rawTarget: AnyObject,
      public methods: AnyObject | undefined,
      public structureConfigs: CustomIonizedModelConfig[]
   ) {
      if (__DEV__) this.__DEV__asTraceable = new Traceable()
      this.watch = () => {
         this.trackAbsorbedIons()
         return watch.call(this)
      }
      this.unwatch = () => unwatch.call(this)
   }

   recordOp: ((mutation: Mutation) => void) | undefined
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

   pions: Map<PropertyKey, PionQuark> = new Map()

   registerPion(key: PropertyKey, pion: PionQuark) {
      this.pions.set(key, pion)
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

   // __DEV__traceTriggers?: Set<PropertyKey> = __DEV__ ? new Set() : undefined
   // __DEV__origin?: string
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

