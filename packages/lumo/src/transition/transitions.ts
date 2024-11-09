//@ts-nocheck
import { defineTransition } from "./defineTransition";

// slide, scale, fade
/* 
function scale(
    node: Element,
    {
        delay,
        duration,
        easing,
        start,
        opacity
    }?: ScaleParams | undefined
): TransitionConfig; */

/* 
function fly(
    node: Element,
    {
        delay,
        duration,
        easing,
        x,
        y,
        opacity
    }?: FlyParams | undefined
): TransitionConfig;
*/

//TODO: concatentate transform values so original is not overwritten


export const fade = defineTransition('fade',
    ({ duration = 250, timing = 'ease' } = {}) => ({
        offstage: { opacity: 0 },
        duration,
        timing
    }))

export const slide = defineTransition('slide',
    ({ x = 0, y = 20, opacity = 0 } = {}) => ({
        opacity,
        transform: `translate(${x}px, ${y}px)`
    }))


slide({ duration: 300, y: -25 })



bounce({ direction: 'reverse', times: 2, })