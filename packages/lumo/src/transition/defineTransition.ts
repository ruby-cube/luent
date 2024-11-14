import { AnyObject } from "@rue/types";

export type CSSTransitionProperties = {
    // Opacity and Visibility
    opacity?: number;
    visibility?: 'visible' | 'hidden' | 'collapse';

    // Transformations
    translateX?: number;
    translateY?: number;
    translateZ?: number;
    scaleX?: number;
    scaleY?: number;
    scaleZ?: number;
    rotateX?: number;
    rotateY?: number;
    rotateZ?: number;
    skewX?: number;
    skewY?: number;
    perspectiveTransform?: number;

    // Positioning and Layout
    top?: number | string;
    right?: number | string;
    bottom?: number | string;
    left?: number | string;
    zIndex?: number;

    // Dimensions and Sizing
    width?: number | string;
    height?: number | string;
    minWidth?: number | string;
    minHeight?: number | string;
    maxWidth?: number | string;
    maxHeight?: number | string;

    // Margins, Padding, and Borders
    margin?: number | string;
    marginTop?: number | string;
    marginRight?: number | string;
    marginBottom?: number | string;
    marginLeft?: number | string;
    padding?: number | string;
    paddingTop?: number | string;
    paddingRight?: number | string;
    paddingBottom?: number | string;
    paddingLeft?: number | string;
    borderWidth?: number | string;
    borderTopWidth?: number | string;
    borderRightWidth?: number | string;
    borderBottomWidth?: number | string;
    borderLeftWidth?: number | string;
    borderSpacing?: number | string;

    // Background and Foreground
    backgroundColor?: string;
    backgroundPosition?: string;
    backgroundSize?: string;
    backgroundBlendMode?: string;
    backgroundImage?: string;
    color?: string;

    // Font and Text Properties
    fontSize?: number | string;
    fontWeight?: number | string;
    lineHeight?: number | string;
    letterSpacing?: number | string;
    textIndent?: number | string;
    textShadow?: string;

    // Border Styles and Effects
    borderColor?: string;
    borderRadius?: number | string;
    borderStyle?: string;
    borderImageOutset?: number | string;
    borderImageSlice?: number | string;
    borderImageWidth?: number | string;
    outlineColor?: string;
    outlineWidth?: number | string;
    outlineOffset?: number | string;

    // Box Shadow and Outline
    boxShadow?: string;
    outline?: string;

    // Clip and Masking
    clipPath?: string;
    mask?: string;
    maskPosition?: string;
    maskSize?: string;

    // Filter Effects
    filter?: string;
    blur?: number;
    brightness?: number;
    contrast?: number;
    grayscale?: number;
    hueRotate?: number;
    invert?: number;
    saturate?: number;
    sepia?: number;

    // Flex and Grid Properties
    flexGrow?: number;
    flexShrink?: number;
    flexBasis?: number | string;
    order?: number;

    // Miscellaneous
    cursor?: string;
    perspective?: number;
    mixBlendMode?: string;
}

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
    offscreenClass: string;
    delay: number;
    duration: number;
    timing: TransitionTiming;
} 

export type TransitionClasses = {
    offscreenClass: string;
    transitionClass: string;
}


export type TransitionDef = {
    offscreen: { [K in keyof CSSTransitionProperties]?: CSSTransitionProperties[K] } // provide class config or existing class name (separated by spaces if multiple classes)
    delay?: number;
    duration?: number;
    timing?: TransitionTiming;
} | {
    offscreenClass: string // provide class config or existing class name (separated by spaces if multiple classes)
    properties: string | string[]
    delay?: number;
    duration?: number;
    timing?: TransitionTiming;
} | {
    offscreenClass: string
    transitionClass: string
}

type TransitionOptions = {
    delay?: number;
    duration?: number;
    timing?: TransitionTiming;
} & { [K in keyof CSSTransitionProperties]?: CSSTransitionProperties[K] }
    & { [key: string]: string | number | boolean }

/* 
note: delay in ms (default: 0), duration in ms (default: 250), timing (default: 'ease')
 */
export function defineTransition<F extends (options?: TransitionOptions) => TransitionDef>(name: string, useTransition: F) {
    const _name = name; //manage name collisions
    let offscreenClass = '';

    function setupTransition(options?: Parameters<F>[0]) {
        const transition = useTransition(options)
        if (!offscreenClass) {
            offscreenClass = mountOffscreenClass(_name, transition.offscreen)
        }
        return {
            name: _name,
            properties: transition.properties || Object.keys(transition.offscreen),
            offscreenClass,
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

function mountOffscreenClass(name: string, offscreen: CSSTransitionProperties | string) {
    if (typeof offscreen === 'string') {
        return offscreen;
    }
    const style = transitionStylesheet ?? createTransitionStyleSheet()
    const properties = compileCSSProperties(offscreen)
    const className = 'offscreen-' + name;
    style.insertRule(`.${className} { ${properties} }`)
    return className;
}

export function createTransitionStyleSheet() {
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

function compileCSSProperties(properties: AnyObject) {
    let props = ''
    for (const key in properties) {
        props = props + key + ':' + properties[key] + ';'
    }
    return props;
}


