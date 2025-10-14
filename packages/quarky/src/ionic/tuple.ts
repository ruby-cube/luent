
const allTuples: WeakSet<any[]> = new WeakSet()

export function tuple<T extends [any] | any[]>(value: T): T {
    if (!(value instanceof Array)) {
        return value;
    }
    allTuples.add(value)
    return value;
}

export function isTuple(value: any): value is any[] {
    return allTuples.has(value);
}