import { DeepReadonly, readonly } from 'vue';
import { UnionToIntersection, MiscObj } from '@rue/types';
import { reifier } from './reifier';

export const _PREREQS_ = Symbol("prereqs")
export const _INTERFACE_ = Symbol("interface")
export const _IMPLEMENTS_ = Symbol("implements")
export const _INIT_ = Symbol("initRole")
export const _METHODS_ = Symbol("methods")
export const _DATA_MARKER_ = Symbol("data marker");
export const _MARKER_ = Symbol("role marker");
export const _ID_ = Symbol("role marker");
export const $val = null as unknown;

export type Data<T> = { [_DATA_MARKER_]: true } & T;
export type INCLUDE_ROLE_MARKERS = "include role markers";
export type OMIT_ROLE_MARKERS = "omit role markers";

export type PrivateRole<$ROL extends $Role> = _Role<$ROL>;
export type Role<$ROL extends $Role> = DeepReadonly<_Role<$ROL>>

// type RekeyCore<RKYMP extends { [key: string]: { [key: string]: `${string}` } }> = RKYMP extends { $CoreRole: infer RKY } ? RKY extends { [key: string]: `${string}` } ? RKY : {} : {};
type RekeyCore<RKYMP extends { [key: string]: { [key: string]: `${string}` } }, PRQKY extends string> = RKYMP extends { [Key in PRQKY]: infer RKY } ? RKY extends { [key: string]: `${string}` } ? RKY : {} : {};

export type _Role<$ROL extends $Role, CTX = INCLUDE_ROLE_MARKERS, ImplementedKeys extends string | symbol | number = "", RKYMP extends { [key: string]: { [key: string]: `${string}` } } = {}, RLKY extends string = ""> = Core<$ROL, RekeyCore<RKYMP, RLKY>> & Prereqs<$ROL, CTX, ImplementedKeys | _ImplementedKeys<$ROL>, Omit<RKYMP, RLKY>> & Omit<Interface<$ROL>, ImplementedKeys> & (CTX extends OMIT_ROLE_MARKERS ? {} : RoleMarker<$ROL>);
export type KeysOfRole<$R extends $Role, CTX = INCLUDE_ROLE_MARKERS, ImplementedKeys extends string | symbol | number = "", RKYMP extends { [key: string]: { [key: string]: `${string}` } } = {}, RLKY extends string = ""> = _Role<$R, CTX, ImplementedKeys, RKYMP, RLKY> extends { [Key in infer K]: any } ? K : never;
export type ValueInRole<$R extends $Role, K, CTX = INCLUDE_ROLE_MARKERS, ImplementedKeys extends string | symbol | number = "", RKYMP extends { [key: string]: { [key: string]: `${string}` } } = {}, RLKY extends string = ""> = K extends string | symbol | number ? $R extends $Role ? _Role<$R, CTX, ImplementedKeys, RKYMP, RLKY> extends { [Key in K]: infer V } ? V : never : never : never;

export type RoleMarker<$ROL extends $Role> = $ROL extends { [_MARKER_]: infer M } ? M extends { [key: symbol | string]: any } ? M : {} : {};
export type Interface<$ROL extends $Role> = $ROL extends { [_INTERFACE_]: infer I } ? I extends MiscObj ? I : {} : {};
export type _ImplementedKeys<$ROL extends $Role> = $ROL extends { [_IMPLEMENTS_]: infer I } ? I extends MiscObj ? keyof I : "" : "";

export type Prereqs<$RLE extends $Role, CTX = INCLUDE_ROLE_MARKERS, ImplementedKeys extends string | symbol | number = "", RKYMP extends { [key: string]: { [key: string]: `${string}` } } = {}> = $RLE extends { [_PREREQS_]: infer PRE } ? PRE extends { [key: string]: $Role } ? UnionToIntersection<PrereqRole<PRE, CTX, ImplementedKeys, RKYMP>> : {} : {};
type PrereqRole<T extends { [key: string]: $Role }, CTX = INCLUDE_ROLE_MARKERS, ImplementedKeys extends string | symbol | number = "", RKYMP extends { [key: string]: { [key: string]: `${string}` } } = {}> = T extends { [Key in infer K]: infer R } ? R extends $Role ? K extends string ? _Role<R, CTX, ImplementedKeys, RKYMP, K> : never : never : never;

