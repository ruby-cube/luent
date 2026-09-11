import type { JSX } from './jsx-runtime'

export {
  ion,
  ionic,
  watch as track,
  ionize,

  ionicTick,
  ionicLayout,
  ionicPrelude,
  ionicRender,
  runIonicTask as ionicCall,

  Finitron,

  PRELUDE,
  SYNC,
  RENDER,
  TICK,
  LAYOUT,

  // Clean this up
  // Stream,
  // $suspense,
  // Animation,
  // AsyncIon,
  // EACH,
  // Interval,
  // LaxUpdate,
  // SuspenseIon,
  // as,
  // getActiveUpdate,
  // getAwaiting,
  // isPending,
  // o,
  // ooo,
  // swiftUpdate,

  toRaw,
  toIon,
  toValue,

  queueTask,

  queueLayout,
  queuePrelude,
  queueRender,
  awaitTick
} from '@luent/quarky'
export { isMutableIon } from './element/mutables'
export type { Nested, Ion, Ionic, MutableIon } from '@luent/quarky'

export { NodeRef, asJSX } from './node/NodeRef'
// export * from './node/NodeSetup'
// export * from './component/Component'
// export * from './boundaries/Portal'
// export * from './boundaries/Await'
// export * from './component/bindings-types'
export { awaiting } from './async/awaiting'
// export * from './component/Style'
// export * from './component/bindings'
// export * from './client/mountIsland'
// export * from './iteratives/For'
// export * from './iteratives/Thru'
// export * from './node/makeJSXNode'
// export * from './flask/template-hooks'
// export * from './element/setUpElement'
// export * from './conditional/If'
// export * from './conditional/MatchCase'
// export * from './context/provide'
// export * from './context/ContextKey'
// export * from './context/Context'
// export * from './events/target'
// export * from './events/listen'
// export * from './events/Abortable'

// export * from './utils/destructure'
// export * from './flask/flask-hooks'
// export * from './flask/ViewFlask'
// export * from './measureLayout'
// export * from './server/writeHTML'
// export * from './server/portals'
export { MICROCLASS_MERGE } from './element/styles'
export { ShadowRoot } from './component/shadow'
// export type { TransitionBindings } from './transitions/transitions'
// export * from './conditional/As'

export { $from } from './utils/destructure'
export { mountIsland } from './client/mountIsland'
export { writeIsland } from './server/writeHTML'
// export { withIslands } from './server/writeIslands'
export { css, Style } from './component/Style'
export { setUpElement } from './element/setUpElement'
export {
  $fromContext,
  fromContext,
  fromRoot,
  fromGround,
  provideRoot,
  provideGround
} from './context/provide'
export { Context } from './context/Context'
export {
  ContextKey,
  mergeKeys
} from './context/ContextKey'
export { listen } from './events/listen'
export { Await, Meanwhile, Twiddle } from './boundaries/Await'
export { Portal } from './boundaries/Portal'
export { For } from './iteratives/For'
export { Thru } from './iteratives/Thru'
export { If, Else, ElseIf } from './conditional/If'
export { Match, Case, Default } from './conditional/MatchCase'
export { As } from './conditional/As'
export { Try, Catch } from './boundaries/Try'
export {
  beforeMount,
  atMount,
  atAttach,
  afterMount,
  beforeUnmount,
  beforeDetach,
  atUnmount,
  afterUnmount,
  afterAttach,
  afterDemount,
  afterDetach,
  afterRemount,
  atDemount,
  atDetach,
  atRemount,
  beforeAttach,
  beforeDemount,
  beforeRemount
} from './flask/flask-hooks'

export { atEnd } from './flask/Scene'

export type {
  ComponentRef,
} from './node/NodeRef'
export type {
  RawJSXNode,
  TagType,
} from './node/makeJSXNode'
export type { ComponentTag } from './component/Component'
export type { ContextEntryKey } from './context/ContextKey'
export type { FromTag, RenderTag, WithRef } from './component/bindings-types'
export type { TagClass } from './element/styles'
export type { TagName } from './element/setUpElement'
export type { ViewType } from './conditional/If'
export type { Xray } from './component/bindings'
export type { JSX }
export type Event<T = Element> = JSX.Event<T>
export type ClipboardEvent = JSX.ClipboardEvent
export type FocusEvent<T = Element, RelatedTarget = Element> = JSX.FocusEvent<T, RelatedTarget>
export type FormEvent<T = Element> = JSX.FormEvent<T>
export type InvalidEvent<T = Element> = JSX.InvalidEvent<T>
export type StateChangeEvent<T = Element> = JSX.StateChangeEvent<T>
export type KeyboardEvent<T = Element> = JSX.KeyboardEvent<T>
export type MouseEvent = JSX.MouseEvent
export type ModifierKey = JSX.ModifierKey

export { JSXComponent as component, toª as to$, ªªof as $of } from '@luent/nextscript'
export type { ComponentKit } from '@luent/nextscript'






