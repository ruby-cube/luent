import { isObject } from "@rue/utils"
import { DOMNode } from "../../../../packages/luent/src/node/VineNode"
import { getActiveFlask } from "@rue/flask"
import { atAttach, beforeDetach, atRender, queueTask } from "@rue/luent"

// class-based
type VarKit = {
   duration?: string
   timing?: string
   delay?: string
}

type PrefixKit = {
   as?: 'transition' | 'animation'
   name: string
} & VarKit

// ---

type TransitionInClassKit = {
   active: string, // fade-in
   from: string // 
} & VarKit

type TransitionOutClassKit = {
   active?: string
   to: string
} & VarKit

type AnimationClassKit = {
   class: string
} & VarKit

const fadeIn = Transition(() => ({
   property: 'opacity',
   from: '0',
}))

type TransitionInKit = TransitionInClassKit | TransitionInStyleKit | PrefixKit | AnimationClassKit | AnimationStyleKit
type TransitionOutKit = TransitionOutClassKit | TransitionOutStyleKit | PrefixKit | AnimationClassKit | AnimationStyleKit

type TransitionConfig = {
   'transition-in'?: TransitionInKit | TransitionInKit[]
   'transition-out'?: TransitionOutKit | TransitionOutKit[]
}

function setUpTransitionKits(node: DOMNode, kits: TransitionInKit[],
   setUpTransition: {
      withStyles: Function,
      withClasses: Function,
      withAnimationStyle: Function,
      withAnimationClass: Function
   },
   toClassKit: {
      transition: Function,
      animation: Function
   }
) {
   for (const kit of kits) {
      if ('name' in kit) {
         if ('as' in kit && kit.as === 'animation') {
            setUpTransition.withAnimationClass(node, toClassKit.animation(kit))
         }
         else {
            setUpTransition.withClasses(node, toClassKit.transition(kit))
         }
      }
      else if ('active' in kit) {
         setUpTransition.withClasses(node, kit)
      }
      else if ('class' in kit) {
         setUpTransition.withAnimationClass(node, kit)
      }
      else if ('property' in kit) {
         // transition style
         setUpTransition.withStyles(node, kit)
      }
      else if ('animation' in kit) {
         setUpTransition.withAnimationStyle(node, kit)
      }
      else {
         throw new Error('Invalid Transition kit')
      }
   }
}


function toTransitionInClassKit(kit: PrefixKit): TransitionInClassKit {
   const { name, delay, duration, timing } = kit
   return {
      active: name + '-in-active',
      from: name + '-in-from',
      delay,
      duration,
      timing
   }
}

function toTransitionOutClassKit(kit: PrefixKit): TransitionOutClassKit {
   const { name, delay, duration, timing } = kit
   return {
      active: name + '-out-active',
      to: name + '-out-to',
      delay,
      duration,
      timing
   }
}


function toAnimateInClassKit(kit: PrefixKit): AnimationClassKit {
   const { name, delay, duration, timing } = kit
   return {
      class: name + '-in',
      delay,
      duration,
      timing
   }
}

function toAnimateOutClassKit(kit: PrefixKit): AnimationClassKit {
   const { name, delay, duration, timing } = kit
   return {
      class: name + '-out',
      delay,
      duration,
      timing
   }
}

type ActiveTransitionIn = {
   trigger(): void;
   setStartingState(): void;
   cancel(): void;
}

type ActiveTransitionOut = {
   trigger(): void;
   // setToState(): void;
   // cancel(): void;
}

function useTransitionInByClasses(kit: TransitionInClassKit) {
   return function createTransition(node: HTMLElement) {
      const { active, from, delay, duration, timing, cancelTransition } = kit
      let cancelled = false;
      return {
         trigger() {
            if (cancelled) return;
            node.classList.add(active)
            if (duration) node.style.setProperty('transition-duration', duration)
            if (delay) node.style.setProperty('transition-delay', delay)
            if (timing) node.style.setProperty('transition-timing', timing)
            node.classList.remove(from)
         },
         setStartingState() {
            node.classList.add(from)
         },
         cancel() {
            if (cancelled) return;
            cancelled = true;
            cancelTransition(node)
         }
      }
   }
}

function useTransitionOutByClasses(kit: TransitionOutClassKit) {
   return function createTransition(node: HTMLElement) {
      const { active, to, delay, duration, timing } = kit
      return {
         trigger() {
            if (active) node.classList.add(active)
               // TODO: or use var()???
            if (duration) node.style.setProperty('transition-duration', duration)
            if (delay) node.style.setProperty('transition-delay', delay)
            if (timing) node.style.setProperty('transition-timing', timing)
            node.classList.add(to)
         }
      }
   }
}






export function setUpTransitions(node: HTMLElement, createTransitionIn: (clone: DOMNode) => ActiveTransitionIn, createTransitionOut: (clone: DOMNode) => ActiveTransitionOut) {
   const transitioning = new Set<ActiveTransitionIn>()

   atAttach(() => {
      transitionIn(node, createTransitionIn, transitioning)
   })

   beforeDetach(() => {
      transitionOut(node, createTransitionOut, transitioning)
   })
}


