import { component, fromTag, NodeRef, RenderSlot } from "@rue/luent"
import { TooltipContent, TooltipRoot, IonicTooltip, Alignment, Placement } from "@rue/luent-ui"

export { TooltipKit } from "@rue/luent-ui"

export function HoverInfo(setup: {
  ref?: NodeRef<'div'>;
  Slot: RenderSlot,
  tail?: RenderSlot,
  info: IonicTooltip,
  gap?: number,
  place?: Placement,
  align?: Alignment
}) {
  const {
    ref,
    info,
    tail = true,
    Slot,
    place,
    align,
    gap,
    ...bindings
  } = fromTag(setup)

  info.configure({ placement: place, alignment: align, gap })

  return component(
    <o--body>
      <TooltipRoot
        tooltip={info}>
        <TooltipContent
          microclass={() => `${info.above ? 'origin-bottom' : info.below ? 'origin-top' : info.left ? 'origin-right' : 'origin-left'} rounded-md px-3 py-1.5 text-xs bg-foreground text-background z-50 w-fit max-w-xs`}
          auto-bind={bindings}
          style='background-color: var(--vp-c-text-3); font-family: var(--vp-font-family-mono); font-weight: 600;'
        >
          {Slot()}
        </TooltipContent>
      </TooltipRoot>
    </o--body>
  )
}