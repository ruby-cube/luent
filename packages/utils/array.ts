

export function copyAllButFirstN(count: number, array: any[]) {
    const copy = [];
    const limit = array.length;
    if (count > limit) throw "Remove count cannot be greater than array length"
    for (let i = count; i < limit; i++) {
        copy.push(array[i]);
    }
    return copy;
}

export function copyAllButLastN(count: number, array: any[]) {
    const copy = [];
    const limit = array.length - count;
    if (count > limit) throw "Remove count cannot be greater than array length"
    for (let i = 0; i < limit; i++) {
        copy.push(array[i]);
    }
    return copy;
}

export function copyAllButSlice(startIndex: number, endIndex: number, array: any[]) {
    const copy = [];
    const count = endIndex - startIndex;
    let limit = startIndex;
    if (count < 0) throw "startIndex cannot be greater than endIndex";
    if (count > limit) throw "Remove count cannot be greater than array length";
    for (let i = 0; i < limit; i++) {
        copy.push(array[i]);
    }
    limit = array.length;
    for (let i = endIndex; i < limit; i++) {
        copy.push(array[i]);
    }
    return copy;
}

export function copyAllBut(index: number, array: any[],) {
    const copy = [];
    let limit = index;
    for (let i = 0; i < limit; i++) {
        copy.push(array[i]);
    }
    limit = array.length;
    for (let i = index + 1; i < limit; i++) {
        copy.push(array[i]);
    }
    return copy;
}

export function copySlice(array: any[], startIndex: number, endIndex: number) {
    return array.slice(startIndex, endIndex);
}

export function copyIndices(array: any[], indices: number[] | Set<number>) {
    throw "function not yet implemented";
}

export function copyAllButIndices(array: any[], indices: number[] | Set<number>) {
    throw "function not yet implemented";
}

export const isArray = Array.isArray;

export function isIterable(obj: any) {
    if (obj == null) {
        return false;
    }
    return typeof obj[Symbol.iterator] === 'function';
}

export function removeItem(item: any, arr: any[]) {
    arr.splice(arr.indexOf(item), 1)
}

export function appendItems(arr: any[], items: any[]){
    arr.splice(arr.length, 0, ...items)
}