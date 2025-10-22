import { AnyObject } from "@rue/types"
import { Quark, QUARK, quarkOf } from "../../../../packages/quarky/src/abstract/Quark"
import { isObject } from "@rue/utils"
import { isIonicProxy } from "@rue/quarky"
import { ModelQuark } from "../../../../packages/quarky/src/ionic/ModelQuark"

type MayBeMutable<T> = T & { '~mu': true }

type ReadonlyProxy<T> = T

type IonicProxy = AnyObject & { [QUARK]: Quark & { pureMethods: Set<string | symbol> } }

function ReadonlyProxy(target: IonicProxy) {
   return new Proxy(target, {
      // TODO: make sure everything else works, e.g prototype, key in, 
      // TODO: block deleteProperty, setPrototype etc
      get(target, key) {
         const quark = quarkOf(target)
         const value = target[key]
         if (isIonicProxy(value)) {
            return ReadonlyProxy(value)  // TODO: must propogate MayBeMutableProxy with .filter(), .map(), iterator, etc.
         }
         if (value instanceof Function && !quark.pureMethods.has(key)) {
            console.warn(`Cannot access ${key.toString()} of read-only proxy. To access, require a may-be-mutable by prefixing input property with 'mu:', then pass may-be-mutable proxy into mu(), e.g. mu(list).push(item) or mark method as pure.`)
            return;
         }
         return value
      },
      set() {
         console.warn(`Read-only proxy cannot be mutated. To mutate, require a may-be-mutable by prefixing input property with 'mu:', then pass may-be-mutable proxy into mu(), e.g. mu(user).name = newName`)
         return false
      }
   })
}


function MayBeMutableProxy(target: IonicProxy) {
   return new Proxy(target, {
      get(target, key) {
         const quark = quarkOf(target)
         const value = target[key]
         if (isIonicProxy(value)) {
            return MayBeMutableProxy(value) // TODO: must propogate MayBeMutableProxy with .filter(), .map() etc.
         }
         if (value instanceof Function && !quark.pureMethods.has(key)) {
            console.warn(`Cannot directly access ${key.toString()} of may-be-mutable proxy. To access, pass may-be-mutable proxy into mu(), e.g. mu(list).push(item) or mark method as pure.`)
            return;
         }
         return value;
      },
      set() {
         console.warn(`May-be-mutable proxy cannot be directly mutated. To mutate, pass may-be-mutable proxy into mu(), e.g. mu(user).name = newName`)
         return false
      }
   })
}

function mu<T extends { '~ionicProxy': true }>(muProxy: T): T {
   //@ts-expect-error
   return quarkOf(muProxy).ionicProxy // TODO: change model property of modelQuark to ionicProxy
}