import { AnyObject } from "@rue/types";

export function isFunction(value: any): value is (...args: any[])=>any {
   // return value instanceof Function
   return typeof value === 'function';
}
export function isObject(value: any): value is AnyObject {
   return typeof value === 'object' && value !== null;
}
export function isString(value: any): value is string {
   return typeof value === 'string';
}
