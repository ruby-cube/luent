import { AnyObject } from "@rue/types";
import { DerivedIon } from "../derivations/DerivedIon";
import { IonicModel } from "./IonicModel";

export function $Props<T extends AnyObject, K extends keyof T>(reactive: IonicModel<T>, keys: K[]) {
    const multiPropIon = DerivedIon(() => {
        const values = []
        for (const key of keys) {
            values.push(reactive[key])
        }
        return values;
    })
    // getMetaReactive(reactive).registerMultiPropIon(keys.toString(), propsSignal)
    return multiPropIon
}