// {Await(($file = fetchFile($userID, $fileID)) =>
//    <File id={$fileID()} file={$file} />
// )}
// {Meanwhile({ timeout: 500 },
//    <Loading />
// )}
// {Catch(err =>
//    <div>{err}</div>
// )}

import { RenderFunction } from "../node/makeNode";
import { RenderError } from "./Try";


export function Await(renderResolved: RenderFunction) {
   return {
      renderResolved,
      // suspense // Suspense<T> Awaited<T> Promise<T> []
   }
}

export function Meanwhile(renderPlaceholder: RenderFunction) {
   return {
      renderPlaceholder
      // timeout
   }
}

export function Catch(renderError: RenderError) {
   return {
      renderError
   }
}

function _$$AwaitSeries(series: [{ renderResolved: RenderFunction }, { renderPlaceholder: RenderFunction }, { renderError: RenderError }]) {
   
}