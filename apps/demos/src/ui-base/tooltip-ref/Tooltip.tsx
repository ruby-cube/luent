import { atDiscard, atMounted, ComponentTag, Context, ContextKey, css, fromContext, FromTag, If, listen, NodeRef, RawJSXNode, RenderSlot, style, template } from "@rue/lumo"
import { dev, getActiveUpdate, Ion, Ionic, queueLayout, queueRender, queueTask, toIon } from "@rue/quarky"
import { IonicTooltip } from "./Tooltip.model";

// TODO:
// [] hideDelay should never be greater than delay, clamp hideDelay to delay if it is greater
// [] if the tooltip blocks the trigger hover, we end up with a weird toggling the tooltip on-off-on-off situation


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

   return template(
      <div
         at:mounted={node => tooltip.positionTail(node)}
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

const TOOLTIP = ContextKey<IonicTooltip>()


function TooltipRoot(setup: FromTag<{
   ref?: NodeRef<'div'>;
   Slot: RenderSlot;
   tooltip: IonicTooltip
}>) {
   const {
      ref,
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
      tooltip.reposition()
   })

   return template(
      <>
         {If((tooltip.visible),
            <Context provide={TOOLTIP(tooltip)}>
               <div
                  at:create={node => { tooltip.setTooltip(node) }}
                  ref={ref}
                  class={Ion(() => (console.log('>>> tooltip classes', tooltip.placement, getActiveUpdate()?.cycle.currentPhase), 'tooltip ' + tooltip.placement))}
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

// type RenderTooltip = (data: { tooltip: string }) => RawJSXNode
// const TOOLTIP = ContextKey<Ionic<TooltipModel>>()

// function TooltipPod(setup: FromTag<{
//    tooltip: RenderTooltip,
//    Slot: RenderSlot
// }>) {
//    const { Slot, tooltip: renderTooltip } = setup
//    const tooltip = Ionic(new TooltipModel('above'))
//    const renderSlot = collectTriggers(Slot, tooltip)

//    return template(
//       <Context provide={TOOLTIP(tooltip)}>
//          {renderSlot}
//          {If(tooltip.ævisible, () =>
//             renderTooltip(tooltip.data)
//          )}
//       </Context>
//    )
// }

// function collectTriggers(Slot: RenderSlot, tooltip: Ionic<TooltipModel>) {
//    return function renderSlot() {
//       const fragment = mountToFragment(Slot)
//       const triggers = fragment.querySelectorAll('data-tooltip')

//       tooltip.setUpTriggers(triggers)
//       return fragment
//    }
// }



export {
   TooltipContent,
   TooltipTail,
   TooltipRoot
}