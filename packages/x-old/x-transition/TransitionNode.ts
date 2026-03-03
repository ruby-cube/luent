import { renderPhasicNode, TransitionConfig } from "./x_PhasicNode";
import { createTransitionStyleSheet, getTransitionStylesheet, TransitionClasses, TransitionFunction, TransitionKit } from "./defineTransition";
import { AnimationClass, AnimationFunction, AnimationKit } from "./defineAnimation";
import { renderTransitNode } from "./TransitNode";
import { AnyObject } from "@rue/types";
import { Ion } from "@rue/quarky";
import { isFunction } from "@rue/utils";
import { NodeRef } from "../../lumo/src/node/NodeRef";
import { RenderSlot, FromTag } from "../../lumo/src/component/Input";

export type TransitionHook = {
   phase: 'in' | 'out'
}

export type TransitionNodeInput = {
   // children: (() => JSXNode) | JSXNode,
   with?: AnimationClass | TransitionClasses | TransitionConfig | TransitionConfig[];
   'load:with'?: true | AnimationClass | TransitionClasses | TransitionConfig | TransitionConfig[];
   'in:with'?: AnimationClass | TransitionClasses | TransitionConfig | TransitionConfig[];
   'out:with'?: AnimationClass | TransitionClasses | TransitionConfig | TransitionConfig[];
   onStart?: (hook: TransitionHook) => void;
   onEnd?: (hook: TransitionHook) => void;
   disable?: boolean | Ion<boolean>;
   Slot: RenderSlot
}

type TransitDelta = {
   x: number;
   y: number;
   scaleX: number;
   scaleY: number;
}

export type TransitionNode = {
   transitionIn(endTransition: () => void): void,
   getDimsAndPosition(): DOMRect
   prepOutgoingNode(initialPosition: DOMRect): void,
   transitionOut(endTransition: (cleanup?: () => void) => void): void,
   computeDelta(initialPosition: DOMRect, finalPosition: DOMRect): TransitDelta;
   transport(delta: TransitDelta): Animation;
   transportOut(delta: TransitDelta, initialPosition: DOMRect, finalPosition: DOMRect): Animation;
   transportIn(delta: TransitDelta): Animation;
   morph(initialPosition: DOMRect, finalPosition: DOMRect): Animation;
   transitioningOut: boolean,
   animatingOut: boolean,
   cancel(direction: "in" | "out"): void
   pause(direction: "in" | "out", transitionStartTime: number): void
}

const defaultFade: TransitionClasses = {
   offscreenClass: 'offscreen-default-fade',
   transitionClass: 'transition-default-fade'
}

export function Transition(input: FromTag<TransitionNodeInput & {Slot: RenderSlot}>){
   return createTransitionNode('Transition', input)
}
export function Transit(input : FromTag<TransitionNodeInput & {Slot: RenderSlot}>){
   return createTransitionNode('Transit', input)
}




