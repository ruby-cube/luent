import { $fromContext, atDiscard, atMounted, ComponentTag, Context, ContextKey, css, fromContext, FromTag, If, listen, NodeRef, RawJSXNode, RenderSlot, style, template } from "@rue/lumo"
import { dev, getActiveUpdate, Ion, Ionic, queueLayout, queueRender, queueTask, toIon } from "@rue/quarky"
import { IonicTooltip } from "./Tooltip.model";
import { debug } from "@rue/utils";
import { autoUpdate, computePosition } from "@floating-ui/dom";

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

   console.log('attributes?', attributes)
   const { gap } = tooltip

   queueLayout(() => {
      const node = $tooltip()
      if (!node) {
         debug.error('Must set tooltip node with setTooltip before repositioning tooltip')
         return;
      }
      const rect = node.getBoundingClientRect()
      if (
         tooltip.placement === 'above' && rect.top < 0
         || tooltip.placement === 'below' && rect.bottom > document.documentElement.clientHeight
         || tooltip.placement === 'left' && rect.left < 0
         || tooltip.placement === 'right' && rect.right > document.documentElement.clientWidth
      ) {
         tooltip.flip()
      }
   })

   return template(
      <>
         {If((tooltip.visible),
            <Context provide={[TOOLTIP(tooltip), TOOLTIP_NODE($tooltip)]}>
               <div
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
   'shape:class'?: Ion<string>
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
   
   console.log('$tooltip', $tooltip)

   /**
    * centers tail with anchor
    * 
    * @param node 
    * @param tooltip 
    * @returns 
    */
   function positionTail(node: HTMLElement) {
      const anchor = document.querySelector(`[data-tooltip-anchor='${tooltip.anchorName}']`)
      if (!anchor) return;

      let visibility: string | null = null

      const placeArrow = () => {
         if (!anchor) return;
         const axis = tooltip.axis
         const placement = axis === 'y' ? 'bottom' : 'left'// tail's placement on the other axis is handled by the tooltip container so we only care about one axis

         computePosition(anchor, node, {
            placement,
         }).then(({ x, y }) => {
            const inset = axis === 'y' ? x : y
            const tooltipNode = $tooltip()
            if (!tooltipNode) {
               console.error('tooltipNode is missing')
               return;
            }
            // hide tail if tooltip is greatly misaligned due to collision shift
            if (inset < 10 || tooltipNode[axis === 'y' ? 'offsetWidth' : 'offsetHeight'] - inset < 10) {
               if (visibility === null) visibility = node.style.visibility
               node.style.visibility = 'hidden'
            }
            else {
               if (typeof visibility === 'string') {
                  node.style.visibility = visibility
                  visibility = null
               }
               node.style[axis === 'y' ? 'left' : 'top'] = `${inset}px`
            }
         });
      }

      const cleanup = autoUpdate(
         anchor,
         node,
         placeArrow,
      );
      atDiscard(cleanup)
   }

   return template(
      <div
         at:mounted={positionTail}
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