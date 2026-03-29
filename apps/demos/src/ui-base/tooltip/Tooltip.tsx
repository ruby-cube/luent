import { $fromContext, atDiscard, atMounted, ComponentTag, Context, ContextKey, css, fromContext, FromTag, If, listen, NodeRef, RawJSXNode, RenderSlot, style, template } from "@rue/lumo"
import { Ion, toIon } from "@rue/quarky"
import { IonicTooltip } from "./TooltipKit";
import { maybeFlip, positionTail } from "../popover/Popover";

// TODO:
// [] hideDelay should never be greater than delay, clamp hideDelay to delay if it is greater
// [] if the tooltip blocks the trigger hover, we end up with a weird toggling the tooltip on-off-on-off situation

const TOOLTIP = ContextKey<IonicTooltip>()
const TOOLTIP_NODE = ContextKey<NodeRef<'div'>>()




function TooltipRoot(setup: FromTag<{
   ref?: NodeRef<'div'>;
   Slot: RenderSlot;
   tooltip: IonicTooltip
}>) {
   const {
      ref: $tooltip = NodeRef('div'),
      æclasses,
      æstyles,
      // gap = 0,
      Slot,
      tooltip,
      ...attributes
   } = setup

   const { gap } = tooltip



   return template(
      <>
         {If((tooltip.visible),
            <Context provide={[TOOLTIP(tooltip), TOOLTIP_NODE($tooltip)]}>
               <div
                  at:create={node => maybeFlip(node, tooltip)}
                  ref={$tooltip}
                  class={('tooltip ' + tooltip.placement)}
                  style={(`--tooltip-anchor: ${tooltip.anchorName}; ${æstyles()}`)}
                  {...attributes}
               >
                  {Slot()}
               </div>
            </Context>
         )}
      </>
   )
      .style(css`
      
         .tooltip {
            position: absolute;
            position-anchor: var(--tooltip-anchor);
            isolation: isolate;
         }

         .tooltip.above {
            justify-self: anchor-center;
            bottom: calc(anchor(top) + ${gap}rem);
         }

         .tooltip.below {
            justify-self: anchor-center;
            top: calc(anchor(bottom) + ${gap}rem);
         }

         .tooltip.left {
            align-self: anchor-center;
            right: calc(anchor(left) + ${gap}rem);
         }

         .tooltip.right {
            align-self: anchor-center;
            left: calc(anchor(right) + ${gap}rem);
         }
      `)

}

function TooltipContent(setup: FromTag<{
   ref?: NodeRef<'div'>;
   Slot: RenderSlot;
}>) {
   const {
      ref,
      æclasses,
      æstyles,
      Slot,
      ...attributes
   } = setup

   // const tooltip = fromContext(TOOLTIP)
   // const { gap } = tooltip;

   return template(
      <div class={æclasses}>
         {Slot()}
      </div>
   )
}


function TooltipTail(setup: FromTag<{
   as?: ComponentTag | string;
   offset?: Ion<number>
   'shape:class'?: Ion<string> // FIX: should this just be shapeClasses? or should this be gathered into an object? yes. namespace object
   'shape:style'?: Ion<string>
}>) {
   const {
      æclasses,
      æstyles,
      "æshape:class": æshapeClasses = toIon(''),
      "æshape:style": æshapeStyles = toIon(''),
      æoffset = toIon('-30%'),
      as: Comp = 'div',
      ...attributes
   } = setup

   const tooltip = fromContext(TOOLTIP)
   const $tooltip = $fromContext(TOOLTIP_NODE)

   return template(
      <div
         at:mounted={node => positionTail(node, tooltip, $tooltip)}
         class={('tail-root ' + tooltip.placement + ' ' + æclasses())}
         {...attributes}
      >
         <Comp
            class={(`tail ${tooltip.placement} ${æshapeClasses()}`)}
            style={æshapeStyles}
         ></Comp>
      </div>
   )
      .style(css`
         .tail-root {
            position: absolute;
         }

         .tail-root.above {
            bottom: 0px;
         }

         .tail-root.below {
            top: 0px;
         }

         .tail-root.left {
            right: 0px;
            // top: 50%;
         }

         .tail-root.right {
            left: 0px;
            // top: 50%;
         }

         .tail {
            position: absolute;
         }

         .tail.above {
            bottom: ${æoffset()};
         }

         .tail.below {
            top: ${æoffset()};
         }

         .tail.left {
            right:${æoffset()};
            // top: -50%;
         }

         .tail.right {
            left: ${æoffset()};
            // top: -50%;
         }
      `)
}



export {
   TooltipContent,
   TooltipTail,
   TooltipRoot
}