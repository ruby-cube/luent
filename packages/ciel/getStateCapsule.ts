import { $type } from "@rue/utils"
import { getContext } from "../x_old/provides"
import { AnyObject, RequiredKeys } from "@rue/types"

export const ciel = {

    get<T extends AnyObject>(keys: RequiredKeys<T>[]): T {
        return {} as T;
    }
}


ciel.provide({ selection: new Selection() }) // in main no arguments needed

ciel.provide([new Selection(x, y)]) // in app or a component

ciel.get<ListItem.needs>()


const needs = getNeeds([
    Bullet
])

interface ISelection {
    current: number
}


// const X_POSITION = Symbol()// as InjectionKey<number>
// const SELECTION = Symbol()// as InjectionKey<number>

// const K = {
//     X_POSITION: Symbol() as unique symbol,
//     SELECTION: Symbol() as unique symbol
// }




export function ListItem(context: { position: number } = getContext(['position'])) {


    return {
        render: () => {

        }
    }
}

function contextKeys<T extends { [key: string]: symbol }>(component: any, keys: T): { [readonly K in keyof T]: {

    return keys;
}







interface InjectionKey<T> extends Symbol {
}