import { Context, createRoot, NodeRef, template } from "@rue/lumo"
import { Button } from "../Button"
import { Tooltip } from "../Tooltip"
import { TOOLTIP_CONFIG, createTooltip } from "../../ui-base/tooltip/Tooltip"

// Basic:
// [X] anchoring
// [X] responsive flip
// [X] responsive shift
// [X] placement
// [X] close delay window
// [X] tooltip default anchor
// [] tooltip default trigger (no info)
// [x] show-hide arrow
// [X] show-hide
// [X] show-hide with delay
// [X] show-hide with transitions

// Fancy:
// [] align start instead of center
// [] transition across triggers (don't close tooltip)


const demoBoxStyle = ""
// "relative flex h-72 w-full justify-center p-10 data-[align=center]:items-center data-[align=end]:items-end data-[align=start]:items-start data-[chromeless=true]:h-auto data-[chromeless=true]:p-0"

export function TooltipDemo() {
   const tooltip = createTooltip({
      // placement: 'above',
      placement: 'left',
      // placement: 'right',
      // placement: 'below',
      info: {
         bold: 'Bold Bold Bold Bold',
         italic: 'Italic',
         underline: 'Underline'
      }
   })

   return template(
      <Context provide={[TOOLTIP_CONFIG({ delay: 600, hideDelay: 500 })]}>
         <div data-align='center' class={demoBoxStyle}>

            {/* <div style='background-color: lightblue' at:create={tooltip.anchor.bold}>b</div> */}
            <div style='background-color: lightblue' at:create={tooltip.anchor.italic}>i</div>
            {/* <div style='background-color: lightblue' at:create={tooltip.anchor.underline}>u</div> */}
            <Button at:create={tooltip.anchor.default} variant='outline'>o</Button>
            <Button at:create={tooltip.trigger.bold} variant="outline">
               B
            </Button>
            <Button at:create={tooltip.trigger.italic} variant="outline">
               I
            </Button>
            <Button at:create={[tooltip.trigger.underline, tooltip.anchor.underline]} variant="outline">
               U
            </Button>
            <Tooltip tooltip={tooltip}>
               <p>{(tooltip.info)}</p>
               <p>{(tooltip.info)}</p>
               <p>{(tooltip.info)}</p>
            </Tooltip>
         </div>
         <button class='mt-70' on:click={e => tooltip.hide()}>hide tooltip</button>
      </Context>
   )
}

if (__STYLE__) {
   createRoot(TooltipDemo).mount('#root')
}

