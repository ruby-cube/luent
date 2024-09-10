import { MetaReactiveModel } from "./ReactiveModel";

export type Collection<K = any, V = any> = Set<K> | Array<K> | Map<K, V>

export class MetaReactiveCollection<T extends Collection = Collection> extends MetaReactiveModel<T> {
    constructor(rawTarget: T, deep: boolean) {
        super(rawTarget, deep)
    }

    observedEntryKeys = new Set()

    addObservedEntryKey(entryKey: any) {
        this.observedEntryKeys.add(entryKey)
    }

    deleteObservedEntryKey(entryKey: any) {
        this.observedEntryKeys.delete(entryKey)
    }
}