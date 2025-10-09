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

// const animation = concatStreams([
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

import { Ion } from "@rue/quarky"
import { AnyObject, Primitive } from "@rue/types"
import { isFunction, noop, normalizeToArray } from "@rue/utils"

//TODO: { until:} atUnmount

interface Stream {
   start(): Promise<void>
   stop(): void
}

type StreamIon<T> = {
   (): T,
   value: T
   // pause
   // resume
} & Stream

type TimerDef<T = any, C = any> = {
   '@pre'?: (this: T, context: C & StreamContext) => void,
   delay?: number,
   while?: (this: T, context: C & StreamContext) => boolean,
   run(this: T, context: C & StreamContext): void
   interval: number | 'frame'
   x?: number
   doWhile?: (this: T, context: C & StreamContext) => boolean,
   '@post'?: (this: T, context: C & StreamContext) => void
}

interface Def<T, C> {
   // service?: boolean,
   timer: TimerDef<T, C> | TimerDef<T, C>[],
   context?: C & AnyObject
}

interface StreamDef<T, C> extends Def<T, C> {
   this: T
}

interface StreamIonDef<T, C, P> extends Def<StreamIon<T> & P, C> {
   value: T,
}

type Proto = {

}


// type InternalThis<T = any, C = AnyObject, P = AnyObject> = { value: T, context?: C & { x: number } } & P

// const animation = concatStreams([
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

export function concatStreams(streams: Stream[]) {
   let currentStream: Stream;
   let stopped = false;

   return {
      async start() {
         for (const stream of streams) {
            if (stopped) {
               stopped = false;
               return;
            }
            currentStream = stream
            await stream.start()
         }
      },
      stop() {
         stopped = true;
         currentStream.stop()
      }
   }
}

export function mergeStreams(streams: Stream[]) {
   return {
      start() {
         const promises = []
         for (const stream of streams) {
            promises.push(stream.start())
         }
         return Promise.all(promises)
            .catch(() => { }) as unknown as Promise<void>
      },
      stop() {
         for (const stream of streams) {
            stream.stop()
         }
      }
   }
}

export function StreamIon<T, C, P>(def: StreamIonDef<T, C, P>, proto?: P & ThisType<StreamIon<T>>): T extends Function ? never : StreamIon<T> & P {
   const { timer, value, context } = def;

   // const internalThis = new Proxy({}, {
   //    get(target, key) {
   //       if (key === 'context') return context;
   //       if (key === 'value') return $state();
   //       if (key in proto) return proto[key];
   //       return undefined;
   //    },
   //    set(target, key, value) {
   //       if (key === 'value') {
   //          $state.value = value
   //          return true;
   //       }
   //       return false;
   //    }
   // }) as unknown as InternalThis

   //TODO: hook tasks
   // const { proto, tasks } = extractHookTasks(protoDef ?? {})

   if (value instanceof Function) throw new Error('[INVALID INPUT] The value of StreamIon cannot be a function')
   if (proto && 'start' in proto) throw new Error('[INVALID INPUT] StreamIons cannot be assigned a start method. Did you mean `@start`?')
   if (proto && 'stop' in proto) throw new Error('[INVALID INPUT] StreamIons cannot be assigned a start method. Did you mean `@end`?')

   const state: StreamContext = { ...context, timer: {x: 1, index: 0} }

   const streamMethods = {
      start() {
         state.timer.x = 1
         state.timer.index = 0
         return start()
      },
      stop() {
         stop()
         state.timer.index = null
      }
   }

   const prototype = proto ? Object.assign(proto, streamMethods) : streamMethods //TODO: make a clone instead?

   const $state = Ion(value as Primitive, prototype)
const tims = normalizeToArray(timer)
   const { start, stop } = setUpTimers(tims, $state, state)

   return $state as unknown as T extends Function ? never : StreamIon<T> & P
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


type StreamContext = { timer: { x: number, index: number | null } }

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
      const index = context.timer.index
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
      context.timer.index = null
   }

   function next() {
      const index = context.timer.index
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
      timer.x = timer.x ?? (checksConditions ? Infinity : 1)
      const { interval, x: maxTimes } = timer
      const setUpTimer = interval === 'frame'
         ? setUpAnimation
         : maxTimes > 1 || checksConditions
            ? setUpInterval
            : setUpTimeout

      activeTimers.push(createTimer(timer, setUpTimer, entity, context, i, next))
   }

   return {
      start,
      stop
   }
}


function setUpAnimation(timer: TimerDef, entity: AnyObject, context: StreamContext, stop: () => void, next: () => Timer | undefined) {
   const { interval, run, "@pre": atPre, "@post": atPost, while: precondition, doWhile: postcondition } = timer
   if (interval !== 'frame') throw new Error('[INVALID INPUT]')
   let id: number;

   atPre?.apply(entity, [context])
   id = requestAnimationFrame(runFrame)

   function runFrame() {
      if (precondition && !precondition.apply(entity, [context])) {
         stop();
         next()?.start()
         return;
      }
      run.apply(entity, [context])
      if (context.timer.x === timer.x || postcondition && !postcondition.apply(entity, [context])) {
         atPost?.apply(entity, [context])
         stop()
         next()?.start()
         return;
      }
      else {
         context.timer.x++
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
      if (context.timer.x === timer.x || postcondition && !postcondition.apply(entity, [context])) {
         atPost?.apply(entity, [context])
         stop()
         next()?.start()
         return;
      }
      else {
         context.timer.x++
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
         context.timer.index = index;
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