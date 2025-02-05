import { asNonlocalReadonly } from "../NonlocalReadonly";
import { META } from "../ReactiveEntity";
import { Ion, isIon } from "./Ion";

type WritableIon = Ion & { state: any }

export function createReadonlyIon(ion: WritableIon) {
   const meta = ion[META]
   return meta.asReadOnly = () => asNonlocalReadonly(ion())
}

export function isWritableIon(value: any): value is WritableIon {
   return isIon(value) && 'state' in value;
}