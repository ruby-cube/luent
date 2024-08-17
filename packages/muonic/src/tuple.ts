
// const position$ = o$(tuple([0, 3]))

const allTuples: WeakSet<any[]> = new WeakSet();

export function tuple(value: any[]) {
    if (!(value instanceof Array)) {
        return value;
    }
    allTuples.add(value);
    return value;
}

export function isTuple(value: any): value is any[] {
    return allTuples.has(value);
}
