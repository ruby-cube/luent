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
        offscreen: { opacity: 0 },
        duration,
        timing
    }))

export const slide = defineTransition('slide',
    ({ delay = 0, duration = 250, timing = 'ease', x = 0, y = 20, opacity = 0 } = {}) => ({
        offscreen: {
            opacity,
            transform: `translate(${x}px, ${y}px)`
        },
        delay,
        duration,
        timing
    }))


slide({ duration: 300, y: -25 })


bounce({ direction: 'reverse', times: 2, })

function pooh({ offscreen: { x = 0, y = 20, opacity = 0 } = {} } = {}) {

    return {
        opacity,
        transform: `translate(${x}px, ${y}px)`
    }
}