//  const $blink = StreamIon({
//       service: true, // does not stop when component is discarded
//       value: false,
//       timer: {  // can pass array of timers too
//          delay: 50,
//          run() {
//             this.value = !this.value;
//          },
//          interval: 500,
//          x: 6,
//          end() {
//             this.value = true
//          }
//       }
//    }, {
//       reset() {
//          this.value = false;
//       },
//    })

// const animation = concat([
//    running,
//    running,
//    $blink
// ], {
//    timer: {
//       delay: 5000,
//       x: 1000,
//    },
//    until: atUnmount
// })

// animation.start();

import { Ion, MutableIon } from "@rue/quarky"
import { AnyObject, Primitive } from "@rue/types"
import { isFunction, noop, normalizeToArray } from "@rue/utils"

/**
 * Streams
 * 
 * Purpose:
 * - stopability
 * - composability
 * of asynchronous operations: timeout, interval, animation, promises/suspense
 */

//TODO: { until:} atUnmount

interface StreamControl {
   start(stream?: PropertyKey): Promise<void>
   stop(): void
}

type ComposedStream = StreamControl

type TimerDef<T = any, C = any> = {
   '@pre'?: (this: T, context: C & StreamContext) => void,
   delay?: number,
   while?: (this: T, context: C & StreamContext) => boolean,
   run(this: T, context: C & StreamContext): void
   interval: number | 'frame'
   max?: number
   doWhile?: (this: T, context: C & StreamContext) => boolean,
   '@post'?: (this: T, context: C & StreamContext) => void
}

interface StreamDef<T, C> {
   this: T
   // service?: boolean,
   stream?: TimerDef<T, C> | TimerDef<T, C>[], // default timer
   streams?: { [key: PropertyKey]: TimerDef<T, C> | TimerDef<T, C>[] } // named timers
   context?: C & AnyObject,
   '@start'?: (context: C & StreamContext) => void
   '@@stop'?: (context: C & StreamContext) => void
}

// interface StreamDef<T = any, C = any> extends Def<T, C> {
//    this: T
// }

// interface StreamIonDef<T, C, P> extends Def<MutableIon<T> & P, C> {
//    value: T,
// }

// type Proto = {

// }


// type InternalThis<T = any, C = AnyObject, P = AnyObject> = { value: T, context?: C & { x: number } } & P

// const animation = concat([
//    running,
//    running,
//    $blink
// ], {
//    timer: {
//       delay: 5000,
//       x: 1000,
//    },
//    until: atUnmount
// })

//TODO: allow normal, both sync and async functions to be chained in concat
// function toStream(start: () => Promise<void>) {
//    let started = false;
//    return {
//       start() {
//          if (started) {
//             this.stop()
//             return new Promise<void>((resolve) => {
//                setTimeout(() => this.start().then(resolve), 0)
//             })
//          }
//          started = true;
//          return start()
//             .then(() => started = false)
//             .catch(() => { started = false }) as unknown as Promise<void>
//       },
//       stop() {
//          if (!started) return;
//             stream.stop()
//          started = false
//       }
//    }
// }

type ComposeUtils = {
   sequence: typeof sequence,
   merge: typeof merge,
   pend: typeof pend,
   delay: typeof delay,
   repeat: typeof repeat
}


export function ComposedStream(def: (utils: ComposeUtils) => Stream): Stream {
   return def({ sequence, merge, pend, delay, repeat })
}

function delay(ms: number) {
   let id: NodeJS.Timeout
   return {
      [AS_STREAM]: {
         start() {
            return new Promise(resolve => {
               id = setTimeout(resolve, ms)
            })
         },
         stop() {
            clearTimeout(id)
         }
      }
   }
}

// function repeat(times: number, stream: Stream): ComposedStream {
//    let i = times;

//    async function start(){
//       while(i--){
//          await startStream(stream)
//       }
//    }

//    function stop(){

//    }

//    return {
//       [AS_STREAM]: {
//          start,
//          stop
//       },
//       start,
//       stop
//    } as ComposedStream
// }


function repeat(times: number, stream: Stream): ComposedStream {
   let currentStream: Stream;
   let started = false;
   let stopped = false;

   async function start() {
      if (started) {
         stop()
         return new Promise<void>((resolve) => {
            setTimeout(() => start().then(resolve), 0)
         })
      }
      if (stopped) {
         stopped = false;
      }
      started = true;
      let i = times
      while (i--) {
         if (stopped) {
            stopped = false;
            return;
         }
         currentStream = stream
         await startStream(stream)
            .catch(() => { started = false })
      }
      started = false;
   }

   function stop() {
      if (!started) return;
      stopped = true;
      stopStream(currentStream)
      started = false;
   }

   return {
      [AS_STREAM]: {
         start,
         stop
      },
      start,
      stop
   } as ComposedStream
}

