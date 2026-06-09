import { AnyObject } from "@rue/types"

export type Stream = {
   start(): Promise<void>
   stop(): void
}

// TODO: timeout
// TODO: animation ... interval 'frame'
// TODO: until beforeUnmount

export function Stream(startDef: (utils: AnyObject) => Promise<void>, options?: { '@stop': () => void }): Stream {

   const stopTask = options?.["@stop"]
   let stopCurrentStream: () => void

   const interval = Interval()
   let stopped = false
   let started = false

   function start() {
      if (started) {
         stop()
         return new Promise<void>((resolve) => {
            setTimeout(() => start().then(resolve), 0)
         })
      }
      started = true;
      stopped = false;
      return startDef({
         get interval() {
            return (ms: number, task: () => void, options?: { max?: number }) => {
               if (stopped) return;
               stopCurrentStream = interval.stop
               return interval.start(ms, task, options)
            }
         },
         // stream,
         run,
         repeat
      }).catch(err => {
         if (err !== 'stream cancelled') throw err
      })
   }

   let value: unknown;

   function run(...streams: [Function] | (Stream | Promise<any>)[]): unknown | Promise<unknown> {
      if (stopped) return undefined as unknown as Promise<any>
      if (streams.length === 1) {
         const stream = streams[0]
         if (stream instanceof Function) {
            const maybePromise = stream(value)
            if ('then' in maybePromise) {
               maybePromise.then((res: unknown) => value = res)
            }
            else {
               value = maybePromise
            }
            return maybePromise
         }
         if ('start' in stream && 'stop' in stream) {
            stopCurrentStream = stream.stop
            return stream.start().then(res => value = res)
         }
         else return stream.then(res => value = res)
      }
      const promises: Promise<any>[] = []
      stopCurrentStream = () => {
         for (const stream of streams) {
            if ('stop' in stream)
               stream.stop()
         }
      }
      for (const stream of streams) {
         promises.push('start' in stream ? stream.start() : stream instanceof Function ? stream() : stream)
      }

      return Promise.all(promises).then(res => value = res)
   }

   // function stream(...streams: (Stream | Promise<any>)[]) {
   //    if (stopped) return;
   //    if (streams.length === 1) {
   //       const stream = streams[0]
   //       if ('start' in stream && 'stop' in stream) {
   //          stopCurrentStream = stream.stop
   //          return stream.start()
   //       }
   //       else return stream
   //    }
   //    const promises: Promise<any>[] = []
   //    stopCurrentStream = () => {
   //       for (const stream of streams) {
   //          if ('stop' in stream)
   //             stream.stop()
   //       }
   //    }
   //    for (const stream of streams) {
   //       promises.push('start' in stream ? stream.start() : stream)
   //    }

   //    return Promise.all(promises)
   // }

   async function repeat(times: number, fn: () => Promise<void>) {
      if (stopped) return;
      let x = times;
      while (x--) {
         await fn()
      }
   }

   function stop() {
      if (!started) return;
      stopTask?.()
      stopCurrentStream()
      stopped = true;
      started = false;
   }

   return {
      start,
      stop
   }
}





function Interval() {
   const state = {
      x: 0,
      end
   }

   let id: NodeJS.Timeout | null = null
   let resolve: (() => void) | null = null
   let reject: ((reason?: any) => void) | null = null

   function startInterval(ms: number, task: () => void, options?: { max?: number }) {
      console.log('starting interval')
      const maxTimes = options?.max ?? Infinity
      console.log('maxTimes', maxTimes)
      const boundTask = () => {
         state.x++
         task.call(state)
         if (state.x === maxTimes) end()
      }
      id = setInterval(boundTask, ms)

      return new Promise<void>((_resolve, _reject) => {
         resolve = _resolve
         reject = _reject
      })
   }

   function clear() {
      if (id === null) return;
      clearInterval(id)
   }

   function end() {
      clear()
      resolve?.()
      resetInterval()
   }

   function cancel() {
      clear()
      reject?.('stream cancelled')
      resetInterval()
   }

   function resetInterval() {
      state.x = 0
      id = null;
      resolve = null
      reject = null
   }

   return { start: startInterval, stop: cancel }
}