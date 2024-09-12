import { ReactiveAtom } from "./derivations/ReactiveAtom"

export const META = Symbol('metaReactiveEntity')


export interface ReactiveEntity<T = any> {
    readonly type: symbol
}

// export interface ReactivePrimitive {
//     asAtom?: ReactiveAtom
//     initializeAsAtom: (atom: ReactiveAtom) => void
//     destroyAsAtom: () => void
// }

// export function initializeAsAtom(this: ReactivePrimitive, atom: ReactiveAtom) {
//     this.asAtom = atom
// }

// export function destroyAsAtom(this: ReactivePrimitive){
//     this.asAtom = undefined
// }