import { FromTag, NodeRef, RenderSlot, template } from "@rue/lumo"
import { Ionic } from "@rue/quarky"
import { TooltipArrow, TooltipContent, TooltipModel } from "../ui-base/tooltip/Tooltip"
import { mergeTailwind } from "../utils/utils"

// const transitionInStyles = "data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-[state=delayed-open]:animate-in data-[state=delayed-open]:fade-in-0 data-[state=delayed-open]:zoom-in-95"

// const transitionOutStyles = "data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95"

// const transitionInSlide = "data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2"

// const radixPositionOrigin = "origin-(--radix-tooltip-content-transform-origin)"

// function assertTooltip(tooltip: Ionic<TooltipModel>): asserts tooltip is Ionic<Glass<TooltipModel & Pick<InternalTooltipModel, 'show' | 'hide'>>> {
//    if (!('show' in tooltip) || !('hide' in tooltip)) throw new Error('`show` and `hide` methods missing from tooltip')
// }

function Tooltip(setup: FromTag<{
   ref?: NodeRef<'div'>;
   Slot: RenderSlot,
   gap?: number,
   tooltip: Ionic<TooltipModel>
}>) {
   const {
      ref,
      æclasses,
      tooltip,
      gap = .75,
      Slot,
      ...props
   } = setup

   return template(
      <o--body>
         <TooltipContent
            ref={ref}
            tooltip={tooltip}
            data-slot="tooltip-content"
            gap={gap}
            class={mergeTailwind(
               "rounded-md px-3 py-1.5 text-xs bg-foreground text-background z-50 w-fit max-w-xs",
               æclasses()
            )}
            animate-in={`animate-in fade-in-0 zoom-in-95 ${tooltip.above ? 'slide-in-from-bottom-2' : tooltip.below ? 'slide-in-from-top-2' : tooltip.leftside ? 'slide-in-from-right-2' : 'slide-in-from-left-2'}`}
            animate-out='animate-out fade-out-0 zoom-out-95'
            {...props}
         >
            {Slot}
            <TooltipArrow class="justify-self-center size-2.5 rotate-45 rounded-[2px] bg-foreground fill-foreground z-50" />
         </TooltipContent>
      </o--body>
   )
}

export { Tooltip }