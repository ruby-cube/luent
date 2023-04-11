import { getKeyPathValue, KeyPath, setKeyPath, toKeyPath, clone } from "@rue/utils";
import { Cast, Class, MiscObj } from "@rue/types";
import { DataEntry, DatasetName, toDatasetName } from "./datasets";
import { $Role, _DATA_MARKER_, _ID_, _INTERFACE_, _MARKER_, _PREREQS_, _Role } from "@rue/etre";
import { Modo } from './Modo.role';
import { UID } from './types';
import { createModel } from './depot';
import { isLiablePod, resetIsLiablePod, ReviveConfig } from "./revival/flatdata";


export const _REVIVE_ = Symbol("revive");
export const _IS_LIABLE_POD_ = Symbol("isLiable");
export const PEA_MARKER = Symbol("modos-PEA_MARKER");
export const $id = "";
export const $clone = () => { };

export type ModelData<F extends ((data: any) => MiscObj) | Class | { (data: any): MiscObj }> = F extends Class ? Omit<ConstructorParameters<F>[0], typeof _DATA_MARKER_> : F extends (...args: any[]) => any ? F extends { [_REVIVE_]: infer R } ? R extends ReviveConfig[] ? _FlatData<Omit<Parameters<F>[0], typeof _DATA_MARKER_>, R> : Omit<Parameters<F>[0], typeof _DATA_MARKER_> : Omit<Parameters<F>[0], typeof _DATA_MARKER_> : never;

// export type ModelData<T extends _ModelDef> = { id?: string } & (T extends { [_REVIVE_]: infer R } ? R extends ReviveConfig[] ? _FlatData<T, R> : _ModelData<T> : _ModelData<T>);
// export type _ModelData<T extends _ModelDef> = (T extends { [_CORE_]: Class } ? { [Key in keyof CoreData<T>]: CoreData<T>[Key] } : {}) & (T extends { [_PREREQS_]: { [key: string]: $Role } } ? _DataFromRoles<T> : {});


// export type ReviveConfig[] = (KeyPathWithPeaMarker | KeyPath)[];


type _FlatData<T extends MiscObj, R extends ReviveConfig[]> =
    Omit<T, FirstLevelKeys<R>> & { [Key in OneLevelNestedKeys<R>]: FlatValue<T[Key]> }
    & { [Key in TwoLevelNestedKeys<R>]: Omit<T[Key], SecondLevelKey<R, Key>> & { [Key2 in SecondLevelKey<R, Key>]: FlatValue<T[Key][Key2]> } }
    & { [Key in ThreeLevelNestedKeys<R>]: Omit<T[Key], SecondLevelKey<R, Key>> & { [Key2 in SecondLevelKey<R, Key>]: Omit<T[Key][Key2], ThirdLevelKey<R, Key, Key2>> & { [Key3 in ThirdLevelKey<R, Key, Key2>]: FlatValue<T[Key][Key2][Key3]> } } }
// type _FlatData<T extends _ModelDef, R extends ReviveConfig[]> =
//     Omit<_ModelData<T>, FirstLevelKeys<R>> & { [Key in OneLevelNestedKeys<R>]: FlatValue<_ModelData<T>[Key]> }
//     & { [Key in TwoLevelNestedKeys<R>]: {[CleanKey in keyof Omit<_ModelData<T>[Key], SecondLevelKey<R, Key>>]: Omit<_ModelData<T>[Key], SecondLevelKey<R, Key>>[CleanKey]} & { [Key2 in SecondLevelKey<R, Key>]: FlatValue<_ModelData<T>[Key][Key2]> } }
//     & { [Key in ThreeLevelNestedKeys<R>]: {[CleanKey in keyof Omit<_ModelData<T>[Key], SecondLevelKey<R, Key>>]: Omit<_ModelData<T>[Key], SecondLevelKey<R, Key>>[CleanKey]} & { [Key2 in SecondLevelKey<R, Key>]: {[CleanKey in keyof Omit<_ModelData<T>[Key][Key2], ThirdLevelKey<R, Key, Key2>>]: Omit<_ModelData<T>[Key][Key2], ThirdLevelKey<R, Key, Key2>>[CleanKey]} & { [Key3 in ThirdLevelKey<R, Key, Key2>]: FlatValue<_ModelData<T>[Key][Key2][Key3]> } } }

