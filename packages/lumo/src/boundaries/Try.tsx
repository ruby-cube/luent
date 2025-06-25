import { component } from "../component/Component";
import { fromTag } from "../component/fromTag";
import { RawJSXNode, RenderFunction } from "../node/makeNode";

export function Try(render: RenderFunction | RawJSXNode) {
   console.log('running try')
   return render;
}

export function Catch(render: (err: Error) => RawJSXNode) {
   return render;
}

export function createTryCatch(tryCatch: [RenderFunction, undefined | ((err: Error) => RawJSXNode)]) {
   const [renderAttempt, renderError] = tryCatch
   try {
      return renderAttempt();
   }
   catch (err) {
      if (renderError)
         return renderError(err instanceof Error ? err : new Error(typeof err === 'string' ? err : ''))
      return undefined;
   }
}

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

export function Tentative(config: { try: RenderFunction, catch?: RenderError }) {

   return function $TryNode(
      input = fromTag<{
         // provide //TODO:
      }>()
   ) {

      return component(
         createTryCatch([config.try, config.catch])
      )
   }
}