import { AnyObject } from "@rue/types";
import { toRaw } from "../ionize/ionize";
import { AnyIon, isAnyIon, ref } from "./AnyIon";

type MaybeIon<T> = ReadonlyIon<T> | T

type NormalizeAllKeysToIons<T extends AnyObject> = {
    [K in keyof T]: T[K] extends AnyIon ? T[K] : () => T[K]
}

type NormalizeKeysToIons<T extends AnyObject, K extends keyof T> = {
    [S in K]: T[S] extends AnyIon ? T[S] : () => T[K]
} & Omit<T, K>

//TODO: Types: if keys are provided, return NormalizeKeysToIons. if no keys, NormalizeAllKeysToIons

/**
 * Normalizes properties of an object into inert ions (getters)
*/
//TODO: validation and 
export function validate<T extends AnyObject, K extends keyof T, O>(
    obj: T,
    normalizers?: { [key: keyof T]: ((value: any) => any) | ((value: any) => any)[] }
) {
    const output = {} as AnyObject
    const rawObj = toRaw(obj);
    for (const key in rawObj) {
        const normalize = normalizers[key]
        if (normalize) {
            output[key] = normalize(rawObj[key]);
        }
        else {
            output[key] = rawObj[key]
        }
    }
    return output;
}

export function toIon(value: any) {
    return isAnyIon(value) ? value : ref(value)
}

function MovableBox(setup: {
    initialPosition: {
        x: number,
        y: number
    },
    $xShift: number,
    $yShift: number,
}) {

    // destructure setup props
    const {
        initialPosition,  // type: number
        $xShift,  // type: AnyIon<number>
        $yShift   // type: AnyIon<number>
    } = normalize(setup, {
        initialPosition: assertNumber,
        $xShift: toIon,
        $yShift: toIon
    });

    return Component(
        <div style={/* dynamic styles */ } > </div>

    )
}

