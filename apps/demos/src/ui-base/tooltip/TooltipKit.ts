import { autoUpdate, computePosition } from "@floating-ui/dom"
import { atDiscard, ContextKey, fromContext, fromRoot, listen, NodeRef, provideRoot } from "@rue/lumo"
import { Expand, Ion, Ionic, queueLayout, queueTask } from "@rue/quarky"
import { AnyObject } from "@rue/types"
import { debug, isObject } from "@rue/utils"
import { DATA_ATTRIBUTE_POPOVER, Placement, Popover } from "../popover/Popover"


type TooltipConfig = Readonly<{
   delay?: number,
   hideDelay?: number,
   undelayed?: number
}>

const TOOLTIP_CONFIG = ContextKey<TooltipConfig>()





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

type AsTrigger = (node: HTMLElement) => void
type AsAnchor = (node: HTMLElement) => void


let tooltipID = 0

function TooltipKit<I extends object>(options?: {
   gap?: number,
   placement?: Placement,
   info?: I
}) {
   const anchorRoot = '--tooltip-anchor-' + tooltipID++
   const info = options?.info

   const tooltip = Ionic(new Popover(
      options?.placement ?? 'above',
      options?.gap ?? .75
   ), {
      devName: 'tooltip'
   })

   const asTrigger = TriggerSetup(tooltip, info)
   const asAnchor = AnchorSetup(info)


   const explicitAnchors = new Set()

   function AnchorSetup<T>(info: T) {
      if (!isObject(info)) {

      }
      const anchor = Object.create(null)
      for (const key in info) {
         anchor[key] = AsAnchor(key)
      }
      anchor.default = AsAnchor('default')
      return anchor
   }

   function AsAnchor(key: string) {
      return (node: HTMLElement) => {
         if (explicitAnchors.has(key)) return;
         explicitAnchors.add(key)
         // @ts-expect-error
         node.style.anchorName
            = anchorRoot + '-' + key
         node.setAttribute(DATA_ATTRIBUTE_POPOVER, anchorRoot + '-' + key)
      }
   }

   function TriggerSetup(tooltip: Ionic<Popover>, info: I | undefined) {
      if (!info) return;
      const trigger = Object.create(null)
      for (const key in info) {
         trigger[key] = AsTrigger(key, info[key], tooltip)
      }
      return trigger
   }


   function AsTrigger(key: string, info: any | undefined, tooltip: Ionic<Popover>) {

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



export type IonicTooltip<T = undefined> = Ionic<Readonly<Popover<T>>>


export {
   TooltipKit,
   TOOLTIP_CONFIG
}