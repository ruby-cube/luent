import { component, FromTag, NodeRef, RenderSlot } from "luent"
import { TooltipContent, TooltipRoot, IonicTooltip, Alignment, Placement } from "@luent/luent-ui"

export { TooltipKit } from "@luent/luent-ui"

export function HoverInfo(setup: FromTag<{
  ref?: NodeRef<'div'>;
  Slot: RenderSlot,
  tail?: RenderSlot,
  tooltip: IonicTooltip,
  gap?: number,
  place?: Placement,
  align?: Alignment
}>) {
  const {
    ref,
    tooltip,
    tail = true,
    Slot,
    place = "above",
    align,
    gap,
    ...bindings
  } = setup

  tooltip.configure({ placement: place, alignment: align, gap })

  return (
    // <o--body>
      <TooltipRoot
        tooltip={tooltip}>
        <TooltipContent
          microclass={() => `${tooltip.above ? 'origin-bottom' : tooltip.below ? 'origin-top' : tooltip.left ? 'origin-right' : 'origin-left'} rounded-md px-3 py-1.5 text-xs bg-foreground text-background z-50 w-fit max-w-xs`}
          auto-bind={bindings}
          style='background-color: var(--vp-c-text-3); font-family: var(--vp-font-family-mono); font-weight: 600;'
        >
          {Slot()}
        </TooltipContent>
      </TooltipRoot>
    // </o--body>
  )
}