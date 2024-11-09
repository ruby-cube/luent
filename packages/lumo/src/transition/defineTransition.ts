import { AnyObject } from "@rue/types";

type OffstageProperties = {
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

type TransitionConfig = {
    offstage: OffstageProperties,
    // delay?: number,
    duration?: number,
    timing?: TransitionTiming
}

type TransitionTiming =
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

export type TransitionFunction = (durationOrTiming?: number | TransitionTiming, timing?: TransitionTiming) => TransitionVars

export type TransitionVars = {
    // delay: number;
    duration: number;
    timing: TransitionTiming;
}

/**
 * NOTE: delay in ms (default: 0), duration in ms (default: 250), timing (default: 'ease')
 */
export function defineTransition<OPT extends (options?: AnyObject) => OffstageProperties>(name: string, getOffstageProperties: OPT, transition?: TransitionVars) {
    const _name = name;//TODO: manage repeat names with global()
    let transitionMounted = false;
    return function configureTransition(durationOrTiming?: number | TransitionTiming, timing?: TransitionTiming) {
        const duration = typeof durationOrTiming === 'number' ? durationOrTiming : undefined
        const _timing = timing ? timing : typeof durationOrTiming === 'string' ? durationOrTiming : undefined

        return (opts?: Parameters<OPT>) => {
            let transitionClass: string = ''
            if (!transitionMounted) {
                transitionClass = mountOffstageClass(_name, getOffstageProperties(opts))
            }
            return {
                transitionClass,
                // delay: transition.delay ?? 0,
                duration: duration ?? transition?.duration ?? 250,
                timing: _timing ?? transition?.timing ?? 'ease'
            }
        }
    }
}

let offstageStylesheet: CSSStyleSheet; //TODO: replace with global(OFFSTAGE_STYLESHEET) using global context

function mountOffstageClass(name: string, offstage: OffstageProperties) {
    const style = offstageStylesheet ?? createOffstageStylesheet()
    //TODO: const style = global(OFFSTAGE_STYLESHEET) ?? createOffstageStylesheet()
    const properties = compileCSSProperties(offstage)
    const className = 'offstage-' + name;
    style.insertRule(`.${className} { ${properties} }`)
    return className;
}

function createOffstageStylesheet() {
    const stylesheets = document.styleSheets
    const index = stylesheets.length;
    const style = document.createElement('style');
    const head = document.querySelector('head')
    if (!head) throw new Error(`document has no head tag!`)
    head.appendChild(style)
    const stylesheet = stylesheets.item(index)
    if (!stylesheet) throw new Error(`no stylesheet at this index!`)
    offstageStylesheet = stylesheet //TODO: replace with provideGlobal(OFFSTAGE_STYLESHEET, stylesheet)
    return stylesheet;
}

function compileCSSProperties(properties: AnyObject) {
    let props = ''
    for (const key in properties) {
        props = props + key + ':' + properties[key] + ';'
    }
    return props;
}

function mountCSSTransitionClasses(node: HTMLElement,) {

}


