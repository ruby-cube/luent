import { TypedKey } from "@rue/lumo";

export function request<T>(key: TypedKey<T> | symbol | string): Promise<T>{
    
    return fetch('') as Promise<T>;
}