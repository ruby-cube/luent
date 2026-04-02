import { $listen, PausableListener, CallbackRemover, defineCustomCleanupScheduler, SustainedListenerOptions, ScheduleStop } from '@rue/flask';
import { withUpdate } from '../element/makeElement';


type EventListenerOptions = Omit<AddEventListenerOptions, "signal"> & Omit<SustainedListenerOptions, 'until'> & CustomCleanupSchedulerListenerOptions

export type CustomCleanupSchedulerListenerOptions = {
   until?: [EventTarget, keyof DocumentEventMap | keyof HTMLElementEventMap | keyof WindowEventMap] | ScheduleStop | AbortSignal
}

type EventName<T> = T extends Document ? keyof DocumentEventMap :
   T extends Window ? keyof DocumentEventMap |'hashchange' :
   keyof HTMLElementEventMap

type EventHandler<T, K extends string> = T extends Document ? (event: K extends keyof DocumentEventMap ? DocumentEventMap[K] : Event) => void
   : T extends Window ? (event: K extends keyof WindowEventMap ? WindowEventMap[K] : Event) => void
   : T extends HTMLElement ? (event: K extends keyof HTMLElementEventMap ? HTMLElementEventMap[K] : Event) => void
   : EventListener



export function listen<
   T extends EventTarget,
   CB
>(
   element: T,
   event: EventName<T>,
   handler: CB & EventHandler<T, EventName<T>>,
   options?: EventListenerOptions
) {
   if (options?.eager) withUpdate(handler, event)(new Event(event))
   return $listen(withUpdate(handler, event), <SustainedListenerOptions>options || {}, {
      enroll(cb) {
         element.addEventListener(event, cb, options)
      },
      remove(cb) {
         element.removeEventListener(event, cb, options)
      }
   })
}

defineCustomCleanupScheduler(
   (target, event) =>
      (cleanup: CallbackRemover) =>
         listen(target, event, cleanup)
)

