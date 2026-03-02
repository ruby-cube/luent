import { queueRender, queueTask, toValue } from "@rue/quarky"
import { AnyObject } from "@rue/types"
import { MaybeIon } from "../component/Input"
import { atMounted, atUnmount } from "../flask/flask-hooks"
import { getTransition } from "./Transition"
import { setUpPositionTransition, setUpTransit } from "./transit"

const END_EVENT_FALLBACK_BUFFER_MS = 50

// function animateIn(node: HTMLElement) {
//    node.classList.add('animate-in')
//    node.addEventListener('animationend', () => {
//       node.classList.remove('animate-in')
//    })
// }

// function animateOut(node: HTMLElement, container: HTMLElement) {
//    const rect = node.getBoundingClientRect()
//    const clone = node.cloneNode(true) as HTMLElement
//    clone.style.setProperty('position', 'fixed')
//    clone.style.setProperty('top', rect.top - 16 + 'px')
//    clone.style.setProperty('left', rect.left + 'px')
//    clone.style.setProperty('width', rect.width + 'px')
//    clone.style.setProperty('height', rect.height + 'px')

//    container.appendChild(clone)

//    clone.classList.add('animate-out')
//    clone.addEventListener('animationend', () => {
//       clone.classList.remove('animate-out')
//       clone.remove()
//    })
// }


export type TransitionConfigs = {
   'initial:appear'?: boolean
   'animate-item'?: MaybeIon<string>
   'transition-item'?: MaybeIon<string>
   'transit-class'?: MaybeIon<string>
   'transit-key'?: any
   'transit-port'?: any
   'animate-in'?: MaybeIon<string>
   'animate-out'?: MaybeIon<string>
   'transition-in-from'?: MaybeIon<string>
   'transition-in'?: MaybeIon<string>
   'transition-out-to'?: MaybeIon<string> // ?? TODO:
   'transition-out'?: MaybeIon<string> // ?? TODO:
} & AnyObject

export function setUpTransitions(node: HTMLElement, transitions: TransitionConfigs, transitionConfig: TransitionConfigs | undefined) {
   const transitioning = new Set<ActiveTransitionIn>()

   const transitionItemClasses = transitions['transition-item'] ?? transitionConfig?.["transition-item"]
   const transitClasses = transitions['transit-class']
   const transitKey = transitions['transit-key']
   const transitPort = transitions['transit-port']
   const animateInClasses = transitions['animate-in'] ?? transitionConfig?.["animate-in"]
   const transitionInClasses = transitions['transition-in'] ?? transitionConfig?.["transition-in"]
   const fromClasses = transitions['transition-in-from'] ?? transitionConfig?.["transition-in-from"]
   const animateOutClasses = transitions['animate-out'] ?? transitionConfig?.["animate-out"]
   const transitionOutClasses = transitions['transition-out'] ?? transitionConfig?.["transition-out"]// TODO: ?? not sure
   const toClasses = transitions['transition-out-to'] ?? transitionConfig?.["transition-out-to"]// TODO: ??? not sure

   if (animateInClasses || transitionInClasses) {
      atMounted(() => {

         transitionIn(node, (clone) => {
            let endTransition: () => void
            let cancelTransition: () => void

            return {
               cancel() {
                  cancelTransition()
               },
               start() {
                  let transitionCount = 0
                  if (animateInClasses) {
                     transitionCount++
                     startAnimateIn(clone, toClassNames(toValue(animateInClasses)), onEnd)
                  }
                  if (transitionInClasses && fromClasses) {
                     transitionCount++
                     startTransitionIn(clone, toClassNames(toValue(fromClasses)), toClassNames(toValue(transitionInClasses)), onEnd)
                  }
                  function onEnd() {
                     transitionCount--
                     if (transitionCount === 0) {
                        endTransition()
                     }
                  }
               },
               onEnd(task: () => void) {
                  endTransition = task
               },
               onCancel(task: () => void) {
                  cancelTransition = task;
               }
            }
         }, transitioning)
      })
   }
   if (animateOutClasses || transitionOutClasses) {
      atUnmount(() => {
         transitionOut(node, (clone) => {
            let endTransition: () => void
            return {
               start() {
                  let transitionCount = 0
                  if (animateOutClasses) {
                     transitionCount++
                     startAnimateOut(clone, toClassNames(toValue(animateOutClasses)), onEnd)
                  }
                  if (transitionOutClasses) {
                     transitionCount++
                     startTransitionOut(clone, toClassNames(toValue(transitionOutClasses)), onEnd)
                  }

                  function onEnd() {
                     transitionCount--
                     if (transitionCount === 0) {
                        endTransition()
                     }
                  }
               },
               onEnd(task: () => void) {
                  endTransition = task;
               }
            }
         }, transitioning)
      })
   }
   if (transitionItemClasses) {
      setUpPositionTransition(node, transitionItemClasses)
   }
   if (transitKey) {
      setUpTransit(node, transitKey, transitPort, transitClasses)
   }
}

