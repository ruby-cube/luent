import { hasQuark, QUARK, Quark, quarkOf } from "../Quark"
import { Update } from "./UpdateCycle"
import { trigger, Watchable, Watched } from "./Watched"


const ATOMIC = Symbol('atomic')


export class AtomicQuark implements Watchable, Quark {
   pendingUpdate: null | Update = null
   quarkType = ATOMIC
   trigger = trigger
   asWatched: undefined | Watched
}


export function isAtomic(value: unknown): value is { [QUARK]: AtomicQuark } {
   return hasQuark(value) && quarkOf(value).quarkType === ATOMIC
}


export function isAtomicQuark(value: unknown): value is AtomicQuark {
   return value instanceof Object && 'quarkType' in value && value.quarkType === ATOMIC
}
