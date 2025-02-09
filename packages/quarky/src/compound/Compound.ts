import { asAtom, IonicAtom, MaybeIonicAtom } from "./Atom"

export interface MaybeCompound<T extends Compound = Compound> {
   asCompound?: T
}

export interface Compound {
   atoms: IonicAtom[]
   track(entity: MaybeIonicAtom): IonicAtom
   trigger(): void
}

export function track(this: Compound, entity: MaybeIonicAtom) {
   const atom = asAtom(entity)
   if (atom.compounds.has(this)) return atom;
   this.atoms.push(atom)
   return atom;
}

export function untrackAtoms(this: Compound) {
   this.atoms?.forEach(atom => {
      atom.removeCompound(this)
   })
   this.atoms = []
}