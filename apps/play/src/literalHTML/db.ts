import { SymbolKey } from "@rue/lumo";

export function request<T>(key: SymbolKey<T> | symbol | string): Promise<T>{
    
    return fetch('') as Promise<T>;
}