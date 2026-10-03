import { Button } from "../Button"
import { Tooltip, TOOLTIP_CONFIG, TooltipKit } from "@luent/luent-ui"

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


const demoBoxStyle = "relative flex h-72 w-full justify-center p-10 data-[align=center]:items-center data-[align=end]:items-end data-[align=start]:items-start data-[chromeless=true]:h-auto data-[chromeless=true]:p-0"

export function TooltipDemo() {
  const { tooltip, setTooltipTrigger } = TooltipKit({
    info: { // TODO: remove info?
      bold: 'Bold',
      italic: 'Italic',
      underline: 'Underline'
    }
  })

  return (
    <o:context map={[TOOLTIP_CONFIG({ /* delay: 500, hideDelay: 500 */ })]}>
      <div data-align='center' class={demoBoxStyle}>

        {/* <div style='background-color: lightblue' before:mount={tooltip.anchor.bold}>b</div> */}
        {/* <div style='background-color: lightblue' before:mount={tooltip.anchor.italic}>i</div> */}
        {/* <div style='background-color: lightblue' before:mount={tooltip.anchor.underline}>u</div> */}
        {/* <Button before:mount={tooltip.anchor.default} variant='outline'>o</Button> */}
        <Button before:mount={setTooltipTrigger.bold} variant="outline">
          B
        </Button>
        <Button before:mount={setTooltipTrigger.italic} variant="outline">
          I
        </Button>
        <Button before:mount={setTooltipTrigger.underline} variant="outline">
          U
        </Button>
        <Tooltip tooltip={tooltip} place="above" align="center">
          <p>{() => tooltip.info}</p>
        </Tooltip>
      </div>
      <button class='mt-70' on:click={() => tooltip.hide()}>hide tooltip</button>
    </o:context>
  )
}

// if (__STYLE__) {
//   mountIsland(TooltipDemo, '#root')
// }

