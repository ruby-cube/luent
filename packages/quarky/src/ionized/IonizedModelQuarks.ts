import type { AnyObject } from "@rue/types"
import { PropIon } from "./Pion"
import { __DEV__getTrace } from "../../../flask/debug"
import { Traceable } from "../debug/debug"
import { CustomIonizedModelConfig, IonizedModel } from "./IonizedModel"
import { unwatch, watch, Watchable, Watched } from "../watch/Watched"
import { MaybeParticle, Particle } from "../Compound/Particle"
import { MaybeCompound } from "../Compound/Compound"
import { IonizedCompound } from "./IonizedCompound"
import { QuarksOf } from "../Quarks"
import { Capsule } from "../capsule/Capsule"
import { Mutation } from "../actions/Mutable"




// type OpMap = Map<EntryKey, TrackedOp>
// type OpName = string
// type EntryKey = any

export const IONIZED_MODEL = Symbol('ionicModel')



// type IonizedModelQuarks = Quarks<IonizedModel>
// & Watchable
// & CapsuleQuarks
// & MaybeParticle
// & MaybeCompound<IonizedCompound>

export class IonizedModelQuarks
   implements Watchable, QuarksOf<Capsule>, MaybeParticle, MaybeCompound<IonizedCompound> {
   // entity!: IonizedModel
   ionicModel?: IonizedModel //TODO: rename as entity
   // shallowReactive?: IonizedModel<T>
   readonly type = IONIZED_MODEL

   asReined?: object
   asReadonly?: object
   __DEV__asTraceable = new Traceable()


   initIonizedModel(ionicModel: IonizedModel) {
      if (this.ionicModel) return;
      this.ionicModel = ionicModel;
   }

   // initShallowReactive(ionicModel: IonizedModel) {
   //     if (this.deepReactive) return;
   //     this.deepReactive = ionicModel as IonizedModel<T>;
   // }

   constructor(
      public rawTarget: AnyObject,
      public methods: AnyObject | undefined,
      public structureConfigs: CustomIonizedModelConfig[]
      // public reactive: T
      // public traps?: ReactiveTraps<T>
   ) {
      if (__DEV__) this.__DEV__asTraceable = new Traceable()
      this.unwatch = () => {
         unwatch(this.asWatched!, () => {
            this.asWatched = undefined
         })
      }
   }
   recordOp: ((mutation: Mutation) => void) | undefined
   asCompound?: IonizedCompound
   asParticle?: Particle | undefined
   asWatched?: Watched<Watchable> | undefined
   
   watch() {
      return watch(this, () => {
         return this.asWatched = new Watched(this)
      })
   }
   unwatch: () => void


   private appendedProperties: Set<PropertyKey> = new Set()

   isNewProperty(key: PropertyKey) {
      return !(key in this.rawTarget) && !this.appendedProperties.has(key)
   }

   registerNewProperty(key: PropertyKey) {
      this.appendedProperties.add(key)
      this.markDirty()
   }

   private hasNewAbsorbedIons: boolean = true;
   private markDirty() {
      this.hasNewAbsorbedIons = true
   }
   private undirty() {
      this.hasNewAbsorbedIons = false;
   }

   // private asCompound?: IonizedCompound

   trackAbsorbedIons() {
      if (this.asCompound && this.hasNewAbsorbedIons === false) return;
      const derivation = this.asCompound || (this.asCompound = new IonizedCompound(this))
      derivation.collectAbsorbedIons(this.ionicModel!)
      this.undirty()
   }

   // observedProps?: Map<PropertyKey, ObservedProp>

   // registerObservedProp(key: PropertyKey, prop: ObservedProp) {
   //     if (!this.observedProps) this.observedProps = new Map()
   //     this.observedProps.set(key, prop)
   // }

   // unregisterObservedProp(key: PropertyKey) {
   //     if (!this.observedProps) return;
   //     this.observedProps.delete(key)
   // }

   // getObservedProp(key: PropertyKey) {
   //     if (!this.observedProps) return;
   //     return this.observedProps.get(key)
   // }



   propIons?: Map<PropertyKey, PropIon>

   registerPropIon(key: PropertyKey, ion: PropIon) {
      if (!this.propIons) this.propIons = new Map()
      this.propIons.set(key, ion)
   }

   unregisterPropIon(key: PropertyKey) { //QUESTION: When to unregister?  when watchcount === 0 and observedProps atom size === 0?
      if (!this.propIons) return;
      this.propIons.delete(key)
   }

   getPropIon(key: PropertyKey) {
      if (!this.propIons) return;
      return this.propIons.get(key)
   }


   // trackedOps?: Map<OpName, OpMap>

   // registerTrackedOp(op: OpName, entryKey: EntryKey, trackedOp: TrackedOp) {
   //    if (!this.trackedOps) this.trackedOps = new Map()
   //    let opMap = this.trackedOps.get(op);
   //    if (!opMap) {
   //       opMap = new Map();
   //       this.trackedOps.set(op, opMap)
   //    }
   //    opMap.set(entryKey, trackedOp)
   // }

   // unregisterTrackedOp(op: OpName, entryKey: EntryKey) {
   //    if (!this.trackedOps) return;
   //    const opMap = this.trackedOps.get(op)
   //    opMap?.delete(entryKey)
   //    if (opMap?.size === 0) {
   //       this.trackedOps.delete(op)
   //    }
   // }




   // allows collections to efficiently trigger observed props/ops when a sweeping mutation like clear() or .length = 0 occurs
   observedEntryKeys?: Set<PropertyKey>

   addObservedEntryKey(entryKey: any) {
      if (!this.observedEntryKeys) this.observedEntryKeys = new Set()
      this.observedEntryKeys.add(entryKey)
   }

   deleteObservedEntryKey(entryKey: any) {
      if (!this.observedEntryKeys) return;
      this.observedEntryKeys.delete(entryKey)
   }

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

// export class MetaIonicCollection<T extends Collection = Collection> extends IonizedModelQuarks<T> {
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

