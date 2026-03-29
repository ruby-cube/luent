import { autoUpdate, computePosition } from "@floating-ui/dom"
import { atDiscard, ContextKey, fromContext, listen } from "@rue/lumo"
import { Ionic, queueLayout, queueTask } from "@rue/quarky"
import { debug } from "@rue/utils"


type TooltipConfig = Readonly<{
   delay?: number,
   hideDelay?: number,
   undelayed?: number
}>

const TOOLTIP_CONFIG = ContextKey<TooltipConfig>()

type Placement = 'above' | 'below' | 'left' | 'right'



function IonicTooltip<O>(options?: O & {
   gap?: number,
   placement?: Placement,
   info?: { [key: string]: unknown }
}): O extends { info: infer I } ? IonicTooltip<I> : IonicTooltip {

   return (Ionic(new TooltipModel(
      options?.placement ?? 'above',
      options?.gap ?? .75,
      (options?.info ?? {}) as O extends { info: infer I } ? I : {}
   ), {
      //@ts-expect-error
      devName: 'tooltip'
   })) as O extends { info: infer I } ? IonicTooltip<I> : IonicTooltip
}

type AsTooltipTrigger = (node: HTMLElement) => void
type AsTooltipAnchor = (node: HTMLElement) => void


let tooltipID = 0

class TooltipModel<T = {}> {
   private anchorRoot: string = '--tooltip-anchor-' + tooltipID++

   anchorName: string = ''

   private triggers: { [K in keyof T]: AsTooltipTrigger } | undefined
   private anchors: { [K in keyof T]: AsTooltipAnchor } | undefined

   get trigger(): { [K in keyof T]: AsTooltipTrigger } { // NOTE: we must `get` in order to have access to Ionic proxy
      return this.triggers ?? (this.triggers = this.TooltipTriggerSetup(this.config))
   }

   get anchor(): { [K in keyof T | 'default']: AsTooltipAnchor } {
      return this.anchors ?? (this.anchors = this.TooltipAnchorSetup(this.config))
   }

   node?: HTMLElement

   setTooltip(node: HTMLElement) {
      this.node = node
   }

   reposition() {
      const node = this.node
      if (!node) {
         debug.error('Must set tooltip node with setTooltip before repositioning tooltip')
         return;
      }
      const rect = node.getBoundingClientRect()
      if (
         this.placement === 'above' && rect.top < 0
         || this.placement === 'below' && rect.bottom > document.documentElement.clientHeight
         || this.placement === 'left' && rect.left < 0
         || this.placement === 'right' && rect.right > document.documentElement.clientWidth
      ) {
         this.flip()
      }
   }

   get axis() {
      return this.placement === 'above' || this.placement === 'below' ? 'y' : 'x'
   }

   private flipped: boolean = false;

   flip() {
      this.flipped = !this.flipped
   }

   info!: T[keyof T]

   constructor(
      public configuredPlacement: Placement,
      public gap: number,
      private config: T
   ) {
   }

   get placement() {
      return this.flipped ? this.configuredPlacement === 'above' ? 'below' : this.configuredPlacement === 'below' ? 'above' : this.configuredPlacement === 'left' ? 'right' : 'right' : this.configuredPlacement
   }

   positionTail(node: HTMLElement) {
      const anchor = document.querySelector(`[data-tooltip-anchor='${this.anchorName}']`)
      if (!anchor) return;
      let visibility: string | null = null
      const placeArrow = () => {
         if (!anchor) return;
         const axis = this.axis
         const placement = axis === 'y' ? 'bottom' : 'left'// tail's placement on the other axis is handled by the tooltip container so we only care about one axis

         computePosition(anchor, node, {
            placement,
         }).then(({ x, y }) => {
            const inset = axis === 'y' ? x : y
            const tooltipNode = this.node
            if (!tooltipNode) return;
            // hide tail if tooltip is greatly misaligned due to collision shift
            if (inset < 10 || tooltipNode[axis === 'y' ? 'offsetWidth' : 'offsetHeight'] - inset < 10) {
               if (visibility === null) visibility = node.style.visibility
               node.style.visibility = 'hidden'
            }
            else {
               if (typeof visibility === 'string') {
                  node.style.visibility = visibility
                  visibility = null
               }
               node.style[axis === 'y' ? 'left' : 'top'] = `${inset}px`
            }
         });
      }
      const cleanup = autoUpdate(
         anchor,
         node,
         placeArrow,
      );
      atDiscard(cleanup)
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
      anchor.default = this.AsTooltipAnchor('default')
      // (node: HTMLElement) => {
      //    this.hasDefaultAnchor = true;
      //    setDefaultAnchor(node)
      // }
      return anchor
   }

   private explicitAnchors = new Set()

   private AsTooltipAnchor(key: string) {
      return (node: HTMLElement) => {
         if (this.explicitAnchors.has(key)) return;
         this.explicitAnchors.add(key)
         // @ts-expect-error
         node.style.anchorName
            = this.anchorRoot + '-' + key
         node.setAttribute('data-tooltip-anchor', this.anchorRoot + '-' + key)
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
            if (this.explicitAnchors.has('default') || this.explicitAnchors.has(key)) return;
            this.anchor[key as keyof T](node)
         })

         const showTooltip = () => {
            this.setAnchor(this.explicitAnchors.has(key) ? key : this.explicitAnchors.has('default') ? 'default' : key)
            queueTask(() => this.show(info))
         }

         const hideTooltip = () => {
            if (hideDelay) {
               closeTimeout = setTimeout(() => {
                  this.hide()
               }, hideDelay)
            }
            else {
               this.hide()
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
}


export type IonicTooltip<T = {}> = Readonly<Ionic<TooltipModel<T>>>

export {
   IonicTooltip,
   TOOLTIP_CONFIG
}