import { RawJSXNode, RenderFunction } from "../node/makeNode";

export function Try(render: RenderFunction | RawJSXNode) {
   return render;
}

export function Catch(render: (err: Error) => RawJSXNode) {
   return render;
}

export function createTryCatch(renderAttempt: RenderFunction, renderError: undefined | ((err: Error) => RawJSXNode)) {
   try {
      return renderAttempt();
   }
   catch (err) {
      if (renderError)
         return renderError(err instanceof Error ? err : new Error(typeof err === 'string' ? err : ''))
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
//          // provide //TODO:
//       }>()
//    ) {

//       return component(
//          createTryCatch(config.try, config.catch)
//       )
//    }
// }