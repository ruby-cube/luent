import { ReactiveAtom } from "./derivations/ReactiveAtom"

export interface ReactivePrimitive {
    asAtom?: ReactiveAtom
    initializeAsAtom: (atom: ReactiveAtom) => void
    destroyAsAtom: () => void

}

export function initializeAsAtom(this: ReactivePrimitive, atom: ReactiveAtom) {
    this.asAtom = atom
}

export function destroyAsAtom(this: ReactivePrimitive){
    this.asAtom = undefined
}