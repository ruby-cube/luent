import { v } from "../InputTypes";
import { fromApp } from "./provide";

export function createContextKey<D extends InputDef>(typeDef: D) {

    return {
        name: typeDef.name,
        optional: typeDef.optional,
        default: typeDef.default
    } as D
}

type InputDef = {
    name: string,
    validatedType?: any,
    inputType?: any,
    $inputType?: any,
    default?: true | undefined;
    required?: true;
    optional?: '?'
}

export function createInjectedClass(classKey: InputDef, get: (key: InputDef) => any = fromApp) {
    return (...args: any[]) => new get(classKey)(...args)
}

export function createInjectedFactory(classKey: InputDef, get: (key: InputDef) => any = fromApp) {
    return (...args: any[]) => get(classKey)(...args)
}

const DOG = createContextKey(v<string>)