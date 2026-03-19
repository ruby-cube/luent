import { ComponentTag, Context, ContextKey, css, fromContext, FromTag, If, listen, NodeRef, RawJSXNode, RenderSlot, style, template } from "@rue/lumo"
import { mergeTailwind } from "../../utils/utils"
import { Ion, Ionic, queueTask, toIon } from "@rue/quarky"



function TooltipTail(setup: FromTag<{
   as?: ComponentTag | string;
   offset?: Ion<number>
   'shape:class'?: Ion<string>
   'shape:style'?: Ion<string>
}>) {
   const {
      æclasses,
      æstyles,
      "æshape:class": æshapeClasses = toIon(''),
      "æshape:style": æshapeStyles = toIon(''),
      æoffset = toIon('-30%'),
      as: Comp = 'div',
      ...attributes
   } = setup

   const tooltip = fromContext(TOOLTIP)
   const { gap, placement } = tooltip
   console.log('styles', æstyles())
   return template(
      <div
         class={'arrow-root ' + placement + ' ' + æclasses()}
         style={(`--tooltip-anchor: ${tooltip.anchorName}; ${æstyles()}`)}
         {...attributes}
      >
         <Comp
            class={(`arrow ${placement} ${æshapeClasses()}`)}
            style={æshapeStyles}
         ></Comp>
      </div>
   )
      .style(css`
         .arrow-root {
            position: absolute;
            position-anchor: var(--tooltip-anchor);
            isolation: isolate;
         }

         .arrow-root.above {
            justify-self: anchor-center;
            bottom: calc(anchor(top) + ${gap}rem);
         }

         .arrow-root.below {
            justify-self: anchor-center;
            top: calc(anchor(bottom) + ${gap}rem);
            clip-path: polygon(0% 0%, 0% -100%, 100% -100%, 100% 0%, 0% 0%)
         }

         .arrow-root.left {
            align-self: anchor-center;
            right: calc(anchor(left) + ${gap}rem);
         }

         .arrow-root.right {
            align-self: anchor-center;
            left: calc(anchor(right) + ${gap}rem);
         }

         .arrow {
            position: absolute;
         }

         .arrow.above {
            bottom: ${æoffset()};
         }

         .arrow.below {
            top: ${æoffset()};
         }

         .arrow.left {
            right:${æoffset()};
         }

         .arrow.right {
            left: ${æoffset()};
         }
      `)
}

const TOOLTIP = ContextKey<Ionic<TooltipModel>>()


function TooltipRoot(setup: FromTag<{
   ref?: NodeRef<'div'>;
   Slot: RenderSlot;
   tooltip: Ionic<TooltipModel>
}>) {
   const {
      ref,
      æclasses,
      æstyles,
      // gap = 0,
      Slot,
      tooltip,
      ...attributes
   } = setup

   console.log('attributes?', attributes)

   return template(
      <>
         {If((tooltip.visible),
            <Context provide={TOOLTIP(tooltip)}>
               {Slot()}
            </Context>
         )}
      </>
   )

}

function TooltipContent(setup: FromTag<{
   ref?: NodeRef<'div'>;
   Slot: RenderSlot;
}>) {
   const {
      ref,
      æclasses,
      æstyles,
      Slot,
      ...attributes
   } = setup

   const tooltip = fromContext(TOOLTIP)
   const { placement, gap } = tooltip;

   return template(
      <div
         ref={ref}
         class={('tooltip ' + placement + ' ' + æclasses())}
         style={(`--tooltip-anchor: ${tooltip.anchorName}; ${æstyles()}`)}
         {...attributes}
      >{Slot}</div>
   )
      .style(css`
         .tooltip {
            position: absolute;
            position-anchor: var(--tooltip-anchor);
            isolation: isolate;
         }

         .tooltip.above {
            justify-self: anchor-center;
            bottom: calc(anchor(top) + ${gap}rem);
         }

         .tooltip.below {
            justify-self: anchor-center;
            top: calc(anchor(bottom) + ${gap}rem);
         }

         .tooltip.left {
            align-self: anchor-center;
            right: calc(anchor(left) + ${gap}rem);
         }

         .tooltip.right {
            align-self: anchor-center;
            left: calc(anchor(right) + ${gap}rem);
         }
      `)
}

// type RenderTooltip = (data: { tooltip: string }) => RawJSXNode
// const TOOLTIP = ContextKey<Ionic<InternalTooltipModel>>()

// function TooltipPod(setup: FromTag<{
//    tooltip: RenderTooltip,
//    Slot: RenderSlot
// }>) {
//    const { Slot, tooltip: renderTooltip } = setup
//    const tooltip = Ionic(new InternalTooltipModel('above'))
//    const renderSlot = collectTriggers(Slot, tooltip)

//    return template(
//       <Context provide={TOOLTIP(tooltip)}>
//          {renderSlot}
//          {If(tooltip.ævisible, () =>
//             renderTooltip(tooltip.data)
//          )}
//       </Context>
//    )
// }

