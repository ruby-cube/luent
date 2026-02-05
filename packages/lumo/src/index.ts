import { wrapWithCommons } from './context/Context'

export * from './node/NodeRef' 
export * from './node/NodeSetup' 
export * from './component/Component' 
export * from '../../quarky/src/async/AsyncIon' 
export * from './boundaries/Portal' 
export * from './boundaries/Await' 
export * from './component/Input' 
export * from './component/Style' 
export * from './createRoot' 
export * from './iteratives/For' 
export * from './node/makeJSXNode' 
export * from './element/makeElement' 
export * from './conditional/If' 
export * from './conditional/Polymorph' 
export * from './context/provide' 
export * from './context/ContextKey'
export * from './context/Context' 
export * from './events/target' 
export * from './events/listen' 
export * from './events/Abortable' 
export * from './boundaries/Try'
export * from './transition/transitions' 
export * from './transition/TransitionNode' 
export * from './flask/flask-hooks' 
export * from './flask/ViewFlask' 
export * from './specialty/Stream' 
export * from './specialty/Finitron' 
export * from './measureLayout'
export * from '../../quarky/src/reactivity/RenderCycle'

//@ts-expect-error
window._$$wrapWithCommons = wrapWithCommons;



/**
 *  App developers can extend CommonsKeyMap interface like so:
 *  
 *  export const Frog = Symbol('frog')
 * 
 *  const frogType = ContextKey(FROG, v<string>)
 *  
 *  declare module '@rue/lumo' {
 *     interface CommonsKeyMap {
 *        [_dog_]: typeof frogType
 *     }
 *  }
 * 
 */
export interface CommonsKeyMap { }