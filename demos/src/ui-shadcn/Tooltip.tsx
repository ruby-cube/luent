import { component, fromTag, If, NodeRef, RenderSlot, template } from "@rue/luent"
import { TooltipContent, TooltipRoot, TooltipTail } from "../ui-base/tooltip/Tooltip"
import { IonicTooltip } from "../ui-base/tooltip/Tooltip.kit";
import { Alignment, Placement } from "../ui-base/popover/Popover.kit";

// const transitionInStyles = "data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-[state=delayed-open]:animate-in data-[state=delayed-open]:fade-in-0 data-[state=delayed-open]:zoom-in-95"

// const transitionOutStyles = "data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95"

// const transitionInSlide = "data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2"

// const radixPositionOrigin = "origin-(--radix-tooltip-content-transform-origin)"

// function assertTooltip(tooltip: IonicTooltip): asserts tooltip is Ionic<Glass<TooltipModel & Pick<TooltipModel, 'show' | 'hide'>>> {
//    if (!('show' in tooltip) || !('hide' in tooltip)) throw new Error('`show` and `hide` methods missing from tooltip')
// }

function Tooltip(setup: {
  ref?: NodeRef<'div'>;
  Slot: RenderSlot,
  tail?: RenderSlot,
  tooltip: IonicTooltip,
  gap?: number,
  place?: Placement,
  align?: Alignment
}) {
  const {
    ref,
    tooltip,
    tail = true,
    Slot,
    place,
    align,
    gap,
    ...bindings
  } = fromTag(setup)

  tooltip.configure({ placement: place, alignment: align, gap })

  /* FIX: flipping happens AFTER transition origin and slide in is already determined, so tooltip slides in from wrong direction if tooltip is flipped. How do we delay transition until after the flip? */
  // TODO: fix tailwind class intellisense
  const slideIn = () => `${tooltip.above ? 'slide-in-from-bottom-2' : tooltip.below ? 'slide-in-from-top-2' : tooltip.left ? 'slide-in-from-right-2' : 'slide-in-from-left-2'}`
  const animateIn = `animate-in fade-in-0 zoom-in-95`
  const animateOut = `animate-out fade-out-0 zoom-out-95`

  return component(
    <o--body>
      <TooltipRoot
        animate-in={() => animateIn + ' ' + slideIn()}
        animate-out={animateOut}
        // transit-key='tooltip'
        // animate-item
        tooltip={tooltip}>
        <TooltipContent
          microclass={() => `${tooltip.above ? 'origin-bottom' : tooltip.below ? 'origin-top' : tooltip.left ? 'origin-right' : 'origin-left'} rounded-md px-3 py-1.5 text-xs bg-foreground text-background z-50 w-fit max-w-xs`}
          auto-bind={bindings}
        >
          {Slot()}
        </TooltipContent>
        <TooltipTail
          microclass={`size-2.5`}
          shape:microclass='size-2.5 rotate-45 rounded-[2px] bg-foreground fill-foreground z-50'
        >
        </TooltipTail>
      </TooltipRoot>
    </o--body>
  )
}

export { Tooltip }