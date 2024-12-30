import { component, If, Else, fade, ElseIf, slide, fromTag, v, target } from "@rue/lumo";
import { ion, ionize } from "@rue/quarky";

export function MountIf() {
   const $count = ion(0, {
      increment() {
         $count.as($count() + 1)
      }
   })

   const $active = ion(true, {
      toggle() {
         $active.as(!$active())
      }
   })

   const $ready = ion(true, {
      toggle() {
         $ready.as(!$ready())
      }
   })

   const $isMobile = ion(false, {
      toggle() {
         $isMobile.as(!$isMobile())
      }
   })

   const todos = ionize([{ name: 'bubby' }] as { name: string }[])

   // const removed = todos.splice(0, 2)

function $hi(){
   return ""
}
   //NOTE: if $--transit duration is shorter than $--transition duration, it will disable $--transition transition
   return component(
      <>
         <button on:click={() => (todos[0].name += '!')} style={{ color: ('re' + 'd' + $hi()) }}>shout</button>
         <h1>Hello {(todos[0].name)}</h1>
         <div>{() => 'hi'}</div>
         <$--transition>
            {If($active,
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
            )}
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
         {/* <CounterButton $:increment={$count.increment} /> */}
      </>
   )
}

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

//     // onReactivate(() => {
//     //     console.log("activated yo")
//     // })

//     // onDeactivate(() => {
//     //     console.log("deactivate")
//     // })

//     _this.onDestroy(() => {
//         console.log("destroyd")
//     })

//     $count.as(1)

//     return component(
//         <>
//             <div ref={$countDiv}>{$count}</div>
//             <button on:click-this-$button-v={[$count.as($count() + 1), stopPropagation]} ref={$button}>increment</button >
//             {/* <Counter>{$count()}</Counter> */}
//         </>
//     )
// }


// slot: renderfunction, component, readonly ion, primitive value
