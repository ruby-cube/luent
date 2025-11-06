import type { AnyObject } from "@rue/types"
import { __DEV__getTrace } from "../../../flask/debug"
import { IonicProxy } from "./Ionic"
import { trigger, Atom, TrackedAtom } from "../reactivity/Atom"
import { Mutable, Mutation } from "../abstract/Mutable"
import { Traceable } from "../debug/Traceable"
import { asAtomicOp, TrackedOps } from "./TrackableOp"
import { debug } from "@rue/utils"
import { getIonizedMemberDef } from "./IonicMethods"
import { AtomicIonQuark } from "../ion/AtomicIon"
import { ModelState } from "../reactivity/LazyState"
import { AtomicQuark } from "../abstract/AtomicQuark"
import { Ion } from "../ion/Ion"


const IONIZED_MODEL = 'ionized model' as const

type PionProxy = {[key: PropertyKey]: Ion<unknown>}


export class ModelQuark implements Atom {

   quarkType = IONIZED_MODEL

   __DEV__asTraceable: Traceable

   constructor(
      public model: IonicProxy,
      public rawTarget: AnyObject, //initialData
      public state: ModelState, // NOTE: this is only relevant for collections...
      public clone: ((obj: AnyObject) => AnyObject) | undefined,
      public proxyProto: AnyObject, //DEV only
   ) {

      this.__DEV__asTraceable = new Traceable()
   }

   asMutable: Mutable = new Mutable()

   asTrackedAtom: TrackedAtom | undefined

   trigger = trigger

   pions: undefined | PionProxy = undefined

   trackedOps: Record<PropertyKey, AtomicIonQuark | TrackedOps> = {}

   registerOp(key: PropertyKey, entryKey: any, atomicOp: AtomicQuark) {
      const ops = this.trackedOps[key] ?? new Map();
      if (!(ops instanceof Map)) {
         debug.error(`${String(key)} is not an op`)
         return atomicOp;
      }
      this.trackedOps[key] = ops;
      ops.set(entryKey, atomicOp)
      return atomicOp;
   }


   // New Properties

   private appendedProperties: Set<PropertyKey> = new Set()

   isNewProperty(key: PropertyKey) {
      return !(key in this.rawTarget) && !this.appendedProperties.has(key)
   }

   registerNewProperty(key: PropertyKey) {
      this.appendedProperties.add(key)
      // this.markStale()
   }


   // Revert Ops

   reversionOps: Map<string, (mutation: Mutation) => true> = new Map()


   revertOp(mutation: Mutation) {
      const op = mutation.op
      this.reversionOps.get(op)?.(mutation) || (this.reversionOps.set(op, (mutation: Mutation) => {
         const initialized = true;
         const configs = getIonizedMemberDef(this.rawTarget, op);
         if (configs)
            for (const config of configs) { //FIX:
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




// private hasNewAbsorbedIons: boolean = true;
// private markStale() {
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
// $: Record<PropertyKey, Ion | TrackedOps>;