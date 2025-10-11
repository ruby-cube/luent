import { component } from "@rue/lumo"
import { Ion } from "@rue/quarky"
import { AnyObject } from "@rue/types";
import './TestStreamIon.css'

function encase<T>(fn: () => T) {
   return fn()
}


export function TestVanillaStream() {

   const $eye = Ion(1, {
      bug() { this.value = 2 },
      reset() { this.value = 1 },
      toggle() { this.value = this.value === 1 ? 2 : 1 }
   });

   const bugeye = Stream(async ({ interval, run }) => {
      run(() => {
         $eye.bug()
      })
      await interval(500, () => {
         $eye.toggle()
      }, { max: 5 })
      run(() => {
         $eye.reset()
      })
   }, { '@stop': () => $eye.reset() })

   const $side = Ion('l' as 'l' | 'r')

   const turning = Stream(async ({ interval, run }) => {
      run(() => {
         $side.value = 'r'
      })
      await interval(1000, () => {
         $side.value = $side.value === 'l' ? 'r' : 'l'
      }, { max: 3 })
      run(() => {
         $side.value = 'l'
      })
   }, { '@stop': () => $side.value = 'l' })


   const $running = Ion(false as false | 3 | 4)

   const running = Stream(async ({ interval, run }) => {
      run(() => {
         $running.value = 3
      })
      await interval(125, () => {
         $running.value = $running.value === 3 ? 4 : 3
      }, { max: 32 })
      run(() => {
         $running.value = false
      })
   }, { '@stop': () => $running.value = false })

   const animation = Stream(async ({ stream, repeat }) => {
      await repeat(3, async () => {
         await stream(turning, running)
         await stream(bugeye)
      })
   })


   const $frame = Ion(() =>
      $running() ? $running() : $eye()
   )

   return component(
      <>
         <div class="logo">
            <div class={['bg dragon', (`${$side()}${$frame()}`)]}></div>
         </div>
         <button on:click={e => { animation.start() }}>start</button>
         <button on:click={e => { animation.stop() }}>stop</button>
      </>
   )
}


type Stream = {
   start(): Promise<void>
   stop(): void
}

// TODO: timeout
// TODO: animation ... interval 'frame'
// TODO: until atUnmount

function Stream(startDef: (utils: AnyObject) => Promise<void>, options?: { '@stop': () => void }): Stream {

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
         stream,
         run,
         repeat
      }).catch(err => {
         if (err !== 'stream cancelled') throw err
      })
   }

   function run(fn: Function): Promise<any> {
      if (stopped) return undefined as unknown as Promise<any>
      return fn()
   }

   function stream(...streams: (Stream | Promise<any>)[]) {
      if (stopped) return;
      if (streams.length === 1) {
         const stream = streams[0]
         if ('start' in stream && 'stop' in stream) {
            stopCurrentStream = stream.stop
            return stream.start()
         }
         else return stream
      }
      const promises: Promise<any>[] = []
      stopCurrentStream = () => {
         for (const stream of streams) {
            if ('stop' in stream)
               stream.stop()
         }
      }
      for (const stream of streams) {
         promises.push('start' in stream ? stream.start() : stream)
      }

      return Promise.all(promises)
   }

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