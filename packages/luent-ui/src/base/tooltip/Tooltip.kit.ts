import { ContextKey, fromContext, listen, ionic, Ionic, queueTask } from "luent"
import { AnyObject } from "@luent/types"
import { DATA_ATTRIBUTE_POPOVER, getPopoverID, Popover } from "../popover/Popover.kit"


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

//    return (ionic(new TooltipModel(
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


function TooltipKit<I extends { [key: string]: any }>(options?: {
   // gap?: number,
   // placement?: Placement,
   // alignment?: Alignment
   container?: (() => HTMLElement | undefined) | string | HTMLElement
   info?: I
}) {
   const anchorRoot = '--popover-anchor-' + getPopoverID()
   const info = options?.info

   const tooltip = ionic(new TooltipModel(
      /* options?.placement ??  */'above',
      /* options?.alignment ??  */'center',
      /* options?.gap ??  */.75,
      options?.container
   ), {
      '-devName': 'tooltip'
   })


   const asTrigger = TriggerSetup(tooltip, info)
   const asAnchor = AnchorSetup(info)


   const explicitAnchors = new Set()

   function AnchorSetup(info: I | undefined): { [K in keyof I]: AsAnchor } {
      const anchor = Object.create(null)
      if (!info) return anchor;
      for (const key in info) {
         anchor[key] = AsAnchor(key)
      }
      anchor.default = AsAnchor('default')
      return anchor
   }

   function AsAnchor(key: string) {
      return (node: HTMLElement) => {
        console.log('$$$ asAnchor...')
        if (explicitAnchors.has(key)) {
          console.log('$$$ Nooooo anchor')
          return;
        }
        console.log('$$$ anchoring!!', node)
         explicitAnchors.add(key)
         node.style.anchorName
            = anchorRoot + '-' + key
         node.setAttribute(DATA_ATTRIBUTE_POPOVER, anchorRoot + '-' + key)
      }
   }

   function TriggerSetup(tooltip: Ionic<TooltipModel>, info: I | undefined): { [K in keyof I]: AsTrigger } {
      const trigger = Object.create(null)
      if (!info) return trigger;
      for (const key in info) {
         trigger[key] = AsTrigger(key, info[key], tooltip)
      }
      return trigger
   }


   function AsTrigger(key: keyof I & string, info: any | undefined, tooltip: Ionic<TooltipModel>) {

      return (node: HTMLElement) => {
         queueTask(() => {
          console.log('$$$ shall we anchor?')
          if (explicitAnchors.has('default') || explicitAnchors.has(key)) {
              console.log('$$$ no anchor...')
              return;
            }
            console.log('$$$ yes anchor!')
            asAnchor[key](node)
         })

         const showTooltip = () => {
            const anchorKey = explicitAnchors.has(key) ? key : explicitAnchors.has('default') ? 'default' : key
            tooltip.anchorName = anchorRoot + '-' + anchorKey
            queueTask(() => {
               tooltip.info = info
               tooltip.show()
            })
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
      tooltip: tooltip as unknown as IonicTooltip<I>,
      asTooltipAnchor: asAnchor,
      setTooltipTrigger: asTrigger
   }
}

class TooltipModel<T extends object = AnyObject> extends Popover {
   info: T[keyof T] | undefined
}



export type IonicTooltip<T extends { [key: string]: any } = AnyObject> = Ionic<Readonly<TooltipModel<T>>>


export {
   TooltipKit,
   TOOLTIP_CONFIG
}