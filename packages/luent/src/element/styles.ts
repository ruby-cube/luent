import { AnyObject, Booleanny } from "@luent/types";
import { IonOr } from "../component/bindings-types";
import { Flask, getFlask } from "@luent/flask";
import { Ion, isGetter, awaitRender, RUN_EAGERLY, trackForRender, queueInternalRender } from "@luent/quarky";
import { camelToKebabCase, isFunction, isObject, isString } from "@luent/utils";
import { ContextKey } from "../context/ContextKey";
import { fromRoot } from "../context/provide";

const { isArray } = Array

type MergeMicroclasses = (...classes: (string | Falsey)[]) => string
export const MICROCLASS_MERGE = ContextKey<MergeMicroclasses>('microclassMerge')

export function setUpMicroclasses(node: Element, classes: TagClass[]) {
  const merge = fromRoot(MICROCLASS_MERGE)
  if (!merge) return setUpClasses(node, classes)
  const microclasses = composeMicroclasses(classes, merge)
  if (!microclasses) return;
  const flask = getFlask()
  const classList = node.classList
  if (isGetter(microclasses)) {
    trackForRender(microclasses, ({ previous }/* newState: ReactiveClasses | string | Falsey, oldState: ReactiveClasses | string | Falsey */) => {
      // if (current === previous) return;
      queueInternalRender(() => {
        const current = microclasses()
        if (previous) removePreviousClasses(previous, classList)
        if (current) setUpClassesFromString(current, classList)
      })
    }, flask, RUN_EAGERLY)
  }
  else {
    setUpClassesFromString(microclasses, classList)
  }
}

function composeMicroclasses(classes: TagClass[], merge: MergeMicroclasses) {
  let ionic = false;
  const microclasses: (string | Ion<string | Falsey>)[] = []

  compose(classes)

  function compose(classes: TagClass[]) {
    for (const entry of classes) {
      if (isGetter(entry)) {
        ionic = true;
        microclasses.push(entry)
      }
      else if (!entry) {
        continue;
      }
      else if (isArray(entry)) {
        compose(entry)
      }
      else if (isObject(entry)) {
        for (const [key, value] of Object.entries(entry)) {
          if (isGetter(value)) {
            microclasses.push(() => value() ? key : null)
          }
          else if (value) {
            microclasses.push(key)
          }
        }
      }
      else if (typeof entry === 'string') {
        microclasses.push(entry)
      }
    }
  }

  if (ionic) return () => {
    return merge(...microclasses.map(entry => isFunction(entry) ? entry() : entry))
  }
  return merge(...microclasses as string[])
}


export type ReactiveClasses = {
  [key: string]: IonOr<Booleanny>;
}

export type TagStyle = IonOr<string | Falsey> | IonOr<{ [key: string]: IonOr<string | number | Falsey> }>
export type TagClass = ReactiveClasses | IonOr<string | Falsey> | (IonOr<string | Falsey> | TagClass)[]
type Falsey = undefined | null | false | ''

export function setUpClasses(node: Element, classes: TagClass[]) {
  const flask = getFlask()
  const classList = node.classList
  setUpClassesFromArray(classes, classList, flask)
}

function removePreviousClasses(prevValue: string | AnyObject, classList: DOMTokenList) {
  if (isString(prevValue)) {
    const prevClasses = prevValue && prevValue.split(' ')
    if (prevClasses)
      for (const prevClass of prevClasses) {
        classList.remove(prevClass);
      }
  }
  else if (isArray(prevValue)) {
    for (const value of prevValue) {
      removePreviousClasses(value, classList)
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
  else if (prevValue && __INTERNAL__) {
    console.warn('DEV RESEARCH: Reactive class input has not been handled for', prevValue)
  }
}


function addClasses(value: TagClass, classList: DOMTokenList, flask: Flask) {
  if (!value) {
    return;
  }
  else if (isArray(value)) {
    setUpClassesFromArray(value, classList, flask)
  }
  else if (isString(value)) {
    setUpClassesFromString(value, classList)
  }
  else if (isObject(value)) {
    setUpClassesFromObject(value, classList, flask)
  }
  else {
    if (__INTERNAL__) console.warn('DEV RESEARCH: Reactive class input has not been handled for', value)
  }
}

function setUpClassesFromArray(entries: TagClass[], classList: DOMTokenList, flask: Flask) {
  for (const entry of entries) {
    if (isGetter(entry)) {
      trackForRender(entry, ({ current, previous }/* newState: ReactiveClasses | string | Falsey, oldState: ReactiveClasses | string | Falsey */) => {
        // if (current === previous) return;
        queueInternalRender(() => {
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

function setUpClassesFromObject(entry: ReactiveClasses, classList: DOMTokenList, flask: Flask) {
  for (const key in entry) {
    const value = entry[key]
    if (isGetter(value)) {
      trackForRender(value, ({ current, previous }) => {
        // if (current === previous) return
        queueInternalRender(() => {
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



export function setUpConditionalDisplay(node: { style: CSSStyleDeclaration }, $show: Ion<Booleanny>) {
  let display = node.style.display

  trackForRender($show, ({ flask, current: shouldShow, previous, eagerRun }) => {
    if (!eagerRun && shouldShow === previous) return;
    if (shouldShow) {
      queueInternalRender(() => {
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
      queueInternalRender(() => {
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
      trackForRender(entry, ({ current, previous }) => {
        // if (current === previous) return;
        queueInternalRender(() => {
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
  if (isObject(entry)) {
    for (const key in entry) {
      const value = entry[key] as IonOr<string | number | Falsey>;
      if (isGetter(value)) {
        trackForRender(value, () => {
          queueInternalRender(() => {
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
    const importantMatch = typeof value === 'string' && /\s*!important\s*$/i.test(value)
    const rawValue = typeof value === 'string' ? value.replace(/\s*!important\s*$/i, '') : value
    style.setProperty(key, String(rawValue), importantMatch ? 'important' : '')
  }
  else {
    style.removeProperty(key)
  }
}

function normalizeStyle(expression: string) {
  expression = expression.trim();
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