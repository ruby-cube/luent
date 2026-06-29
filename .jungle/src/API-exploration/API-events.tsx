//@ts-nocheck
import { getActiveFlask } from "@rue/flask";
import { component, template, listen } from "@rue/luent";
import { normalizeToArray } from "@rue/utils";


export function TempoPlayer() {

   listen(window, click(e => { doSomething() }))

   return (

      <>
         {If($active,
            <>
               <o--window on={click(e => doSomething())}></o--window>
               <div>hi</div>
            </>
         )}
         {If($active, () => {
            listen(window, click(e => { doSomething() }))
            return (
               <div>
                  hi
               </div>
            )
         }
         )}
         <button></button>
      </>
   )
}

class TempoEvent extends Event {
   constructor() {
      super('remix:tempo', { cancelable: true })
   }

   bpm: number = 0
}

type Emit<E extends Event> = (event: E) => void

const tempo = createInteraction('remix:tempo', (emit: Emit<TempoEvent>) => {

   function handleTap(event: Event) {

   }

   return [
      keydown(handleTap)
   ]
})


function createInteraction<N extends string, E extends Event>(event: N, def: (emit: Emit<E>) => any) {
   return (task: (event: E) => void, options?: any) => {
      const flask = getActiveFlask()
      return (target: HTMLElement) => {
         target.addEventListener(event as any, task, options)
         flask.onDiscard(() => target.removeEventListener(event as any, task))
         const listeners = normalizeToArray(def((e: E) => target.dispatchEvent(e)));
         for (const listen of listeners) {
            listen(target, options)
         }
      }
   }
}

type SetupCleanup = any
type Abort = any

function keydown(task: (event: KeyboardEvent, utils: { setup: SetupCleanup, abort: Abort }) => void, options?: any) {
   return (target: HTMLElement) => {
      target.addEventListener('keydown', (e) => task(e, { setup: {}, abort: {} }), options)
   }
}


//    private create = new Event('create')
//    private remount = new Event('preserve')
//    private demount = new Event('demount')
//    private discard = new Event('discard')

//    private emit(event: Event) {
//       this.node.dispatchEvent(event)
//    }

//    private on(hookName: LifecycleHook, task: Task) {
//       this.node.addEventListener(hookName, task)
//       return {
//          stop:() => {
//             this.node.removeEventListener(hookName, task)
//          }
//       }
//    }
// }

// <div on:event={[
//    tempo(e => { console.log('tempo')})
// ]}>