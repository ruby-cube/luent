import { atCreate, atMounted, ContextKey, createRoot, css, Finitron, fromContext, FromTag, If, listen, NodeRef, queueRender, RenderSlot, template } from "@rue/lumo"
import { Button } from "../Button"
import { mergeTailwind } from "../../utils/utils"
import { Ion, queueTask, watch } from "@rue/quarky"

// import {
//    Tooltip,
//    TooltipContent,
//    TooltipTrigger,
// } from "../Tooltip"

// anchor
// trigger
const demoBoxStyle = "relative flex h-72 w-full justify-center p-10 data-[align=center]:items-center data-[align=end]:items-end data-[align=start]:items-start data-[chromeless=true]:h-auto data-[chromeless=true]:p-0"

export function TooltipDemo() {
   const { $tooltip, asTooltipAnchor } = TooltipKit()

   return template(
      <div data-align='center' class={demoBoxStyle}>
         <Button at:create={asTooltipAnchor} variant="outline">
            Hover
         </Button>
         <Tooltip ref={$tooltip}>
            <p>Add to library</p>
         </Tooltip>
      </div>
   )
}

function TooltipKit() {
   const $tooltip = NodeRef(TooltipContent);

   return {
      $tooltip,
      asTooltipTrigger: function asTooltipTrigger(node: HTMLElement) {
         listen(node, 'mouseenter', () => {
            $tooltip()?.show()
         })

         listen(node, 'mouseleave', () => {
            $tooltip()?.hide()
         })
      },
      asTooltipAnchor(node: HTMLElement, asTrigger = false) {
         if (asTrigger) this.asTooltipTrigger(node)
         // console.log('asTooltipAnchor', node)
         // console.log('asTooltipAnchor: $tooltip (expect TooltipContent instance)', $tooltip())
         // node.style.anchorName = '--tooltip-anchor' + 0 // id
         $tooltip()?.anchor('--tooltip-anchor' + 0)
      }
   }
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
   sideOffset = 0,
   Slot,
   ...props
}: FromTag<{ Slot: RenderSlot, sideOffset?: number }>) {
   const $tooltip = NodeRef(TooltipContent)

   return template(
      <o--body>
         <TooltipContent
            ref={$tooltip}
            data-slot="tooltip-content"
            sideOffset={sideOffset}
            class={mergeTailwind(
               "rounded-md px-3 py-1.5 text-xs bg-foreground text-background z-50 w-fit max-w-xs",
               $classes()
            )}
            {...props}
         >
            {Slot}
            <TooltipArrow class="size-2.5 rotate-45 rounded-[2px] bg-foreground fill-foreground z-50 translate-y-[calc(-50%_-_2px)]" />
         </TooltipContent>
      </o--body>
   )
      .ref($tooltip)
}

export { Tooltip }

// Base

function TooltipArrow({ $classes }: FromTag<{}>) {

   return template(
      <div class={$classes}></div>
   )
}

const POPOVER_ID = ContextKey<string>()



function TooltipContent({
   $classes,
   sideOffset,
   ...attributes
}: FromTag<{ Slot: RenderSlot, sideOffset?: number }>) {
   const $show = Ion(true)
   const tooltip = Finitron({
      'open': { 'close': () => 'closed' },
      'closed': { 'reset': () => 'open' }
   })
   const $div = NodeRef('div')
   const $anchorName = Ion('')

   tooltip.activate(() => 'open')

   return template(
      <>
         {If($show,
            <div
               at:create={node => { // TODO: ref should be available
                  // watch(() => tooltip.state, ({ previous }) => {
                  //    if (previous === 'open') {
                  //       listen(node, 'transitionend', () => {
                  //          $show.value = false;
                  //          tooltip.apply('reset')
                  //       })
                  //    }
                  // })
               }}
               ref={$div}
               data-open={(tooltip.is('open'))}
               data-closed={(tooltip.is('closed'))}
               class={'tooltip ' + $classes()}
               style={(`--tooltip-anchor: ${$anchorName()};`)}
               {...attributes}
            ></div>
         )}
      </>
   )
      .style(css`
         .tooltip {
            position: absolute;
            position-anchor: var(--tooltip-anchor);
            isolation: isolate;
         }
      `)
      .ref({
         show() {
            $show.value = true;
            tooltip.apply('reset')
         },
         hide() {
            tooltip!.apply('close')
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