// function collectTriggers(Slot: RenderSlot, tooltip: Ionic<InternalTooltipModel>) {
//    return function renderSlot() {
//       const fragment = mountToFragment(Slot)
//       const triggers = fragment.querySelectorAll('data-tooltip')

//       tooltip.setUpTriggers(triggers)
//       return fragment
//    }
// }




type TooltipConfig = Readonly<{
   delay?: number,
   closeDelay?: number,
   undelayed?: number
}>

const TOOLTIP_CONFIG = ContextKey<TooltipConfig>()

type Placement = 'above' | 'below' | 'left' | 'right'



function createTooltip<O>(options?: O & {
   gap?: number,
   placement?: Placement,
   info?: { [key: string]: unknown }
}) {
   const tooltip = Ionic(new InternalTooltipModel(
      options?.placement ?? 'above',
      options?.gap ?? .75,
      (options?.info ?? {}) as O extends { info: infer I } ? I : {}
   ))

   return tooltip as unknown as Readonly<Ionic<InternalTooltipModel<O extends { info: infer I } ? I : {}>>>
}

type AsTooltipTrigger = (node: HTMLElement) => void
type AsTooltipAnchor = (node: HTMLElement) => void

type TooltipData<T> = T[keyof T]

let tooltipID = 0

class InternalTooltipModel<T = {}> {
   private anchorRoot: string = '--tooltip-anchor-' + tooltipID++

   anchorName: string = ''

   private triggers: { [K in keyof T]: AsTooltipTrigger } | undefined
   private anchors: { [K in keyof T]: AsTooltipAnchor } | undefined

   get trigger(): { [K in keyof T]: AsTooltipTrigger } { // NOTE: we must `get` in order to have access to Ionic proxy
      return this.triggers ?? (this.triggers = this.TooltipTriggerSetup(this.config))
   }

   get anchor(): { [K in keyof T]: AsTooltipAnchor } {
      return this.anchors ?? (this.anchors = this.TooltipAnchorSetup(this.config))
   }

   info!: T[keyof T]

   constructor(
      public placement: Placement,
      public gap: number,
      private config: T
   ) {
   }

   visible = false

   show(info?: T[keyof T] | undefined) {
      if (info !== undefined) this.info = info;
      this.visible = true
   }

   hide() {
      this.visible = false
   }

   private setAnchor(key: string) {
      this.anchorName = this.anchorRoot + '-' + key
   }

   get above() { return this.placement === 'above' }
   get below() { return this.placement === 'below' }
   get leftside() { return this.placement === 'left' }
   get rightside() { return this.placement === 'right' }

   private TooltipAnchorSetup<T>(config: T) {
      const anchor = Object.create(null)
      for (const key in config) {
         anchor[key] = this.AsTooltipAnchor(key)
      }
      return anchor
   }

   private AsTooltipAnchor(key: string) {
      let set = false;
      return (node: HTMLElement) => {
         if (set) return;
         set = true;
         // @ts-expect-error
         node.style.anchorName
            = this.anchorRoot + '-' + key
      }
   }


   private TooltipTriggerSetup<T>(config: T) {
      const trigger = Object.create(null)
      for (const key in config) {
         trigger[key] = this.AsTooltipTrigger(key, config[key])
      }
      return trigger
   }



   private AsTooltipTrigger(key: string, info: any | undefined) {

      return (node: HTMLElement) => {
         queueTask(() => {
            this.anchor[key as keyof T](node)
         })

         const showTooltip = () => {
            this.setAnchor(key) // TODO: assuming trigger is the same as anchor
            queueTask(() => this.show(info))
         }

         const hideTooltip = () => {
            if (closeDelay) {
               closeTimeout = setTimeout(() => {
                  this.hide()
               }, closeDelay)
            }
            else {
               this.hide()
            }
         }

         const config = fromContext(TOOLTIP_CONFIG, '?')
         const delay = config?.delay ?? /* options?.delay */ 0
         const closeDelay = config?.closeDelay ?? /* options?.closeDelay */ 0
         let closeTimeout: NodeJS.Timeout
         if (delay) {
            let timeout: NodeJS.Timeout;
            listen(node, 'mouseenter', () => {
               if (closeTimeout) clearTimeout(closeTimeout)
               timeout = setTimeout(() => {
                  showTooltip()
                  listen(node, 'mouseleave', hideTooltip)
               }, delay)
            })

            listen(node, 'mouseleave', () => {
               if (timeout) {
                  clearTimeout(timeout)
               }
            })
         }
         else {
            listen(node, 'mouseenter', showTooltip)
            listen(node, 'mouseleave', hideTooltip)
         }
      }
   }
}



export type TooltipModel = Readonly<InternalTooltipModel<any>>


export {
   TooltipContent,
   TooltipTail,
   TooltipRoot,
   createTooltip,
   TOOLTIP_CONFIG
}