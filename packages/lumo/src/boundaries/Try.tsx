import { RawJSXNode, RenderFunction } from "../node/makeJSXNode";

export function Try(render: RenderFunction | RawJSXNode) {
   return render;
}

export function Catch(renderError: RenderError) {
   return {
      renderError
   }
}

export function createTryCatch(renderAttempt: RenderFunction, errorKit: undefined | {renderError: ((err: Error) => RawJSXNode)}) {
   try {
      return renderAttempt();
   }
   catch (err) {
      if (errorKit)
         return errorKit.renderError(err instanceof Error ? err : new Error(typeof err === 'string' ? err : ''))
      return undefined;
   }
}

//@ts-expect-error
window._$$TrySeries = createTryCatch

// EXAMPLE:
// const $App = Tentative({
//    try: () => (
//       <App data={$data}></App>
//    ),
//    catch: error => (
//       <div>oh no</div>
//    )
// })
export type RenderError = (err: Error) => RawJSXNode

// export function Tentative(config: { try: RenderFunction, catch?: RenderError }) {

//    return function $TryNode(
//       input : FromTag<{
//          // provide // TODO:
//       }>()
//    ) {

//       return component(
//          createTryCatch(config.try, config.catch)
//       )
//    }
// }