import { AnyObject } from "@luent/types";
import { QUARK } from "../abstract/Quark";
import { trigger, Atom, TrackedAtom } from "../reactivity/Atom";
import { TraceableMutable } from "../debug/Traceable";
import { MutableIon } from "./Ion";
import { track } from "../reactivity/Compound";
import { isPlainObject } from "@luent/utils";
import { SimpleState } from "../reactivity/State";
import { traceMutation } from "../debug/dev";


export type QuarkyAtomicIon = MutableIon<unknown> & { [QUARK]: AtomicIonQuark, displayName: string }

export interface IonHooks {
   '@derive'?: () => unknown,
   '@init'?: () => void,
   '@get'?: (value: unknown) => void,
   '@set'?: (event: { value: unknown, previous: unknown }) => void
}


export class AtomicIonQuark implements Atom {
   asTrackedAtom: TrackedAtom | undefined;

   castGet: ((value: unknown) => void) | undefined
   castSet: ((event: { value: unknown; previous: unknown; }) => void) | undefined;
   castInit: (() => void) | undefined

   asTraceable?: TraceableMutable

   constructor(
      public state: SimpleState,
      hooks: IonHooks | undefined,
   ) {
      this.castGet = hooks?.["@get"]
      this.castSet = hooks?.["@set"]
      this.castInit = hooks?.["@init"]
   }

   getState(): unknown {
      return this.state.get()
   }
}

export function createAtomicIon<T>(
   initialState: T,
   setup?: AnyObject
): MutableIon<T> {
   const quark = new AtomicIonQuark(new SimpleState(initialState), setup)
   const $state = (
      quark.castGet
         ? withGetHook(getState.bind(quark), quark.castGet)
         : function () { return getState.apply(quark) }
   ) as QuarkyAtomicIon

   $state[QUARK] = quark
   if (__DEV__) $state.displayName = 'getState'
   if (__DEV__) quark.asTraceable = new TraceableMutable(setup?.devName)


   if (setup) {
      const descriptors = Object.getOwnPropertyDescriptors(setup)
      if (__DEV__ && !isPlainObject(setup)) throw new Error('additional ion setup and methods must be defined in an object literal') // TODO: allow classes and prototypes?
      if (__DEV__ && 'value' in descriptors) throw new Error('Overriding .value property disallowed. Use @get and @set hooks to add behavior')
      delete descriptors['@get'];
      delete descriptors['@set'];
      delete descriptors['@init'];
      Object.defineProperties($state, descriptors)
   }

   Object.defineProperty($state, 'value', {
      get: $state,
      set: quark.castSet
         ? withSetHook(setState.bind(quark), quark.castSet, () => quark.state.get())
         : setState.bind(quark)
   })

   return $state
}


export function getState(this: AtomicIonQuark) {
   track(this)
   return this.state.get()
}

export function setState(this: AtomicIonQuark, value: unknown) {
   if (__DEV__) traceMutation(this.asTraceable, this.state.get(), value)
   this.state.set(value)
   trigger(this)
   return value;
}


export function withGetHook(
   getState: () => unknown,
   castGet: (value: unknown) => void
) {
   function $state() {
      const value = getState();
      castGet(value)
      return value;
   }
   // preserve monomorphism
   $state.value = undefined
   $state[QUARK] = undefined
   return $state
}

export function withSetHook<T = unknown>(
   set: (value: unknown) => T,
   castSet: (event: { value: unknown, previous: unknown }) => void,
   getState: () => unknown
) {
   return function setState(value: unknown) {
      const previous = getState()
      const output = set(value)
      castSet({ value, previous })
      return output;
   }
}