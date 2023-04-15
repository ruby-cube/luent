import { $type } from "@rue/utils";
import { Cast, Class, UnionToIntersection, MiscObj } from "@rue/types";
import { conferCount, Data, Interface, Prereqs, resetConferCount, RoleMarker, _INIT_, _DATA_MARKER_, _PREREQS_, _Role, _INTERFACE_, $Role, Core, ValueInRole, KeysOfRole, OMIT_ROLE_MARKERS, INCLUDE_ROLE_MARKERS } from "./Role";
import { rolesMap } from './typecheck';
import { createHook } from '@rue/pecherie';


export type KeyCollisionCheck<R extends $Role> = { [Key in (keyof Core<R> & KeysOfPrereqs<R>)]: "collision" } & (R extends { [_PREREQS_]: infer P } ? P extends { [key: string]: infer R } ? R extends $Role ? KeyCollisionCheck<R> : never : {} : never);
export type KeysOfPrereqs<$R extends $Role> = Prereqs<$R> extends { [Key in infer K]: any } ? K : never; //Resolves infinite loop
export type KeysOfCollisionCheck<$R extends $Role> = KeyCollisionCheck<$R> extends { [Key in infer K]: any } ? K : never; //Resolves infinite loop
export function keyCollisionCheck<R extends $Role, C extends KeysOfCollisionCheck<R> extends never ? true : (KeysOfCollisionCheck<R> extends KeysOfRekeyMap<M> ? true : "There are key collisions!" | Exclude<KeysOfCollisionCheck<R>, KeysOfRekeyMap<M>>), M extends { [key: string]: { [key: string]: `${string}` } } = {}>(role: R, check: C, rekeyMap?: M) { }
type KeysOfRekeyMap<M extends { [key: string]: { [key: string]: string } }> = M extends { [key: string]: infer RKY } ? RKY extends { [Key in infer RKY]: string } ? RKY : never : never;

export function roleCollisionCheck(role: $Role) {
    const prereqs = role[_PREREQS_];
    const map: Map<string, $Role> = new Map()
    if (prereqs) {
        for (const key in prereqs) {
            const prereq = prereqs[key];
            const existingPrereq = map.get(key);
            if (existingPrereq && existingPrereq !== prereq) console.warn(`Two prereqs share the name ${key}. This is not necessarily a problem, but may cause issues if rekeying`)
            map.set(key, prereq)
        }
    }
}


export type DataFromRoles<$ROL extends { [key: string]: $Role } | undefined> = UnionToIntersection<$ROL extends { [key: string]: infer R } ? R extends { [_INIT_]: (...args: any[]) => MiscObj | undefined; } ? { [Key in keyof CoreData<R>]: CoreData<R>[Key] } & (R extends { [_PREREQS_]: infer P } ? P extends { [key: string]: $Role; } ? DataFromRoles<P> : {} : {}) : never : never>;
export type CoreData<R extends { [_INIT_]: (...args: any[]) => MiscObj | undefined }> = R extends { [_INIT_]: infer C } ? C extends (...args: infer A) => MiscObj ? Omit<UnionToIntersection<DataInParams<A>>, typeof _DATA_MARKER_> : {} : {};
type DataInParams<P extends any[]> = P extends { [key: number]: infer A } ? A extends { [_DATA_MARKER_]: true } ? A : {} : {};

const [castComposed, _onComposed] = createHook({
    hook: "composed",
    onceAsDefault: true,
    data: $type as MiscObj, //model
})

export const onComposed = _onComposed

// Auto-compose function
function _compose(rolesSet: Set<$Role>, data: MiscObj | undefined) {
    const model = {} as MiscObj;
    for (const $Role of rolesSet) {
        const confer = $Role.confer;
        if (confer) {
            try {
                const role = confer(data);
                if (role) {
                    const { props, methods } = role;
                    if (props) {
                        for (const key in props) {
                            if (__DEV__ && key in model) console.warn(`Overriding property: ${key}: ${model[key].toString()} with ${props[key].toString()}. If this is unintended, consider using a custom compose function.`)
                            model[key] = props[key];
                        }
                    }
                    if (methods) {
                        for (const key in methods) {
                            if (__DEV__ && key in model) console.warn(`Overriding property: ${key}: ${model[key].toString()} with ${props[key].toString()}. If this is unintended, consider using a custom compose function.`)
                            model[key] = methods[key];
                        }
                    }
                }
            }
            catch (err) {
                if (__DEV__) {
                    console.warn("The following error may be an indication that a custom compose function needs to be passed into `$[Role].reifier()`")
                    console.error(err);
                }
            }
        }
    }
    return model;
}

