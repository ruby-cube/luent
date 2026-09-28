import { awaitRender, queueTask, toValue } from "@luent/quarky"
import { IonOr } from "../component/bindings-types"
import { atAttach, atUnmount, beforeDetach } from "../flask/flask-hooks"
import { setUpPositionTransition, setUpTransit } from "./transit"
import { createStack } from "@luent/utils"
import { Flask, getFlask } from "@luent/flask"
import { inShadow } from "../component/shadow"
import { css, Style } from "../component/Style"

const END_EVENT_FALLBACK_BUFFER_MS = 50

const transitioningOut: Set<Flask> = new Set()
export function isTransitioningOut(flask: Flask) {
  return transitioningOut.has(flask)
}

export interface TransitionBindings extends BaseTransitionBindings {
  'in'?: true | IonOr<string>
  'out'?: true | IonOr<string>
  'from'?: IonOr<string>
  'to'?: IonOr<string>
}

interface BaseTransitionBindings {
  'animate-item'?: boolean | IonOr<string>
  'transition-item'?: boolean | IonOr<string>

  'transit-class'?: IonOr<string>
  'transit-key'?: any
  'transit-port'?: any

  'animate-intro'?: true | IonOr<string>
  'animate-in'?: true | IonOr<string>
  'animate-out'?: true | IonOr<string>
  'animate-in-out'?: true

  'in-out'?: boolean | IonOr<string>
  'from-to'?: IonOr<string>
}
export interface TransitionConfigs extends BaseTransitionBindings {
  'transition-in'?: true | IonOr<string>
  'transition-out'?: true | IonOr<string>
  'transition-from'?: IonOr<string>
  'transition-to'?: IonOr<string> // ?? TODO:
}

// TODO: add transition in and out classes like animate in out


export const [markInitialRender, unmarkInitialRender, isInitialRender] = createStack<boolean>()

let ANIMATE_IN: string;
function useAnimateIn() {
  if (!ANIMATE_IN || inShadow()) {
    const className = 'luent-animate-in'
    insertCSSRule('@keyframes luent-fade-in', "from { opacity: 0; } to { opacity: 1; }")

    insertCSSRule('.' + className, "animation: 500ms cubic-bezier(0.55, 0, 0.1, 1) luent-fade-in;")
    if (!inShadow()) ANIMATE_IN = className
    return className;
  }
  return ANIMATE_IN
}

let ANIMATE_OUT: string;
function useAnimateOut() {
  if (!ANIMATE_OUT || inShadow()) {
    const className = 'luent-animate-out'
    insertCSSRule('@keyframes luent-fade-out', "from { opacity: 1; } to { opacity: 0; }")
    insertCSSRule('.' + className, "animation: 500ms cubic-bezier(0.55, 0, 0.1, 1) luent-fade-out; z-index: -1;")
    if (!inShadow()) ANIMATE_OUT = className
    return className;
  }

  return ANIMATE_OUT
}

let TRANSITION_IN_OUT: string;
function useTransitionInOut() {
  if (!TRANSITION_IN_OUT || inShadow()) {
    const className = 'luent-in-out'
    insertCSSRule('.' + className, "transition: opacity 500ms cubic-bezier(0.55, 0, 0.1, 1);")
    if (!inShadow()) TRANSITION_IN_OUT = className
    return className;
  }
  return TRANSITION_IN_OUT
}

let TRANSITION_TO_FROM: string;
function useTransitionToFrom() {
  if (!TRANSITION_TO_FROM || inShadow()) {
    const className = 'luent-transition-to-from'
    insertCSSRule('.' + className, "opacity: 0;")
    if (!inShadow()) TRANSITION_TO_FROM = className
    return className;
  }
  return TRANSITION_TO_FROM
}



let TRANSITION_POSITION: string;

function useTransitionPosition() {
  if (!TRANSITION_POSITION || inShadow()) {
    const className = 'luent-transition-position'
    insertCSSRule('.' + className, "transition: transform 200ms ease-in-out;")
    if (!inShadow()) TRANSITION_POSITION = className
    return className;
  }
  return TRANSITION_POSITION
}

function insertCSSRule(name: string, rule: string) {
  const style = useTransitionStyleElement()
  awaitRender(() => {
    const stylesheet = style.sheet
    if (!stylesheet) throw new Error('style element not attached to DOM')
    stylesheet.insertRule(`${name} { ${rule} }`, stylesheet.cssRules.length)
  })
}

