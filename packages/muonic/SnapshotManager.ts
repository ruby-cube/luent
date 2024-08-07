import { AnyObject } from "@rue/types";

//NOTE: Temporarily pause development of this until usefulness is confirmed
// Currently, for snapshots to work, we need to take a snapshot of every piece of state created upon initialization with $ or o$
// this seems expensive ... even if it's incorporated into the reactive proxy and signal function, not sure if it's worth it
// This is meant as a way to have snapshots the way immutable practices do, without all the copying of objects


type Snapshot = AnyObject;
type IndexedSnapshot = [number, Snapshot]
type SnapshotStack = IndexedSnapshot[];

export class SnapshotManager {
    private snapshotMap: WeakMap<AnyObject, SnapshotStack> = new WeakMap();
    takeSnapshot(original: AnyObject, index: number, clone: undefined | AnyObject) {
        const snapshotMap = this.snapshotMap;
        const snapshot = new Proxy(clone ? clone : shallowClone(original), {
            get(target, key, receiver) {
                const value = Reflect.get(target, key, receiver);
                if (value instanceof Object) { //TODO: make sure functions are handled appropriately
                    const snapshots = snapshotMap.get(value)
                    if (!snapshots) return value;
                    return findSnapshot(snapshots, index) || value;
                }
                return value;
            },
            set() { return false } // immutable
        });

        this.storeSnapshot(snapshot, original, index)
        return snapshot;
    }

    private storeSnapshot(snapshot: Snapshot, target: AnyObject, index: number) {
        let snapshots = this.snapshotMap.get(target);
        if (!snapshots) {
            snapshots = []
            this.snapshotMap.set(target, snapshots);
        }
        snapshots.push([index, snapshot])
    }
}

function findSnapshot(snapshots: SnapshotStack, index: number) {
    let closestI;
    let closestIndex = 0;
    let i = 0;
    while (i--) {
        const indexedSnapshot = snapshots[i];
        const _index = indexedSnapshot[0];
        if (_index === index) return indexedSnapshot[1];
        if (_index < index && _index > closestIndex) { // find the most recent snapshot
            closestI = i;
            closestIndex = _index;
        }
    }
    if (closestI === undefined) return;
    // if (closestI === undefined) throw "No snapshot found";
    return snapshots[closestI][1];
}

export function shallowClone(data: AnyObject) {
    if (data instanceof Array) return [...data];
    if (data instanceof Set) return new Set(data);
    if (data instanceof Map) return new Map(data);
    return { ...data }
}