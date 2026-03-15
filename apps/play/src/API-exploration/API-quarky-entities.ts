// Abstract

// Atom { asTrackedAtom?: TrackedAtom }
// Compound { particles }

// *Subject extends Compound (directly watched)
// - FunctionSubject
// - ModelSubject
// - MultiSubject

// Interfaces
// Stateful { getState(): unknown }

// Traceable
// (ions)
// - Atomic Ion (atom)
// - Atomic Pion (atom)
// - Derivation Ion (compound)  (functional compound w/state)

// (sorta ion)
// - Tracked Op (atom)

// (model)
// - Ionic Model (atom)

// (watchers)
// - Multisubject (multi compound)
// - Ion Subject (multi compound)
// - Ionic Subject (model compound)

// - Ionic Task (compound) (functional compound, no state)



interface Stateful { // Used in Watch and Traceable
   getState(): unknown
}

interface Traceable {
   name: string;
   origin: string;
}

interface TraceableMutable extends Traceable {
   traceMutation: boolean
   logTrigger: (() => void) | boolean
}




