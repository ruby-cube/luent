import {  isClass } from '@rue/utils';
import { Cast, Class, MiscObj } from '@rue/types';

import { $Role, _PREREQS_ } from "./Role";

export type RoleDef = { __typeDef__: MiscObj };
export type TypeChecker<T = MiscObj> = (value: any) => value is T;
export type ContextualType = {
    check: TypeChecker,
    __typeDef__: MiscObj
}

export type TypeDef<T> = T extends { __typeDef__: infer T } ? T : (T extends Class ? Class["prototype"] : never);

export const rolesMap: WeakMap<MiscObj, Set<$Role>> = new WeakMap();

export function enacts<T extends { __typeDef__: MiscObj }>(value: any, type: T): value is TypeDef<T> {
    if (value == null || !(value instanceof Object))
        return false;

    if (is$Role(type)) {
        const roles = rolesMap.get(<MiscObj><Cast>value)
        if (roles) return roles.has(<$Role>type);
        else return false;
    }

    if (isClass(type)) {
        return value instanceof type;
    }

    if (isContextualType(type))
        return type.check(value);

    console.warn("invalid type", type)
    throw new Error("[typecheck] Invalid `is` check type.")
}

// export function modelDefOf(model: Model) {
//     return modelDefMap.get(model)!;
// }

function is$Role(type: any): type is $Role {
    return _PREREQS_ in type;
}

function isContextualType(type: any): type is ContextualType {
    return "check" in type;
}


export function defineTypeCheck<T, C extends (value: any) => value is T>(typeDef: T, typechecker: C): [{ check: C, __typeDef__: T }, C] {
    return [{
        check: typechecker
    }, typechecker] as [{ check: C, __typeDef__: T }, C];
}

// @example
// export const [ArticleItem, isArticleItem] = defineTypeCheck({ id: "aaa", article: "hi" }, (model: Model): model is { id: UID, article: string } => {
//     return true;
// })

// type See = typeof ArticleItem extends (model: any) => infer R ? R : never;