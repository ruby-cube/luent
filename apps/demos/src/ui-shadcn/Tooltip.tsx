import { FromTag, If, NodeRef, RenderSlot, template } from "@rue/lumo"
import { Ionic } from "@rue/quarky"
import { TooltipContent, TooltipModel, TooltipRoot, TooltipTail } from "../ui-base/tooltip/Tooltip"
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
   arrow?: RenderSlot,
   tooltip: Ionic<TooltipModel>
}>) {
   const {
      ref,
      æclasses,
      tooltip,
      arrow = true,
      Slot,
      ...props
   } = setup

   const slideIn = () =>`${tooltip.above ? 'slide-in-from-bottom-2' : tooltip.below ? 'slide-in-from-top-2' : tooltip.leftside ? 'slide-in-from-right-2' : 'slide-in-from-left-2'}`
   const animateIn = `animate-in fade-in-0 zoom-in-95`
   const animateOut = `animate-out fade-out-0 zoom-out-95`

   return template(
      <o--body>
         <TooltipRoot
            animate-in={(animateIn + ' ' + slideIn())}
            animate-out={animateOut}
            tooltip={tooltip}>
            <TooltipContent
               class={(mergeTailwind(
                  `${tooltip.above ? 'origin-bottom' : tooltip.below ? 'origin-top' : tooltip.leftside ? 'origin-right' : 'origin-left'} rounded-md px-3 py-1.5 text-xs bg-foreground text-background z-50 w-fit max-w-xs`,
                  æclasses()
               ))}
               {...props}
            >
               {Slot}
            </TooltipContent>
            <TooltipTail
               class={`size-2.5`}
               shape:class='size-2.5 rotate-45 rounded-[2px] bg-foreground fill-foreground z-50'
            >
            </TooltipTail>
         </TooltipRoot>
      </o--body>
   )
}

export { Tooltip }