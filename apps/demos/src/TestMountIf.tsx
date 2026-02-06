import { getActiveFlask } from "@rue/flask";
import { component, If, Else, fade, ElseIf, slide, Transition, Transit, SYNC, tick, Style, NodeRef, atMounted, $Node } from "@rue/lumo";
import { debug, getActiveUpdate, instantUpdate, Ion, ooo, queueRender, queueTask, toValue, watch } from "@rue/quarky";
import "./style.css"


export function TestMountIf() {

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

   const $green = Ion(200, {
      decrement() {
         this.value -= 20
      }
   })

   const $container = NodeRef('div')

   const transitioningInMap = new WeakMap<HTMLElement, Set<HTMLElement>>()

   function transitionIn(node: HTMLElement) {
      console.log('transition in')
      const transitioningIn = transitioningInMap.get(node) || new Set()
      transitioningInMap.set(node, transitioningIn)

      const clone = node.cloneNode(true) as HTMLElement
      transitioningIn.add(clone)

      // - read dims of new node (must read before hiding new node)
      const rect = node!.getBoundingClientRect()

      node.style.setProperty('visibility', 'hidden')

      const observer = new MutationObserver(() => {
         observer.disconnect()
         node.style.removeProperty('visibility')
         clone.style.setProperty('visibility', 'hidden')
      })
      observer.observe(node, { childList: true, attributes: true, characterData: true, subtree: true })

      // - position newClone
      clone.style.removeProperty('visibility')
      clone.style.setProperty('position', 'absolute')//TODO: fixed? absolute?
      clone.style.setProperty('top', rect.top + 'px')
      clone.style.setProperty('left', rect.left + 'px')
      clone.style.setProperty('width', rect.width + 'px')
      clone.style.setProperty('height', rect.height + 'px')

      // set starting transition state
      clone.classList.add(transition_in_from)

      node.after(clone)

      requestAnimationFrame(() => { // THIS IS IMPORTANT... ensures browser doesn't batch changes, preventing transition
         queueTask(() => {
            // trigger transition
            clone.classList.add(transition_in_active)
            clone.classList.remove(transition_in_from)

            clone.addEventListener('transitionend', () => {
               node.style.removeProperty('visibility')
               clone.remove();
               transitioningIn.delete(clone)
               observer.disconnect()
            })
         })
      })
   }

   const transition_in_from = 'fade-in-from-0'
   const transition_in_active = 'fade-in-active'

   const transition_out_to = 'fade-out-to-0'
   const transition_out_active = ""
   const cancel_transition = 'cancel-transition'

   function transitionOut(node: HTMLElement) {
      const transitioning = transitioningInMap.get(node)
      if (transitioning?.size) {
         for (const clone of transitioning) {
            // transition.cancel()
            clone.classList.add('cancel-transition')
            transitioning.delete(clone)
         }
      }

      // - read dims of prev node
      const rect = node.getBoundingClientRect()
      const parent = node.parentNode
      const clone = node.cloneNode(true) as HTMLElement

      queueRender(() => {
         // - position clone
         clone.style.removeProperty('visibility')
         clone.style.setProperty('position', 'fixed')
         clone.style.setProperty('top', rect.top + 'px')
         clone.style.setProperty('left', rect.left + 'px')
         clone.style.setProperty('width', rect.width + 'px')
         clone.style.setProperty('height', rect.height + 'px')

         parent?.appendChild(clone)

         requestAnimationFrame(() => { // THIS IS IMPORTANT... ensures browser doesn't batch changes, preventing transition
            queueTask(() => {
               if (transition_out_active) clone.classList.add(transition_out_active)
               clone.classList.add(transition_out_to)

               clone.addEventListener('transitionend', () => {
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
         <button on:click={() => ($green.decrement(), $name.value += '!')}>shout</button>
         <h1 style={{ color: (`rgb(200 ${$green()} 200)`) }}>Hello {$name}</h1>
         <button on:click={e => { $active.toggle() }}>toggle active</button>
         <button on:click={e => { $ready.toggle() }}>toggle ready</button>
         <hr></hr>
         <div class='container' ref={$container}>
            {If($active,
               <div at:mounted={transitionIn} at:unmount={transitionOut}>
                  oh
                  <h2>hi</h2>
                  {If($ready,
                     <p>ready</p>
                  )}
               </div>
            )}
            {ElseIf($ready,
               <div at:mounted={transitionIn} at:unmount={transitionOut}>
                  two peas in a pod
                  <h2>🤢🤢</h2>
               </div>
            )}
            {Else(
               <div at:mounted={transitionIn} at:unmount={transitionOut}>
                  ok
                  <h2>bye</h2>
               </div>
            )}
         </div>
      </div>
   )
      .css`
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
      `
}
