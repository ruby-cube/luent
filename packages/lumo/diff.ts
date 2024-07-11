import { AnyObject } from "@rue/types";
import { longestCommonSubsequence } from "./lcs";
import { UniqueItem } from "./mxsFor";
import { isEqual } from "@rue/utils";

type Index = number
type Count = number

export function diff(newArr: AnyObject[] | UniqueItem[], oldArr: AnyObject[] | UniqueItem[], idKey?: string | symbol) { //TODO: Originally wrote this diffing arrays of objects and unique ids, but I need it to work for any[]s, wrap repeat values in an object or function and put in stand-in arrays
    const _newArr = idKey ? toIdArray(newArr, idKey) : newArr;
    const _oldArr = idKey ? toIdArray(oldArr, idKey) : oldArr;

    const newSet = new Set(_newArr);
    const oldSet = new Set(_oldArr);
    const newArrCommonItems = [];
    const oldArrCommonItems = [];
    const newItems = new Set();
    const indicesToRemove: number[] = [];
    const indicesAndRemoveCount: [Index, Count][] = [];


    // find items to insert
    let i = 0;
    while (i < _newArr.length) {
        const item = _newArr[i];
        if (oldSet.has(item)) newArrCommonItems.push(item);
        else newItems.add(item)

        i++;
    }

    // find items to remove
    let j = 0;
    while (j < _oldArr.length) {
        const item = _newArr[j];
        if (newSet.has(item)) oldArrCommonItems.push(item);
        else {
            const prevEntry = indicesAndRemoveCount.at(-1);
            if (prevEntry && prevEntry[0] + 1 === j) {
                prevEntry[1]++; // increment count
            }
            else {
                indicesAndRemoveCount.push([j, 1])
            }
            indicesToRemove.push(j)
        }
        j++;
    }

    if (isEqual(newArrCommonItems, oldArrCommonItems)) return { noChange: true };

    // find longest common sequence
    const { seq: lcs } = longestCommonSubsequence(newArrCommonItems, oldArrCommonItems);

    return {
        insertAndMoveKit: {
            isNewItem: (item: any) => newItems.has(item),
            itemHasMoved: (item: any) => lcs.indexOf(item) === -1,
            newArrayAsIDs: _newArr,
            getItem: (_newArr instanceof IDArray) ? _newArr.getItem : ((id: any) => id),
        },
        removeKit: {
            indicesToRemove,
            indicesAndRemoveCount,
        }
    }
}

export type InsertAndMoveKit = {
    isNewItem: (item: any) => boolean;
    itemHasMoved: (item: any) => boolean;
    newArrayAsIDs: any[];
    getItem: (id: any) => any;
}

function toIdArray(target: AnyObject[], idKey: string | symbol) {
    const idArray = new IDArray();
    for (const item of target) {
        idArray.push(item[idKey])
    }
    const itemMap: Map<any, any> = new Map();
    idArray.getItem = (id: any) => {
        const item = itemMap.get(id);
        if (!item) throw new Error(`There is no item associated with ${id}`)
        return item;
    }
    return idArray;
}

class IDArray extends Array {
    getItem: (id: any) => any = (id: any) => id
}


