import { atCreate, atMounted, ComponentTag, Context, ContextKey, createRoot, css, Finitron, fromContext, FromTag, If, listen, NodeRef, queueRender, RenderSlot, TagName, template } from "@rue/lumo"
import { Button } from "../Button"
import { mergeTailwind } from "../../utils/utils"
import { Ion, Ionic, queueTask, watch } from "@rue/quarky"

// import {
//    Tooltip,
//    TooltipContent,
//    TooltipTrigger,
// } from "../Tooltip"

// [X] anchoring
// [] responsive re-anchoring
// [X] show-hide
// [X] show-hide with delay
// [] show-hide with transitions


// anchor
// trigger
const demoBoxStyle = "relative flex h-72 w-full justify-center p-10 data-[align=center]:items-center data-[align=end]:items-end data-[align=start]:items-start data-[chromeless=true]:h-auto data-[chromeless=true]:p-0"

export function TooltipDemo() {
   const { $tooltip, asTooltipAnchor, tooltip } = TooltipKit()

   return template(
      // <Context provide={[TOOLTIP_CONFIG({ delay: 600, closeDelay: 600 })]}>
      <div data-align='center' class={demoBoxStyle}>
         <Button at:create={asTooltipAnchor} variant="outline">
            Hover
         </Button>
         <Tooltip ref={$tooltip} tooltip={tooltip}>
            <p>Add to library</p>
         </Tooltip>
      </div>
      // </Context>
   )
}

type TooltipConfig = Readonly<{
   delay?: number,
   closeDelay?: number,
   timeout?: number
}>

const TOOLTIP_CONFIG = ContextKey<TooltipConfig>()

type Placement = 'above' | 'below' | 'left' | 'right'
function TooltipKit(options?: { placement: Placement }) {
   const $tooltip = NodeRef(TooltipContent);
   const $placement = Ion(options?.placement ?? 'above')

   function asTooltipTrigger(node: HTMLElement, options?: TooltipConfig) {
      const config = fromContext(TOOLTIP_CONFIG, '?')
      const delay = config?.delay ?? options?.delay
      const closeDelay = config?.closeDelay ?? options?.closeDelay
      let closeTimeout: NodeJS.Timeout
      if (delay) {
         let timeout: NodeJS.Timeout;
         listen(node, 'mouseenter', () => {
            if (closeTimeout) clearTimeout(closeTimeout)
            timeout = setTimeout(() => {
               $tooltip()?.show()
               listen(node, 'mouseleave', () => {
                  closeTooltip()
               })
            }, delay)
         })

         listen(node, 'mouseleave', () => {
            if (timeout) {
               clearTimeout(timeout)
            }
         })
      }
      else {
         listen(node, 'mouseenter', () => {
            $tooltip()?.show()
         })

         listen(node, 'mouseleave', () => {
            closeTooltip()
         })
      }
      function closeTooltip() {
         if (closeDelay) {
            closeTimeout = setTimeout(() => {
               $tooltip()?.hide()
            }, closeDelay)
         }
         else {
            $tooltip()?.hide()
         }
      }
   }

   const tooltip = Ionic({
      get above() { return $placement() === 'above' },
      get below() { return $placement() === 'below' },
      get leftside() { return $placement() === 'left' },
      get rightside() { return $placement() === 'right' },
   })

   return {
      $tooltip,
      asTooltipTrigger,
      asTooltipAnchor(node: HTMLElement, asTrigger = true) {
         if (asTrigger) asTooltipTrigger(node)
         //@ts-expect-error
         node.style.anchorName = '--tooltip-anchor' + 0 // id
         $tooltip()?.anchor('--tooltip-anchor' + 0)
      },
      tooltip
   }
}

type TooltipState = {
   readonly above: boolean;
   readonly below: boolean;
   readonly leftside: boolean;
   readonly rightside: boolean;
}


// ---

// function TooltipProvider({
//    delayDuration = 0,
//    ...props
// }: FromTag<typeof TooltipPrimitive.Provider>) {
//    return (
//       <TooltipPrimitive.Provider
//          data-slot="tooltip-provider"
//          delayDuration={delayDuration}
//          {...props}
//       />
//    )
// }

// function Tooltip({
//    ...props
// }: FromTag<{}>) {
//    return <TooltipPrimitive.Root {...props} />
// }

