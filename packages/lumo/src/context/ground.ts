import { fromGround, provideGround } from "./provide"

export function provideGlobalFunction(fn: Function, implementation: Function){
   provideGround(fn, implementation)
}

export function useGlobalFunction(fn: Function){
   const _fn = function(){
      const func = fromGround(fn) ?? fn
      return func()
   }

   _fn.name = fn.name

   return _fn;
}