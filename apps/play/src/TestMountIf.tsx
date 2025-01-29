import { component, If, Else, fade, ElseIf, slide, fromTag, v, target, prep, Ion } from "@rue/lumo";
import { ion, ionize, watch } from "@rue/quarky";
import { AnyObject } from "@rue/types";
import { asyncTrace_DEV } from "../../../packages/flask/debug";


export function MountIf() {
   const $count = ion(0, {
      increment() {
         $count.state = $count() + 1
      }
   })

   const list = ionize({
      count: 0,
   }, {
      increment(value: number) {
         return list.count = list.count + value
      }
   })

   const $active = ion(false, {
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
      asyncTrace_DEV()
   })
   //NOTE: if $--transit duration is shorter than $--transition duration, it will disable $--transition transition
   return component(
      <>
         {/* <button on:click={() => ($color.change(), todos[0].name += '!')} style={{ color: 'lime' }}>shout</button> */}
         <button on:click={() => ($color.change(), todos[0].name += '!')} style={{ color: ($color()) + 'e' }}>shout</button>
         <h1>Hello {$ = todos[0].name}</h1>
         <div>hi</div>
         <$--transition>
            {If($active, (asyncTrace_DEV(),
               <>
                  oh
                  <$--transit with={slide({ x: -100, duration: 2200 })}>
                     <h2>hi</h2>
                  </$--transit>
                  <$--transit with={slide({ x: 100, duration: 2200 })}>
                     <h2>hope</h2>
                  </$--transit>
                  {If($ready,
                     <p>ready</p>
                  )}
               </>
            ))}
            {ElseIf($ready,
               <>
                  low
                  <h2>balloon</h2>
               </>
            )}
            {Else(
               <>
                  so
                  <h2>bye</h2>
               </>
            )}
         </$--transition>
         <button on:click={$active.toggle}>toggle active</button>
         <button on:click={$ready.toggle}>toggle ready</button>
         {/* <Child dog-sled={$color() + 'd'} on:incrementclick={e => { open(); $active.toggle()}}></Child> */}
      </>
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

//     // onUnmount(() => {
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
