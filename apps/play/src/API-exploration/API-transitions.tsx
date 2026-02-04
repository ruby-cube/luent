import { isObject } from "@rue/utils"
import { DOMNode } from "../../../../packages/lumo/src/node/VineNode"
import { getActiveFlask } from "@rue/flask"
import { atMounted } from "@rue/lumo"

// class-based
type VarKit = {
   duration?: string
   timing?: string
   delay?: string
}

type PrefixKit = {
   as?: 'transition' | 'animation'
   prefix: string
} & VarKit

// ---

type TransitionInClassKit = {
   active: string,
   from: string
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

function setUpTransition(node: DOMNode, kits: TransitionInKit[],
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
      if ('prefix' in kit) {
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

function setUpTransitionInClasses(node: DOMNode, kit: TransitionInClassKit) {
   atMounted(() => {
      
   })
}

function toTransitionInClassKit(kit: PrefixKit): TransitionInClassKit {
   const { prefix, delay, duration, timing } = kit
   return {
      active: prefix + '-in-active',
      from: prefix + '-in-from',
      delay,
      duration,
      timing
   }
}

function toTransitionOutClassKit(kit: PrefixKit): TransitionOutClassKit {
   const { prefix, delay, duration, timing } = kit
   return {
      active: prefix + '-out-active',
      to: prefix + '-out-to',
      delay,
      duration,
      timing
   }
}


function toAnimateInClassKit(kit: PrefixKit): AnimationClassKit {
   const { prefix, delay, duration, timing } = kit
   return {
      class: prefix + '-in',
      delay,
      duration,
      timing
   }
}

function toAnimateOutClassKit(kit: PrefixKit): AnimationClassKit {
   const { prefix, delay, duration, timing } = kit
   return {
      class: prefix + '-out',
      delay,
      duration,
      timing
   }
}

// prefix-classes
// <div transition-in={{ prefix: 'fade', duration: '300ms'}}

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

