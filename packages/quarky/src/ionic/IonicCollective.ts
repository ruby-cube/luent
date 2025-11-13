import type { AnyObject } from "@rue/types"
import { __DEV__getTrace } from "../../../flask/debug"
import { IonicProxy } from "./Ionic"
import { Atom, TrackedAtom } from "../reactivity/Atom"
import { Traceable } from "../debug/Traceable"
import { TrackedOpQuark, TrackedOps } from "./TrackableOp"
import { debug } from "@rue/utils"
import { CollectiveState } from "../reactivity/State"

// NOTE: The only difference between ionic collective and ionic model
// -- ionic collective, we clone on every update
// -- ionic model, we clone only for internal tracked ops like [[in]] and apply mutation to target

const IONIC_COLLECTIVE = 'ionic collective' as const

export class CollectiveQuark implements Atom {
   __DEV__asTraceable: Traceable = new Traceable()
   quarkType = IONIC_COLLECTIVE
   proxy!: IonicProxy

   constructor(
      public target: AnyObject, //initialData
      public state: CollectiveState,
   ) { }

   asTrackedAtom: TrackedAtom | undefined

   trackedOps: Record<PropertyKey, TrackedOps> = {}

   registerOp(key: PropertyKey, entryKey: any, trackedOp: TrackedOpQuark) {
      const ops = this.trackedOps[key] ?? new Map();
      if (!(ops instanceof Map)) {
         debug.error(`${String(key)} is not an op`)
         return trackedOp;
      }
      this.trackedOps[key] = ops;
      ops.set(entryKey, trackedOp)
      return trackedOp;
   }
}


function createIonicCollective(
   target: AnyObject,
   config: AnyObject // TODO:
) {
   const collectiveQuark = new CollectiveQuark(target, new CollectiveState(target, /* FIX: standin */(target: any) => [...target]))

   const proxy = new Proxy(collectiveQuark, {
      get() {

      },
      set() {

      }
   }) as any as IonicProxy
   collectiveQuark.proxy = proxy

   // TODO: how do we get the ionic proxy from the target? do we need an ID? Do we apply all mutations to the original target?

   return proxy
}



