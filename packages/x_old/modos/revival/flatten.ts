import { KeyPath, KeyPathString } from "@rue/utils";
import { Modo } from "../Modo.role";
import { ReviveConfig } from "./flatdata";

export function flatten(model: object | undefined) {
    if (model == null) return model;
    if (__DEV__ && !("id" in model)) throw new Error("Cannot flatten model. No id")
    return (<Modo>model).id;
}

export type Revived = Set<string>;

export function toRevived(reviveConfigs: ReviveConfig[] | undefined){
    if (reviveConfigs == null) return reviveConfigs;
    const revived: Revived = new Set();
    for (const reviveConfig of reviveConfigs){
        revived.add(reviveConfig.keyPathString)
    }
    return revived;
}

export function wasRevived(keyPath: KeyPathString, revived: Revived | undefined){
    if (revived == null) return false;
    return revived.has(keyPath);
}