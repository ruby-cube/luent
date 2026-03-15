import { AnyObject } from "@rue/types"
import { QUARK, quarkOf } from "./abstract/Quark"
import { isIonicProxy } from "./ionic/IonicModel"

// NOTE: This file tightly couples Lumo with Quarky... need to decide whether to keep Quarky decoupled from Lumo

type MayBeMutable<T> = T & { '~mu': true }

type ReadonlyProxy<T> = T

type IonicProxy = AnyObject & { [QUARK]: { pureMethods: Set<string | symbol> } }

export function ReadonlyProxy(target: IonicProxy) {

   function warnNoMutation() {
      console.warn(`Read-only proxy cannot be mutated. To mutate, require a may-be-mutable by prefixing input property with 'mu:', then pass may-be-mutable proxy into mu(), e.g. mu(user).name = newName`)
   }

   return new Proxy(target, {
      get(target, key) {
         if (key === '~readonly') return true;
         const quark = quarkOf(target)
         const value = target[key]
         if (isIonicProxy(value)) {
            return ReadonlyProxy(value)
         }
         if (value instanceof Function && !quark.pureMethods.has(key)) {
            console.warn(`Cannot access ${key.toString()} of read-only proxy. To access, require a may-be-mutable by prefixing input property with 'mu:', then pass may-be-mutable proxy into mu(), e.g. mu(list).push(item) or mark method as pure.`)
            return;
         }
         // TODO: must propogate ReadonlyProxy with .filter(), .map(), iterator, etc.
         return value
      },


      getOwnPropertyDescriptor(target, key) {
         // TODO: Should property descriptors be protected? should they be ionic?
         console.warn('[DEV RESEARCH] Property descriptor access behavior yet undecided. Need better understanding of use cases')
         return Object.getOwnPropertyDescriptor(target, key)
      },

      getPrototypeOf(target) {
         // TODO: Should prototypes be protected? should they be ionic?
         console.warn('[DEV RESEARCH] Prototype access behavior yet undecided')
         return Reflect.getPrototypeOf(target)
      },

      ...createMutationTraps(warnNoMutation)

   })
}



export function MayBeMutableProxy(target: IonicProxy) {

   function warnNoMutation() {
      console.warn(`May-be-mutable proxy cannot be directly mutated. To mutate, pass may-be-mutable proxy into mu(), e.g. mu(user).name = newName`)
   }
   return new Proxy(target, {
      get(target, key) {
         const quark = quarkOf(target)
         const value = target[key]
         if (isIonicProxy(value)) {
            return MayBeMutableProxy(value)
         }
         if (value instanceof Function && !quark.pureMethods.has(key)) {
            console.warn(`Cannot directly access ${key.toString()} of may-be-mutable proxy. To access, pass may-be-mutable proxy into mu(), e.g. mu(list).push(item) or mark method as pure.`)
            return;
         }
         // TODO: must propogate MayBeMutableProxy with .filter(), .map() etc.
         return value;
      },

      getOwnPropertyDescriptor(target, key) {
         // TODO: Should property descriptors be protected? should they be ionic?
         console.warn('[DEV RESEARCH] Property descriptor access behavior yet undecided. Need better understanding of use cases')
         return Object.getOwnPropertyDescriptor(target, key)
      },

      getPrototypeOf(target) {
         // TODO: Should prototypes be protected? should they be ionic?
         console.warn('[DEV RESEARCH] Prototype access behavior yet undecided. Need better understanding of use cases')
         return Reflect.getPrototypeOf(target)
      },

      ...createMutationTraps(warnNoMutation)
   })
}


function createMutationTraps(warnNoMutation: () => void) {
   return {
      set() {
         warnNoMutation()
         return false
      },

      defineProperty() {
         warnNoMutation()
         return false;
      },

      deleteProperty() {
         warnNoMutation()
         return false;
      },

      preventExtensions() {
         warnNoMutation()
         return false;
      }

      // NOTE: setPrototypeOf is already blocked by ionic proxy
   }
}


export function mu<T extends { '~ionicProxy': true }>(proxy: T): T {
   //@ts-expect-error
   if (proxy["~readonly"])
      throw new Error("Mutable objects may only be accessed through may-be-mutable proxies. Request a may-be-mutable by prefixing input property with 'mu:'")
   //@ts-expect-error
   return quarkOf(proxy).ionicProxy // TODO: change model property of modelQuark to ionicProxy
}

export function getIonicProxy(proxy: { [QUARK]: Quark & { ionicProxy: AnyObject } }) {
   return quarkOf(proxy).ionicProxy
}




// TODO: protection in fromContext()
// TODO: Readonly Proxy in input
// TODO: what happens if you pass a plain object with mu: ? Can we protect plain objects this way? ... don't. Proxies everywhere is a pain
// TODO: ions need to be protected
// TODO: what about functions that output a mutable object