export type Core<R extends $Role, RKY extends { [key: string]: `${string}` } = {}> = CoreProps<R, RKY> & CoreMethods<R, RKY>;
export type CoreProps<R extends $Role, RKY extends { [key: string]: `${string}` } = {}> = R extends { [_INIT_]: infer I } ? I extends (...args: any[]) => infer P ? P extends void ? {} : Omit<P, typeof _DATA_MARKER_ | keyof RKY> & _Rekey<P, RKY> : {} : {};
export type CoreMethods<R extends $Role, RKY extends { [key: string]: `${string}` } = {}> = R extends { [_METHODS_]: infer M } ? M extends MiscObj ? Omit<M, keyof RKY> & _Rekey<M, RKY> : {} : {};
// { [Key in Exclude<KeysOfRole<R>, keyof RKY>]: ValueInRole<R, Key>; } & 
type _Rekey<T, RKY extends { [key: string]: `${string}` } = {}> = { [Key in keyof RKY as RKY[Key]]: Key extends keyof T ? T[Key] : never }
export type Rekey<R extends $Role, RKY extends { [key: string]: `${string}` }> = Core<R, RKY> & Prereqs<R> & Interface<R> & RoleMarker<R>;

type ReturnOf<INI extends ((...args: any[]) => any) | undefined> = INI extends (...args: any[]) => infer R ? R extends void ? {} : { [Key in keyof R as Key extends typeof _DATA_MARKER_ ? never : Key]: R[Key] } : {}


// export type $Role = {
//     [_INIT_]: ((...args: any[]) => MiscObj | void) | undefined;
//     [_METHODS_]: { [key: string]: any } | undefined;
//     [_PREREQS_]: {
//         [key: string]: $Role
//     } | undefined;
//     [_INTERFACE_]: MiscObj | undefined;
//     [_IMPLEMENTS_]: MiscObj | undefined;
//     [_MARKER_]: { [key: symbol | string]: any } | undefined;
//     confer: ((...args: any[]) => MiscObj | void) | null;
// }


export type $Role = {
    __typeDef__: MiscObj;
    confer: ((...args: any[]) => MiscObj | void) | null;
    // reifier: ((...args: any[]) => MiscObj | void) | null;
    [_INIT_]: ((...args: any[]) => MiscObj | void) | undefined;
    [_METHODS_]: { [key: string]: any } | undefined;
    [_PREREQS_]: {
        [key: string]: $Role
    } | undefined;
    [_INTERFACE_]: MiscObj | undefined;
    [_IMPLEMENTS_]: MiscObj | undefined;
    [_MARKER_]: { [key: symbol | string]: any } | undefined;
}




export function role<CFG extends {
    marker?: { [key: symbol]: any };
    $construct?: (...args: any[]) => any;
    prereqs?: { [key: string]: $Role };
    interface?: MiscObj;
} & IMP,
    MRK extends (CFG extends { marker: infer K } ? K : undefined),
    INI extends (CFG extends { $construct: infer I } ? I : undefined),
    PRQ extends (CFG extends { prereqs: infer P } ? P : undefined),
    IFC extends (CFG extends { interface: infer I } ? I : undefined),
    CFR extends (CFG extends { $construct?: infer I } ?
        I extends (...args: infer P) => infer R ?
        (...args: P) => R extends MiscObj ? { props: ReturnOf<I> } & (keyof MET extends never ? {} : { methods: MET }) : (keyof MET extends never ? void : { methods: MET })
        : (keyof MET extends never ? null : () => { methods: MET })
        : (keyof MET extends never ? null : () => { methods: MET })),
    DEF extends { __typeDef__: MiscObj;[_INIT_]: INI;[_METHODS_]: MET;[_PREREQS_]: PRQ;[_INTERFACE_]: IFC;[_IMPLEMENTS_]: IMP;[_MARKER_]: MRK; confer: CFR },
    MET extends { [Key in keyof CFG as Key extends "marker" | "$construct" | "prereqs" | "interface" | "implements" ? never : Key]: CFG[Key] },
    M extends keyof MET extends never ? undefined : MET,
    P extends INI extends (...args: any[]) => infer R ? R extends MiscObj ? Omit<R, typeof _DATA_MARKER_> : {} : {},
    IMP extends MiscObj | undefined = {},
