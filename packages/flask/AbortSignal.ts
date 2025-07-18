

type Abort = AbortController['abort']

export function AbortSignal(): [Abort, AbortSignal]{
   const controller = new AbortController()
   return [controller.abort, controller.signal]
}