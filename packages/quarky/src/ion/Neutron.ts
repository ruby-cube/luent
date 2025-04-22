import { EntityQuark, hasQuark, QUARK, QuarkOf, quarkOf } from "../Quark";
import { shouldIonize } from "./AtomicIon";
import { attachCapsuleMethods, Capsule } from "../capsule/Capsule";
import { __DEV__label, __DEV__traceMethodCall } from "../debug/debug";
import { ionize } from "../ionized/ionize";
import { AtomicIon, Methods } from "./ion";
import { Traceable } from "../debug/Traceable";


export function neutron<T, M>(initialState: T, methods?: M & Methods): M extends Methods ? AtomicIon<T, M> : AtomicIon<T> {
   return createAtomicNeutron(initialState, methods, false) as unknown as M extends Methods ? AtomicIon<T, M> : AtomicIon<T>
}


//TODO: I don't know how I should handle read-only, and traceability for neutrons.
/** INTERNAL */
export type $AtomicNeutronState = AtomicIon & Capsule & {
   [QUARK]: {
      type: symbol;
      inert: true;
      state: any,
      ionized: boolean, //TODO: remove? an ionized neutron is useless because the watcher will never be triggered... to work, you need to make the neutron reactive.
   } & EntityQuark<$AtomicNeutronState>
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
      entity: $ion,
      type: INERT_ION,
      asTraceable: new Traceable()
   }

   $ion[QUARK] = ion
   $ion.labelName = undefined
   // $ion.__DEV__label = __DEV__label

   const capsuleName = 'Neutron'

   Object.defineProperty($ion, 'state', {
      get() {
         return ion.state;
      },
      set: value => {
         // __DEV__traceMethodCall(capsuleName, $ion, 'state')
         return state = shouldIonize(value, ionized) ? ionize(value) : value
      }
   })

   if (methods) {
      attachCapsuleMethods(capsuleName, $ion, methods)
   }

   return $ion
}


export function isInertIon(value: unknown): value is { [QUARK]: { inert: true } } {
   return hasQuark(value) && (<{ inert: true }>quarkOf(value)).inert === true;
}
