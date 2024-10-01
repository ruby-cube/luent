import { NodeEntity } from "../node/makeNode";


let isTrying = false; //TODO: figure out how to choose between non-rendering on error vs allowing error to bubble up

export function Try(renderFunction: (o?: any) => NodeEntity | NodeEntity[]) {
    return {
        Catch(renderError: (error: Error) => NodeEntity | NodeEntity[]) {
            let prevState = isTrying;
            try {
                isTrying = true;
                return renderFunction()
            }
            catch (err) {
                const error = err instanceof Error ? err : new Error(<string>err)
                return renderError(error)
            }
            finally {
                isTrying = prevState
            }
        }
    }
}

