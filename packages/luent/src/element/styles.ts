import { AnyObject, Booleanny } from "@rue/types";
import { MaybeIon } from "../component/x-Input";
import { Flask, getFlask } from "@rue/flask";
import { Ion, isGetter, queueRender, RUN_EAGERLY, watchToRender } from "@rue/quarky";
import { camelToKebabCase, isObject, isString } from "@rue/utils";


type ReactiveClasses = {
   [key: string]: MaybeIon<Booleanny>;
}

export type TagStyle = MaybeIon<string | Falsey> | MaybeIon<{ [key: string]: MaybeIon<string | number | Falsey> }>
export type TagClass = ReactiveClasses | MaybeIon<string | Falsey> | (MaybeIon<string | Falsey> | TagClass)[]
type Falsey = undefined | null | false | ''

export function setUpClasses(node: Element, classes: TagClass[]) {
   const flask = getFlask()
   const classList = node.classList

   for (const entry of classes) {
      if (isGetter(entry)) {
         watchToRender(entry, ({ current, previous }/* newState: ReactiveClasses | string | Falsey, oldState: ReactiveClasses | string | Falsey */) => {
            // if (current === previous) return;
            queueRender(() => {
               if (previous) removePreviousClasses(previous, classList)
               if (entry()) addClasses(entry(), classList, flask)
            })
         }, flask, RUN_EAGERLY)
      }
      else if (entry) {
         addClasses(entry, classList, flask)
      }
   }
}

function removePreviousClasses(prevValue: string | AnyObject, classList: DOMTokenList) {
   if (isString(prevValue)) {
      const prevClasses = prevValue && prevValue.split(' ')
      if (prevClasses)
         for (const prevClass of prevClasses) {
            classList.remove(prevClass);
         }
   }
   else if (isObject(prevValue)) {
      for (const key in prevValue) {
         const value = prevValue[key]
         if (value) {
            classList.remove(key)
         }
      }
   }
   else if (__DEV__) {
      console.warn('DEV RESEARCH: Reactive class input has not been handled for', prevValue)
   }
}


function addClasses(value: string | Falsey | { [key: string]: Booleanny }, classList: DOMTokenList, flask: Flask) {
   if (!value) {
      return;
   }
   else if (isString(value)) {
      setUpClassesFromString(value, classList)
   }
   else if (isObject(value)) {
      setUpClassesFromObject(value, classList, flask)
   }
   else {
      if (__DEV__) console.warn('DEV RESEARCH: Reactive class input has not been handled for', value)
   }
}

// let __debug__=false;
// // export function initDebugger(){
// // __debug__ = true
// // }

function setUpClassesFromObject(entry: ReactiveClasses, classList: DOMTokenList, flask: Flask) {
   for (const key in entry) {
      const value = entry[key]
      if (isGetter(value)) {
         watchToRender(value, ({ current, previous }) => {
            // if (current === previous) return
            queueRender(() => {
               if (value()) classList.add(key)
               else if (previous) classList.remove(key)
            })
         }, flask, RUN_EAGERLY)
      }
      else if (value) {
         classList.add(key)
      }
      else {
         classList.remove(key)
      }
   }
}

function setUpClassesFromString(classString: string, classList: DOMTokenList) {
   const classes = classString.split(' ')
   for (const activeClass of classes) {
      if (activeClass) classList.add(activeClass)
   }
}




// function removePreviousClasses(prevValue: string | AnyObject, classList: DOMTokenList) {
//    if (isString(prevValue)) {
//       const prevClasses = prevValue && prevValue.split(' ')
//       if (prevClasses)
//          for (const prevClass of prevClasses) {
//             classList.remove(prevClass);
//          }
//    }
//    else if (isObject(prevValue)) {
//       for (const key in prevValue) {
//          const value = prevValue[key]
//          if (value) {
//             classList.remove(key)
//          }
//       }
//    }
//    else if (__DEV__) {
//       console.warn('DEV RESEARCH: Reactive class input has not been handled for', prevValue)
//    }
// }


// function addClasses(value: string | Falsey | { [key: string]: Booleanny }, classList: DOMTokenList, flask: Flask) {
//    if (!value) {
//       return;
//    }
//    else if (isString(value)) {
//       setUpClassesFromString(value, classList)
//    }
//    // else if (isObject(value)) {
//    //    setUpClassesFromObject(value, classList, flask)
//    // }
//    else {
//       if (__DEV__) console.warn('DEV RESEARCH: Reactive class input has not been handled for', value)
//    }
// }

