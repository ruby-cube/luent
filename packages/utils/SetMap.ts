

export class SetMap<K, V> extends Map<K, Set<V>> {
    constructor() {
        super();
    }

    initializeSet(key: K) {
        const set: Set<V> = new Set()
        this.set(key, set);
        return set
    }

    addToSet(value: V, key: K) {
        let set = this.get(key)
        if (!set) set = this.initializeSet(key);
        set.add(value);
    }

    deleteFromSet(value: V, key: K) {
        let set = this.get(key)
        set?.delete(value);
    }
}