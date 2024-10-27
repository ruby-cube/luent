import { IonicAtom } from "./derivations/IonicAtom"
import { isIon } from "./ion/Ion"
import { asMetaIon, isAtomicIon } from "./ion/Ion"
import { isIonicModel } from "./ionize/ionize"

export const META = Symbol('metaReactiveEntity')


export interface ReactiveEntity<T = any> {
    readonly type: symbol
}

// export interface ReactivePrimitive {
//     asAtom?: IonicAtom
//     initializeAsAtom: (atom: IonicAtom) => void
//     destroyAsAtom: () => void
// }

// export function initializeAsAtom(this: ReactivePrimitive, atom: IonicAtom) {
//     this.asAtom = atom
// }

// export function destroyAsAtom(this: ReactivePrimitive){
//     this.asAtom = undefined
// }

export function isReactive(value: any) {
    return isIonicModel(value) || isIon(value) && !asMetaIon(value).inert
}