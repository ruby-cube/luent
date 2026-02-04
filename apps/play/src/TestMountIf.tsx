import { getActiveFlask } from "@rue/flask";
import { component, If, Else, fade, ElseIf, slide, Transition, Transit, SYNC, tick, Style, NodeRef, atMounted, $Node } from "@rue/lumo";
import { debug, getActiveUpdate, instantUpdate, Ion, queueRender, queueTask, toValue, watch } from "@rue/quarky";
import { AnyObject } from "@rue/types";
import "./style.css"


export function MountIf() {

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

   const $container = NodeRef('div')

   const transitioningInMap = new WeakMap<HTMLElement, Set<HTMLElement>>()

   function transitionIn(node: HTMLElement) {
      console.log('transition in')
      queueRender(() => {
         const transitioningIn = transitioningInMap.get(node) || new Set()
         transitioningInMap.set(node, transitioningIn)

         const clone = node.cloneNode(true) as HTMLElement
         transitioningIn.add(clone)

         // - read dims of new node (must read before hiding new node)
         const rect = node!.getBoundingClientRect() // TODO: queue in Layout to prevent layout thrashing

         node.style.setProperty('visibility', 'hidden')

         // - position newClone
         clone.style.removeProperty('visibility')
         clone.style.setProperty('position', 'absolute')
         clone.style.setProperty('top', rect.top + 'px')
         clone.style.setProperty('left', rect.left + 'px')
         clone.style.setProperty('width', rect.width + 'px')
         clone.style.setProperty('height', rect.height + 'px')

         // set starting transition state
         clone.classList.add('fade-in-from-0')
         $container()?.appendChild(clone)


         requestAnimationFrame(() => { // THIS IS IMPORTANT... ensures browser doesn't batch changes, preventing transition
            queueTask(() => {
               // trigger transition
               clone.classList.add('fade-in-active')
               clone.classList.remove('fade-in-from-0')

               clone.addEventListener('transitionend', () => {
                  node.style.removeProperty('visibility')
                  clone.remove();
                  transitioningIn.delete(clone)
               })
            })
         })
      })
   }

   function transitionOut(node: HTMLElement) {
      const transitioning = transitioningInMap.get(node)
      if (transitioning?.size) {
         for (const clone of transitioning) {
            clone.classList.add('cancel-transition')
            transitioning.delete(clone)
         }
      }
      console.log('transition out!')
      // - read dims of prev node
      const rect = node.getBoundingClientRect() // TODO: queue in Layout to prevent layout thrashing
      const clone = node.cloneNode(true) as HTMLElement

      // - position prevClone
      clone.style.removeProperty('visibility')
      clone.style.setProperty('position', 'absolute')
      clone.style.setProperty('top', rect.top + 'px')
      clone.style.setProperty('left', rect.left + 'px')
      clone.style.setProperty('width', rect.width + 'px')
      clone.style.setProperty('height', rect.height + 'px')

      queueRender(() => {
         $container()?.appendChild(clone) // must happen before we read dims of new node ... why??

         requestAnimationFrame(() => { // THIS IS IMPORTANT... ensures browser doesn't batch changes, preventing transition
            queueTask(() => {
               clone.classList.add('fade-out-to-0')

               clone.addEventListener('transitionend', () => {
                  console.log('transition ended')
                  clone.remove();
               })
            })
         })
      })
   }

   //NOTE: if Transit duration is shorter than ooo-transition duration, it will disable ooo-transition transition
   return component(
      <div style={{
         '--fade-in-duration': '2000ms',
         '--fade-out-duration': '2000ms',
         '--fade-in-timing': 'ease',
         '--fade-out-timing': 'ease'
      }}>
         <button on:click={() => ($color.change(), $name.value += '!')} style={{ color: ($color() + 'e') }}>shout</button>
         <h1>Hello {$name}</h1>
         <button on:click={e => { $active.toggle() }}>toggle active</button>
         <button on:click={e => { $ready.toggle() }}>toggle ready</button>
         <hr></hr>
         <div class='container' ref={$container}>
            {If($active,
               <div at:mounted={transitionIn} at:unmount={transitionOut}>
                  oh
                  <h2>hi</h2>
                  <h2>hope</h2>
                  {/* {If($ready,
                     <p>ready</p>
                  )} */}
               </div>
            )}
            {ElseIf($ready,
               <div at:mounted={transitionIn} at:unmount={transitionOut}>
                  low
                  <h2>balloon</h2>
               </div>
            )}
            {Else(
               <div at:mounted={transitionIn} at:unmount={transitionOut}>
                  so
                  <h2>bye</h2>
               </div>
            )}
         </div>
         {Style`

            .container {
               overflow: hidden;
            }

            .fade-in-active {
               transition: opacity var(--fade-in-duration) var(--fade-in-timing);
            }

            .fade-out-to-0 {
               opacity: 0;
               transition: opacity var(--fade-out-duration) var(--fade-out-timing);
            }

            .fade-in-from-0 {
               opacity: 0;
            }

            .cancel-transition {
               opacity: 0;
               transition: opacity 500ms;
            }


@keyframes fade-in {
   from {
      opacity: 0;
   }

   to {
      opacity: 1;
   }
}

@keyframes fade-out {
   from {
      opacity: 1;
   }

   to {
      opacity: 0;
   }
}

.animate-out {
   animation: fade-out 2000ms ease-in;
}

.animate-in {
   animation: fade-in 2000ms ease-in;
}

.cancel-animation {
 animation: fade-out 500ms ease-in;
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