function transitionIn(node: HTMLElement, createTransition: (clone: DOMNode) => ActiveTransitionIn, transitioning: Set<ActiveTransitionIn>) {
   console.log('transition in')

   const clone = node.cloneNode(true) as HTMLElement


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

   const transition = createTransition(clone)
   transitioning.add(transition)
   // set starting transition state
   transition.setStartingState()
   // clone.classList.add(transition_in_from)

   node.after(clone)

   requestAnimationFrame(() => { // THIS IS IMPORTANT... ensures browser doesn't batch changes, preventing transition
      queueTask(() => {
         // trigger transition
         transition.trigger()
         // clone.classList.add(transition_in_active)
         // clone.classList.remove(transition_in_from)


         clone.addEventListener('transitionend', () => {
            node.style.removeProperty('visibility')
            clone.remove();
            transitioning.delete(transition)
            observer.disconnect()
         })
      })
   })
}

function transitionOut(node: HTMLElement, createTransition: (clone: DOMNode) => ActiveTransitionOut, transitioning: Set<ActiveTransitionIn>) {
   if (transitioning?.size) {
      for (const transition of transitioning) {
         transition.cancel()
         transitioning.delete(transition)
      }
   }

   // - read dims of prev node
   const rect = node.getBoundingClientRect()
   const parent = node.parentNode
   const clone = node.cloneNode(true) as HTMLElement

   atRender(() => {
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
            createTransition(clone).trigger()

            clone.addEventListener('transitionend', () => {
               clone.remove();
            })
         })
      })
   })
}


// prefix-classes
// <div transition-in={{ name: 'fade', duration: '300ms'}}

// classes
// <div transition-in={{ delay: '30ms', active: 'fade-in-active', from: 'fade-in-from', duration: '300ms'}}

// <div {...fadeInOut.delay(30)('300ms ease')}>

// <div {...fadeInOut('3000ms')}>

// styles
// <div transition-in={{ property: 'opacity', from:'0', duration: '300ms' }}

// style-based

type TransitionSpecs = {
   duration?: string
   timing?: string
   delay?: string
}

type TransitionInStyleKit = {
   property: string
   from: string
} & TransitionSpecs

type TransitionOutStyleKit = {
   property: string
   to: string
} & TransitionSpecs

type AnimationSpecs = {
   direction?: string
   iteration?: string
   endState?: string // fill-mode
} & TransitionSpecs

type AnimationStyleKit = {
   animation: string // keyframes name e.g. fade-in
} & AnimationSpecs

// <div transition-in="opacity 300ms ease"

function Transition(fn: (...details?: any[]) => TransitionInStyleKit | TransitionInClassKit | TransitionOutStyleKit | TransitionOutClassKit | AnimationStyleKit | AnimationClassKit) {
   return (one?: any, two?: any, three?: any) => {
      const details = fn.length & one instanceof Array ? one : undefined
      const specs = details ? typeof two === 'string' ? two : undefined : typeof one === 'string' ? one : undefined
      const other = one && one !== details && one !== specs ? other : two && two !== specs ? two : three ? three : undefined

      const [a, b, c] = specs?.split(' ') ?? []
      const delayed = a.endsWith('-delay')

      const delay = delayed ? a : undefined
      const duration = delayed ? b : a
      const timing = delayed ? c : b

      const kit = fn(...details)

      kit.delay = delay ?? kit.delay
      kit.duration = duration ?? kit.duration
      kit.timing = timing ?? kit.timing

      if (other) {
         return [kit, ...other]
      }
      return [kit]
   }
}




function getTransitionClasses(str: string, type: 'transition' | 'animation', direction: 'in' | 'out') {
   const strings = str.split(" ")
   return strings
      .map(string => string.endsWith('...') ? toTransitionClass(getPrefix(string),) : string)
}




function toAnimationClass(prefix: string) {

}



// (<>
//    <div {...fadeIn('30s', slideLeft(['30px'], '300ms'))} />
// </>)


// animate-in="fade... slide..."
// animate-out="fade..."
// animate-order='in-out'

// transition-in="fade... slide..."
// transition-out="fade..."
// transition-order='in-out' | 'out-in 

// transition-in="fade..."
// transition-out="fade..."

// CLASSES
// .fade-in-active { transition: ... }
// .fade-in-from { opacity: 0 }
// .fade-out-to { transition: ...; opacity: 0 }

// fade-in-duration="1000ms"
// slide-in-duration="2000ms"

// var(--fade-in-duration)

// animate-in-out="fade"
// animate-in="fade"
// animate-out="fade"

// .fade-in { animation: ... }
// .fade-out { animation: ... }


// ANIMATION SYNTAX (ends in -in or -out)
// in="fade-in"
// out="fade-out"

// TRANSITION SYNTAX (contains in-from)
// in="fade-in-from-0"
// out="fade-out-to-0"



// use scss mixins and/or extends to rename existing classes
// // _class-one.scss
// @mixin class-one {
//   color: red;
//   padding: 1rem;
// }

// // main.scss
// @use "class-one" as *;

// .class-two {
//   @include class-one;
// }



// transit-key={todo.id}
// transit-port="todos"


// as='ul'
// in="fade-in slide-in"
// out="fade-out"
// order='in-out' | 'out-in 
// duration="1000ms"

// keyframes-in="fade-in"
// keyframes-out="fade-out"

// transit-key={todo.id}
// transit-port="todos"

