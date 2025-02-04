import { isFunction, isObject } from "@rue/utils";
import { __devCheckIfTracked, getWithoutTracking } from "./derivations/DependencyTracker";
import { isIon } from "./ion/Ion";
import { __DEV__getTrace, getPublicTrace, traceAsyncPath } from "../../flask/debug";
import { AnyObject } from "@rue/types";
import { META } from "./ReactiveEntity";
import { AtomicIon, isAtomicIon } from "./ion/AtomicIon";
import { isDerivedIon, isNamedDerivation } from "./derivations/DerivedIon";


let _isSignal = false;

export function hasReactivity_DEV(maybeHasSignal: any): maybeHasSignal is Function {
   if (!(isFunction(maybeHasSignal)) && !isIon(maybeHasSignal)) return false;
   console.warn('Using `hasReactivity_DEV` on a function with unknown side effects can cause bugs. To avoid unknown side-effects, use `isIon` to check for reactivity and pass any impromptu getters into the $ function. `hasReactivity_DEV` is only to check if you have a wrapped signal')
   _isSignal = false;
   getWithoutTracking(maybeHasSignal)
   if (_isSignal) {
      _isSignal = false;
      return true;
   }
   return false;
}

export function emitSignal() {
   _isSignal = true;
}


//+++++++


export function __DEV__trace(type: string, label: string, origin: string, key?: PropertyKey) {
   const trace = __DEV__getTrace()

   console.log('')
   console.log(`# ${label}`)
   console.log(`NonError Origin: ${type}\n    ` + (origin ? origin : ''))
   console.log(`NonError Call Trace: ${key ? type + '.' + String(key) : ''}\n    ` + (trace ? trace : ''))
   console.log('')
}

// type Traceable = AnyObject | Ion;

export const __DEV__debug = {
   // traceTrackers,
   traceTriggers,
   traceCalls,
   // traceAsyncPaths,

   // logAtoms,
   // traceable,

   traceAsyncPath,
   // traceTrigger // TODO: This should be on effect  effect.__DEV__traceTrigger()
}



function asTraceable(subject: AnyObject): Traceable {
   const traceable = subject[META].__DEV__asTraceable
   if (!traceable) throw new Error('Subject is not traceable')
   return traceable;
}

export function __DEV__traceMethodCall(type: string, subject: AnyObject, key: PropertyKey) {
   const traceable = asTraceable(subject);
   if (traceable.__DEV__traceTriggers.has(key)) __DEV__trace(type, subject.__DEV__labelName, traceable.__DEV__origin!, key)
}

function __DEV__traceFunctionCall(subject: Function & Labellable) {
   const traceable = asTraceable(subject);
   __DEV__trace('Function', subject.__DEV__labelName, traceable.__DEV__origin!)
}

export function traceableMethodWrap(type: string, subject: AnyObject, key: PropertyKey, fn: Function) {
   return (...args: any[]) => {
      __DEV__traceMethodCall(type, subject, key)
      return fn(...args)
   }
}
export function traceableFunctionWrap(fn: Function) {
   return (...args: any[]) => {
      __DEV__traceFunctionCall(fn)
      return fn(...args)
   }
}

function getOriginTrace() {
   const trace = getPublicTrace()
   if (!trace) return '';
   return 'at ' + trace?.split('at')[1].trim()
   // console.log(trace)
   // return trace
}

export class Traceable {

   constructor() {
      this.__DEV__origin = getOriginTrace()
      // this.__DEV__labels = new Set()
   }

   __DEV__traceTriggers: Set<PropertyKey> = new Set()
   __DEV__traceAsyncPath: Set<PropertyKey> = new Set()
   __DEV__traceTrackers: Set<PropertyKey> = new Set()

   __DEV__origin?: string
   // __DEV__labels: Set<string>
}


function traceTriggers(subject: AnyObject, key?: PropertyKey) {
   if (!isTraceable(subject)) {
      console.warn('NonError Trace: subject of traceTriggers() is not traceable', getPublicTrace())
      return;
   }
   if (key) {
      const value = subject[key];
      if (isFunction(value) && !isIon(value))
         throw new Error('invalid subject. To trace a function call use traceCall()')
      traceMemberTriggers(subject, key)
   }
   else if (isAtomicIon(subject)) traceIonTriggers(subject)
   else if (isNamedDerivation(subject) || isDerivedIon(subject)) traceDerivationTriggers(subject)
   else throw new Error('invalid subject. To trace a function call use traceCall()')
}

