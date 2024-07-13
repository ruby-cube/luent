
import { initializeEffect } from "../muonic/watch";
import { NodeRef } from "./NodeRef";

// dynamicClasses(itemsRef, [
//     // manipulation instructions
//     (o) => {  // one-to-one binding, coarse-grained
//         if ($dragging())
//             o.add('dragging');
//         if ($highlighted() && $isActive())
//             o.add('highlight');
//     },
//     (o) => { // one-to-one binding, fine-grained
//         if ($dragging())
//             o.add('dragging')
//     },
//     (o) => {
//         if ($highlighted() && $isActive())
//             o.add('highlight')
//     },
//     (o) => { // one-to-one binding, fine-grained
//         if ($dragging()) {
//             o.add('dragging')
//             o.remove('highlight')
//             o.remove('grow')
//         }
//         else {
//             o.add('highlight')
//             o.remove('dragging')
//         }
//     },

//     // over-writes classes
//     (o) => {
//         if ($highlighted() && $isActive())
//             o.replace(`dragging highlight`)
//     },
// ])

export function dynamicClasses(nodeRef: NodeRef, reactiveEffects: ((o: DOMTokenList) => void)[]) {
    nodeRef.onCreated((node) => {
        for (const effect of reactiveEffects) {
            initializeEffect(() => effect(node.classList))
        }
    })
}

export function dynamicStyles(nodeRef: NodeRef, reactiveEffects: ((o: CSSStyleDeclaration) => void)[]) {
    nodeRef.onCreated((node) => {
        for (const effect of reactiveEffects) {
            initializeEffect(() => effect(node.style))
        }
    })
}