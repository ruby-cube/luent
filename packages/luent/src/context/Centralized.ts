import { fromRoot, fromGround, provideRoot, provideGround } from "./provide";

export function defineAppwide<F extends (...args: any[]) => any>(key: string, factory: F): F {
   return defineCentralized(key, factory, fromRoot, provideRoot)
}

export function defineGlobal<F extends (...args: any[]) => any>(key: string, factory: F): F {
   return defineCentralized(key, factory, fromGround, provideGround)
}

function defineCentralized<F extends (...args: any[]) => any>(key: string, factory: F, fromCentral: Function, provideCentral: Function): F {
   return ((...args: any[]) => {
      const existing = fromCentral(key)
      if (existing) return existing;
      const instance = factory(...args)
      provideCentral(key, instance)
      return instance;
   }) as F
}

// TODO: Services are instantiated and removed based on usage
export function defineService() {

}

export function defineGlobalService() {

}