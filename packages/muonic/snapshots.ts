import { AnyObject } from "@rue/types";


type Snapshot = AnyObject;
type IndexedSnapshot = [number, Snapshot]
type SnapshotStack = IndexedSnapshot[];

export class SnapshotManager {
    snapshotMap: WeakMap<AnyObject, SnapshotStack> = new WeakMap();
    takeSnapshot(target: AnyObject, index: number) {
        const snapshotMap = this.snapshotMap;
        const snapshot = new Proxy({ ...target }, {
            get(target, key) {
                const value = target[key];
                if (value instanceof Object) {
                    const snapshots = snapshotMap.get(target[key])
                    if (!snapshots) return value;
                    return findSnapshot(snapshots, index) || value;
                }
                return target[key];
            },
            set() { return false } // immutable
        });

        this.storeSnapshot(snapshot, target, index)
        return snapshot;
    }

    storeSnapshot(snapshot: Snapshot, target: AnyObject, index: number) {
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
    if (closestI === undefined) throw "No snapshot found";
    return snapshots[closestI][1];
}