type FirstLevelKeys<R extends ReviveConfig[]> = R extends (infer KP)[] ? KP extends [infer K, ...any[]] ? K : never : never;
type OneLevelNestedKeys<R extends ReviveConfig[]> = R extends (infer KP)[] ? KP extends [infer K, typeof PEA_MARKER?] ? K : never : never;
type TwoLevelNestedKeys<R extends ReviveConfig[]> = R extends (infer KP)[] ? KP extends [infer K1, string, typeof PEA_MARKER?] ? K1 : never : never;
type SecondLevelKey<R extends ReviveConfig[], K extends string> = R extends (infer KP)[] ? KP extends [infer K1, infer K2, ...any[]] ? K1 extends K ? K2 : never : never : never;
type ThreeLevelNestedKeys<R extends ReviveConfig[]> = R extends (infer KP)[] ? KP extends [infer K1, string, string, typeof PEA_MARKER?] ? K1 : never : never;
type ThirdLevelKey<R extends ReviveConfig[], KY1 extends string, KY2 extends string> = R extends (infer KP)[] ? KP extends [infer K1, infer K2, infer K3, typeof PEA_MARKER?] ? K1 extends KY1 ? K2 extends KY2 ? K3 : never : never : never : never;
type FlatValue<T> = T extends Object[] ? UID[] : UID;



// type _ModelDef = { //NOTE: Need to use this in generic type defs because ModoDef causes excessively deep error 
//     [_CORE_]: Class | undefined;
//     [_PREREQS_]: { [key: string]: $Role; } | undefined;
//     [_REVIVE_]: ReviveConfig[] | undefined;
// }

export type ModoDef = {
    name: string;
    make: (data: DataEntry) => Modo;
    [_REVIVE_]: ReviveConfig[] | undefined;
    [_IS_LIABLE_POD_]: boolean;
    clone: (data: MiscObj) => Modo;
}


///





///

export type ModoSymbol<T> = Symbol & { __typeDef__: T, description: string };


export function enrollModelMaker<
    NME extends string,
    MKE extends (data: any) => any,
    KY1 extends `${string}`,
    KY2 extends `${string}`,
    KY3 extends `${string}`,
    KPT extends [KY1, KY2, KY3] | [KY1, KY2] | [KY1],
    RVE extends ReviveConfig<KPT>[] | undefined = undefined,
// RVE extends KPT[] | undefined = undefined,
>(config: { name: NME, make: MKE, revive?: RVE }): [typeof create, ModoSymbol<{ [Key in keyof (ReturnType<MKE> & Modo)]: (ReturnType<MKE> & Modo)[Key] }>] {
    const { name, revive, make } = config;

    function create(data: Parameters<MKE>[0]): ReturnType<MKE> & Modo {
        return createModel<MKE>(data, modoDef);
    }

    function cloneModel(data: Parameters<MKE>[0]) {
        const model = create(JSON.parse(JSON.stringify(data)));
        if (revive) {
            for (const keyPathString of revive) {
                if (typeof keyPathString !== "string") continue;
                const keyPath = toKeyPath(keyPathString);
                const value = getKeyPathValue(model, keyPath);
                if (value instanceof Array) {
                    const arrayClone = [];
                    for (const item of value) {
                        arrayClone.push(("clone" in item) ? item.clone() : item);
                    }
                    setKeyPath(model, keyPath, arrayClone);
                }
                else {
                    setKeyPath(model, keyPath, ("clone" in value) ? value.clone() : value);
                }
            }
        }
        return model;
    }

    const modoDef = {
        name,
        [_REVIVE_]: revive && clone(revive, 2) as ReviveConfig[],
        [_IS_LIABLE_POD_]: isLiablePod,
        make,
        clone: cloneModel
    }

    resetIsLiablePod();

    registerModelDef(modoDef); //main 

    return [create, <Cast>Symbol(name) as ModoSymbol<ReturnType<MKE> & Modo>];
    // RVE extends KPT[] ? { (data: Parameters<MKE>[0]): ReturnType<MKE>, [_REVIVE_]: RVE } : ModelCreator<MKE>;
}








