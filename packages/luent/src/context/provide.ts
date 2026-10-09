import { ContextNode, getClosestContext } from "./context-stack";
import { NodeContext, RootContext, toContextEntries } from "./Context";
import { ContextEntryKey, isMuKey, toContextKey } from "./ContextKey";
import { Ion, toIon } from "@luently/quarky";
import { isFunction } from "@luently/utils";

// TODO: trace provider
// fromContext.trace('dog')(DOG)

export function fromContext<K extends ContextEntryKey | string>(key: K, required?: '!'): ContextValue<K> {
  const value = _fromContext(key, required ? false : key.optional)
  return value
}

export function $fromContext<K extends ContextEntryKey | string>(key: K, required?: '!'): ContextValue<K> {
  const optional = required ? false : key.optional
  const value = _fromContext(key, optional)
  if (optional && value === undefined) return undefined;
  return toIon(value)
}

export function _fromContext<K extends ContextEntryKey | string, OPT>(key: K, optional?: OPT): OPT extends string ? ContextValue<K> | undefined : ContextValue<K> {
  const context = getClosestContext()
  // const optional = isFunction(key) ? key.optional : false
  if (!context) {
    if (!optional) throw new Error(`No context provided`)
    else return getDefaultValue(key);
  }
  if (typeof key !== 'string' && !isFunction(key)) throw new Error('[INVALID INPUT] Invalid context key')
  const contextKey = toContextKey(key as ContextEntryKey | string)
  // climb context tree
  let parent: ContextNode | undefined = context;
  while (parent !== undefined) {
    const entries = parent.entries
    if (entries?.has(contextKey)) {
      return entries?.get(contextKey);
    }
    parent = parent.parent;
  }
  if (!optional) throw RequiredInputNotProvidedError(key)
  return getDefaultValue(key) as ContextValue<K>
}


export function createRootContext() {
  const rootContext = {
    entries: undefined,
    parent: undefined,
    root: undefined as unknown as RootContext,
    ground: undefined,
  }
  rootContext.root = rootContext
  return rootContext;
}

type ContextValue<K> = K extends (arg: infer T) => any ? T : unknown

function warnAlreadyProvided() {
  // TODO: provide dev name in context key using compiler
  console.warn(`[LUENT] Context already provided`)
}

// TODO: validate value
export function provideRoot<K extends ContextEntryKey>(key: K, value: ContextValue<K>) {
  let context = getClosestContext();
  if (!context)
    throw new Error("No context found :(")
  const rootContext = context.root;
  const appEntries = rootContext.entries || (rootContext.entries = new Map());
  const contextKey = toContextKey(key)
  if (appEntries.has(contextKey)) {
    if (__DEV__) {
      warnAlreadyProvided()
    }
    return value; // TODO: Maybe allow overrides??
  }
  appEntries.set(contextKey, value);
  return value;
}

export function fromRoot<K extends ContextEntryKey | string, OPT>(key: K, optional?: OPT & '?'): OPT extends string ? ContextValue<K> | undefined : ContextValue<K> {
  const context = getClosestContext();
  // const optional = isFunction(key) ? key.optional : false
  const value = _fromRoot(key, optional, context)
  return value as OPT extends string ? ContextValue<K> | undefined : ContextValue<K>
}



export function $fromRoot<K extends ContextEntryKey | string, OPT>(key: K, optional?: OPT & '?'): OPT extends string ? ContextValue<K> | undefined : ContextValue<K> {
  const context = getClosestContext();
  // const optional = isFunction(key) ? key.optional : false
  const value = _fromRoot(key, optional, context)
  if (optional && value === undefined) return undefined;
  return toIon(value) as OPT extends string ? ContextValue<K> | undefined : ContextValue<K>
}

export function _fromRoot<K extends ContextEntryKey | string>(key: K, optional: any | undefined, context: ContextNode | undefined): any {
  if (!context) {
    if (!optional) throw new Error(`No context provided`)
    else return getDefaultValue(key);
  }
  const rootContext = context?.root;
  if (!rootContext) {
    if (!optional) throw new Error(`No context provided`)
    else return getDefaultValue(key);
  }
  const contextKey = toContextKey(key)
  const value = rootContext.entries?.get(contextKey)
  if (value === undefined) return _fromGround(key, optional, rootContext) as ContextValue<K>;
  return value
}





export function createGroundContext(entries?: [ContextEntryKey | string, unknown][]) {
  const context = { entries: new Map(entries), app: undefined, ground: undefined } as unknown as RootContext
  context.ground = context;
  return context
}

export function provideGround<K extends ContextEntryKey | string>(key: K, value: ContextValue<K>) {
  let context = getClosestContext();
  if (!context)
    throw new Error('')
  const groundContext = context.ground
  if (!groundContext)
    throw new Error('No ground context found. Call createGroundContext() and pass into mountIsland() via config')
  const globalEntries = groundContext.entries!
  const contextKey = toContextKey(key)
  if (globalEntries.has(contextKey)) {
    if (__DEV__) {
      warnAlreadyProvided()
    }
    return value; // TODO: Maybe allow overrides??
  }
  globalEntries.set(contextKey, value);
  return value;
}


export function fromGround<K extends ContextEntryKey | string, OPT>(key: K, optional?: OPT & "?"): OPT extends string ? ContextValue<K> | undefined : ContextValue<K> {
  const value = _fromGround(key, optional, getClosestContext())
  return value as OPT extends string ? ContextValue<K> | undefined : ContextValue<K>
}

export function $fromGround<K extends ContextEntryKey | string, OPT>(key: K, optional?: OPT & '?'): OPT extends string ? ContextValue<K> | undefined : ContextValue<K> {
  const value = _fromGround(key, optional, getClosestContext())
  if (optional && value === undefined) return undefined;
  return toIon(value)
}

export function _fromGround<K extends ContextEntryKey | string>(key: K, optional: any, context: NodeContext | RootContext | undefined): any {
  if (!context) {
    if (!optional) throw new Error(`No context provided`)
    else return getDefaultValue(key);
  }
  const globalEntries = context?.ground?.entries
  const contextKey = toContextKey(key)
  const value = globalEntries?.get(contextKey)
  if (value === undefined) {
    if (!optional) throw RequiredInputNotProvidedError(key)
    return getDefaultValue(key)
  }
  return value
}



function getDefaultValue(key: string | ContextEntryKey) {
  return typeof key === 'string' ? undefined : key.defaultValue?.()
}

const RequiredInputNotProvidedError = (key: string | ContextEntryKey) => {
  return new Error(`Required input ${typeof key === 'string' ? key : key.name} not provided in context`)
}