function pend(suspenseful: Promise<unknown>) {
   const promise = suspenseful; //TODO: or from suspenseIon
   return {
      [AS_STREAM]: {
         start() {
            return promise
         },
         stop: noop
      }
   }
}

function sequence(...streams: (Stream | (() => void))[]): ComposedStream {
   let currentStream: Stream | (() => void);
   let started = false;
   let stopped = false;

   async function start() {
      if (started) {
         stop()
         return new Promise<void>((resolve) => {
            setTimeout(() => start().then(resolve), 0)
         })
      }
      if (stopped) {
         stopped = false;
      }
      started = true;
      for (const stream of streams) {
         if (stopped) {
            stopped = false;
            return;
         }
         currentStream = stream
         await startStream(stream)
            .catch(() => { started = false })
      }
      started = false;
   }

   function stop() {
      if (!started) return;
      stopped = true;
      stopStream(currentStream)
      started = false;
   }

   return {
      [AS_STREAM]: {
         start,
         stop
      },
      start,
      stop
   } as ComposedStream
}



function merge(...streams: Stream[]): ComposedStream {
   let started = false;
   function start() {
      if (started) {
         stop()
         return new Promise<void>((resolve) => {
            setTimeout(() => start().then(resolve), 0)
         })
      }
      started = true;
      const promises = []
      for (const stream of streams) {
         promises.push(startStream(stream))
      }
      return Promise.all(promises)
         .then(() => started = false)
         .catch(() => { started = false }) as unknown as Promise<void>
   }
   function stop() {
      if (!started) return;
      for (const stream of streams) {
         stopStream(stream)
      }
      started = false
   }
   return {
      [AS_STREAM]: {
         start,
         stop
      },
      start,
      stop
   } as ComposedStream
}

type Stream<T = unknown, S = PropertyKey> = T & { '~streams': S }
type InternalStream = { [AS_STREAM]: StreamControl }

type StreamsOf<T> = T extends { '~streams': infer S } ? S : never

export function startStream<T extends Stream | (() => void | Promise<void>)>(entity: T, name?: StreamsOf<T>) {
   if (!(AS_STREAM in entity)) {
      const promise = entity()
      if (promise) return promise;
      return new Promise((resolve) => setImmediate(resolve))
   }
   return (<InternalStream><unknown>entity)[AS_STREAM].start(name)
}

export function stopStream(entity: Stream<unknown> | (() => void | Promise<void>)) {
   if (!(AS_STREAM in entity)) return;
   return (<InternalStream><unknown>entity)[AS_STREAM].stop()
}

const AS_STREAM = Symbol('stream') as unknown as '~streams'

// export function StreamIon<T, C, P>(def: StreamIonDef<T, C, P>, proto?: P & ThisType<MutableIon<T>>): T extends Function ? never : Stream<Ion<T> & P> {
//    const { value } = def;
//    if (value instanceof Function) throw new Error('[INVALID INPUT] The value of StreamIon cannot be a function')
//    const $state = Ion(value as Primitive, proto!)
//    asStream($state, def)
//    return $state as T extends Function ? never : Stream<Ion<T> & P>
// }

//TODO: Manage multiple stream definitions
export function asStream<T extends object, C>(def: StreamDef<T, C>) {
   const { stream, context, this: entity } = def;
   const streams = def.streams ?? { default: stream }

   //TODO: hook tasks
   // const { proto, tasks } = extractHookTasks(protoDef ?? {})



   const state: StreamContext = { ...context, stream: { x: 1, index: 0, timestamp: undefined, name: 'default' } }

   let started = false;

   (<InternalStream>entity)[AS_STREAM] = {
      start(stream?: string) {
         if (started) {
            this.stop()
            return new Promise<void>((resolve) => {
               setTimeout(() => this.start().then(resolve), 0)
            })
         }
         started = true;
         state.stream.x = 1
         state.stream.index = 0
         return start()
            .then(() => { started = false })
            .catch(() => { started = false })
      },
      stop() {
         if (!started) return;
         stop()
         state.stream.index = null
         started = false;
      }
   }

   const { start, stop } = setUpTimers(normalizeToArray(streams.default), entity, state) //TODO: implement named streams

   return entity
}

// function extractHookTasks(protoDef: AnyObject) {
//    const propertyDefs = Object.getOwnPropertyDescriptors(Object.getPrototypeOf(protoDef))
//    const proto: AnyObject = {}
//    const tasks: AnyObject = {}
//    for (const key in protoDef) {
//       if (key.startsWith('@')) {
//          tasks[key.slice(1)] = protoDef[key]
//       }
//       else if (key in propertyDefs) {
//          Object.defineProperty(proto, key, propertyDefs[key])
//       }
//       else {
//          proto[key] = protoDef[key]
//       }
//    }
//    return { proto, tasks }
// }