// function TooltipTrigger({
//    ...props
// }: FromTag<{}>) {
//    return <TooltipPrimitive.Trigger data-slot="tooltip-trigger" {...props} />
// }

const transitionInStyles = "data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-[state=delayed-open]:animate-in data-[state=delayed-open]:fade-in-0 data-[state=delayed-open]:zoom-in-95"

const transitionOutStyles = "data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95"

const transitionInSlide = "data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2"

const radixPositionOrigin = "origin-(--radix-tooltip-content-transform-origin)"


function Tooltip({
   $classes,
   tooltip,
   gap = .75,
   Slot,
   ...props
}: FromTag<{ Slot: RenderSlot, gap?: number, tooltip: Ionic<TooltipState> }>) {
   const $tooltip = NodeRef(TooltipContent)

   return template(
      <o--body>
         <TooltipContent
            ref={$tooltip}
            data-slot="tooltip-content"
            gap={gap}
            class={mergeTailwind(
               "rounded-md px-3 py-1.5 text-xs bg-foreground text-background z-50 w-fit max-w-xs",
               $classes()
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
      .ref($tooltip)

}

export { Tooltip }

// Base

function TooltipArrow({
   $classes,
   as: Comp = 'div'
}: FromTag<{ as?: ComponentTag | string }>) {

   return template(
      <Comp class={(mergeTailwind('absolute', $classes()))}></Comp>
   )
}

const POPOVER_ID = ContextKey<string>()



function TooltipContent({
   $classes,
   gap = 0,
   Slot,
   ...attributes
}: FromTag<{ Slot: RenderSlot, gap?: number }>) {
   const $show = Ion(false)
   // const tooltip = Finitron({
   //    'open': { 'close': () => 'closed' },
   //    'closed': { 'reset': () => 'open' }
   // })
   const $div = NodeRef('div')
   const $anchorName = Ion('')

   console.log('### Tooltip Content attributes', attributes)

   // tooltip.activate(() => 'open')

   return template(
      <>
         {If($show,
            <div
               // at:create={node => {
               //    // watch(() => tooltip.state, ({ previous }) => {
               //    //    if (previous === 'open') {
               //    //       listen(node, 'transitionend', () => {
               //    //          $show.value = false;
               //    //          tooltip.apply('reset')
               //    //       })
               //    //    }
               //    // })
               // }}
               ref={$div}
               // data-open={(tooltip.is('open'))}
               // data-closed={(tooltip.is('closed'))}
               class={'tooltip ' + $classes()}
               style={(`--tooltip-anchor: ${$anchorName()};`)}
               {...attributes}
            >{Slot}</div>
         )}
      </>
   )
      .style(css`
         .tooltip {
            position: absolute;
            position-anchor: var(--tooltip-anchor);
            isolation: isolate;
            justify-self: anchor-center;
            bottom: calc(anchor(top) + ${gap}rem);
         }
      `)
      .ref({
         show() {
            $show.value = true;
            // tooltip.apply('reset')
         },
         hide() {
            // tooltip!.apply('close')
            $show.value = false
         },
         anchor(name: string) {
            $anchorName.value = name
         }
      })
}



// export enum CommonPopupDataAttributes {
//   /**
//    * Present when the popup is open.
//    */
//   open = 'data-open',
//   /**
//    * Present when the popup is closed.
//    */
//   closed = 'data-closed',
//   /**
//    * Present when the popup is animating in.
//    */
//   startingStyle = TransitionStatusDataAttributes.startingStyle,
//   /**
//    * Present when the popup is animating out.
//    */
//   endingStyle = TransitionStatusDataAttributes.endingStyle,
//   /**
//    * Present when the anchor is hidden.
//    */
//   anchorHidden = 'data-anchor-hidden',
//   /**
//    * Indicates which side the popup is positioned relative to the trigger.
//    * @type { 'top' | 'bottom' | 'left' | 'right' | 'inline-end' | 'inline-start'}
//    */
//   side = 'data-side',
//   /**
//    * Indicates how the popup is aligned relative to specified side.
//    * @type {'start' | 'center' | 'end'}
//    */
//   align = 'data-align',
// }

if (__STYLE__) {
   createRoot(TooltipDemo).mount('#root')
}

