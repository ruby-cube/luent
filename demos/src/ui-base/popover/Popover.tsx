import { component, $fromContext, beforeUnmount, atAttach, ComponentTag, Context, ContextKey, css, fromContext, If, listen, NodeRef, RawJSXNode, RenderSlot, Style, template } from "@rue/luent"
import { Ion, Ionic, toIon, ion } from "@rue/quarky"
import { Alignment, maybeFlip, Placement, Popover, positionTail } from "./Popover.kit";

// TODO:
// [] hideDelay should never be greater than delay, clamp hideDelay to delay if it is greater
// [] if the popover blocks the trigger hover, we end up with a weird toggling the popover on-off-on-off situation



const POPOVER = ContextKey<Ionic<Popover>>()
const POPOVER_NODE = ContextKey<NodeRef<'div'>>()

function PopoverRoot(setup: {
   ref?: NodeRef<'div'>;
   Slot: RenderSlot;
   popover: Ionic<Popover>
}) {
   const {
      ref: $popover = NodeRef('div'),
      $classes,
      $styles,
      // gap = 0,
      Slot,
      popover,
      ...attributes
   } = setup

   const { gap } = popover

   return component(
      <>
         {If((popover.visible), // TODO: configure activation type
            <Context provide={[POPOVER(popover), POPOVER_NODE($popover)]}>
               <div
                  pre:mount={node => maybeFlip(node, popover)}
                  ref={$popover}
                  class={(`popover ${popover.placement} ${popover.alignment}`)}
                  style={(`--popover-anchor: ${popover.anchorName}; ${$styles()}`)}
                  {...attributes}
               >
                  {Slot()}
               </div>
            </Context>
         )}
         {Style(css`
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
         `)}
      </>
   )

}

function PopoverContent(setup: {
   ref?: NodeRef<'div'>;
   Slot: RenderSlot;
}) {
   const {
      ref,
      $classes,
      $styles,
      Slot,
      ...attributes
   } = setup

   // const popover = fromContext(TOOLTIP)
   // const { gap } = popover;

   return component(
      <div class={$classes()} style={$styles()} {...attributes}>
         {Slot()}
      </div>
   )
}


function PopoverTail(setup: {
   as?: ComponentTag | string;
   offset?: Ion<number>
   'shape:class'?: Ion<string> // FIX: should this just be shapeClasses? or should this be gathered into an object? yes. namespace object
   'shape:style'?: Ion<string>
}) {
   const {
      $classes,
      $styles,
      "$shape:class": $shapeClasses = toIon(''),
      "$shape:style": $shapeStyles = toIon(''),
      $offset = toIon('-30%'),
      as: Comp = 'div',
      ...attributes
   } = setup

   const popover = fromContext(POPOVER)
   const $popover = $fromContext(POPOVER_NODE)

   return component(
      <>
         <div
            at:attach={node => positionTail(node, popover, $popover)}
            class={('tail-root ' + popover.placement + ' ' + $classes())}
            {...attributes}
         >
            <Comp
               class={(`tail ${popover.placement} ${$shapeClasses()}`)}
               style={$shapeStyles}
            ></Comp>
         </div>
         {Style(css`
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
               bottom: ${$offset()};
            }

            .tail.below {
               top: ${$offset()};
            }

            .tail.left {
               right: ${$offset()};
               // top: -50%;
            }

            .tail.right {
               left: ${$offset()};
               // top: -50%;
            }
         `)}
      </>
   )
}



export {
   PopoverContent,
   PopoverTail,
   PopoverRoot
}