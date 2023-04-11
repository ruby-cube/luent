/* 
Turtles. Slow on land; fast in water. 

PURPOSE:
This module provides a way to throttle reactivity, preventing updates to the DOM until required.

USE CASE: 
Since view updates interfere with spellcheck in contenteditable, input, and textarea, 
causing an unpleasant flickering on the screen when the user is typing, 
we need to prevent updates to the DOM until absolutely essential 
 
*/

import { Ref, ref, watch } from "vue";
import { noop } from "@rue/utils";

let noTurtle: true | false = false;

export const turtledom = {
    __sleep: __DEV__ ? () => { // turn off all throttling (overrides activated status) for DEV purposes
        noTurtle = true;
    } : noop,
    __awaken: __DEV__ ? () => { // restores throttling
        noTurtle = false;
    } : noop,

    activated: false,

    activate() {
        this.activated = true;
    },
    deactivate() {
        this.activated = false;
    },
}


const _turtleMap: WeakMap<Ref, Ref> = new WeakMap();

export function getTurtle(nodeRef: Ref) {
    return _turtleMap.get(nodeRef);
}

export function turtle(reactivePropGetter: () => string, nodeRef: Ref<Text>) {
    const throttledRef = ref(reactivePropGetter());
    _turtleMap.set(nodeRef, throttledRef);
    watch(reactivePropGetter, (val) => {
        if (__DEV__ && noTurtle === true) {
            throttledRef.value = val;
        }
        else if (turtledom.activated) {
            return;
        }
        if (throttledRef.value === val) {
            nodeRef.value.nodeValue = val; // currently only supports text nodes
        }
        else {
            throttledRef.value = val;
        }
    });
    return throttledRef;
}
