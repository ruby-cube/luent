import { VineNodeDepot } from "./NodeDepot";

// Singleton
const lookups = new Map();

export function getDepot(type: string) {
    return lookups.get(type);
}

export function registerDepot<T>(type: string, lookupMap: VineNodeDepot<T>) {

}