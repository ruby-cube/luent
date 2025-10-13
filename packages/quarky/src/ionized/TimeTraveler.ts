import { AnyObject } from "@rue/types";
import { isFunction } from "@rue/utils";
import { isIon } from "../ion/Ion";
import { ionize, isIonKey, toRaw } from "./ionize";
import { getIonizedModel } from "./IonizedModel";

//NOTE: Temporarily pause development of this until usefulness is confirmed
// Currently, for snapshots to work, we need to take a snapshot of every piece of state created upon initialization with $ or ionize
// this seems expensive ... even if it's incorporated into the reactive proxy and signal function, not sure if it's worth it
// This is meant as a way to have snapshots the way immutable practices do, without all the copying of objects


// type Snapshot = AnyObject;
// type IndexedSnapshot = [number, Snapshot]
// type SnapshotStack = IndexedSnapshot[];

// class TimeTraveler {
//    private snapshotMap: WeakMap<AnyObject, SnapshotStack> = new WeakMap();
//    takeSnapshot(original: AnyObject, index: number, clone: undefined | AnyObject) {
//       return; // TODO: temporarily disable
//       const snapshotMap = this.snapshotMap;
//       const snapshot = new Proxy(clone ? clone : shallowClone(original), {
//          get(target, key, receiver) {
//             const value = Reflect.get(target, key, receiver);
//             if (value instanceof Object) { // TODO: make sure functions are handled appropriately
//                const snapshots = snapshotMap.get(value)
//                if (!snapshots) return value;
//                return findSnapshot(snapshots, index) || value;
//             }
//             return value;
//          },
//          set() { return false } // immutable
//       });

//       this.storeSnapshot(snapshot, original, index)
//       return snapshot;
//    }

//    private storeSnapshot(snapshot: Snapshot, target: AnyObject, index: number) {
//       let snapshots = this.snapshotMap.get(target);
//       if (!snapshots) {
//          snapshots = []
//          this.snapshotMap.set(target, snapshots);
//       }
//       snapshots.push([index, snapshot])
//    }
// }

// function findSnapshot(snapshots: SnapshotStack, index: number) {
//    let closestI;
//    let closestIndex = 0;
//    let i = 0;
//    while (i--) {
//       const indexedSnapshot = snapshots[i];
//       const _index = indexedSnapshot[0];
//       if (_index === index) return indexedSnapshot[1];
//       if (_index < index && _index > closestIndex) { // find the most recent snapshot
//          closestI = i;
//          closestIndex = _index;
//       }
//    }
//    if (closestI === undefined) return;
//    // if (closestI === undefined) throw "No snapshot found";
//    return snapshots[closestI][1];
// }

export function shallowClone<T extends object>(data: T): T {
   if (data instanceof Array) return [...data] as T;
   if (data instanceof Set) return new Set(data) as T;
   if (data instanceof Map) return new Map(data) as T;
   return { ...data }
}

// export const timeTraveler = new TimeTraveler()


type SnapshotsInfo = {
   snapshots: Snapshots;
   latestIndex: number;
   indices: number[];
}

const snapshotMap: Map<object, SnapshotsInfo> = new Map()

function getCurrentSnapshot(target: object) {
   // TODO: need to coordinate with update cycle...
   const { snapshots, latestIndex } = getSnapshotsInfo(target)
   return snapshots[latestIndex]
}

function getSnapshotsInfo(target: object) {
   const snapshotInfo = snapshotMap.get(target);
   if (!snapshotInfo) throw new Error('no snapshotInfo found!')
   return snapshotInfo;
}

export function findSnapshot(target: object, index: number) {
   const { snapshots, indices } = getSnapshotsInfo(target)
   if (index in snapshots) return snapshots[index]
   let i = indices.length;
   while (i--) {
      if (indices[i] in snapshots) return snapshots[indices[i]]
   }
   throw new Error('no snapshot found :(')
}

type Snapshots = { [key: number]: object }

export function initializeSnapshots(target: object) {
   // snapshotMap.set(target, createSnapshotInfo(target))
   return target;
}

// function createSnapshotInfo(target: object) {
//    const index = getUpdateCycleCount() // TODO: make sure we are calling this at the appropriate time for an accurate count
//    const snapshots: Snapshots = {}
//    snapshots[index] = takeSnapshot(target)
//    return {
//       snapshots,
//       latestIndex: index,
//       indices: [index]
//    }
// }


function isIterable(obj: AnyObject): obj is { [Symbol.iterator]: () => Iterator<unknown> } {
   return obj != null && typeof obj[Symbol.iterator] === 'function';
}

const CURRENT_STATE = Symbol('current state')

function takeSnapshot(target: AnyObject) {
   if (isIon(target)) {
      const state = target();
      const snapshot = function $snapshot() {
         return state;
      }
      snapshot.state = state
      snapshot[CURRENT_STATE] = target
      return snapshot;
   }

   //FIX: The problem with this implementation is that it undoes all the performance gains from lazy access... 
   // Can we make snapshots lazy by bringing them to the level of pions? 
   // snapshots would have to be proxies then..

   const collectionSnapshot: undefined | any[] = isIterable(target) ? [] : undefined // TODO: need to getCurrentSnapshot

   if (isIterable(target)) {
      for (const item of target) {
         // TODO: differentiate between values and entries
         if (item instanceof Object){
            collectionSnapshot?.push(getCurrentSnapshot(toRaw(ionize(item))))
         }
         else {
            collectionSnapshot?.push(item)
         }
      }
   }

   const snapshot: AnyObject = collectionSnapshot || Object.create(target)
   for (const key in target) {
      const value = target[key]
      if (isIon(value)) {
         snapshot[key] = value()
      }
      else if (value instanceof Function) {
         snapshot[key] = value;
      }
      else if (value instanceof Object) {
         ionize(value)
         snapshot[key] = getCurrentSnapshot(value) // need to get this lazily
      }
      else {
         snapshot[key] = value;
      }
   }
   snapshot[CURRENT_STATE] = target
   return snapshot;
}


// a wrapper to make snapshots interfacable with jsx templates, with trackable ops and ion access 

export function reviveSnapshot(snapshot: AnyObject, current: AnyObject) {
   if (current instanceof Array) { // TODO: but what about extensions of arrays?
      return current;
   }
   if (isIterable(current)) {
      return current.constructor(current[Symbol.iterator]())
   }
   const revived = new Proxy({ snapshot, current }, {
      get(target, key) {
         const { snapshot, current } = target;
         if (!snapshot || !current) throw new Error('no snapshot to view')

         if (key in snapshot) {
            const value = snapshot[key]
            if (isFunction(value)) {
               return value.bind(revived)
            }
            else if (value instanceof Object) {
               return reviveSnapshot(value, value[CURRENT_STATE]);
            }
            else { return value; }
         }
         if (isIonKey(key)) {
            return snapshot[key.slice(1)]
         }
         if (key in current) {
            return current[key].bind(revived)
         }
         return undefined
      },
      set() { return false }, // immutable
      has({ current, snapshot }, key) {
         return key in snapshot || key in current;
      }
   })
}