// export function defineModel<
//     NME extends string,
//     CFG extends { [_CORE_]: COR, [_PREREQS_]: ROL, [_INTERFACE_]: IFC, [_MARKER_]: MRK },
//     MDF extends {
//         name: NME;
//         __typeDef__: _Role<CFG>;
//         // __typeDef__: { [Key in keyof _Role<CFG>]: _Role<CFG>[Key] }; //NOTE: This causes excessively deep errors. Do not use.
//         [_REVIVE_]: RVE;
//         // [_MAKE_]: (data: DataFromRoles<ROL> & CoreData<{ [_CORE_]: COR }>) => _Role<CFG>;
//         [_MAKE_]: (data: DataFromRoles<ROL> & CoreData<{ [_CORE_]: COR }>) => Modo & _Role<CFG, OMIT_ROLE_MARKERS>;
//         reify: COR extends Class ? (...args: ConstructorParameters<COR>) => COR["prototype"] : null;
//         create: (data: DataFromRoles<ROL> & CoreData<{ [_CORE_]: COR }>) => _Role<CFG>;
//         [_PREREQS_]: ROL;
//         [_INTERFACE_]: IFC;
//         [_CORE_]: COR;
//         [_MARKER_]: MRK;
//         ops__: OPS
//     },
//     KY1 extends `${string}`,
//     KY2 extends `${string}`,
//     KY3 extends `${string}`,
//     KPT extends [KY1, KY2, KY3, typeof PEA_MARKER?] | [KY1, KY2, typeof PEA_MARKER?] | [KY1, typeof PEA_MARKER?],
//     MRK extends MR extends undefined ? { [Key in `__${NME}__`]: any } : MR,
//     MKE extends (data: Data<{ [Key in keyof (DataFromRoles<ROL> & CoreData<{ [_CORE_]: COR }>)]: (DataFromRoles<ROL> & CoreData<{ [_CORE_]: COR }>)[Key] } & DataEntry>, modoDef: MDF) => Modo & _Role<CFG, OMIT_ROLE_MARKERS>,
//     MR extends { [key: symbol]: any } | undefined = undefined,
//     COR extends Class | undefined = undefined,
//     ROL extends { [key: string]: $Role } | undefined = undefined,
//     IFC extends MiscObj | undefined = undefined,
//     // RVE extends {[key: number]: {[key: number]: KPT}} | undefined = undefined,
//     RVE extends KPT[] | undefined = undefined,
//     // RVE extends (KeyPathWithPeaMarker | KeyPath)[] | undefined = undefined,
//     OPS extends MiscObj | undefined = undefined,
// >(config: {
//     name: NME,
//     marker?: MR,
//     core?: COR,
//     interface?: IFC,
//     prereqs?: ROL,
//     __prereqs__?: GatheredPrereqs<ROL>,
//     revive?: RVE,  //NOTE: Include ModelDefs is purely for inducing the import of pea modules
//     make: MKE,
//     ops?: OPS

// }) {
//     const { name, core, prereqs, revive, make } = config;

//     const rolesSet = gatherPrereqs(prereqs);
//     const startCount = core ? 1 : 0;
//     const requiredReifyCount = rolesSet ? countReifyFunctions(rolesSet, startCount) : startCount;

//     const modoDef = <ModoDef><C>{
//         name,
//         reify: core ? function (...args: any[]) {
//             incrementReifyCount();
//             return new core(...args);
//         } : null,

//         create(this: MDF, data: DataFromRoles<ROL> & CoreData<{ [_CORE_]: COR }>) {
//             const id = _genId();
//             const _data = { ...data, id };
//             const model = <C>this[_MAKE_](_data) as Modo;
//             instateModel(model); //main 
//             castModelCreated({
//                 model,
//                 data: _data,
//             })
//             return model;
//         },

//         [_CORE_]: core,
//         [_PREREQS_]: prereqs && clone(prereqs),
//         [_REVIVE_]: revive && clone(revive, 2),

