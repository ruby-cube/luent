import { component, Context, createRoot, NodeRef, template } from "@rue/luent"
import { Button } from "../Button"
import { Tooltip } from "../Tooltip"
import { IonicTooltip, TOOLTIP_CONFIG, TooltipKit } from "../../ui-base/tooltip/Tooltip.kit"

// Basic:
// [X] anchoring
// [X] responsive flip
// [X] responsive shift
// [X] placement
// [X] close delay window
// [X] tooltip default anchor
// [] tooltip default trigger (no info)
// [x] show-hide tail
// [X] show-hide
// [X] show-hide with delay
// [X] show-hide with transitions

// Fancy:
// [] 'align' start instead of center
// [] transition across triggers (don't close tooltip)


const demoBoxStyle = ""
// "relative flex h-72 w-full justify-center p-10 data-[align=center]:items-center data-[align=end]:items-end data-[align=start]:items-start data-[chromeless=true]:h-auto data-[chromeless=true]:p-0"

export function TooltipDemo() {
   const { tooltip, asTooltipTrigger } = TooltipKit({
      info: { // TODO: remove info?
         bold: 'Bold Bold Bold Bold',
         italic: 'Italic',
         underline: 'Underline'
      }
   })

   

   return component(
      <v-context provide={[TOOLTIP_CONFIG({ delay: 600, hideDelay: 600 })]}>
         <div data-align='center' class={demoBoxStyle}>

            {/* <div style='background-color: lightblue' pre:mount={tooltip.anchor.bold}>b</div> */}
            {/* <div style='background-color: lightblue' pre:mount={tooltip.anchor.italic}>i</div> */}
            {/* <div style='background-color: lightblue' pre:mount={tooltip.anchor.underline}>u</div> */}
            {/* <Button pre:mount={tooltip.anchor.default} variant='outline'>o</Button> */}
            <Button pre:mount={asTooltipTrigger.bold} variant="outline">
               B
            </Button>
            <Button pre:mount={asTooltipTrigger.italic} variant="outline">
               I
            </Button>
            <Button pre:mount={asTooltipTrigger.underline} variant="outline">
               U
            </Button>
            <Tooltip tooltip={tooltip} place="above" align="center">
               <p>{(tooltip.info)}</p>
               <p>{(tooltip.info)}</p>
               <p>{(tooltip.info)}</p>
            </Tooltip>
         </div>
         <button class='mt-70' on:click={e => tooltip.hide()}>hide tooltip</button>
      </v-context>
   )
}

if (__STYLE__) {
   createRoot(TooltipDemo).mount('#root')
}

