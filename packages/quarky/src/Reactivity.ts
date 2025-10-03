

// interface Atom {
//    state: unknown,
//    stale: boolean,
//    compounds: Compound[]
//    effects: unknown
// }





// interface Compound {
//    task: () => unknown,
//    stale: boolean
//    effects: unknown
// }


// interface Watched {

// }

// export class Compound {

//    _atoms: Set<Atom> = new Set()

//    atoms: Atom[] = []

//    track(atom: Atom) {
//       if (this._atoms.has(atom)) return atom
//       this._atoms.add(atom)
//       this.atoms.push(atom)
//       return atom;
//    }

//    untrackAtoms() {
//       this.atoms.length = 0
//       this._atoms.clear()
//    }

//    forEachAtom(fn: (atom: Atom) => void) {
//       const atoms = this.atoms;
//       atoms.forEach(atom => {
//          // if ('forEachAtom' in particle) {
//          //    particle.forEachAtom(fn)
//          // }
//          // else {
//          fn(atom)
//          // }
//       })
//    }
// }

// function getState(this: Atom) {
//    track(this);
//    return this.state;
// }

// function setState(this: Atom, value: unknown) {
//    this.state = value;
//    trigger(this);
// }

// function deriveState() {

// }

// function track(atom: Atom) {

// }

// function trigger(atom: Atom) {
//    atom.asWatchSubject?.stale = true;
//    for (const compound of atom.compounds) {
//       compound.stale = true;
//    }
// }












// interface ionicTask {
//    task: () => void
//    stale: boolean
// }