//         [_MAKE_]: (data: Data<DataEntry & DataFromRoles<ROL> & CoreData<{ [_CORE_]: COR }>>) => {
//             resetReifyCount();
//             makingModel = true;
//             const model = <C>make(data, <MDF><C>modoDef) as Modo;
//             makingModel = false;
//             modelDefMap.set(model, modoDef);
//             if (reifyCount !== requiredReifyCount) console.warn(`[@Rue/Modo] Missing ${requiredReifyCount - reifyCount} reify call(s). Make sure all roles (from prereqs or model) are reified within 'make' function`)

//             if (rolesSet) {
//                 rolesMap.set(model, rolesSet);
//             }

//             castModelMade({
//                 modoDef,
//                 model,
//                 data
//             })

//             return model;
//         }
//     }

//     registerModelDef(<ModoDef><C>modoDef); //main 

//     return <C>modoDef as MDF
// }



// export function defineModel<CFG extends {
//     // id: ID ;
//     name: N;
//     marker?: { [key: symbol]: any };
//     core?: Class;
//     prereqs?: { [key: string]: $Role };
//     interface?: MiscObj;
//     ops?: MiscObj;
//     revive?: KPT[],  //NOTE: Include ModelDefs is purely for inducing the import of pea modules

// },
//     // ID extends `${string}`,
//     // IDY extends (CFG extends {id: infer N}? N : never ),
//     N extends `${string}`,
//     MRK extends (CFG extends { marker: infer K } ? K : undefined),
//     COR extends (CFG extends { core: infer C } ? C : undefined),
//     PRQ extends (CFG extends { prereqs: infer P } ? P : undefined),
//     IFC extends (CFG extends { interface: infer I } ? I : undefined),
//     OPS extends (CFG extends { ops: infer O } ? O : undefined),
//     NME extends (CFG extends { name: infer N } ? N : never),
//     RVE extends (CFG extends { revive: infer R } ? R : undefined),
//     $R extends { [_CORE_]: COR, [_PREREQS_]: PRQ, [_INTERFACE_]: IFC, [_MARKER_]: MRK },
//     KY1 extends `${string}`,
//     KY2 extends `${string}`,
//     KY3 extends `${string}`,
//     KPT extends [KY1, KY2, KY3, typeof PEA_MARKER?] | [KY1, KY2, typeof PEA_MARKER?] | [KY1, typeof PEA_MARKER?],
//     MKE extends (data: Data<{ [Key in keyof (DataFromRoles<PRQ> & CoreData<{ [_CORE_]: COR }>)]: (DataFromRoles<PRQ> & CoreData<{ [_CORE_]: COR }>)[Key] } & DataEntry>, modoDef: {
//         reify: COR extends Class ? (...args: ConstructorParameters<COR>) => COR["prototype"] : null
//     }) => Modo & _Role<$R, OMIT_ROLE_MARKERS>,
//     MDF extends {
//         name: NME;
//         __typeDef__: _Role<$R>;
//         // { [Key in keyof _Role<{ [_CORE_]: COR, [_PREREQS_]: PRQ, [_INTERFACE_]: IFC, [_MARKER_]: MRK }>]: _Role<{ [_CORE_]: COR, [_PREREQS_]: PRQ, [_INTERFACE_]: IFC, [_MARKER_]: MRK }>[Key] };
//         reify: CFG extends { core: infer C } ?
//         C extends Class ? (...args: ConstructorParameters<C>) => C["prototype"]
//         // : C extends MiscObj ? () => { [Key in keyof C as C[Key] extends { [_DATA_MARKER_]: true } ? never : Key]: C[Key] }
//         : null
//         : null;
//         [_CORE_]: COR;
//         [_PREREQS_]: PRQ;
//         [_INTERFACE_]: IFC;
//         [_MARKER_]: MRK;
//         [_REVIVE_]: RVE;
//         ops__: OPS; //TODO: include ops from roles... what about interfaces?
//         create: (data: DataFromRoles<PRQ> & CoreData<{ [_CORE_]: COR }>) => _Role<$R>;
//         [_MAKE_]: (data: DataFromRoles<PRQ> & CoreData<{ [_CORE_]: COR }>) => Modo & _Role<$R, OMIT_ROLE_MARKERS>;
//     }
// >(config: CFG, make?: {
//     make: MKE,
// }) {
//     const { core, prereqs } = config;
//     return {
//         [_CORE_]: core,
//         [_PREREQS_]: prereqs,
//         reify: core ? function (...args: any[]) {
//             incrementReifyCount();
//             return new core(...args);
//         } : null
//     } as MDF
// }