>(def: CFG & { implements?: IMP } & ThisType<MET & Prereqs<DEF, OMIT_ROLE_MARKERS> & P & (IFC extends undefined ? {} : IFC)>) {
    const { $construct, prereqs } = def;
    delete def.$construct;
    delete def.prereqs;
    delete def.marker;
    delete def.interface;
    delete def.implements;

    const _methods = __DEV__ ? def ? readonly(def) : undefined : def;
    // const o = $construct ? {
    //     $construct,
    //     onComposed,
    // } : null;

    return {
        [_PREREQS_]: prereqs,
        confer: $construct || Object.keys(def).length > 0 ? function (...args: any[]) {
            incrementConferCount();
            return { props: $construct ? $construct(...args) : null, methods: _methods };
        } : null,
        reifier
    } as {
        __typeDef__: _Role<DEF>;
        confer: CFR;
        reifier: typeof reifier;
        [_INIT_]: INI;
        [_METHODS_]: M;
        [_PREREQS_]: PRQ;
        [_INTERFACE_]: IFC;
        [_IMPLEMENTS_]: IMP;
        [_MARKER_]: MRK;
    }
}





export let conferCount = 0;

function incrementConferCount() {
    conferCount++;
}

export function resetConferCount() {
    conferCount = 0;
}





// import { DeepReadonly, readonly } from 'vue';
// import { UnionToIntersection } from '../../utility/types';
// import { MiscObj } from '../types';
// import { onComposed, reifier } from './reifier';

// export const _PREREQS_ = Symbol("prereqs")
// export const _INTERFACE_ = Symbol("interface")
// export const _INIT_ = Symbol("initRole")
// export const _METHODS_ = Symbol("methods")
// export const _DATA_MARKER_ = Symbol("data marker");
// export const _MARKER_ = Symbol("role marker");
// export const _ID_ = Symbol("role marker");
// export const $val = null as unknown;

// export type Data<T> = { [_DATA_MARKER_]: true } & T;

// export type PrivateRole<$ROL extends $Role> = _Role<$ROL>;
// export type Role<$ROL extends $Role> = DeepReadonly<_Role<$ROL>>

// export type _Role<$ROL extends $Role, CTX = INCLUDE_ROLE_MARKERS> = Core<$ROL> & Prereqs<$ROL, CTX> & (CTX extends OMIT_ROLE_MARKERS ? {} : RoleMarker<$ROL>)
// //  & Interface<$ROL> 

// export type RoleMarker<$ROL extends $Role> = $ROL extends { [_MARKER_]: infer M } ? M extends { [key: symbol | string]: any } ? M : {} : {};
// export type Interface<$ROL extends $Role> = $ROL extends { [_INTERFACE_]: infer I } ? I extends MiscObj ? I : {} : {};

// export type Prereqs<$RLE extends $Role, CTX = INCLUDE_ROLE_MARKERS> = $RLE extends { [_PREREQS_]: infer PRE } ? PRE extends { [key: string]: $Role } ? UnionToIntersection<PrereqRole<PRE, CTX>> : {} : {};
// type PrereqRole<T extends { [key: string]: $Role }, CTX = INCLUDE_ROLE_MARKERS> = T extends { [key: string]: infer R } ? R extends $Role ? _Role<R, CTX> : {} : never;
// export type Core<R extends $Role> = R extends { confer: infer C } ?
//     C extends (...args: any[]) => infer R ?
//     R extends { props?: infer P, methods?: infer M } ? P extends MiscObj ? M extends MiscObj ? P & M : P : M extends MiscObj ? M : {} : {}
//     : {}
//     : {};

// export type CoreData<R extends { [_INIT_]: (...args: any[]) => MiscObj | undefined }> = R extends { [_INIT_]: infer C } ? C extends (...args: infer A) => MiscObj ? Omit<UnionToIntersection<DataInParams<A>>, typeof _DATA_MARKER_> : {} : {};
// type DataInParams<P extends any[]> = P extends { [key: number]: infer A } ? A extends { [_DATA_MARKER_]: true } ? A : {} : {};

// type ReturnOf<INI extends ((...args: any[]) => any) | undefined> = INI extends (...args: any[]) => infer R ? R extends void ? {} : { [Key in keyof R as Key extends typeof _DATA_MARKER_ ? never : Key]: R[Key] } : {}


