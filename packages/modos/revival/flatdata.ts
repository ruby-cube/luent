import { watch } from "vue";
import { getKeyPathValue, KeyPath, KeyPathString, setKeyPath, toKeyPath } from "@rue/utils";
import { Cast, MiscObj, Mutable } from "@rue/types";
import { getModel, populateDepot } from "../depot";
import { PEA_MARKER } from "../Model";
import { $PeapodPea, PeapodPea } from "../vine/PeapodPea.role";
import { PodNode, disconnectPeaFromPod, } from "../vine/PodNode.role";
import { UID } from "../types";
import { connectLonePeaAndPod, connectPeasAndPod, updateLonePeaConnections, updatePeapodConnections, } from "../vine/vineOps"
import { enacts } from "../../etre/typecheck";
import { Modo } from "../Modo.role";
import { $LonePea, LonePea } from "../vine/LonePea.role";


export type Flat<T extends MiscObj, K extends (keyof T) | undefined = undefined> = K extends string | number | symbol ? (Omit<T, K> & { [key in K]: T[key] extends any[] ? UID[] : UID }) : T;

// export type PropsToRevive = (KeyPath | KeyPathWithPeaMarker)[];
export type ModelsToRevive = Map<ModelToRevive[], ReviveConfig[]>;


export type ReviveConfig<KPT extends KeyPath = KeyPath> = {
    keyPathString: string,
    keyPath: KPT,
    peaType: 0 | 1 | 2,
    isPeapod: boolean | undefined
}


type ModelToRevive = Modo & { [key: string]: any }

export function _reviveFlatPeasAndProps(modelsToRevive: ModelsToRevive) {
    for (const [models, reviveConfigs] of modelsToRevive) {

        // revive flat peas
        for (const reviveConfig of reviveConfigs) {
            const { keyPath, isPeapod, peaType } = reviveConfig;
            const isVinePea = peaType === PeaType.VINE;
            const isReliant = peaType === PeaType.RELIANT;
            if (isVinePea || isReliant) {
                connectAndReviveFlatPeas(models, keyPath, isPeapod, isVinePea); //main 
            }
            else {
                reviveFlatPeas(models, keyPath, isPeapod);
            }
        }
    }
};




function validateFlatPea(value: any): asserts value is string {
    if (typeof value !== "string") throw new Error("[@Rue/Modos] A flat pea must be of type string. Did you mean to register a flat peapod? If the flat value is nested in an object, register flat pea with a key path in `defineModel`")
}

function validateFlatPeapod(value: any): asserts value is string {
    if (!(value instanceof Array)) throw new Error("[@Rue/Modos] A flat peapod must be of type string. Did you mean to register a flat pea? If the flat value is nested in an object, register flat peapod with a key path in `defineModel`")
}



function connectAndReviveFlatPeas(models: Mutable<PodNode>[], keyPath: KeyPath, isPeapod: boolean | undefined, isVinePea: boolean | undefined) {
    for (const model of models) {
        const value = getKeyPathValue(model, keyPath);
        if (isPeapod) {
            if (__DEV__) validateFlatPeapod(value);
            const peapod = revivePeapod(value); //also 
            if (peapod.length > 0 && !enacts($PeapodPea, peapod[0])) throw new Error("[@Rue/Modos] first pea is not a PeapodPea") //NOTE: this is not a failsafe guard; it doesn't check every pea
            setKeyPath(model, keyPath, peapod); //also 
            connectPeasAndPod(model, <PeapodPea[]><Cast>peapod, isVinePea); //main 
            watch(() => getKeyPathValue(model, keyPath), (peapod, prevPeapod) => {
                updatePeapodConnections(model, peapod, prevPeapod, isVinePea); //m 
            }) //main 
        }
        else {
            if (__DEV__) validateFlatPea(value);
            const pea = getRevivedModel(value);
            if (!enacts($LonePea, pea)) throw new Error("[@Rue/Modos] `pea` is not a LonePea")
            setKeyPath(model, keyPath, pea); //also 
            connectLonePeaAndPod(model, <LonePea><Cast>pea, isVinePea); //main 
            watch(() => getKeyPathValue(model, keyPath), (pea, prevPea) => {
                updateLonePeaConnections(model, pea, prevPea, isVinePea); //m 
            }) //main 
        }
    }
}




function reviveFlatPeas(models: Modo[], keyPath: KeyPath, isPeapod: boolean | undefined) {
    for (const model of models) {
        const value = getKeyPathValue(model, keyPath);
        if (isPeapod) {
            if (__DEV__) validateFlatPeapod(value);
            setKeyPath(model, keyPath, revivePeapod(value)); //main 
        }
        else {
            if (__DEV__) validateFlatPea(value);
            setKeyPath(model, keyPath, getRevivedModel(value)); //main 
        }
    }
}



type RevivedArray = Modo[];

function revivePeapod(array: UID[]) {
    const revivedArray: RevivedArray = [];
    const limit = array.length;
    for (let i = 0; i < limit; i++) {
        const id = array[i];
        revivedArray.push(getRevivedModel(id)!); //main 
    }
    return revivedArray;
}




function getRevivedModel(id: UID): Modo | undefined {
    try {
        return getModel(id);
    }
    catch (err) {
        if (__DEV__) throw new Error(`[@Rue/Modos] Cannot find model corresponding to ${id}. Make sure dataset used to populate depot contains all necessary data for revival`)
    }
}



export type PeaRoleDef = {
    __typeDef__: {
        readonly id: string;
        readonly pod: {
            readonly id: string;
        } | null;
    };
}
type RoleDef = {
    __typeDef__: Modo;
}
type PeaMarker = typeof PEA_MARKER;
// export type KeyPathWithPeaMarker = [...KeyPath, PeaMarker]

export const PeaType = {
    UNRELIANT: 0,
    RELIANT: 1,
    VINE: 2,
} as const

type Unreliant = typeof PeaType.UNRELIANT;
type Reliant = typeof PeaType.RELIANT;
type Vine = typeof PeaType.VINE;

export let isLiablePod = false;
export function resetIsLiablePod() {
    isLiablePod = false;
}

export function flatPeapod<KPS extends `${string}`>(keyPathString: KPS, modelDefs: PeaRoleDef[], peaType: Unreliant | Reliant | Vine): ReviveConfig<_KeyPath<KPS>> {
    return flatPea(keyPathString, modelDefs, peaType, true)
}

export function flatPea<KPS extends `${string}`>(keyPathString: KPS, modelDefs: PeaRoleDef[], peaType: Unreliant | Reliant | Vine, isPeapod?: boolean): ReviveConfig<_KeyPath<KPS>> {
    const keyPath = toKeyPath(keyPathString);
    if (__DEV__ && keyPath.length > 3) throw new Error("[flatdata]: flatPea cannot be nested more than three levels deep");
    if (peaType === PeaType.VINE || peaType === PeaType.RELIANT) isLiablePod = true;
    return {
        keyPathString,
        keyPath: keyPath as _KeyPath<KPS>,
        peaType,
        isPeapod
    };
}

// export function flatProp<KPS extends `${string}`>(keyPathString: KPS, modelDefs: RoleDef[]): _KeyPath<KPS> {
//     const keyPath = toKeyPath(keyPathString);
//     if (__DEV__ && keyPath.length > 3) throw new Error("[flatdata]: flatPea cannot be nested more than three levels deep");
//     return keyPath as _KeyPath<KPS>
// }


type _KeyPath<K extends string> = K extends `${infer K1}.${infer K2}.${infer K3}` ? [K1, K2, K3] : K extends `${infer K1}.${infer K2}` ? [K1, K2] : [K];

