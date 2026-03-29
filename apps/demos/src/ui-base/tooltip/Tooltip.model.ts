import { autoUpdate, computePosition } from "@floating-ui/dom"
import { atDiscard, ContextKey, fromContext, fromRoot, listen, NodeRef, provideRoot } from "@rue/lumo"
import { Expand, Ion, Ionic, queueLayout, queueTask } from "@rue/quarky"
import { AnyObject } from "@rue/types"
import { debug } from "@rue/utils"


type TooltipConfig = Readonly<{
   delay?: number,
   hideDelay?: number,
   undelayed?: number
}>

const TOOLTIP_CONFIG = ContextKey<TooltipConfig>()

type Placement = 'above' | 'below' | 'left' | 'right'



// function IonicTooltip<O>(options?: O & {
//    gap?: number,
//    placement?: Placement,
//    info?: { [key: string]: unknown }
// }): O extends { info: infer I } ? IonicTooltip<I> : IonicTooltip {

//    return (Ionic(new TooltipModel(
//       options?.placement ?? 'above',
//       options?.gap ?? .75,
//       (options?.info ?? {}) as O extends { info: infer I } ? I : {}
//    ), {
//       //@ts-expect-error
//       devName: 'tooltip'
//    })) as O extends { info: infer I } ? IonicTooltip<I> : IonicTooltip
// }

type AsTooltipTrigger = (node: HTMLElement) => void
type AsTooltipAnchor = (node: HTMLElement) => void


let tooltipID = 0

function TooltipKit<O>(options?: O & {
   gap?: number,
   placement?: Placement,
   info?: { [key: string]: unknown }
}) {
   const anchorRoot = '--tooltip-anchor-' + tooltipID++
   const info = (options?.info ?? {}) as O extends { info: infer I } ? I : {}

   const tooltip = Ionic(new TooltipModel(
      options?.placement ?? 'above',
      options?.gap ?? .75
   ), {
      devName: 'tooltip'
   })

   const asTrigger = TooltipTriggerSetup(tooltip, info)
   const asAnchor = TooltipAnchorSetup(info)


   const explicitAnchors = new Set()

   function TooltipAnchorSetup<T>(config: T) {
      const anchor = Object.create(null)
      for (const key in config) {
         anchor[key] = AsTooltipAnchor(key)
      }
      anchor.default = AsTooltipAnchor('default')
      return anchor
   }

   function AsTooltipAnchor(key: string) {
      return (node: HTMLElement) => {
         if (explicitAnchors.has(key)) return;
         explicitAnchors.add(key)
         // @ts-expect-error
         node.style.anchorName
            = anchorRoot + '-' + key
         node.setAttribute('data-tooltip-anchor', anchorRoot + '-' + key)
      }
   }

   function TooltipTriggerSetup<T>(tooltip: Ionic<TooltipModel>, config: T) {
      const trigger = Object.create(null)
      for (const key in config) {
         trigger[key] = AsTooltipTrigger(key, config[key], tooltip)
      }
      return trigger
   }


   function AsTooltipTrigger<T>(key: string, info: T[keyof T] | undefined, tooltip: Ionic<TooltipModel>) {

      return (node: HTMLElement) => {
         queueTask(() => {
            if (explicitAnchors.has('default') || explicitAnchors.has(key)) return;
            asAnchor[key](node)
         })

         const showTooltip = () => {
            const anchorKey = explicitAnchors.has(key) ? key : explicitAnchors.has('default') ? 'default' : key
            tooltip.anchorName = anchorRoot + '-' + anchorKey
            queueTask(() => tooltip.show(info))
         }

         const hideTooltip = () => {
            if (hideDelay) {
               closeTimeout = setTimeout(() => {
                  tooltip.hide()
               }, hideDelay)
            }
            else {
               tooltip.hide()
            }
         }

         const config = fromContext(TOOLTIP_CONFIG, '?')
         const delay = config?.delay ?? /* options?.delay */ 0
         const hideDelay = config?.hideDelay ?? /* options?.hideDelay */ 0
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

   return {
      tooltip,
      asAnchor,
      asTrigger
   }
}

class TooltipModel<T = {}> {
   anchorName = ''

   constructor(
      public configuredPlacement: Placement,
      public gap: number
   ) {
   }

   get placement() {
      return this.flipped ? this.configuredPlacement === 'above' ? 'below' : this.configuredPlacement === 'below' ? 'above' : this.configuredPlacement === 'left' ? 'right' : 'right' : this.configuredPlacement
   }

   get axis() {
      return this.placement === 'above' || this.placement === 'below' ? 'y' : 'x'
   }

   get above() { return this.placement === 'above' }
   get below() { return this.placement === 'below' }
   get leftside() { return this.placement === 'left' }
   get rightside() { return this.placement === 'right' }


   private flipped: boolean = false;

   flip() {
      this.flipped = !this.flipped
   }

   info!: T[keyof T]

   visible = false

   show(info: (T[keyof T]) | undefined) {
      if (info !== undefined) this.info = info;
      this.visible = true
   }

   hide() {
      this.visible = false
   }
}


export type IonicTooltip<T = {}> = Ionic<Readonly<TooltipModel<T>>>


export {
   TooltipKit,
   TOOLTIP_CONFIG
}