function positionClone(clone: HTMLElement, rect: DOMRect) {
   clone.style.setProperty('position', 'absolute')
   clone.style.setProperty('top', rect.top + 'px')
   clone.style.setProperty('left', rect.left + 'px')
   clone.style.setProperty('width', rect.width + 'px')
   clone.style.setProperty('height', rect.height + 'px')
}


// function getVisualAnchorRect(root: HTMLElement) {
//    let top = Number.POSITIVE_INFINITY
//    let left = Number.POSITIVE_INFINITY

//    const walker = document.createTreeWalker(root, NodeFilter.SHOW_ELEMENT)
//    let current = walker.currentNode as Element

//    while (current) {
//       const el = current as HTMLElement
//       const rect = el.getBoundingClientRect()
//       if (rect.width > 0 || rect.height > 0) {
//          if (rect.top < top) top = rect.top
//          if (rect.left < left) left = rect.left
//       }
//       current = walker.nextNode() as Element
//    }

//    const fallback = root.getBoundingClientRect()
//    return {
//       top: Number.isFinite(top) ? top : fallback.top,
//       left: Number.isFinite(left) ? left : fallback.left,
//    }
// }


// export function cloneForTransition(node: HTMLElement) {
//    const sourceRect = node.getBoundingClientRect()
//    const sourceAnchor = getVisualAnchorRect(node)
//    const sourceTop = sourceRect.top + window.scrollY
//     const sourceLeft = sourceRect.left + window.scrollX

//    const clone = node.cloneNode(true) as HTMLElement;
//    clone.style.setProperty('position', 'absolute')
//    clone.style.setProperty('top', sourceTop + 'px')
//    clone.style.setProperty('left', sourceLeft + 'px')
//    clone.style.setProperty('width', sourceRect.width + 'px')
//    clone.style.setProperty('height', sourceRect.height + 'px')
//    clone.style.setProperty('margin', '0')
//    clone.style.setProperty('box-sizing', 'border-box')
//    clone.style.setProperty('pointer-events', 'none')
//    clone.style.setProperty('z-index', '2147483647')

//    // node.after(clone)
//    document.body.append(clone)

//    const cloneAnchor = getVisualAnchorRect(clone)
//    const topCorrection = sourceAnchor.top - cloneAnchor.top
//    const leftCorrection = sourceAnchor.left - cloneAnchor.left

//    if (topCorrection || leftCorrection) {
//       clone.style.setProperty('top', sourceRect.top + topCorrection + 'px')
//       clone.style.setProperty('left', sourceRect.left + leftCorrection + 'px')
//    }

//    return clone
// }

type ActiveTransitionIn = {
   start(): void;
   cancel(): void;
   onEnd(task: () => void): void;
   onCancel(task: () => void): void;
}

type ActiveTransitionOut = {
   start(): void;
   onEnd(task: () => void): void;
}

// function transitionIn(node: HTMLElement, createTransition: (clone: HTMLElement) => ActiveTransitionIn, transitioning: Set<ActiveTransitionIn>) {

// }


function transitionIn(node: HTMLElement, createTransition: (clone: HTMLElement) => ActiveTransitionIn, transitioning: Set<ActiveTransitionIn>) {
   // -------
   const transition = createTransition(node)
   transitioning.add(transition)

   // ----

   transition.start()
   // set starting transition state
   // clone.classList.add(transition_in_from)

   transition.onEnd(() => {
      transitioning.delete(transition)
      // observer.disconnect()
   })
   transition.onCancel(() => {
      transitioning.delete(transition)
   })
}

function _transitionIn(node: HTMLElement, createTransition: (clone: HTMLElement) => ActiveTransitionIn, transitioning: Set<ActiveTransitionIn>) {
   const clone = node.cloneNode(true) as HTMLElement

   // - read dims of new node (must read before hiding new node)
   const rect = node!.getBoundingClientRect()


   // I forget why I have this... I think it has to do with cancelling transitions?
   // const observer = new MutationObserver(() => {
   //    observer.disconnect()
   //    node.style.removeProperty('visibility')
   //    clone.style.setProperty('visibility', 'hidden')
   // })
   // observer.observe(node, { childList: true, attributes: true, characterData: true, subtree: true })

   // - position newClone
   // const clone =cloneForTransition(node)
   positionClone(clone, rect)



   // -------
   const transition = createTransition(clone)
   transitioning.add(transition)

   // ----
   node.after(clone)
   node.style.setProperty('visibility', 'hidden') // TODO: restore

   transition.start()
   // set starting transition state
   // clone.classList.add(transition_in_from)

   transition.onEnd(() => {
      node.style.removeProperty('visibility')
      clone.remove();
      transitioning.delete(transition)
      // observer.disconnect()
   })
   transition.onCancel(() => {
      clone.remove();
      transitioning.delete(transition)
   })
}