function createTransitionNode(
   type: 'Transition' | 'Transit',
   input: TransitionNodeInput
) {
   const { Slot, 'in:with': inputIn, 'out:with': inputOut, with: inputBoth, "load:with": inputLoad, onEnd, onStart, disable } = input;
   if (disable === true) {
      return isFunction(Slot) ? Slot() : Slot
   }

   const $div = NodeRef('div')

   // TODO: init with

   const [transitionLoad, animateLoad] = inputLoad === true ? normalizeToKitArrays(inputBoth ? inputBoth : inputIn ?? defaultFade) : normalizeToKitArrays(inputLoad)
   const [transitionIn, animateIn] = normalizeToKitArrays(inputIn)
   const [transitionOut, animateOut] = normalizeToKitArrays(inputOut)
   const [transitionBoth, animateBoth] = normalizeToKitArrays(inputBoth ? inputBoth : (!inputIn && !inputOut) ? defaultFade : undefined)

   if ( __DEV__ && transitionIn && transitionBoth || transitionOut && transitionBoth)
      console.warn(`The transition for 'both' will override transition for either 'in' or 'out'`)

   const transitionInProperties = undefined; // TODO:
   const transitionOutProperties = undefined; // TODO: 

   const enterFromClasses = collectOffscreenClasses(transitionBoth || transitionIn)
   const transition_in = mountTransitionClass(transitionBoth || transitionIn)
   const animate_in = mountAnimationClass(animateBoth || animateIn)
   const exitClasses = collectOffscreenClasses(transitionBoth || transitionOut)
   const transition_out = transitionBoth ? transition_in : mountTransitionClass(transitionOut)
   const animate_out = transitionBoth ? animate_in : mountAnimationClass(animateOut)

   let frameID: number | undefined;
   let controller: AbortController;

   const transitionNode: TransitionNode = {
      transitionIn(endTransition: () => void) {
         if (!transition_in && !animate_in) {
            endTransition();
            return;
         }
         const node = $div()
         if (!node) return;

         if (onStart) onStart({ phase: 'in' })
         controller = new AbortController()

         if (transition_in) {
            if (type === 'Transit') {
               node.classList.add(...enterFromClasses!);
               node.classList.add(transition_in);
            }

            frameID =
               requestAnimationFrame(() => {
                  frameID = undefined

                  // unpause
                  // if (paused) { //FIX:
                  //     node.style.removeProperty('animation-play-state')
                  //     for (const prop of transitionInProperties) {
                  //         node.style.removeProperty(prop)
                  //     }
                  // }
                  requestAnimationFrame(() => {
                     node.classList.remove(...enterFromClasses!); // triggers enter

                     node.addEventListener(
                        "transitionend",
                        () => {

                           node.classList.remove(transition_in); // enter prep
                           afterTransition()
                        },
                        { once: true, signal: controller.signal }
                     );
                  })
               });
         }

         if (animate_in) {
            node.classList.add(animate_in);

            node.addEventListener(
               "animationend",
               () => {
                  node.classList.remove(animate_in);
                  afterTransition()
               },
               { once: true, signal: controller.signal }
            );
         }

         let endTransitionCount = (transition_in ? 1 : 0) + (animate_in ? 1 : 0);

         function afterTransition() {
            endTransitionCount--;
            if (endTransitionCount === 0) {
               if (onEnd) onEnd({ phase: 'in' })
               endTransition() //transitioning = false 
            }
         }
      },

      getDimsAndPosition() {
         const node = $div();
         if (!node) throw Error('missing div')
         return node.getBoundingClientRect();
      },

      prepOutgoingNode(initialPosition: DOMRect) {
       const node = $div();
         if (!node) throw Error('missing div')
         node.style.position = 'absolute'
         node.style.top = '0px'
         node.style.left = '0px'
         node.style.width = initialPosition.width + 'px'
         node.style.height = initialPosition.height + 'px'
      },

      computeDelta(initialPosition: DOMRect, finalPosition: DOMRect) {
         return {
            x: initialPosition.left - finalPosition.left,
            y: initialPosition.y - finalPosition.y,
            scaleX: initialPosition.width / finalPosition.width,
            scaleY: initialPosition.height / finalPosition.height
         }
      },

      transport(delta: TransitDelta) {
  const node = $div();
         if (!node) throw Error('missing div')
         return node.animate([
            { transform: `translate(${delta.x}px, ${delta.y}px) scale(${delta.scaleX}, ${delta.scaleY})` },
            { transform: 'translate(0, 0) scale(1, 1)' }
         ], {
            duration: 1800, // TODO:
            easing: 'cubic-bezier(0,0,0.32,1)', // TODO:
         });
      },

      morph(initialPosition: DOMRect, finalPosition: DOMRect) {
          const node = $div();
         if (!node) throw Error('missing div')
         return node.animate([
            { width: initialPosition.width + 'px', height: initialPosition.height + 'px' },
            { width: finalPosition.width + 'px', height: finalPosition.height + 'px' }
         ], {
            duration: 200, // TODO:
            easing: 'cubic-bezier(0,0,0.32,1)', // TODO:
         });
      },

      transportOut(delta: TransitDelta, initialPosition: DOMRect, finalPosition: DOMRect) {
          const node = $div();
         if (!node) throw Error('missing div')
         return node.animate([{
            transform: `translate(${initialPosition.x}px, ${initialPosition.y}px) scale(1, 1)`,
            opacity: 1
         }, {
            transform: `translate(${finalPosition.x}px, ${finalPosition.y}px) scale(${1 / delta.scaleX}, ${1 / delta.scaleY})`,
            opacity: 0
         }], {
            duration: 1800,
            easing: "cubic-bezier(0,0,0.32,1)"
         });
      },

      // READ initialPosition
      // WRITE final state
      // READ finalPosition

      transportIn(delta: TransitDelta) {
          const node = $div();
         if (!node) throw Error('missing div')
         return node.animate([
            {
               transform: `translate(${delta.x}px, ${delta.y}px) scale(${delta.scaleX}, ${delta.scaleY})`,
               opacity: 0
            },
            {
               transform: `translate(0, 0) scale(1, 1)`,
               opacity: 1
            }
         ],
            {
               duration: 1800,
               easing: "cubic-bezier(0,0,0.32,1)"
            }
         );
      },

      transitionOut(endTransition: (cleanup?: () => void) => void) {
         if (!transition_out && !animate_out) {
            endTransition();
            return;
         }
         const node = $div();
         if (!node) throw Error('missing div')
         controller = new AbortController();

         if (onStart) onStart({ phase: 'out' })

         if (transition_out) {
            this.transitioningOut = true;
            frameID =
               requestAnimationFrame(() => {
                  frameID = undefined

                  node.classList.add(transition_out);
                  node.classList.add(...exitClasses!);

                  node.addEventListener(
                     "transitionend",
                     () => afterTransition(() => {
                        this.transitioningOut = false;
                        node.classList.remove(transition_out);
                        node.classList.remove(...exitClasses!);

                        if (type === 'Transition' && transition_in) {
                           node.classList.add(...enterFromClasses!);
                           node.classList.add(transition_in);
                        }
                     }),
                     { once: true, signal: controller.signal }
                  );
               })
         }

         if (animate_out) {
            this.animatingOut = true;
            node.classList.add(animate_out);

            node.addEventListener(
               "animationend",
               () => afterTransition(() => {
                  this.animatingOut = false;
                  node.classList.remove(animate_out);
               }),
               { once: true, signal: controller.signal }
            );
         }

         const transitionCleanups: (() => void)[] = []
         let endTransitionCount = (transition_out ? 1 : 0) + (animate_out ? 1 : 0);

         function afterTransition(cleanup: () => void) {
            endTransitionCount--;
            transitionCleanups.push(cleanup)
            if (endTransitionCount === 0) {
               endTransition(() => {
                  if (onEnd) onEnd({ phase: 'out' })
                  for (const cleanup of transitionCleanups) {
                     cleanup()
                  }
               })
            }
         }
      },

      transitioningOut: false,
      animatingOut: false,

      cancel(direction: 'in' | 'out') {
         const node = $div()!
         controller.abort();
         if (direction === 'in') {
            //complete
            if (transition_in) {
               if (frameID !== undefined)
                  cancelAnimationFrame(frameID)

               node.classList.remove(transition_in);
            }
            if (animate_in) {
               node.classList.remove(animate_in);
            }

         }
         else {
            if (transition_out) {
               this.transitioningOut = false;
               if (frameID !== undefined)
                  cancelAnimationFrame(frameID)

               node.classList.remove(transition_out);
               node.classList.remove(...exitClasses!);

               if (type === 'Transition' && transition_in) {
                  node.classList.add(...enterFromClasses!);
                  node.classList.add(transition_in);
               }
            }
            if (animate_out) {
               this.animatingOut = false;
               node.classList.remove(animate_out);
            }
         }
      },
      pause(direction: 'in' | 'out', transitionStartTime: number) {
         // pause state
         // for (const key in transitionInProperties) {
         //     // TODO: requires A LOT more information to compute transitional state...
         //     const transitionalState = computeTransitionalState(transitionIn.duration, new Date().getTime() - transitionStartTime, 0, -100, '')

         //     node.style.setProperty('transform', `translateX(${transitionalState}px)`);
         // }
         // if (animate_in) node.style.setProperty('animation-play-state', 'pause')
         paused = true;
      }
   }

   let paused = false;

   function unpause(transitionProperties: AnyObject) {
      const node = $div()!
      node.style.removeProperty('animation-play-state')
      if (transitionInProperties) {
         for (const key in transitionProperties) {
            node.style.removeProperty(key)
         }
      }
   }

   function quickFade() {
     const node = $div()!
   }

   const renderNode = type === 'Transit' ? renderTransitNode : renderPhasicNode

   return renderNode(
      $div,
      Slot,
      transitionNode,
      disable
   )
}



