import { isFunction, isObject } from "@rue/utils";
import { isAtomicIon } from "../ion/AtomicIon";
import { AtomicIon, isIon } from "../ion/Ion";
import { __DEV__getTrace, getPublicTrace, traceAsyncPath } from "../../../flask/debug";
import { AnyObject } from "@rue/types";
import { quarkOf, hasQuark, QUARK, Quark } from "../Quark";
import { detachedCall, untrackedCall } from "../ionic/IonicCompound";
import { Compound, CompoundMorph, isCompound } from "../compound/Compound";
import { isIonizedModel } from "../ionized/ionize";
import { Particle } from "../compound/Particle";
import { IonizedModel } from "../ionized/IonizedModel";
import { Traceable } from "./Traceable";
import { debug as _debug } from "@rue/utils";

// export interface DEVLabellable {
//    labelName?: string
//    __DEV__label: (label: string) => void
// }

// export function __DEV__label(this: DEVLabellable, label: string) {
//    this.labelName = label;
// }

//QUESTION: dunno if this applies to only capsules or also effects


let _isSignal = false;

function isReactive<T>(maybeHasSignal: T): maybeHasSignal is T & Function {
   if (!(isFunction(maybeHasSignal))) return false;
   console.warn('Using `isReactive` on a function with unknown side effects can cause bugs. To avoid unknown side-effects, never use isReactive() in production. Instead use `isIon` to check for reactivity and pass any impromptu getters into the $ function. `isReactive` is only to check if you have a wrapped signal')
   _isSignal = false;
   try {
      detachedCall(maybeHasSignal) //TODO: what if function has async code?
   }
   finally {
      if (_isSignal) {
         _isSignal = false;
         return true;
      }
      return false;
   }
}

export function emitSignal() {
   _isSignal = true;
}


//+++++++


export function __DEV__trace(type: string, label: string | undefined, origin: string, key?: PropertyKey) {
   const trace = __DEV__getTrace()
   label = label ?? 'unlabeled'
   console.log('')
   console.log(`# ${label}`)
   console.log(`NonError Origin: ${type}\n    ` + (origin ? origin : ''))
   console.log(`NonError Call Trace: ${key ? type + '.' + String(key) : ''}\n    ` + (trace ? trace : ''))
   console.log('')
}

// type Traceable = AnyObject | Ion;


// debug.logDefinitionSource($count)


export const debug = {
   isReactive,
   // traceTriggers,
   // traceCalls,

   logAtoms, // deeply? or shallowly?
   // logDefinitionSource, //TODO:
   // traceable, // for tracing plain objects

   traceAsyncPath,
   ..._debug
}

export type TraceableSubject = { 
   [QUARK]: TraceableQuark, 
   // labelName?: string
}

// export type TraceableQuark = { asTraceable?: Traceable; }


export function asTraceable(subject: TraceableSubject): Traceable {
   const traceable = quarkOf(subject).asTraceable
   if (!traceable) throw new Error('Subject is not traceable')
   return traceable;
}

function logAtoms(entity: { [QUARK]: CompoundMorph }, label: string) {
   if (!isIon(entity)) return;
   entity() // TODO: we need to track both memoized and non-memoized ions

   debug.log('-------------------')
   debug.log('[LOG ATOMS]', label)
   const particles = quarkOf(entity).asCompound?.particles
   if (particles) _logAtoms(particles)
   else debug.log('No atoms')
   debug.log('-------------------')
}

// function logAbsorbedIons(model: IonizedModel) {
//    if (!isIonizedModel(model)) {
//       debug.log('No absorbed ions found. Target is not ionized model.')
//    }
//    const quark = quarkOf(model)
//    quark.trackAbsorbedIons()
//    //TODO: need to identify and log property keys
// }

function _logAtoms(particles: Particle[]) {
   for (const particle of particles) {
      if (isCompound(particle)) {
         _logAtoms(particle.particles)
      }
      else {
         logAtom(particle.quark)
      }
   }
}


function logAtom(atom: TraceableQuark) {
   debug.log('•', atom.asTraceable.origin)
}



// export function __DEV__traceMethodCall(type: string, subject: TraceableSubject, key: PropertyKey) {
//    const traceable = asTraceable(subject);
//    if (traceable.traceTriggers.has(key)) __DEV__trace(type, subject.labelName, traceable.origin!, key)
// }

// function __DEV__traceFunctionCall(subject: Function & TraceableSubject) {
//    const traceable = asTraceable(subject);
//    __DEV__trace('Function', subject.labelName, traceable.origin!)
// }

// export function traceableMethodWrap(type: string, subject: TraceableSubject, key: PropertyKey, fn: Function) {
//    return (...args: any[]) => {
//       __DEV__traceMethodCall(type, subject, key)
//       return fn(...args)
//    }
// }
// export function traceableFunctionWrap(fn: TraceableSubject & Function) {
//    return (...args: any[]) => {
//       __DEV__traceFunctionCall(fn)
//       return fn(...args)
//    }
// }






// function traceTriggers(subject: AnyObject, key?: PropertyKey) {
//    if (!isTraceable(subject)) {
//       console.warn('NonError Trace: subject of traceTriggers() is not traceable', getPublicTrace())
//       return;
//    }
//    if (key) {
//       const value = subject[key];
//       if (isFunction(value) && !isIon(value))
//          throw new Error('invalid subject. To trace a function call use traceCall()')
//       traceMemberTriggers(subject, key)
//    }
//    else if (isAtomicIon(subject)) traceIonTriggers(subject)
//    else if (isDerivationFunction(subject) || isDerivedIon(subject)) traceDerivationTriggers(subject)
//    else throw new Error('invalid subject. To trace a function call use traceCall()')
// }

