import { EntityQuark, hasQuark, QUARK, QuarkOf, quarkOf } from "../Quark";
import { shouldIonize } from "./AtomicIon";
import { __DEV__initTraceability, attachCapsuleMethods, Capsule } from "../capsule/Capsule";
import { __DEV__traceMethodCall, Traceable } from "../debug/debug";
import { ionize } from "../ionized/ionize";
import { __DEV__label } from "../debug/DEVLabellable";
import { AtomicIon, Methods, NonVoid } from "./ion";


export function neutron<T extends NonVoid, M>(initialState: T, methods?: M & Methods): M extends Methods ? AtomicIon<T, M> : AtomicIon<T> {
   return createAtomicNeutron(initialState, methods, false) as unknown as M extends Methods ? AtomicIon<T, M> : AtomicIon<T>
}


//TODO: I don't know how I should handle read-only, and traceability for neutrons.
/** INTERNAL */
export type $NeutronState = AtomicIon & Capsule & {
   [QUARK]: {
      type: symbol;
      inert: true;
      state: any,
      ionized: boolean, //TODO: remove? an ionized neutron is useless because the watcher will never be triggered... to work, you need to make the neutron reactive.
   } & EntityQuark<$NeutronState>
}

/** 
 * INTERNAL 
 * For reactive ions only.
 * */
export type NeutronQuark = QuarkOf<$NeutronState>
const INERT_ION = Symbol('atomic neutron')

/** INTERNAL */
export function createAtomicNeutron(
   state: any,
   methods?: object,
   ionized: boolean = false
) {
   const $ion = (() => ion.state) as $NeutronState

   const ion: NeutronQuark = {
      state,
      ionized,
      inert: true,
      entity: $ion,
      type: INERT_ION,
      __DEV__asTraceable: new Traceable()
   }
   __DEV__initTraceability(ion)

   $ion[QUARK] = ion
   $ion.__DEV__labelName = undefined
   $ion.__DEV__label = __DEV__label

   const capsuleName = 'Neutron'

   Object.defineProperty($ion, 'state', {
      get() {
         return ion.state;
      },
      set: value => {
         __DEV__traceMethodCall(capsuleName, $ion, 'state')
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