function normalizeToKitArrays(
   input: AnimationClass | TransitionClasses | TransitionConfig | TransitionConfig[] | undefined
): [
      (TransitionKit | TransitionFunction)[] | undefined | TransitionClasses,
      (AnimationKit | AnimationFunction)[] | undefined | AnimationClass
   ] {
   if (typeof input === 'string')
      return [undefined, input];
   if (input && 'transitionClass' in input) {
      return [input, undefined]
   }

   if (!input) return [undefined, undefined];
   if (isFunction(input)) {
      const transition = input();
      if ('animation' in transition) {
         return [undefined, [transition, <AnimationFunction>input]]
      }
      return [
         [transition, <TransitionFunction>input],
         undefined
      ]
   }
   if (input instanceof Array) {
      const animationKits: (AnimationKit | AnimationFunction)[] = []
      const transitionKits: (TransitionKit | TransitionFunction)[] = []
      let defaultTransition: TransitionFunction | undefined;
      let defaultAnimation: AnimationFunction | undefined;
      for (const config of input) {
         const kit = isFunction(config) ? config() : config
         const isAnimationKit = 'animation' in kit;
         const kits = (isAnimationKit ? animationKits : transitionKits) as (AnimationKit | TransitionKit)[]
         kits.push(kit)
         if (kits.length === 2) {
            if (isAnimationKit && defaultAnimation) defaultAnimation = undefined;
            else if (defaultTransition) defaultTransition = undefined;
         }
         else if (kits.length === 1 && isFunction(config)) {
            if (isAnimationKit) defaultAnimation = <AnimationFunction>config;
            else defaultTransition = <TransitionFunction>config;
         }
      }
      if (defaultTransition) {
         if ( __DEV__ && transitionKits.length !== 1)
            throw new Error('This should never happen. Default transitions should only consist of one transition. For-loop logic is wrong')
         transitionKits.push(defaultTransition)
      }
      if (defaultAnimation) {
         if ( __DEV__ && animationKits.length !== 1)
            throw new Error('This should never happen. Default transitions should only consist of one transition. For-loop logic is wrong')
         animationKits.push(defaultAnimation)
      }
      return [
         transitionKits.length === 0 ? undefined : transitionKits,
         animationKits.length === 0 ? undefined : animationKits
      ];
   }
   if ('animation' in input) {
      return [undefined, [input]]
   }
   return [[input], undefined]
}

