import { AnyObject } from "@rue/types"
import { isIonicProxy } from "../ionic/utils"

// TODO: check environment for global object
window.console = new Proxy(console, {
   get(target, key) {
      if (key === 'log') {
         return function log(...args: any[]) {
            target.log(...wrapAnyProxies(args))
         }
      }
      return target[key as keyof Console]
   }
})

const PROXY = Symbol('proxy')

function wrapAnyProxies(args: any[]) {
   return args.map((arg) => {
      if (isIonicProxy(arg)) {
         return toLoggableProxy(arg)
      }
      return arg;
   })
}

function toLoggableProxy(proxy: AnyObject) {
   return {
      ...proxy, // TODO: unwrap nested proxies as well?
      [PROXY]: proxy
   }
}