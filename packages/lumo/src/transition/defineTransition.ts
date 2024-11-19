import { AnyObject } from "@rue/types";
import { CSSTransitionProperties } from "./types";


export type TransitionTiming =
    | 'linear'
    | 'ease'
    | 'ease-in'
    | 'ease-out'
    | 'ease-in-out'
    | 'step-start'
    | 'step-end'
    | `steps(${number}, ${'start' | 'end'})`
    | `cubic-bezier(${number}, ${number}, ${number}, ${number})`
    | 'inherit'
    | 'initial'
    | 'unset';

export type TransitionFunction = {
    (options?: TransitionOptions): TransitionKit
    defaultClass: string
}

export type TransitionKit = {
    name: string;
    properties: string[];
    offscreenClasses: string[];
    delay: number;
    duration: number;
    timing: TransitionTiming;
}

export type TransitionClasses = {
    offscreenClass: string | string[];
    transitionClass: string;
}


export type TransitionDef = {
    offscreen: { [K in keyof CSSTransitionProperties]?: CSSTransitionProperties[K] } // provide class config or existing class name (separated by spaces if multiple classes)
    delay?: number;
    duration?: number;
    timing?: TransitionTiming;
} | {
    offscreen: string | string[] // provide class config or existing class name (separated by spaces if multiple classes)
    properties: string | string[]
    delay?: number;
    duration?: number;
    timing?: TransitionTiming;
}

type TransitionOptions = {
    delay?: number;
    duration?: number;
    timing?: TransitionTiming;
} & { [K in keyof CSSTransitionProperties]?: CSSTransitionProperties[K] }
    & { [key: string]: string | number | boolean }


const transitionNames: Map<string, number> = new Map()

/* 
note: delay in ms (default: 0), duration in ms (default: 250), timing (default: 'ease')
 */
export function defineTransition<F extends (options?: TransitionOptions) => TransitionDef>(name: string, useTransition: F) {
    let _name = ''
    let nameCount = transitionNames.get(name);
    if (nameCount === undefined) {
        transitionNames.set(name, 0)
        _name = name;
    }
    else {
        transitionNames.set(name, ++nameCount)
        _name = name + nameCount
    }

    function setupTransition(options?: Parameters<F>[0]) {
        const transition = useTransition(options)
        const classNames = compileOffscreenClasses(transition.offscreen)
        if (typeof transition.offscreen !== 'string') {
            for (const className of classNames) {
                mountOffscreenClass(className)
            }
        }
        return {
            name: _name,
            properties: 'properties' in transition ? transition.properties : Object.keys(transition.offscreen),
            offscreenClasses: classNames,
            delay: transition.delay ?? 0,
            duration: transition.duration ?? 250,
            timing: transition.timing ?? 'ease'
        }
    }
    setupTransition.defaultClass = ''
    return setupTransition;
}


let transitionStylesheet: CSSStyleSheet

export function getTransitionStylesheet() {
    return transitionStylesheet;
}

const existingOffscreenClasses: Set<string> = new Set()

function mountOffscreenClass(name: string) {
    if (existingOffscreenClasses.has(name)) return;
    const style = transitionStylesheet ?? createTransitionStyleSheet()
    const property = compileCSSProperty(name)
    style.insertRule(`.${name} { ${property} }`)
    console.log('rule inserted', `.${name} { ${property} }`)
}

export function createTransitionStyleSheet() {
    console.log('createTransitionStyleSheet')
    const stylesheets = document.styleSheets
    const index = stylesheets.length;
    const style = document.createElement('style');
    const head = document.querySelector('head')
    if (!head) throw new Error(`document has no head tag!`)
    head.appendChild(style)
    const stylesheet = stylesheets.item(index)
    if (!stylesheet) throw new Error(`no stylesheet at this index!`)
    transitionStylesheet = stylesheet //TODO: replace with provideTransapp(OFFSCREEN_STYLESHEET, stylesheet)
    return stylesheet;
}

function compileCSSProperty(className: string) {
    const [key, valueString] = className.split('-', 2);
    const value = key === 'transform' ? toCssTransformValue(valueString) : valueString;
    return key + ':' + value;
}

function toCssTransformValue(shorthand: string) {
    const match = shorthand.match(/^(\w+?)([XYZ]?)(-?\d*\.?\d+)([a-z%]*)?$/);
    if (!match) {
        throw new Error(`Invalid transform value: ${shorthand}`);
    }

    const [, fn, axis, value, unit] = match;
    const cssValue = unit === 'pc' ? `${value}%` : `${value}${unit || ''}`; // Convert 'pc' to '%', handle missing units
    return `${fn}${axis}(${cssValue})`;
}

function compileOffscreenClasses(properties: string | string[] | { [K in keyof CSSTransitionProperties]?: CSSTransitionProperties[K] }) {
    if (typeof properties === 'string' || properties instanceof Array) return properties;
    const classes: string[] = [];
    for (const key in properties) {
        if (key === 'transform') {
            classes.push(...parseTransform(properties[key as keyof { transform: string }]))
        }
        else {
            const value = properties[key as keyof CSSTransitionProperties] //TODO: remove spaces?
            classes.push(key + '-' + value);
        }
    }
    return classes
}


// from chatGPT
function parseTransform(transform: string | undefined): string[] {
    if (!transform) return [];
    return transform
        .match(/(\w+\([^)]+\))/g) // Match each function with its arguments
        ?.flatMap(entry => {
            const [fn, values] = entry.slice(0, -1).split('('); // Separate function name and arguments
            const args = values.split(',').map(arg => arg.trim()); // Split arguments by commas

            // Process values for specific functions with axis decomposition
            if (['translate', 'scale', 'skew'].includes(fn) && args.length > 1) {
                const axes = ['X', 'Y', 'Z']; // Possible axes
                return args.map((value, index) => {
                    let processedValue = value
                        .replace(/%/g, 'pc'); // Convert '%' to 'pc'
                    return `transform-${fn}${axes[index] || ''}${processedValue}`;
                });
            }

            // For all other functions or single arguments
            let processedValue = values
                .replace(/%/g, 'pc'); // Convert '%' to 'pc'
            return [`transform-${fn}${processedValue}`];
        }) || []; // Return an empty array if no matches
}