export function reifier<
    $ROL extends $Role,
    DAT extends Data<DataFromRoles<{ $Role: $ROL }>>,
    CMP extends (data: DAT) => { [Key in KeysOfRole<$ROL, OMIT_ROLE_MARKERS, "", RKYMP, "$CoreRole">]: ValueInRole<$ROL, Key, OMIT_ROLE_MARKERS, "", RKYMP, "$CoreRole"> },
    // _Role<$ROL, OMIT_ROLE_MARKERS, "", RKYMP, "$CoreRole">,
    RKYMP extends { [key: string]: { [key: string]: `${string}` } },
>(this: $ROL, compose?: CMP, __dev__?: true | { __prereqs__?: GatheredPrereqs<{ $Role: $ROL }>, __rekey__?: RKYMP }) {

    const rolesSet = _gatherPrereqs({ $Role: this });
    const requiredConferCount = rolesSet ? countConferFunctions(rolesSet) : 0;

    const create = (data: Omit<DAT, typeof _DATA_MARKER_>) => {
        resetConferCount();
        const model = compose ? compose(<DAT>data) : _compose(rolesSet, data);
        if (conferCount !== requiredConferCount) console.warn(`[@Rue/Modo] Missing ${requiredConferCount - conferCount} confer call(s). Make sure all roles (from prereqs or model) are reified within 'make' function`)

        if (rolesSet) {
            rolesMap.set(model, rolesSet);
        }

        castComposed(model)
        return <Cast>model as WithoutSymbolKeys_Role<$ROL, RKYMP> extends WithoutSymbolKeys_ReturnOfCompose<CMP> ?
            _Role<$ROL, INCLUDE_ROLE_MARKERS, "", RKYMP, "$CoreRole"> : "Error: Compose function returns excess properties. Additional properties must be added via `role`";
    }

    return create;
}

export type HelpMe<$ROL extends $Role, RKYMP extends { [key: string]: { [key: string]: string; }; }, CMP extends (...args: any[]) => any> = WithoutSymbolKeys_Role<$ROL, RKYMP> extends WithoutSymbolKeys_ReturnOfCompose<CMP> ?
    _Role<$ROL, INCLUDE_ROLE_MARKERS, "", RKYMP, "$CoreRole"> : "Error: Compose function returns excess properties. Additional properties must be added via `role`";
export type ComposeFunction<DAT, $ROL extends $Role, RKYMP extends { [key: string]: { [key: string]: string; }; }> = (data: DAT) => { [Key in KeysOfRole<$ROL, OMIT_ROLE_MARKERS, "", RKYMP, "$CoreRole">]: ValueInRole<$ROL, Key, OMIT_ROLE_MARKERS, "", RKYMP, "$CoreRole"> }


type WithoutSymbolKeys_Role<R extends $Role, RKYMP extends { [key: string]: { [key: string]: `${string}` } } = {}> = { [Key in KeysOfRole<R, OMIT_ROLE_MARKERS, "", RKYMP, "$CoreRole"> as Key extends symbol ? never : Key]: ValueInRole<R, Key, OMIT_ROLE_MARKERS, "", RKYMP, "$CoreRole"> }
type WithoutSymbolKeys_ReturnOfCompose<T extends (...args: any[]) => any> = T extends (...args: any[]) => infer R ? R extends MiscObj ? { [Key in keyof R as Key extends symbol ? never : Key]: R[Key] } : never : never

type _Prereqs<T extends { [key: string]: $Role }> = T & (T extends { [Key in keyof T]: infer R } ? R extends { [_PREREQS_]: { [key: string]: $Role } } ? UnionToIntersection<_Prereqs<R[typeof _PREREQS_]>> : {} : {})
type GatheredPrereqs<T extends { [key: string]: $Role } | undefined> = T extends { [Key in keyof T]: infer R } ? R extends { [_PREREQS_]: { [key: string]: $Role } } ? UnionToIntersection<_Prereqs<R[typeof _PREREQS_]>> : {} : {}

export function _gatherPrereqs<M extends { [key: string]: $Role } | undefined>(prereqs: M, allPrereqs?: Set<$Role>) {
    allPrereqs = allPrereqs ?? new Set();
    for (const key in prereqs) {
        const role = prereqs[key];
        allPrereqs.add(role);
        const _prereqs = role[_PREREQS_];
        _gatherPrereqs(_prereqs, allPrereqs);
    }
    return allPrereqs;
}




function countConferFunctions(roles: Set<$Role>) {
    let count = 0;
    for (const role of roles) {
        if (role.confer) count++;
    }
    return count;
}


export function implement<R extends $Role, I extends (R extends { [_INTERFACE_]: infer I } ? I extends MiscObj ? I : never : never), V extends I[K], K extends keyof I>(role: R, key: K, value: V) {
    return value;
}


