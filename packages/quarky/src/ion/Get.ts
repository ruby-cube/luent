import { hasQuark, QUARK, quarkOf } from "../abstract/Quark";
import { Traceable } from "../debug/Traceable";
import { MutableIon } from "./Ion";



export function Get<T, M>(initialState: T, props?: M & object): MutableIon<T> & M {
   return createAtomicNeutron(initialState, props, false) as MutableIon<T> & M
}


/** INTERNAL */
export type $AtomicNeutronState = MutableIon<unknown> & {
   [QUARK]: {
      inert: true;
      value: any,
      ionized: boolean, // TODO: remove? an ionized neutron is useless because the observer will never be triggered... to work, you need to make the neutron reactive.
   }
}

/** 
 * INTERNAL 
 * For reactive ions only.
 * */
export type NeutronQuark = QuarkOf<$AtomicNeutronState>

const INERT_ION = Symbol('atomic neutron')

/** INTERNAL */
export function createAtomicNeutron(
   value: any,
   methods?: object,
   ionized: boolean = false
) {
   const $ion = (() => ion.value) as $AtomicNeutronState

   const ion: NeutronQuark = {
      value,
      ionized,
      inert: true,
      quarkType: INERT_ION,
      __DEV__asTraceable: new Traceable()
   }

   $ion[QUARK] = ion
   // $ion.__DEV__label = __DEV__label

   const capsuleName = 'Neutron'

   Object.defineProperty($ion, 'value', {
      get() {
         return ion.value;
      },
      set: value => {
         // __DEV__traceMethodCall(capsuleName, $ion, 'value')
         return state = ionized ? maybeIonize(value) : value
      }
   })

   if (methods) {
      attachCapsuleMethods(capsuleName, $ion, methods)
   }

   return $ion as MutableIon<unknown>
}


export function isInertIon(value: unknown): value is { [QUARK]: { inert: true } } {
   if (!hasQuark(value)) return false;
   const quark = quarkOf(value)
   return 'inert' in quark && quark.inert === true;
}


export function Inert<T>(value: T): () => T {
   function inertGet() {
      return value
   }
   inertGet[QUARK] = { inert: true } as { inert: true }
   return inertGet
}