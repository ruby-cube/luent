import { Context, createRoot, template } from "@rue/lumo"
import { Button } from "../Button"
import { Tooltip } from "../Tooltip"
import { TOOLTIP_CONFIG, createTooltip } from "../../ui-base/tooltip/Tooltip"
import { watch } from "@rue/quarky"

// [X] anchoring
// [] responsive re-anchoring
// [] placement
// [] close delay window
// [] tooltip default anchor
// [] tooltip default trigger (no info)
// [X] show-hide
// [X] show-hide with delay
// [X] show-hide with transitions


const demoBoxStyle = "relative flex h-72 w-full justify-center p-10 data-[align=center]:items-center data-[align=end]:items-end data-[align=start]:items-start data-[chromeless=true]:h-auto data-[chromeless=true]:p-0"

export function TooltipDemo() {
   const tooltip = createTooltip({
      placement: 'above',
      info: {
         bold: 'Bold',
         italic: 'Italic',
         underline: 'Underline'
      }
   })

   return template(
      <Context provide={[TOOLTIP_CONFIG({ delay: 600 })]}>
         <div data-align='center' class={demoBoxStyle}>

            {/* <div at:create={tooltip.anchor.bold}>b</div>
         <div at:create={tooltip.anchor.italic}>i</div>
         <div at:create={tooltip.anchor.underline}>u</div> */}
            {/* <div at:create={tooltip.anchor.default}>o</div> */}
            <Button at:create={tooltip.trigger.bold} variant="outline">
               B
            </Button>
            <Button at:create={tooltip.trigger.italic} variant="outline">
               I
            </Button>
            <Button at:create={tooltip.trigger.underline} variant="outline">
               U
            </Button>
            <Tooltip tooltip={tooltip}>
               <p>{(tooltip.info)}</p>
            </Tooltip>
         </div>
      </Context>
   )
}

if (__STYLE__) {
   createRoot(TooltipDemo).mount('#root')
}

