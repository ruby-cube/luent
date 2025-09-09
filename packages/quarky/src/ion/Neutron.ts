import { hasQuark, Quark, QUARK, QuarkOf, quarkOf } from "../Quark";
import { maybeIonize } from "./AtomicIon";
import { attachCapsuleMethods, Capsule } from "../capsule/Capsule";
import { ionize } from "../ionized/ionize";
import { Traceable } from "../debug/Traceable";
import { MutableIon } from "./Ion";


export function neutron<T, M>(initialState: T, props?: M & object): MutableIon<T> & M {
   return createAtomicNeutron(initialState, props, false) as MutableIon<T> & M
}


//TODO: I don't know how I should handle read-only, and traceability for neutrons.
/** INTERNAL */
export type $AtomicNeutronState = MutableIon<unknown> & Capsule & {
   [QUARK]: {
      inert: true;
      state: any,
      ionized: boolean, //TODO: remove? an ionized neutron is useless because the watcher will never be triggered... to work, you need to make the neutron reactive.
   } & Quark<typeof INERT_ION, $AtomicNeutronState>
}

/** 
 * INTERNAL 
 * For reactive ions only.
 * */
export type NeutronQuark = QuarkOf<$AtomicNeutronState>

const INERT_ION = Symbol('atomic neutron')

/** INTERNAL */
export function createAtomicNeutron(
   state: any,
   methods?: object,
   ionized: boolean = false
) {
   const $ion = (() => ion.state) as $AtomicNeutronState

   const ion: NeutronQuark = {
      state,
      ionized,
      inert: true,
      quarkType: INERT_ION,
      __DEV__asTraceable: new Traceable()
   }

   $ion[QUARK] = ion
   // $ion.__DEV__label = __DEV__label

   const capsuleName = 'Neutron'

   Object.defineProperty($ion, 'state', {
      get() {
         return ion.state;
      },
      set: value => {
         // __DEV__traceMethodCall(capsuleName, $ion, 'state')
         return state = maybeIonize(value, ionized)
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
