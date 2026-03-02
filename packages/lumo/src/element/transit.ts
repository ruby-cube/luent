import { queueRender, queueTask, toValue } from "@rue/quarky";
import { toClassNames } from "./transitions";
import { atListChanged } from "../iteratives/For";
import { MaybeIon } from "../component/Input";

export function setUpPositionTransition(node: HTMLElement, transitionClasses: MaybeIon<string>) {
   atListChanged(() => {
      const first = node.getBoundingClientRect()
      queueRender(() => {
         const last = node.getBoundingClientRect()
         startTransitionItem(node, first, last, toClassNames(toValue(transitionClasses)))
      })
   })
}


export function startTransitionItem(node: HTMLElement, first: DOMRect, last: DOMRect, classes: string[]) {
   const deltaY = first.top - last.top
   const deltaX = first.left - last.left
   if (deltaX || deltaY) {
      node.style.setProperty('transform', `translate(${deltaX}px, ${deltaY}px)`)
      requestAnimationFrame(() => {
         queueTask(() => {
            classes.forEach(className => node.classList.add(className))
            node.style.setProperty('transform', `translate(0px, 0px)`)
            node.addEventListener('transitionend', () => {
               classes.forEach(className => node.classList.remove(className))
               node.style.removeProperty('transform')
            }, { once: true })
         })
      })
   }
}