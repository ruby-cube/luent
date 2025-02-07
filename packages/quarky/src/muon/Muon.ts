import { isFunction } from "@rue/utils";
import { Muon } from "../reactivity/reactivity-system";

export function isMuon(value: unknown): value is Muon {
   return isFunction(value) && /^\$[a-z]/.test(value.name) && value.length === 0
}