// export type $Role = {
//     [_INIT_]: ((...args: any[]) => MiscObj | void) | undefined;
//     [_METHODS_]: { [key: string]: any } | undefined;
//     [_PREREQS_]: {
//         [key: string]: $Role
//     } | undefined;
//     [_INTERFACE_]: MiscObj | undefined;
//     [_MARKER_]: { [key: symbol | string]: any } | undefined;
//     confer: ((...args: any[]) => MiscObj | void) | null;
// }


// export type $Role = {
//     __typeDef__: MiscObj;
//     confer: ((...args: any[]) => MiscObj | void) | null;
//     // reifier: ((...args: any[]) => MiscObj | void) | null;
//     [_INIT_]: ((...args: any[]) => MiscObj | void) | undefined;
//     [_METHODS_]: { [key: string]: any } | undefined;
//     [_PREREQS_]: {
//         [key: string]: $Role
//     } | undefined;
//     [_INTERFACE_]: MiscObj | undefined;
//     [_MARKER_]: { [key: symbol | string]: any } | undefined;
// }






// export function useRoleDefiner<H>(lifecycleHooks?: H) {
//     const hooks = lifecycleHooks ? lifecycleHooks : {};

//     function role<CFG extends {
//         marker?: { [key: symbol]: any };
//         $construct?: (this: {
//             onComposed: (callback: (ctx: {
//                 hook: "composed";
//             }) => void) => any;
//         }, ...args: any[]) => any;
//         prereqs?: { [key: string]: $Role };
//         interface?: MiscObj;
//     } & IMP,
//         MRK extends (CFG extends { marker: infer K } ? K : undefined),
//         INI extends (CFG extends { $construct: infer I } ? I : undefined),
//         PRQ extends (CFG extends { prereqs: infer P } ? P : undefined),
//         IFC extends (CFG extends { interface: infer I } ? I : undefined),
//         IMP extends MiscObj & ThisType<MET & { [Key in keyof Prereqs<DEF> as Key extends symbol ? never : Key]: Prereqs<DEF>[Key] } & ReturnOf<INI>> | undefined,
//         RFY extends true | undefined,
//         CFR extends (CFG extends { $construct?: infer I } ?
//             I extends (...args: infer P) => infer R ?
//             (...args: P) => R extends MiscObj ? { props: ReturnOf<I> } & (keyof MET extends never ? {} : { methods: MET }) : (keyof MET extends never ? void : { methods: MET })
//             : (keyof MET extends never ? null : () => { methods: MET })
//             : (keyof MET extends never ? null : () => { methods: MET })),
//         DEF extends { [_INIT_]: INI;[_METHODS_]: MET;[_PREREQS_]: PRQ;[_INTERFACE_]: IFC;[_MARKER_]: MRK, confer: CFR },
//         MET extends { [Key in keyof CFG as Key extends "marker" | "$construct" | "prereqs" | "interface" | "implements" ? never : Key]: CFG[Key] },
//     >(def: CFG & { implements?: IMP } & ThisType<MET & { [Key in keyof Prereqs<DEF> as Key extends symbol ? never : Key]: Prereqs<DEF>[Key] } & ReturnOf<INI>>, reifiable?: RFY) {
//         const { $construct, prereqs } = def;
//         delete def.$construct;
//         delete def.prereqs;
//         delete def.marker;
//         delete def.interface;
//         delete def.implements;

//         const _methods = __DEV__ ? def ? readonly(def) : undefined : def;
//         const o = $construct ? {
//             $construct,
//             onComposed,
//             ...hooks
//         } : null;

//         return {
//             [_PREREQS_]: prereqs,
//             confer: $construct || Object.keys(def).length > 0 ? function (...args: any[]) {
//                 incrementConferCount();
//                 return { props: o && $construct ? o.$construct(...args) : null, methods: _methods };
//             } : null,
//             reifier: reifiable ? reifier : null
//         } as {
//             __typeDef__: _Role<DEF>;
//             confer: CFR;
//             reifier: RFY extends true ? typeof reifier : null;
//             [_INIT_]: INI;
//             [_METHODS_]: MET;
//             [_PREREQS_]: PRQ;
//             [_INTERFACE_]: IFC;
//             [_MARKER_]: MRK;
//         }
//     }
//     return role;
// }


// export const role = useRoleDefiner();


// export let conferCount = 0;

// function incrementConferCount() {
//     conferCount++;
// }

// export function resetConferCount() {
//     conferCount = 0;
// }





