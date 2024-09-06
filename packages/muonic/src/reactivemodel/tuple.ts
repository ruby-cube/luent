
const allTuples = new WeakSet()

export function tuple<T extends [any] | any[]>(value: T): T {
    if (!(value instanceof Array)) {
        return value;
    }
    allTuples.add(value)
    return value;
}

export function isTuple<T extends object>(value: T): value is T {
    return allTuples.has(value);
}