// function traceCalls(subject: AnyObject, key?: PropertyKey) {
//    if (!isTraceable(subject)) {
//       console.warn('NonError Trace: subject of traceTriggers() is not traceable', getPublicTrace())
//       return;
//    }
//    if (key) {
//       const value = subject[key];
//       if (!isTrueFunction(value))
//          throw new Error('invalid subject. To trace a property use traceTriggers()')
//       traceMemberTriggers(subject, key)
//    }
//    else if (isTrueFunction(subject)) {
//       __DEV__traceFunctions.add(subject)
//    }
//    else throw new Error('invalid subject. To trace a property use traceTriggers()')
// }

// function isTrueFunction(value: any): value is Function {
//    return isFunction(value) && !isIon(value)
// }

// function traceIonTriggers(subject: AtomicIon) {
//    asTraceable(subject).traceTriggers!.add('state');
// }

// function traceDerivationTriggers(subject: () => any) {
//    //TODO: see watch/debug.ts
// }

export type TraceableQuark = {
   asTraceable: Traceable
} & Quark

// function isTraceable(subject: AnyObject): subject is TraceableSubject {
//    return isDerivationFunction(subject) || hasQuark(subject);
// }

// function traceMemberTriggers(subject: TraceableSubject, key: PropertyKey) {
//    asTraceable(subject).traceTriggers!.add(key);
// }





// export function traceable<T extends AnyObject>(subject: T): T & TraceableSubject {
//    if (isTraceable(subject)) return subject;
//    if (isFunction(subject)) {
//       return createTraceableFunction(subject)
//    }
//    if (isObject(subject))
//       return createTraceableObject(subject)
//    throw new Error('INVALID INPUT. Only objects or functions can be made traceable')
// }

// function createTraceableObject(target: Object) {
//    const meta = {
//       asTraceable: new Traceable()
//    }
//    const wrappedMethods: AnyObject = {}

//    let labelName: string | undefined;

//    function __DEV__label(label: string) {
//       labelName = label;
//    }

//    const proxySwitchMap = new Map([
//       [QUARK as any, () =>
//          meta as any
//       ],
//       ['labelName', () =>
//          labelName
//       ],
//       ['__DEV__label', () =>
//          __DEV__label
//       ],
//    ])

//    const proxy = new Proxy(target, {
//       get(target, key, receiver) {
//          const getValue = proxySwitchMap.get(key)
//          if (getValue) return getValue();
//          const value = Reflect.get(target, key, receiver)
//          if (isFunction(value) && !isIon(value)) {
//             return wrappedMethods[key] ?? (wrappedMethods[key] = traceableMethodWrap('IonizedModel', proxy, key, value))
//          }
//       },
//       set(target, key, newValue, receiver) {
//          // __DEV__traceMethodCall('IonizedModel', proxy, key)
//          return Reflect.set(target, key, newValue, receiver)
//       }
//    })
//    return proxy;
// }

// const __DEV__traceFunctions = new Set()
// const __DEV__traceAsyncPathsFunctions = new Set()

// function createTraceableFunction(fn: Function & TraceableSubject) {
//    const traceable = new Traceable()
//    function traceableFn(...args: any[]) {
//       if (__DEV__traceFunctions.has(traceableFn))
//          __DEV__trace('TraceableFunction', fn.labelName, traceable.origin!)
//       if (__DEV__traceAsyncPathsFunctions.has(traceableFn))
//          traceAsyncPath(fn.labelName)
//       return fn(...args)
//    }
//    //@ts-expect-error
//    traceableFn[QUARK] = {
//       asTraceable: traceable
//    }
//    traceableFn.__DEV__label = __DEV__label
//    return traceableFn;
// }

// extended property and methods
// wrapped methods (from target)
// target properties (...and methods)





// debug.traceTriggers(frog, 'name') // state [[ set ]]
// debug.traceAsyncPath(frog, 'eat') // trace method call or state [[ set ]]
// debug.traceCalls(frog, 'eat') 
// debug.traceTrackers(frog, 'name') 

// // trace trackable op or state [[ get ]] [[ has ]] [[ iterator ]] etc.
// // Will not work for stand alone functions or non-ionized objects

// // How about ions?? must be true ions. Will not work with derivations.
// debug.traceTriggers($count)
// debug.traceAsyncPath($count) // [[ set ]]
// debug.traceTrackers($count)

// // Derivations
// debug.traceTriggers($doubleCount) // logs when any of its particles are triggered
// debug.traceTrackers($count) // logs particles




// // to trace non-ionized objects or functions or derivations
// const frog = debug.traceable(new Frog())
// // this will not trace any activity of 
// // an original object/function passed into the component,
// // but it will trace any activity that happens in any component
// // the traceable object is passed to

// ___DEV__debug.traceAtoms($doubleCount) // eager
// // atom count
// // atom origin trace
// // atom values

// watch($frog, () => {

// }, {
//    traceTriggers: true,
//    __DEV__logAtoms: true, // eager
// })

// // called within an effect
// debug.asyncTrace()
// debug.triggerTrace()