const transitionStylesheets = new Map<HTMLHeadElement | ShadowRoot, { count: number, style: HTMLStyleElement }>()

export function useTransitionStyleElement() {
  const host = inShadow() ?? document.head
  const existing = transitionStylesheets.get(host)
  if (existing) {
    existing.count++
    return existing.style
  }
  const style = document.createElement('style');
  style.id = 'luent-transitions'
  host.appendChild(style)
  const entry = { count: 1, style }
  transitionStylesheets.set(host, { count: 1, style })
  atUnmount(() => {
    entry.count--;
    if (!entry.count) {
      transitionStylesheets.delete(host)
    }
  })
  return style;
}

export function setUpTransitions(node: HTMLElement, transitions: TransitionConfigs) {
  const transitioning = new Set<ActiveTransitionIn>()
  const initialRender = isInitialRender()
  const animateInOut = transitions['animate-in-out']
  const animateIn = transitions['animate-in'] ?? animateInOut
  const animateInClasses = animateIn === true ? useAnimateIn() : animateIn as IonOr<string>
  const animateOut = transitions['animate-out'] ?? animateInOut
  const animateOutClasses = animateOut === true ? useAnimateOut() : animateOut
  const animateIntro = transitions['animate-intro']
  const animateIntroClasses = animateIntro === true ? animateInClasses : animateIntro as IonOr<string>

  const animateItem = transitions['animate-item']
  const animateItemClasses = animateItem === true ? undefined : animateItem
  const transitionItem = transitions['transition-item']
  const transitionItemClasses = transitionItem === true || animateItem === true ? useTransitionPosition() : transitionItem
  const transitKey = transitions['transit-key']
  const transitClasses = transitions['transit-class'] ?? transitKey ? useTransitionPosition() : undefined
  const transitPort = transitions['transit-port']

  const _transitionIn = transitions['transition-in']
  const _transitionOut = transitions['transition-out']
  const _transitionInOut = transitions['in-out']
  const _transitionFromTo = transitions['from-to']
  const transitionInClasses = _transitionIn === true || _transitionInOut === true ? useTransitionInOut() : _transitionIn ?? _transitionInOut
  const fromClasses = (_transitionIn || _transitionInOut) ? (transitions['transition-from'] ?? _transitionFromTo ?? useTransitionToFrom()) : undefined
  const transitionOutClasses = _transitionOut === true || _transitionInOut === true ? useTransitionInOut() : _transitionOut ?? _transitionInOut
  const toClasses = (_transitionOut || _transitionInOut) ? (transitions['transition-to'] ?? _transitionFromTo ?? useTransitionToFrom()) : undefined

  if (animateInClasses || transitionInClasses) {
    atAttach(() => {
      if (!animateIntro && initialRender) return;
      transitionIn(node, (clone) => {
        let endTransition: () => void
        let cancelTransition: () => void

        return {
          cancel() {
            cancelTransition()
          },
          start() {
            let transitionCount = 0
            if (!initialRender && animateIn) {
              transitionCount++
              startAnimateIn(clone, toClassNames(toValue(animateInClasses)), onEnd)
            }
            else if (initialRender && animateIntro) {
              transitionCount++
              startAnimateIn(clone, toClassNames(toValue(animateIntroClasses)), onEnd)
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
    const flask = getFlask()

    beforeDetach(() => {
      transitioningOut.add(flask)

      transitionOut(node, (clone) => {
        let endTransition: () => void
        return {
          start() {
            let transitionCount = 0
            if (animateOutClasses) {
              transitionCount++
              startAnimateOut(clone, toClassNames(toValue(animateOutClasses)), onEnd)
            }
            if (transitionOutClasses && toClasses) {
              transitionCount++
              startTransitionOut(clone, toClassNames(toValue(toClasses)), toClassNames(toValue(transitionOutClasses)), onEnd)
            }

            function onEnd() {
              transitionCount--
              if (transitionCount === 0) {
                flask.emitDiscard()
                // queueTask(() => {
                transitioningOut.delete(flask)
                // })
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
  if (transitionItemClasses) { // must check transitionItemClasses instead of transitionItem in order to include animateItem
    setUpPositionTransition(node, transitionItemClasses)
  }
  if (transitKey) {
    setUpTransit(node, transitKey, transitPort, transitClasses)
  }
}

function positionClone(clone: HTMLElement, node: HTMLElement) {
  const rect = node.getBoundingClientRect()

  clone.style.setProperty('position', 'fixed')

  clone.style.setProperty('top', rect.top + 'px') // FIX: margin collapsing doesn't get applied, causing inaccurate positioning
  clone.style.setProperty('left', rect.left + 'px')
  clone.style.setProperty('width', rect.width + 'px')
  clone.style.setProperty('height', rect.height + 'px')
  clone.style.setProperty('margin', 'unset', 'important')
}
// function positionClone(clone: HTMLElement, node: HTMLElement) {
//   const rect = node.getBoundingClientRect()
//   return awaiting(computePosition(node, clone), ({ x, y }) => {
//     clone.style.setProperty('position', 'absolute')
//     clone.style.setProperty('top', x + 'px') // FIX: Why do I need to add 16px for transition out to be correct?
//     clone.style.setProperty('left', y + 'px')
//     clone.style.setProperty('width', rect.width + 'px')
//     clone.style.setProperty('height', rect.height + 'px')
//   })
// }


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

// function _transitionIn(node: HTMLElement, createTransition: (clone: HTMLElement) => ActiveTransitionIn, transitioning: Set<ActiveTransitionIn>) {
//   const clone = node.cloneNode(true) as HTMLElement

//   // - read dims of new node (must read before hiding new node)
//   const rect = node!.getBoundingClientRect()


//   // I forget why I have this... I think it has to do with cancelling transitions?
//   // const observer = new MutationObserver(() => {
//   //    observer.disconnect()
//   //    node.style.removeProperty('visibility')
//   //    clone.style.setProperty('visibility', 'hidden')
//   // })
//   // observer.observe(node, { childList: true, attributes: true, characterData: true, subtree: true })

//   // - position newClone
//   // const clone =cloneForTransition(node)
//   positionClone(clone, rect)



//   // -------
//   const transition = createTransition(clone)
//   transitioning.add(transition)

//   // ----
//   node.after(clone)
//   node.style.setProperty('visibility', 'hidden') // TODO: restore

//   transition.start()
//   // set starting transition state
//   // clone.classList.add(transition_in_from)

//   transition.onEnd(() => {
//     node.style.removeProperty('visibility')
//     clone.remove();
//     transitioning.delete(transition)
//     // observer.disconnect()
//   })
//   transition.onCancel(() => {
//     clone.remove();
//     transitioning.delete(transition)
//   })
// }
function transitionOut(node: HTMLElement, createTransition: (clone: HTMLElement) => ActiveTransitionOut, transitioning: Set<ActiveTransitionIn>) {
  if (transitioning?.size) {
    for (const transition of transitioning) {
      transition.cancel()
      transitioning.delete(transition)
    }
  }

  const clone = node.cloneNode(true) as HTMLElement
  node.after(clone)
  positionClone(clone, node)
  clone.style.removeProperty('visibility')

  awaitRender(() => {
    const transition = createTransition(clone)
    transition.start()

    transition.onEnd(() => {
      clone.remove();
    })
  })
}

// function transitionOut(node: HTMLElement, createTransition: (clone: HTMLElement) => ActiveTransitionOut, transitioning: Set<ActiveTransitionIn>) {
//   if (transitioning?.size) {
//     for (const transition of transitioning) {
//       transition.cancel()
//       transitioning.delete(transition)
//     }
//   }


//   const clone = node.cloneNode(true) as HTMLElement
//   clone.style.removeProperty('visibility')
//   node.after(clone)
//   // - position clone
//   awaiting(positionClone(clone, node), () => {

//     awaitRender(() => {
//       const transition = createTransition(clone)
//       transition.start()

//       transition.onEnd(() => {
//         clone.remove();
//       })
//     })
//   })
// }

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
        classes.forEach(className => clone.classList.remove(className))
        emitTransitionEnd()
      })
    })
  })
}

function startTransitionOut(clone: HTMLElement, endClasses: string[], classes: string[], emitTransitionEnd: () => void) {
  requestAnimationFrame(() => { // THIS IS IMPORTANT... ensures browser doesn't batch changes, preventing transition
    queueTask(() => {
      classes.forEach(className => clone.classList.add(className))
      endClasses.forEach(className => clone.classList.add(className))
      onTransitionEnd(clone, () => {
        emitTransitionEnd()
      })
    })
  })
}



