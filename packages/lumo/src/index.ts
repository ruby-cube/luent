import { wrapWithCommons } from './commons/Commons'

export * from './node/x_NodePod' 
export * from './node/NodeRef' 
export * from './node/NodeSetup' 
export * from './component/Component' 
export * from './boundaries/Suspense' 
export * from './boundaries/Portal' 
export * from './component/Input' 
export * from './component/Style' 
export * from './createApp' 
export * from './iteratives/For' 
export * from './node/makeJSXNode' 
export * from './element/makeElement' 
export * from './conditional/If' 
export * from './conditional/Polymorph' 
export * from './conditional/toggledisplay' 
export * from './commons/provide' 
export * from './commons/CommonsKey' 
export * from './commons/Commons' 
export * from './events/target' 
export * from './events/listen' 
export * from './events/Abortable' 
export * from './boundaries/Try' 
export * from './transition/transitions' 
export * from './transition/TransitionNode' 
export * from './flask/flask-hooks' 
export * from './flask/ViewFlask' 
export * from './measureLayout'
export * from './render-cycle'

//@ts-expect-error
window._$$wrapWithCommons = wrapWithCommons;



/**
 *  App developers can extend CommonsKeyMap interface like so:
 *  
 *  export const Frog = Symbol('frog')
 * 
 *  const frogType = CommonsKey(FROG, v<string>)
 *  
 *  declare module '@rue/lumo' {
 *     interface CommonsKeyMap {
 *        [_dog_]: typeof frogType
 *     }
 *  }
 * 
 */
export interface CommonsKeyMap { }