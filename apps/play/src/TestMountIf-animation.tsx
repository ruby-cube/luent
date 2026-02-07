import { getActiveFlask } from "@rue/flask";
import { component, If, Else, fade, ElseIf, slide, Transition, Transit, SYNC, tick, Style, NodeRef, atMounted, $Node } from "@rue/lumo";
import { debug, getActiveUpdate, instantUpdate, Ion, queueRender, queueTask, watch } from "@rue/quarky";
import { AnyObject } from "@rue/types";
import "./style.css"


export function MountIfAnimation() {

   const $count = Ion(0, {
      increment() {
         $count.value = $count() + 1
      }
   })

   // const list = ionize({
   //    count: 0,
   //    increment(value: number) {
   //       return this.count = this.count + value
   //    }
   // })

   const $active = Ion(true, {
      toggle() {
         $active.value = !$active()
      }
   })

   const $ready = Ion(false, {
      toggle() {
         $ready.value = !$ready()
      }
   })

   const $isMobile = Ion(false, {
      toggle() {
         $isMobile.value = !$isMobile()
      }
   })

   const $name = Ion('Dobby')
   // const todos = ionize([{ name: 'bubby', date: 0 }] as { name: string, date: number }[])

   // const removed = todos.splice(0, 2)

   // function $hi() {
   // return ""
   // }

   const $color = Ion('lim', {
      change() {
         if ($color() === 'lim')
            $color.value = 'blu'
         else
            $color.value = 'lim'
      }
   })

   watch($color, () => {
      console.log('hi tick instant', getActiveUpdate())
   })

   const $transitioning = Ion(false)
   const $startHeight = Ion(0)
   const $endHeight = Ion(0)

   const $div1 = NodeRef('div')
   const $div2 = NodeRef('div')
   const $div3 = NodeRef('div')
   const $container = NodeRef('div')

   let prevNode: HTMLDivElement | undefined

   atMounted(initial => {
      if (!initial) return;
      prevNode = getActiveDivRef()()
   })

   function getActiveDivRef() {
      return $active() ? $div1 : $ready() ? $div2 : $div3
   }

   const newClones = new Set<HTMLElement>()

   function maybeTransition($div: $Node) {
      if (prevNode === $div()) {
         return;
      }
      if (newClones.size) { // transitioning
         for (const newClone of newClones) {
            newClone.classList.add('cancel-transition') // FIX:
            newClones.delete(newClone)
            // TODO: interrupt container transition
         }
      }

      transition($div)
   }

   function transition($div: $Node) {
      // container
      const first = $container()!.getBoundingClientRect() // TODO: queue in Layout to prevent layout thrashing
      // - read dims of prev node
      const rect = prevNode!.getBoundingClientRect() // TODO: queue in Layout to prevent layout thrashing
      const prevClone = prevNode!.cloneNode(true)

      console.log('rect.top', rect.top)
      // - position prevClone
      prevClone.style.removeProperty('visibility')
      prevClone.style.setProperty('position', 'absolute')
      prevClone.style.setProperty('top', rect.top + 'px')
      prevClone.style.setProperty('left', rect.left + 'px')
      prevClone.style.setProperty('width', rect.width + 'px')
      prevClone.style.setProperty('height', rect.height + 'px')

      queueRender(() => {
         const last = $container()!.getBoundingClientRect() // TODO: queue in Layout to prevent layout thrashing

         // const deltaX = first.left - last.left;
         // const deltaY = first.top - last.top;
         // $container()!.style.setProperty('width', first.width + 'px')
         $container()!.style.setProperty('height', first.height + 10 + 'px')
         console.log('first height', first.height, 135.833,)
         // TODO: transition container height
         // TODO: figure out why there is a height discrepancy

         $container()!.appendChild(prevClone) // must happen before we read dims of new node ... why??

         const newNode = $div()!

         const newClone = newNode.cloneNode(true)
         newClones.add(newClone)

         // - read dims of new node (must read before hiding new node)
         const rect = newNode!.getBoundingClientRect() // TODO: queue in Layout to prevent layout thrashing

         console.log('prevNode parent', prevNode?.parentNode)
         newNode.style.setProperty('visibility', 'hidden')
         // newNode.style.setProperty('display', 'none')

         // - position newClone
         newClone.style.removeProperty('visibility')
         newClone.style.setProperty('position', 'absolute')
         newClone.style.setProperty('top', rect.top + 'px')
         newClone.style.setProperty('left', rect.left + 'px')
         newClone.style.setProperty('width', rect.width + 'px')
         newClone.style.setProperty('height', rect.height + 'px')

         $container()?.appendChild(newClone)

         prevClone.classList.add('fade-out')
         newClone.classList.add('fade-in')

         requestAnimationFrame(() => {
            queueTask(() => {
               $container()!.style.setProperty('height', last.height + 10 + 'px')
               $container()?.addEventListener('transitionend', () => {
                  $container()?.style.removeProperty('height')
               })
            })
         })
         // Play: animate the final element from its first bounds
         // to its last bounds (which is no transform)
         // $container()!.animate([{
         //    transformOrigin: 'top left',
         //    transform: `scale(${deltaW}, ${deltaH})`
         // }, {
         //    transformOrigin: 'top left',
         //    transform: 'none'
         // }], {
         //    duration: 1000,
         //    easing: 'ease-in',
         //    fill: 'both'
         // });

         prevClone.addEventListener('animationend', () => {
            console.log('transition ended')
            prevClone.remove();
         })

         newClone.addEventListener('animationend', () => {
            console.log('transition ended new')
            newNode.style.removeProperty('visibility')
            // newNode.style.removeProperty('display')
            newClone.remove();
            newClones.delete(newClone)
         })

         prevNode = newNode
      })

   }



   //NOTE: if Transit duration is shorter than ooo-transition duration, it will disable ooo-transition transition
   return component(
      <div>
         <button on:click={() => ($color.change(), $name.value += '!')} style={{ color: ($color() + 'e') }}>shout</button>
         <h1>Hello {$name}</h1>
         <button on:click={e => { $active.toggle(); maybeTransition(getActiveDivRef()) }}>toggle active</button>
         <button on:click={e => { $ready.toggle(); maybeTransition(getActiveDivRef()) }}>toggle ready</button>
         <hr></hr>
         {/* <Transition> */}
         {/* <div style={{ width: ($transitioning() ? $width() : 'unset'), height: ($transitioning() ? $height() : 'unset'), }}> */}
         <div class='container transition-container' ref={$container}>
            {If($active,
               <div class='holder' ref={$div1}>
                  {/* <div> */}
                  oh
                  {/* <Transit with={slide({ x: -100, duration: 2200 })}> */}
                  <h2>hi</h2>
                  {/* </Transit> */}
                  {/* <Transit with={slide({ x: 100, duration: 2200 })}> */}
                  <h2>hope</h2>
                  {/* </Transit> */}
                  {/* {If($ready,
                     <p>ready</p>
                  )} */}
               </div>
            )}
            {ElseIf($ready,
               <div class='holder' ref={$div2}>
                  low
                  <h2>balloon</h2>
               </div>
            )}
            {Else(
               <div class='holder' ref={$div3}>
                  so
                  <h2>bye</h2>
               </div>
            )}
         </div>
         {/* </Transition> */}
         <hr></hr>
         {/* <Child dog-sled={$color() + 'd'} on:incrementclick={e => { open(); $active.toggle()}}></Child> */}
         {Style`


@keyframes fade-in {
   0% {
      opacity: 0;
   }

   25% {
      opacity: .25;
   }

   50% {
      opacity: .5;
   }

   75% {
      opacity: .75;
   }

   100% {
      opacity: 1;
   }
}

@keyframes fade-out {
from {
   opacity: .2
}
   to {
      opacity: 0;
   }
}

@keyframes cancel-out {

   to {
      opacity: 0;
   }
}

.fade-out {
   animation: fade-out 2000ms ease-in forwards;
}

.fade-in {
   animation: fade-in 2000ms ease-in forwards;
}

            .cancel-transition {
               animation: fade-in paused, cancel-out 500ms;
            }

            .transition-container {
               transition: height 125ms ease-in;
            }

         `}
      </div>
   )
}



// function Child(input : FromTag({
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

// function CounterButton(input : FromTag({
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
      $count: Ion(0)
   }
}

function ArticleBlock(setup: {
   Slot: (setup: { frog: string }) => any;
   SlotKit: typeof CounterKit // TODO: auto add ReturnType of SlotKit to setup props
}) {

}
// function Counter() {
//     const _this = $thisComponent()
//     const $count = Ion(0)

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

//     $count.value = 1)

//     return component(
//         <>
//             <div ref={$countDiv}>{$count}</div>
//             <button on:click-this-$button-v={[$count.value = $count() + 1), stopPropagation]} ref={$button}>increment</button >
//             {/* <Counter>{$count()}</Counter> */}
//         </>
//     )
// }


// slot: renderfunction, component, readonly ion, primitive value