function transitionOut(node: HTMLElement, createTransition: (clone: HTMLElement) => ActiveTransitionOut, transitioning: Set<ActiveTransitionIn>) {
   if (transitioning?.size) {
      for (const transition of transitioning) {
         transition.cancel()
         transitioning.delete(transition)
      }
   }

   // - read dims of prev node
   const rect = node.getBoundingClientRect()
   const clone = node.cloneNode(true) as HTMLElement
   node.after(clone)
   // - position clone
   positionClone(clone, rect)
   clone.style.removeProperty('visibility')

   queueRender(() => {

      const transition = createTransition(clone)
      transition.start()

      transition.onEnd(() => {
         clone.remove();
      })
   })
}

export function toClassNames(classString: string) {
   const classNames: string[] = []
   classString.split(' ').forEach(c => {
      const className = c.trim()
      if (className) classNames.push(className)
   })
   return classNames
}

function parseTimeToMs(value: string) {
   const trimmed = value.trim()
   if (!trimmed) return 0
   if (trimmed.endsWith('ms')) return Number.parseFloat(trimmed) || 0
   if (trimmed.endsWith('s')) return (Number.parseFloat(trimmed) || 0) * 1000
   return Number.parseFloat(trimmed) || 0
}

function getLongestTimingMs(durations: string, delays: string) {
   const durationList = durations.split(',').map(part => parseTimeToMs(part))
   const delayList = delays.split(',').map(part => parseTimeToMs(part))

   const maxCount = Math.max(durationList.length, delayList.length)
   if (maxCount === 0) return 0

   let longest = 0
   for (let i = 0; i < maxCount; i++) {
      const duration = durationList[i % durationList.length] ?? 0
      const delay = delayList[i % delayList.length] ?? 0
      const total = duration + delay
      if (total > longest) longest = total
   }
   return longest
}

function onAnimationEnd(node: HTMLElement, done: () => void) {
   const styles = getComputedStyle(node)
   const timeoutMs = getLongestTimingMs(styles.animationDuration, styles.animationDelay) + END_EVENT_FALLBACK_BUFFER_MS
   let completed = false

   const onEnd = () => {
      finish()
   }

   const timer = window.setTimeout(() => {
      finish()
   }, timeoutMs)

   function finish() {
      if (completed) return
      completed = true
      window.clearTimeout(timer)
      node.removeEventListener('animationend', onEnd)
      done()
   }

   node.addEventListener('animationend', onEnd, { once: true })
}

function onTransitionEnd(node: HTMLElement, done: () => void) {
   const styles = getComputedStyle(node)
   const timeoutMs = getLongestTimingMs(styles.transitionDuration, styles.transitionDelay) + END_EVENT_FALLBACK_BUFFER_MS
   let completed = false

   const onEnd = () => {
      finish()
   }

   const timer = window.setTimeout(() => {
      finish()
   }, timeoutMs)

   function finish() {
      if (completed) return
      completed = true
      window.clearTimeout(timer)
      node.removeEventListener('transitionend', onEnd)
      done()
   }

   node.addEventListener('transitionend', onEnd, { once: true })
}

function startAnimateIn(clone: HTMLElement, classes: string[], emitAnimationEnd: () => void) {
   classes.forEach(className => clone.classList.add(className))
   onAnimationEnd(clone, () => {
      classes.forEach(className => clone.classList.remove(className))
      emitAnimationEnd()
   })
}

function startAnimateOut(clone: HTMLElement, classes: string[], emitAnimationEnd: () => void) {
   classes.forEach(className => clone.classList.add(className))
   onAnimationEnd(clone, () => {
      classes.forEach(className => clone.classList.remove(className))
      emitAnimationEnd()
   })
}

function startTransitionIn(clone: HTMLElement, startClasses: string[], classes: string[], emitTransitionEnd: () => void) {
   startClasses.forEach(className => clone.classList.add(className))

   requestAnimationFrame(() => { // THIS IS IMPORTANT... ensures browser doesn't batch changes, preventing transition
      queueTask(() => {
         // trigger transition
         classes.forEach(className => clone.classList.add(className))
         startClasses.forEach(className => clone.classList.remove(className))

         onTransitionEnd(clone, () => {
            emitTransitionEnd()
         })
      })
   })
}

function startTransitionOut(clone: HTMLElement, classes: string[], emitTransitionEnd: () => void) {
   requestAnimationFrame(() => { // THIS IS IMPORTANT... ensures browser doesn't batch changes, preventing transition
      queueTask(() => {
         classes.forEach(className => clone.classList.add(className))
         onTransitionEnd(clone, () => {
            classes.forEach(className => clone.classList.remove(className))
            emitTransitionEnd()
         })
      })
   })
}



