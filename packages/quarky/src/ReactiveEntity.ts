import { IonicAtom } from "./derivations/IonicAtom"
import { asMetaIon, isIon } from "./ion/Ion"
import { isIonicModel } from "./ionize/IonicModel"

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