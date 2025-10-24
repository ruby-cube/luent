import { fromGlobal, provideGlobal } from "./provide"

export function provideGlobalFunction(fn: Function, implementation: Function){
   provideGlobal(fn, implementation)
}

export function useGlobalFunction(fn: Function){
   const _fn = function(){
      const func = fromGlobal(fn) ?? fn
      return func()
   }

   _fn.name = fn.name

   return _fn;
}