function traceCalls(subject: AnyObject, key?: PropertyKey) {
   if (!isTraceable(subject)) {
      console.warn('NonError Trace: subject of traceTriggers() is not traceable', getPublicTrace())
      return;
   }
   if (key) {
      const value = subject[key];
      if (!isTrueFunction(value))
         throw new Error('invalid subject. To trace a property use traceTriggers()')
      traceMemberTriggers(subject, key)
   }
   else if (isTrueFunction(subject)) {
      __DEV__traceFunctions.add(subject)
   }
   else throw new Error('invalid subject. To trace a property use traceTriggers()')
}

function isTrueFunction(value: any): value is Function {
   return isFunction(value) && !isIon(value)
}

function traceIonTriggers(subject: AtomicIon) {
   asTraceable(subject).__DEV__traceTriggers!.add('state');
}

function traceDerivationTriggers(subject: () => any) {
   //TODO: see watch/debug.ts
}

type TraceableMeta = {
   __DEV__asTraceable: Traceable
}

function isTraceable(subject: AnyObject): subject is AnyObject & { [META]: TraceableMeta } {
   return isNamedDerivation(subject) || META in subject;
}

function traceMemberTriggers(subject: AnyObject, key: PropertyKey) {
   asTraceable(subject).__DEV__traceTriggers!.add(key);
}





export function traceable<T>(subject: T): T & Labellable {
   if (isTraceable(subject)) return subject;
   if (isFunction(subject)) {
      return createTraceableFunction(subject)
   }
   if (isObject(subject))
      return createTraceableObject(subject)
   throw new Error('INVALID INPUT. Only objects or functions can be made traceable')
}

function createTraceableObject(target: Object) {
   const meta = {
      __DEV__asTraceable: new Traceable()
   }
   const wrappedMethods: AnyObject = {}

   let __DEV__labelName: string | undefined;

   function __DEV__label(label: string) {
      __DEV__labelName = label;
   }

   const proxySwitchMap = new Map([
      [META as any, () =>
         meta as any
      ],
      ['__DEV__labelName', () =>
         __DEV__labelName
      ],
      ['__DEV__label', () =>
         __DEV__label
      ],
   ])

   const proxy = new Proxy(target, {
      get(target, key, receiver) {
         const getValue = proxySwitchMap.get(key)
         if (getValue) return getValue();
         const value = Reflect.get(target, key, receiver)
         if (isFunction(value) && !isIon(value)) {
            return wrappedMethods[key] ?? (wrappedMethods[key] = traceableMethodWrap('IonizedModel', proxy, key, value))
         }
      },
      set(target, key, newValue, receiver) {
         __DEV__traceMethodCall('IonizedModel', proxy, key)
         return Reflect.set(target, key, newValue, receiver)
      }
   })
   return proxy;
}

const __DEV__traceFunctions = new Set()
const __DEV__traceAsyncPathsFunctions = new Set()

function createTraceableFunction(fn: Function & Labellable) {
   const traceable = new Traceable()
   function traceableFn(...args: any[]) {
      if (__DEV__traceFunctions.has(traceableFn))
         __DEV__trace('TraceableFunction', fn.__DEV__labelName, traceable.__DEV__origin!)
      if (__DEV__traceAsyncPathsFunctions.has(traceableFn))
         traceAsyncPath(fn.__DEV__labelName)
      return fn(...args)
   }
   //@ts-expect-error
   traceableFn[META] = {
      __DEV__asTraceable: traceable
   }
   traceableFn.__DEV__label = __DEV__label
   return traceableFn;
}

// extended property and methods
// wrapped methods (from target)
// target properties (...and methods)


export interface Labellable {
   __DEV__labelName: string
   __DEV__label: (label: string) => void
}

export function __DEV__label(this: Labellable, label: string) {
   this.__DEV__labelName = label;
}


// __DEV__debug.labelTraces(frog, 'frog')
// __DEV__debug.traceTriggers(frog, 'name') // state [[ set ]]
// __DEV__debug.traceAsyncPath(frog, 'eat') // trace method call or state [[ set ]]
// __DEV__debug.traceCalls(frog, 'eat') 
// __DEV__debug.traceTrackers(frog, 'name') 

// // trace trackable op or state [[ get ]] [[ has ]] [[ iterator ]] etc.
// // Will not work for stand alone functions or non-ionized objects

// // How about ions?? must be true ions. Will not work with derivations.
// __DEV__debug.traceTriggers($count)
// __DEV__debug.traceAsyncPath($count) // [[ set ]]
// __DEV__debug.traceTrackers($count)

// // Derivations
// __DEV__debug.traceTriggers($doubleCount) // logs when any of its atoms are triggered
// __DEV__debug.traceTrackers($count) // logs atoms




// // to trace non-ionized objects or functions or derivations
// const frog = __DEV__debug.traceable(new Frog())
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
//    __DEV__traceTriggers: true,
//    __DEV__logAtoms: true, // eager
// })

// // called within an effect
// __DEV__debug.asyncTrace()
// __DEV__debug.triggerTrace()