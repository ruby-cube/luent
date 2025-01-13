import { AnyObject } from "@rue/types";
import { longestCommonSubstring } from "./lcs";
import { areShallowEqualArrays } from "../../../quarky/src";
import { UniqueItem } from "./For";


// TODO: implementation for sets, objects, and maps
export function diff(newArray: AnyObject[] | UniqueItem[], oldArray: AnyObject[] | UniqueItem[], getUID: ((item: unknown) => unknown) | undefined) {
   const [newArr, oldArr] = makeItemsUnique(newArray, oldArray, getUID);

   if (areShallowEqualArrays(newArr, oldArr)) return { noChange: true };

   const newSet = new Set(newArr);
   const oldSet = new Set(oldArr);
   const newArrCommonItems = [];
   const oldArrCommonItems = [];
   const newItems = new Set();
   const indicesToRemove: number[] = [];
   // const indicesAndRemoveCount: [Index, Count][] = [];

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
      const item = oldArr[j];
      if (newSet.has(item)) oldArrCommonItems.push(item);
      else {
         indicesToRemove.push(j)
      }
      j++;
   }

   // find longest common sequence
   const lcs = longestCommonSubstring(newArrCommonItems, oldArrCommonItems);


   return {
      insertAndMoveKit: {
         isNewItem: (item: any) => newItems.has(item),
         hasMoved: (item: any) => lcs.indexOf(item) === -1,
         isRemoved: (item: any) => !newSet.has(item),
         newUArray: newArr,
         oldUArray: oldArr,
         // getOriginalItem
      },
      indicesToRemove,
   }
}

export type InsertAndMoveKit = {
   isNewItem: (uItem: any) => boolean;
   hasMoved: (uItem: any) => boolean;
   isRemoved: (uItem: any) => boolean;
   newUArray: any[];
   oldUArray: any[];
   //  getOriginalItem: (uniqueItem: any, uniqueArray: any[]) => any
}

function toIdArray(target: AnyObject[], getUID: (item: unknown) => unknown) {
   const idArray = new UniqueArray();
   const itemMap: Map<any, any> = new Map();
   for (const item of target) {
      idArray.push(getUID(item))
      itemMap.set(getUID(item), item)
   }

   idArray.getItem = (id: any) => {
      const item = itemMap.get(id);
      if (!item) throw new Error(`There is no item associated with ${id}`)
      return item;
   }
   return idArray;
}

class UniqueArray extends Array {
   getItem: (uItem: any) => any = (uItem: any) => uItem;
}


function makeItemsUnique(arr1: any[], arr2: any[], getUID: ((item: unknown) => unknown) | undefined): [any[], any[]] {
   if (getUID) return [toIdArray(arr1, getUID), toIdArray(arr2, getUID)]

   const uniqueArr1 = [];
   const uniqueArr2 = [];
   const itemMap: Map<any, any> = new Map();
   const arr1Set = new Set();
   const arr2Set = new Set();
   const uMap: Map<any, AnyObject[]> = new Map();

   for (let i = 0; i < arr1.length; i++) {
      const item = arr1[i];
      if (arr1Set.has(item)) {
         // make item unique
         const uItem = [item]

         // store for arr2 compariston
         let uItems = uMap.get(item)
         if (!uItems) {
            uItems = []
            uMap.set(item, uItems);
         }
         uItems.push(uItem);

         // add to unique array
         uniqueArr1.push(uItem)

         // map for retrieval
         itemMap.set(uItem, item)
      }
      else {
         arr1Set.add(item)
         uniqueArr1.push(item)
      }
   }

   for (let i = 0; i < arr2.length; i++) {
      const item = arr2[i];
      if (uMap.has(item)) {
         const uItems = uMap.get(item);
         if (uItems && uItems.length > 0) {
            const uItem = uItems.pop();
            if (uItems.length === 0) {
               uMap.delete(item);
            }
            uniqueArr2.push(uItem);

            // map for retrieval
            itemMap.set(uItem, item)
         }
         else {
            throw new Error("Something's wrong with the control flow.")
         }
      }
      else if (arr2Set.has(item)) {
         const uItem = [item] // make item unique
         uniqueArr2.push(uItem);
         // map for retrieval
         itemMap.set(uItem, item)
      }
      else {
         arr2Set.add(item)
         uniqueArr2.push(item)
      }
   }
   //  function getOriginalItem(uItem: any) {
   //      return itemMap.get(uItem) || uItem
   //  }

   return [uniqueArr1, uniqueArr2]
}