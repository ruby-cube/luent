import { AnyObject } from "@rue/types";
import { longestCommonSubsequence } from "./lcs";



export function diff(newArr: AnyObject[], oldArr: AnyObject[]) {
    const newSet = new Set(newArr);
    const oldSet = new Set(oldArr);
    const newArrCommonItems = [];
    const oldArrCommonItems = [];
    const newItems = new Set();
    const indicesToRemove = [];

    // find items to insert
    let i = 0;
    while (i < newArr.length) {
        const item = newArr[i];
        if (oldSet.has(item)) newArrCommonItems.push(item);
        else newItems.add(item)

        i++;
    }

    // find items to remove
    let j = 0;
    while (j < oldArr.length) {
        const item = newArr[j];
        if (newSet.has(item)) oldArrCommonItems.push(item);
        else indicesToRemove.push(i)
        j++;
    }

    // find longest common sequence
    const { seq: lcs } = longestCommonSubsequence(newArrCommonItems, oldArrCommonItems);

    return {
        newItems,
        indicesToRemove,
        lcs
    }
}