// export function _defineModel<
//     NME extends string,
//     $R extends { [_CORE_]: COR, [_PREREQS_]: PRQ, [_INTERFACE_]: IFC, [_MARKER_]: MRK },
//     CFG extends {
//         // id: ID ;
//         marker?: { [key: symbol]: any };
//         core?: Class;
//         prereqs?: { [key: string]: $Role };
//         interface?: MiscObj;
//         ops?: MiscObj;

//         name: string,
//         revive?: KPT[],  //NOTE: Include ModelDefs is purely for inducing the import of pea modules
//         make: () => any,
//         // make: (data: Data<{ [Key in keyof (DataFromRoles<PRQ> & CoreData<{ [_CORE_]: COR }>)]: (DataFromRoles<PRQ> & CoreData<{ [_CORE_]: COR }>)[Key] } & DataEntry>, modoDef: MDF) => Modo & _Role<$R, OMIT_ROLE_MARKERS>,
//     },
//     MDF extends {
//         name: NME;
//         __typeDef__: _Role<$R>;
//         // __typeDef__: { [Key in keyof _Role<CFG>]: _Role<CFG>[Key] }; //NOTE: This causes excessively deep errors. Do not use.
//         [_REVIVE_]: RVE;
//         // [_MAKE_]: (data: DataFromRoles<PRQ> & CoreData<{ [_CORE_]: COR }>) => _Role<CFG>;
//         [_MAKE_]: (data: DataFromRoles<PRQ> & CoreData<{ [_CORE_]: COR }>) => Modo & _Role<$R, OMIT_ROLE_MARKERS>;
//         reify: COR extends Class ? (...args: ConstructorParameters<COR>) => COR["prototype"] : null;
//         create: (data: DataFromRoles<PRQ> & CoreData<{ [_CORE_]: COR }>) => _Role<$R>;
//         [_PREREQS_]: PRQ;
//         [_INTERFACE_]: IFC;
//         [_CORE_]: COR;
//         [_MARKER_]: MRK;
//         ops__: OPS
//     },
//     KY1 extends `${string}`,
//     KY2 extends `${string}`,
//     KY3 extends `${string}`,
//     KPT extends [KY1, KY2, KY3, typeof PEA_MARKER?] | [KY1, KY2, typeof PEA_MARKER?] | [KY1, typeof PEA_MARKER?],
//     // MRK extends MR extends undefined ? { [Key in `__${NME}__`]: any } : MR,

//     MRK extends (CFG extends { marker: infer K } ? K : undefined),
//     COR extends (CFG extends { core: infer C } ? C : undefined),
//     PRQ extends (CFG extends { prereqs: infer P } ? P : undefined),
//     IFC extends (CFG extends { interface: infer I } ? I : undefined),
//     OPS extends (CFG extends { ops: infer O } ? O : undefined),
//     // MKE extends CFG extends {make: infer M} ? M : undefined,
//     // MR extends { [key: symbol]: any } | undefined = undefined,
//     // PRQ extends { [key: string]: $Role } | undefined = undefined,
//     // IFC extends MiscObj | undefined = undefined,
//     // RVE extends {[key: number]: {[key: number]: KPT}} | undefined = undefined,
//     RVE extends (CFG extends { revive: infer R } ? R : undefined),
// // RVE extends (KeyPathWithPeaMarker | KeyPath)[] | undefined = undefined,

// >(config: CFG) {
//     const { name, core, prereqs, revive, make } = config;

//     const rolesSet = gatherPrereqs(prereqs);
//     const startCount = core ? 1 : 0;
//     const requiredReifyCount = rolesSet ? countReifyFunctions(rolesSet, startCount) : startCount;

//     const modoDef = <ModoDef><C>{
//         name,
//         reify: core ? function (...args: any[]) {
//             incrementReifyCount();
//             return new core(...args);
//         } : null,

