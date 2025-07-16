//@ts-nocheck
import { component, If, Else, fade, ElseIf, slide } from "@rue/lumo";
import { debug, ion, ionize, watch } from "@rue/quarky";
import { AnyObject } from "@rue/types";


export function MountIf() {
   const $count = ion(0, {
      increment() {
         $count.state = $count() + 1
      }
   })

   const list = ionize({
      count: 0,
      increment(value: number) {
         return this.count = this.count + value
      }
   })

   const $active = ion(true, {
      toggle() {
         $active.state = !$active()
      }
   })

   const $ready = ion(false, {
      toggle() {
         $ready.state = !$ready()
      }
   })

   const $isMobile = ion(false, {
      toggle() {
         $isMobile.state = !$isMobile()
      }
   })

   const todos = ionize([{ name: 'bubby', date: 0 }] as { name: string, date: number }[])

   // const removed = todos.splice(0, 2)

   // function $hi() {
   // return ""
   // }
   const $color = ion('lim', {
      change() {
         if ($color() === 'lim')
            $color.state = 'blu'
         else
            $color.state = 'lim'
      }
   })

   watch($color, ()=>{
      debug.traceAsyncPath()
   })

   //NOTE: if ooo-transit duration is shorter than ooo-transition duration, it will disable ooo-transition transition
   return component(

      <div>
         <button on:click={() => ($color.change(), todos[0].name += '!')} style={{ color: ($color() + 'e') }}>shout</button>
         <h1>Hello {(todos[0].name)}</h1>
         <ooo-transition>
            <o-show>
               {If($active, <>
                  oh
                  <ooo-transit with={slide({ x: -100, duration: 2200 })}>
                     <h2>hi</h2>
                  </ooo-transit>
                  <ooo-transit with={slide({ x: 100, duration: 2200 })}>
                     <h2>hope</h2>
                  </ooo-transit>
                  {If($ready,
                     <p>ready</p>
                  )}
               </>)}
               {ElseIf($ready, <>
                  low
                  <h2>balloon</h2>
               </>)}
               {Else(<>
                  so
                  <h2>bye</h2>
               </>)}
            </o-show>
         </ooo-transition>
         <button on:click={$active.toggle}>toggle active</button>
         <button on:click={$ready.toggle}>toggle ready</button>
         {/* <Child dog-sled={$color() + 'd'} on:incrementclick={e => { open(); $active.toggle()}}></Child> */}
      </div>
   )
}


// function Child(input = fromTag({
//    'm:frogWell': Ion<string>,
//    'dog-sled': Ion<string>,
//    Slot: v<string>('?'),
//    'on:incrementclick': OnEvent
// })) {
//    const {Slot, emit } = input

//    return component(
//       <div>child</div>
//    )
// }

// function CounterButton(input = fromTag({
//    // Slot: v<() => any>,
//    '$:increment': v<() => void>
// })) {
//    // const { Slot } = input;
//    return component(
//       ''
//       // Slot()
//    )
// }

// function DisplayCard({ id, title, description }) {
//     // setup logic here...
//     function select() {

//     }

//     return component(
//         <div on:click={e => { if (e.targets('x-select')) select() }}>
//             <p x-select>{title}</p>
//             <p contenteditable>{description}</p>
//             <button on:click={e => open(id)}>open</button>
//             <ArticleBlock SlotKit={CounterKit}>{o =>
//                 <p>{o.frog}</p>
//             }</ArticleBlock>
//         </div>
//     )
// }

// function DisplayCardB({ id, title, description }) {
//     // setup logic here...
//     function select() {

//     }

//     return component(
//         <div on:click={'x-select', e => { if (e.targets('x-select')) select() }}>
//             <p x-select>{title}</p>
//             <p contenteditable>{description}</p>
//             <button on:click={e => open(id)}>open</button>
//             <ArticleBlock SlotKit={CounterKit}>{o =>
//                 <p>{o.frog}</p>
//             }</ArticleBlock>
//         </div>
//     )
// }

function CounterKit() {
   return {
      $count: ion(0)
   }
}

function ArticleBlock(setup: {
   Slot: (setup: { frog: string }) => any;
   SlotKit: typeof CounterKit //TODO: auto add ReturnType of SlotKit to setup props
}) {

}
// function Counter() {
//     const _this = $thisComponent()
//     const $count = ion(0)

//     const $button = NodeRef('button')
//     const $countDiv = NodeRef('div')

//     // onNodesCreated(
//     //     [$button, $countDiv],
//     //     ([button, countDiv]) => {

//     //     }
//     // )

//     watch($count, () => {
//         console.log("sync phase")
//     }, { phase: SYNC })

//     watch($count, () => {
//         console.log("pre-render phase")
//     }, { phase: BEFORE_RENDER })

//     watch($count, () => {
//         console.log("render phase")
//     }, { phase: ON_RENDER })

//     watch($count, () => {
//         console.log("post-render phase")
//     }, { phase: AFTER_RENDER })

//     _this.onCreated(() => {
//         console.log("created")
//         const button = $button()
//         const countDiv = $countDiv()
//         console.log("node ref", button, countDiv)
//     })

//     // onRemount(() => {
//     //     console.log("activated yo")
//     // })

//     // atUnmount(() => {
//     //     console.log("unmount")
//     // })

//     _this.onDiscard(() => {
//         console.log("destroyd")
//     })

//     $count.state = 1)

//     return component(
//         <>
//             <div ref={$countDiv}>{$count}</div>
//             <button on:click-this-$button-v={[$count.state = $count() + 1), stopPropagation]} ref={$button}>increment</button >
//             {/* <Counter>{$count()}</Counter> */}
//         </>
//     )
// }


// slot: renderfunction, component, readonly ion, primitive value