type StreamContext = { stream: { name: string | 'default', x: number, index: number | null, timestamp?: DOMHighResTimeStamp } }

type Timer = {
   start(): void
   stop(): void
}

function setUpTimers(timers: TimerDef[], entity: AnyObject, context: StreamContext) {
   const activeTimers: Timer[] = []

   let done: () => void
   let cancel: () => void

   function start() {
      const promise = new Promise<void>((resolve, reject) => {
         done = resolve
         cancel = reject
      })
      activeTimers[0].start()
      return promise;
   }

   function stop() {
      const index = context.stream.index
      if (index != null) {
         activeTimers[index].stop()
      }
      try {
         cancel();
      }
      catch (err) {
         ;
      }
   }

   function conclude() {
      done();
      context.stream.index = null
   }

   function next() {
      const index = context.stream.index
      if (index != null) {
         const timer = activeTimers[index + 1]
         if (timer) return timer;
         return {
            start: conclude,
            stop: noop
         }
      }
   }

   for (let i = 0; i < timers.length; i++) {
      const timer = timers[i]
      const checksConditions = timer.doWhile || timer.while
      timer.max = timer.max ?? (checksConditions ? Infinity : 1)
      const { interval, max } = timer
      const setUpTimer = interval === 'frame'
         ? setUpAnimation
         : max > 1 || checksConditions
            ? setUpInterval
            : setUpTimeout

      activeTimers.push(createTimer(timer, setUpTimer, entity, context, i, next))
   }

   return {
      start,
      stop
   }
}



//TODO: provide timestamp in context

function setUpAnimation(timer: TimerDef, entity: AnyObject, context: StreamContext, stop: () => void, next: () => Timer | undefined) {
   const { interval, run, "@pre": atPre, "@post": atPost, while: precondition, doWhile: postcondition } = timer
   if (interval !== 'frame') throw new Error('[INVALID INPUT]')
   let id: number;

   atPre?.apply(entity, [context])
   id = requestAnimationFrame(runFrame)

   function runFrame(time: DOMHighResTimeStamp) {
      context.stream.timestamp = time
      if (precondition && !precondition.apply(entity, [context])) {
         stop();
         next()?.start()
         return;
      }
      run.apply(entity, [context])
      if (context.stream.x === timer.max || postcondition && !postcondition.apply(entity, [context])) {
         atPost?.apply(entity, [context])
         stop()
         next()?.start()
         return;
      }
      else {
         context.stream.x++
         id = requestAnimationFrame(runFrame)
      }
   }

   return () => id
}

function setUpInterval(timer: TimerDef, entity: AnyObject, context: StreamContext, stop: () => void, next: () => Timer | undefined) {
   const { interval, run, "@pre": atPre, "@post": atPost, while: precondition, doWhile: postcondition } = timer
   if (interval === 'frame') throw new Error('[INVALID INPUT]')
   atPre?.apply(entity, [context])
   const id = setInterval(() => {
      if (precondition && !precondition.apply(entity, [context])) {
         stop();
         next()?.start()
         return;
      }
      run.apply(entity, [context])
      if (context.stream.x === timer.max || postcondition && !postcondition.apply(entity, [context])) {
         atPost?.apply(entity, [context])
         stop()
         next()?.start()
         return;
      }
      else {
         context.stream.x++
      }
   }, interval)
   return () => id
}


type SetUpTimer = (timer: TimerDef<any>, entity: AnyObject, context: StreamContext, stop: () => void, next: () => Timer | undefined) => () => any

function setUpTimeout(timer: TimerDef, entity: AnyObject, context: StreamContext, stop: () => void, next: () => Timer | undefined) {
   const { interval, run, "@pre": atPre, "@post": atPost } = timer
   if (interval === 'frame') throw new Error('[INVALID INPUT]')
   atPre?.apply(entity, [context]) //QUESTION: not sure if there's a point for pre and post for timeouts...
   const id = setTimeout(() => {
      run.apply(entity, [context])
      atPost?.apply(entity, [context])
      next()?.start()
   }, interval)
   return () => id
}

function createTimer(timer: TimerDef, setUpTimer: SetUpTimer, entity: AnyObject, context: StreamContext, index: number, next: () => Timer | undefined): Timer {
   const { delay, '@post': atPost } = timer

   let id: NodeJS.Timeout;
   let $id = () => id;

   function stop() {
      clearTimeout($id())
      atPost?.apply(entity, [context])
   }

   return {
      start() {
         context.stream.index = index;
         if (delay) {
            id = setTimeout(() => {
               $id = setUpTimer(timer, entity, context, stop, next)
            }, delay)
         }
         else {
            $id = setUpTimer(timer, entity, context, stop, next)
         }
      },
      stop
   }
}


function StreamIonService() {

}

function Stream() {

}

function StreamService() {

}