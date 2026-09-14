import { FromTag, NodeRef, RenderTag, Style, css } from "luent"
import { TooltipContent, TooltipRoot, IonicTooltip, Alignment, Placement } from "@luent/luent-ui"

export { TooltipKit } from "@luent/luent-ui"

export function HoverInfo(setup: FromTag<{
  ref?: NodeRef<'div'>;
  Slot: RenderTag,
  tail?: RenderTag,
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
    <>
      <TooltipRoot
        tooltip={tooltip}>
        <TooltipContent
          microclass={() => `${tooltip.above ? 'origin-bottom' : tooltip.below ? 'origin-top' : tooltip.left ? 'origin-right' : 'origin-left'} rounded-md px-3 py-1.5 text-xs bg-foreground text-background z-50 w-fit max-w-xs`}
          auto-bind={bindings}
          class='hover-info'
        >
          <Slot />
        </TooltipContent>
      </TooltipRoot>
      
      {Style(css`
        .hover-info {
          border: 1px solid var(--vp-c-divider);
          background-color: var(--vp-c-bg); 
          font-family: var(--vp-font-family-mono); 
          font-weight: 600;
        }
      `)}
    </>

    // </o--body>
  )
}