import { isObject } from "@rue/utils";
import { hasQuark, quarkOf } from "../abstract/Quark";
import type { ModelQuark, QuarkyIonicProxy } from "./ModelQuark";
import { ToRaw } from "./Ionic";

export function isIonicProxy(value: any): value is QuarkyIonicProxy {
   if (!isObject(value)) return false;
   return hasQuark(value) && quarkOf(value) instanceof ModelQuark;
}


export function toRaw<T>(obj: T): ToRaw<T> {
   if (obj instanceof ModelQuark) {
      return obj.target as ToRaw<T>;
   }
   if (isIonicProxy(obj)) {
      return quarkOf(obj).target as ToRaw<T>;
   }
   return obj as ToRaw<T>; // already raw target
}