// let __debug__=false;
// // export function initDebugger(){
// // __debug__ = true
// // }

// function setUpClassesFromObject(entry: DynamicClassesConfig, classList: DOMTokenList, flask: Flask) {
//    for (const key in entry) {
//       const value = entry[key]
//       if (isGetter(value)) {
//          watchToRender(value, ({ current, previous }) => {
//             // if (current === previous) return
//             queueInternalRender(() => {
//                if (value()) classList.add(key)
//                else if (previous) classList.remove(key)
//             }, flask)
//          }, flask, RUN_EAGERLY)
//       }
//       else if (value) {
//          classList.add(key)
//       }
//       else {
//          classList.remove(key)
//       }
//    }
// }


// function warnDuplicateClasses(classesA: string, classesB: string) {

//    const aClasses = new Set(classesA.split(' '))
//    const bClasses = classesB.split(' ')
//    for (const className of bClasses) {
//       if (aClasses.has(className)) {
//          console.warn(`Duplicate class name: ${className}`);
//          console.trace();
//       }
//    }
// }
export function setUpConditionalDisplay(node: { style: CSSStyleDeclaration }, $show: Ion<Booleanny>) {
   let display = node.style.display

   watchToRender($show, ({ flask, current: shouldShow, previous, eagerRun }) => {
      if (!eagerRun && shouldShow === previous) return;
      if (shouldShow) {
         queueRender(() => {
            if (!display) {
               node.style.removeProperty('display');
            }
            else {
               node.style.display = display
            }
         })
      }
      else {
         display = node.style.display
         queueRender(() => {
            node.style.display = 'none'
         })
      }
   }, getFlask(), RUN_EAGERLY)
}


export function setUpStyles(node: Element, styles: TagStyle[]) {
   const flask = getFlask()
   const style = (<HTMLElement | SVGAElement | MathMLElement>node).style;
   for (const entry of styles) {
      if (isGetter(entry)) {
         watchToRender(entry, ({ current, previous }) => {
            // if (current === previous) return;
            queueRender(() => {
               setUpStyleEntry(style, entry(), flask);
            })
         }, flask, RUN_EAGERLY)
      }
      else {
         setUpStyleEntry(style, entry, flask)
      }
   }
}

function setUpStyleEntry(style: CSSStyleDeclaration, entry: string | AnyObject | Falsey, flask: Flask) {
   if (entry instanceof Object) {
      for (const key in entry) {
         const value = entry[key] as MaybeIon<string | number | Falsey>;
         if (isGetter(value)) {
            watchToRender(value, () => {
               console.log('style entry', key, value)
               queueRender(() => {
                  assignStyleProperty(style, toStylePropertyName(key), value())
               })
            }, flask, RUN_EAGERLY)
         }
         else {
            assignStyleProperty(style, toStylePropertyName(key), value)
         }
      }
   }
   else if (typeof entry === 'string') {
      style.cssText = style.cssText + "; " + normalizeStyle(entry)
   }
}

function toStylePropertyName(key: string) {
   return key.startsWith('$') ? key.slice(1) : key;
}

function assignStyleProperty(style: AnyObject, property: string, value: string | number | Falsey) {
   const key = camelToKebabCase(property)
   if (value != null) {
      const splitValue = typeof value === 'string' ? value.split(' !importan') : undefined; // ['red', 't'] 
      const _value = String(splitValue ? splitValue[0] : value);
      if (splitValue === undefined || splitValue.length === 1) {
         // if (key === 'transform') 
         style.setProperty(key, _value)
      }
      else {
         style.setProperty(key, _value, { priority: 'important' })
      }
   }
   else {
      style.removeProperty(key)
   }
}


function normalizeStyle(expression: string) {
   expression.trim();
   if (expression.endsWith(';')) return expression.substring(0, expression.length - 1);
   return expression;
}

function warnOverlappingStyles(stylesA: string, stylesB: string) {
   const aStyles = new Set(stylesA.split('; '))
   const bStyles = stylesB.split('; ')
   for (const styling of bStyles) {
      if (aStyles.has(styling)) {
         console.warn(`Duplicate styling: ${styling}`);
         console.trace();
      }
   }
}