function collectOffscreenClasses(transitions: (TransitionKit | TransitionFunction)[] | undefined | TransitionClasses) {
   if (!transitions)
      return undefined;
   if ('transitionClass' in transitions) {
      if (transitions.offscreenClass instanceof Array)
         return [...transitions.offscreenClass];
      return [transitions.offscreenClass]
   };
   const classes: string[] = []
   for (const transition of transitions) {
      if (isFunction(transition)) break;
      classes.push(...transition.offscreenClasses)
   }
   return classes;
}


// TODO: unmount when component unmounted
function mountTransitionClass(transitions: (TransitionKit | TransitionFunction)[] | undefined | TransitionClasses) {
   if (!transitions)
      return undefined;
   if ('transitionClass' in transitions)
      return transitions.transitionClass;

   const maybeSetupFunction = transitions.at(-1);
   const shouldUseDefaultClass = isFunction(maybeSetupFunction)
   if (shouldUseDefaultClass && maybeSetupFunction.defaultClass) {
      return maybeSetupFunction.defaultClass;
   }

   const transitionClass = compileTransitionClassName(transitions)
   if (!existingTransitions.has(transitionClass)) _mountTransitionClass(transitionClass, transitions)

   if (shouldUseDefaultClass) {
      maybeSetupFunction.defaultClass = transitionClass!;
   }

   return transitionClass!
}

const existingTransitions: Set<string> = new Set();

function _mountTransitionClass(className: string, transitions: (TransitionKit | TransitionFunction)[]) {
   existingTransitions.add(className);
   const style = getTransitionStylesheet() ?? createTransitionStyleSheet()
   const transition = compileCSSTransition(transitions);
   style.insertRule(`.${className} { transition: ${transition}}`, style.cssRules.length)
}

function compileCSSTransition(transitions: (TransitionKit | TransitionFunction)[]) {
   let cssString = '';
   for (const kit of transitions) {
      if (isFunction(kit)) break;

      const { delay, duration, properties, timing } = kit;

      for (const property of properties) {
         const comma = cssString ? ',' : ''
         cssString = cssString + comma + property + ' ' + duration + 'ms' + ' ' + timing + (delay ? delay + 'ms' : '')
      }
   }

   return cssString;
}



// name: string;
// delay?: number;
// duration?: number;
// timing?: TransitionTiming;

// name-300-ease-d30_name-400-ease-d30

/* 
{
transition: name 
}
*/

function compileTransitionClassName(transitions: (TransitionKit | TransitionFunction)[]) {
   transitions.sort((a, b) => a.name.localeCompare(b.name))
   let className = ''
   for (const kit of transitions) {
      if (isFunction(kit)) break;
      const transition = `${kit.name}-${kit.duration}-${kit.timing}-d${kit.delay}`
      if (className) {
         className = className + '_' + transition
      }
      else {
         className = transition;
      }
   }
   return className
}

function mountAnimationClass(animations: (AnimationKit | AnimationFunction)[] | undefined | AnimationClass) {
   if (!animations || typeof animations === 'string')
      return animations
   return '' // TODO:
}