//         create(this: MDF, data: DataFromRoles<PRQ> & CoreData<{ [_CORE_]: COR }>) {
//             const id = _genId();
//             const _data = { ...data, id };
//             const model = <C>this[_MAKE_](_data) as Modo;
//             instateModel(model); //main 
//             castModelCreated({
//                 model,
//                 data: _data,
//             })
//             return model;
//         },

//         [_CORE_]: core,
//         [_PREREQS_]: prereqs && clone(prereqs),
//         [_REVIVE_]: revive && clone(revive, 2),

//         [_MAKE_]: (data: Data<DataEntry & DataFromRoles<PRQ> & CoreData<{ [_CORE_]: COR }>>) => {
//             resetReifyCount();
//             makingModel = true;
//             const model = <C>make(data, <MDF><C>modoDef) as Modo;
//             makingModel = false;
//             modelDefMap.set(model, modoDef);
//             if (reifyCount !== requiredReifyCount) console.warn(`[@Rue/Modo] Missing ${requiredReifyCount - reifyCount} reify call(s). Make sure all roles (from prereqs or model) are reified within 'make' function`)

//             if (rolesSet) {
//                 rolesMap.set(model, rolesSet);
//             }

//             castModelMade({
//                 modoDef,
//                 model,
//                 data
//             })

//             return model;
//         }
//     }

//     registerModelDef(<ModoDef><C>modoDef); //main 

//     return <C>modoDef as {
//         __typeDef__: _Role<{ [_CORE_]: COR, [_PREREQS_]: PRQ, [_INTERFACE_]: IFC, [_MARKER_]: MRK }>
//         // { [Key in keyof _Role<{ [_CORE_]: COR, [_PREREQS_]: PRQ, [_INTERFACE_]: IFC, [_MARKER_]: MRK }>]: _Role<{ [_CORE_]: COR, [_PREREQS_]: PRQ, [_INTERFACE_]: IFC, [_MARKER_]: MRK }>[Key] };
//         reify: CFG extends { core: infer C } ?
//         C extends Class ? (...args: ConstructorParameters<C>) => C["prototype"]
//         // : C extends MiscObj ? () => { [Key in keyof C as C[Key] extends { [_DATA_MARKER_]: true } ? never : Key]: C[Key] }
//         : null
//         : null;
//         [_CORE_]: COR;
//         [_PREREQS_]: PRQ;
//         [_INTERFACE_]: IFC;
//         [_MARKER_]: MRK;
//         ops__: OPS; //TODO: include ops from roles... what about interfaces?


//         name: NME;
//         // __typeDef__: _Role<$R>;
//         // __typeDef__: { [Key in keyof _Role<CFG>]: _Role<CFG>[Key] }; //NOTE: This causes excessively deep errors. Do not use.
//         [_REVIVE_]: RVE;
//         // [_MAKE_]: (data: DataFromRoles<PRQ> & CoreData<{ [_CORE_]: COR }>) => _Role<CFG>;
//         [_MAKE_]: (data: DataFromRoles<PRQ> & CoreData<{ [_CORE_]: COR }>) => Modo & _Role<$R, OMIT_ROLE_MARKERS>;
//         // reify: COR extends Class ? (...args: ConstructorParameters<COR>) => COR["prototype"] : null;
//         create: (data: DataFromRoles<PRQ> & CoreData<{ [_CORE_]: COR }>) => _Role<$R>;
//     }
// }



const _modelDefMap: Map<DatasetName, ModoDef> = new Map();

export function registerModelDef(def: ModoDef) {
    const name = toDatasetName(def.name);
    if (__DEV__) {
        const existingConfig = _modelDefMap.get(name);
        if (existingConfig) if (!__TEST__) console.warn(`[Modos] Name Collision: The model name '${name}' already exists. Please rename the model type via 'defineModel'.`);
    }
    _modelDefMap.set(name, def); //main 
}

export function getModelDef(name: string) {
    const modoDef = _modelDefMap.get(name)
    if (__DEV__ && modoDef == null) throw new Error(`There is no model type mapped to the dataset name: ${name}`)
    return modoDef as ModoDef;
}





