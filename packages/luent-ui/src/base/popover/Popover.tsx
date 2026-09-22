import { Ion, Ionic, toIon, $fromContext, Context, ContextKey, css, fromContext, If, listen, NodeRef, RawJSXNode, RenderTag, Style, template, Xray, FromTag } from "luent"
import { maybeFlip, Popover, positionPopover, positionTail } from "./Popover.kit";

// TODO:
// [] hideDelay should never be greater than delay, clamp hideDelay to delay if it is greater
// [] if the popover blocks the trigger hover, we end up with a weird toggling the popover on-off-on-off situation



const POPOVER = ContextKey<Ionic<Popover>>()
const POPOVER_NODE = ContextKey<NodeRef<'div'>>()

function PopoverRoot(setup: FromTag<{
  ref?: NodeRef<'div'>;
  Slot: RenderTag;
  popover: Ionic<Popover>
}>) {
  const {
    ref: $popover = NodeRef('div'),
    // gap = 0,
    Slot,
    popover,
    ...attributes
  } = setup
  const { gap } = popover
  return (
    <>
      {If(() => popover.visible, 'create', // TODO: configure activation type
        <o:context provide={[POPOVER(popover), POPOVER_NODE($popover)]}>
          <div
            at:mount={() => console.log('mounting popover!')}
            before:attach={node => maybeFlip(node, popover)}
            at:attach={node => positionPopover(node, popover)}
            ref={$popover}
            class={['popover', () => popover.placement, () => popover.alignment]}
            style={() => `--popover-anchor: ${popover.anchorName}`}
            auto-bind={attributes}
          >
            <Slot />
          </div>
        </o:context>
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

function PopoverContent(setup: FromTag<{
  ref?: NodeRef<'div'>;
  Slot: RenderTag;
}>) {
  const {
    ref,
    Slot,
    ...attributes
  } = setup

  return (
    <div auto-bind={attributes}>
      <Slot />
    </div>
  )
}


function PopoverTail(setup: FromTag<{
  as?: RenderTag | string;
  offset?: Ion<number>
  'xray:shape'?: Xray<'div'>
  // 'shape:microclass'?: Ion<string> // FIX: should this just be shapeClasses? or should this be gathered into an object? yes. namespace object
  // 'shape:style'?: Ion<string>
}>) {
  const {
    xray,
    $offset = toIon('-30%'),
    as: Node = 'div',
    ...attributes
  } = setup

  const popover = fromContext(POPOVER)
  const $popover = $fromContext(POPOVER_NODE)

  return (
    <>
      <div
        at:attach={node => positionTail(node, popover, $popover)}
        class={['tail-root', () => popover.placement]}
        auto-bind={attributes}
      >
        <Node
          class={['tail', () => popover.placement]}
          auto-bind={xray.shape}
        ></Node>
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