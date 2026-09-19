import {  FromTag,  NodeRef, RenderTag } from "luent"
import { IonicTooltip } from "./Tooltip.kit";
import { PopoverRoot } from "../popover/Popover";

// TODO:
// [] hideDelay should never be greater than delay, clamp hideDelay to delay if it is greater
// [] if the tooltip blocks the trigger hover, we end up with a weird toggling the tooltip on-off-on-off situation

function TooltipRoot(setup: FromTag<{
   ref?: NodeRef<'div'>;
   Slot: RenderTag;
   tooltip: IonicTooltip
}>) {
   const { Slot, tooltip, ...rest } = setup

   return (
      <PopoverRoot popover={tooltip} auto-bind={rest}><Slot/></PopoverRoot> // TODO: how do I prevent over wrapping of Slot? 
   )
}

// const TOOLTIP = ContextKey<IonicTooltip>()
// const TOOLTIP_NODE = ContextKey<NodeRef<'div'>>()

// function TooltipRoot(setup: FromTag<{
//    ref?: NodeRef<'div'>;
//    Slot: RenderTag;
//    tooltip: IonicTooltip
// }>) {
//    const {
//       ref: $tooltip = NodeRef('div'),
//       $classes,
//       $styles,
//       // gap = 0,
//       Slot,
//       tooltip,
//       ...attributes
//    } = setup

//    const { gap } = tooltip



//    return template(
//       <>
//          {If((tooltip.visible), // TODO: configure activation type
//             <o:context provide={[TOOLTIP(tooltip), TOOLTIP_NODE($tooltip)]}>
//                <div
//                   before:mount={node => maybeFlip(node, tooltip)}
//                   ref={$tooltip}
//                   class={(`tooltip ${tooltip.placement} ${tooltip.alignment}`)}
//                   style={(`--tooltip-anchor: ${tooltip.anchorName}; ${$styles()}`)}
//                   {...attributes}
//                >
//                   {Slot()}
//                </div>
//             </o:context>
//          )}
//       </>
//    )
//       .style(css`

//          .tooltip {
//             position: absolute;
//             position-anchor: var(--tooltip-anchor);
//             isolation: isolate;
//          }

//          .tooltip.center.above, tooltip.center.below {
//             justify-self: anchor-center;
//          }

//          .tooltip.center.left, tooltip.center.right {
//             align-self: anchor-center;
//          }

//          .tooltip.above.start, .tooltip.below.start {
//             left: anchor(left)
//          }

//          .tooltip.above.end, .tooltip.below.end {
//             right: anchor(right)
//          }

//          .tooltip.left.start, .tooltip.right.start {
//             top: anchor(top)
//          }

//          .tooltip.left.end, .tooltip.right.end {
//             bottom: anchor(bottom)
//          }

//          .tooltip.above {
//             bottom: calc(anchor(top) + ${gap}rem);
//          }

//          .tooltip.below {
//             top: calc(anchor(bottom) + ${gap}rem);
//          }

//          .tooltip.left {
//             left: unset;
//             right: calc(anchor(left) + ${gap}rem);
//          }

//          .tooltip.right {
//             left: calc(anchor(right) + ${gap}rem);
//          }
//       `)

// }

// function TooltipContent(setup: FromTag<{
//    ref?: NodeRef<'div'>;
//    Slot: RenderTag;
// }>) {
//    const {
//       ref,
//       $classes,
//       $styles,
//       Slot,
//       ...attributes
//    } = setup

//    // const tooltip = fromContext(TOOLTIP)
//    // const { gap } = tooltip;

//    return template(
//       <div class={$classes()} style={$styles()} {...attributes}>
//          {Slot()}
//       </div>
//    )
// }


// function TooltipTail(setup: FromTag<{
//    as?: RenderView | string;
//    offset?: Ion<number>
//    'shape:class'?: Ion<string> // FIX: should this just be shapeClasses? or should this be gathered into an object? yes. namespace object
//    'shape:style'?: Ion<string>
// }>) {
//    const {
//       $classes,
//       $styles,
//       "$shape:class": $shapeClasses = toIon(''),
//       "$shape:style": $shapeStyles = toIon(''),
//       $offset = toIon('-30%'),
//       as: Comp = 'div',
//       ...attributes
//    } = setup

//    const tooltip = fromContext(TOOLTIP)
//    const $tooltip = $fromContext(TOOLTIP_NODE)

//    return template(
//       <div
//          at:attach={node => positionTail(node, tooltip, $tooltip)}
//          class={('tail-root ' + tooltip.placement + ' ' + $classes())}
//          {...attributes}
//       >
//          <Comp
//             class={(`tail ${tooltip.placement} ${$shapeClasses()}`)}
//             style={$shapeStyles}
//          ></Comp>
//       </div>
//    )
//       .style(css`
//          .tail-root {
//             position: absolute;
//          }

//          .tail-root.above {
//             bottom: 0px;
//          }

//          .tail-root.below {
//             top: 0px;
//          }

//          .tail-root.left {
//             right: 0px;
//             // top: 50%;
//          }

//          .tail-root.right {
//             left: 0px;
//             // top: 50%;
//          }

//          .tail {
//             position: absolute;
//          }

//          .tail.above {
//             bottom: ${$offset()};
//          }

//          .tail.below {
//             top: ${$offset()};
//          }

//          .tail.left {
//             right:${$offset()};
//             // top: -50%;
//          }

//          .tail.right {
//             left: ${$offset()};
//             // top: -50%;
//          }
//       `)
// }



export {
   PopoverContent as TooltipContent,
   PopoverTail as TooltipTail,
} from "../popover/Popover"

export { TooltipRoot }