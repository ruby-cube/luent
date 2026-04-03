import { $fromContext, atDiscard, atMounted, ComponentTag, Context, ContextKey, css, fromContext, FromTag, If, listen, NodeRef, RawJSXNode, RenderSlot, style, template } from "@rue/luent"
import { Ion, Ionic, toIon, ion } from "@rue/quarky"
import { Alignment, maybeFlip, Placement, Popover, positionTail } from "./Popover.kit";

// TODO:
// [] hideDelay should never be greater than delay, clamp hideDelay to delay if it is greater
// [] if the popover blocks the trigger hover, we end up with a weird toggling the popover on-off-on-off situation



const POPOVER = ContextKey<Ionic<Popover>>()
const POPOVER_NODE = ContextKey<NodeRef<'div'>>()

function PopoverRoot(setup: FromTag<{
   ref?: NodeRef<'div'>;
   Slot: RenderSlot;
   popover: Ionic<Popover>
}>) {
   const {
      ref: $popover = NodeRef('div'),
      æclasses,
      æstyles,
      // gap = 0,
      Slot,
      popover,
      ...attributes
   } = setup

   const { gap } = popover

   return template(
      <>
         {If((popover.visible), // TODO: configure activation type
            <Context provide={[POPOVER(popover), POPOVER_NODE($popover)]}>
               <div
                  at:create={node => maybeFlip(node, popover)}
                  ref={$popover}
                  class={(`popover ${popover.placement} ${popover.alignment}`)}
                  style={(`--popover-anchor: ${popover.anchorName}; ${æstyles()}`)}
                  {...attributes}
               >
                  {Slot()}
               </div>
            </Context>
         )}
      </>
   )
      .style(css`
      
         .popover {
            position: absolute;
            position-anchor: var(--popover-anchor);
            isolation: isolate;
         }

         .popover.center.above, .popover.center.below {
            justify-self: anchor-center;
         }
         
         .popover.center.left, .popover.center.right {
            align-self: anchor-center;
         }
         
         .popover.above.start, .popover.below.start {
            left: anchor(left)
         }
 
         .popover.above.end, .popover.below.end {
            right: anchor(right)
         }

         .popover.left.start, .popover.right.start {
            top: anchor(top)
         }

         .popover.left.end, .popover.right.end {
            bottom: anchor(bottom)
         }

         .popover.above {
            bottom: calc(anchor(top) + ${gap}rem);
         }

         .popover.below {
            top: calc(anchor(bottom) + ${gap}rem);
         }

         .popover.left {
            left: unset;
            right: calc(anchor(left) + ${gap}rem);
         }

         .popover.right {
            left: calc(anchor(right) + ${gap}rem);
         }
      `)

}

function PopoverContent(setup: FromTag<{
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

   // const popover = fromContext(TOOLTIP)
   // const { gap } = popover;

   return template(
      <div class={æclasses()} style={æstyles()} {...attributes}>
         {Slot()}
      </div>
   )
}


function PopoverTail(setup: FromTag<{
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

   const popover = fromContext(POPOVER)
   const $popover = $fromContext(POPOVER_NODE)

   return template(
      <div
         at:mounted={node => positionTail(node, popover, $popover)}
         class={('tail-root ' + popover.placement + ' ' + æclasses())}
         {...attributes}
      >
         <Comp
            class={(`tail ${popover.placement} ${æshapeClasses()}`)}
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
   PopoverContent,
   PopoverTail,
   PopoverRoot
}