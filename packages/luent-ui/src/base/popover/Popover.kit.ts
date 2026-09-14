import { autoUpdate, computePosition } from "@floating-ui/dom"
import { beforeUnmount, NodeRef, awaiting, toValue, queueLayout } from "luent"

export type Placement = 'above' | 'below' | 'left' | 'right'
export type Alignment = 'start' | 'center' | 'end'

let popoverID = 0

export function getPopoverID() {
  return popoverID++;
}

export class Popover {
  anchorName = ''

  constructor(
    public configuredPlacement: Placement, // TODO: alignment
    public alignment: Alignment,
    public gap: number,
    public container: (() => HTMLElement | undefined) | string | HTMLElement | undefined
  ) {
  }

  configure(config: {
    placement?: Placement, // TODO: alignment
    alignment?: Alignment,
    gap?: number
  }) {
    if (config.placement) {
      this.configuredPlacement = config.placement
    }
    if (config.alignment) {
      this.alignment = config.alignment
    }
    if (config.gap) {
      this.gap = config.gap
    }
  }

  get placement() {
    return this.flipped ? this.configuredPlacement === 'above' ? 'below' : this.configuredPlacement === 'below' ? 'above' : this.configuredPlacement === 'left' ? 'right' : 'right' : this.configuredPlacement
  }

  get axis() {
    return this.placement === 'above' || this.placement === 'below' ? 'y' : 'x'
  }

  get above() { return this.placement === 'above' }
  get below() { return this.placement === 'below' }
  get left() { return this.placement === 'left' }
  get right() { return this.placement === 'right' }


  flipped: boolean = false;

  flip() {
    this.flipped = true;
  }

  visible = false

  show() {
    this.visible = true
  }

  hide() {
    this.visible = false
    this.flipped = false;
  }
}

export function maybeFlip(node: HTMLElement, popover: Popover) {
  queueLayout(() => {
    const rect = node.getBoundingClientRect()
    const container = getContainer(popover)
    const bound = container?.getBoundingClientRect()
    if (
      popover.placement === 'above' && rect.top < (bound ? bound.top : 0)
      || popover.placement === 'below' && rect.bottom > (bound ? bound.bottom : document.documentElement.clientHeight)
      || popover.placement === 'left' && rect.left < (bound ? bound.left : 0)
      || popover.placement === 'right' && rect.right > (bound ? bound.right : document.documentElement.clientWidth)
    ) {
      popover.flip()
    }
  })

  function getContainer(popover: Popover) {
    const { container } = popover;
    if (!container) return;
    return typeof container === 'string' ? document.querySelector(container) : toValue(container)
  }
}

export const DATA_ATTRIBUTE_POPOVER = 'data-popover-anchor'

/**
 * centers tail with anchor
 * 
 * @param node 
 * @param popover 
 * @returns 
 */
export function positionTail(node: HTMLElement, popover: Popover, $popover: NodeRef<'div'>) {
  const anchor = document.querySelector(`[${DATA_ATTRIBUTE_POPOVER}='${popover.anchorName}']`)
  if (!anchor) return;

  let visibility: string | null = null

  const placeArrow = () => {
    if (!anchor) return;
    const axis = popover.axis
    const placement = axis === 'y' ? 'bottom' : 'left'// tail's placement on the other axis is handled by the tooltip container so we only care about one axis

    awaiting(computePosition(anchor, node, { placement }),
      ({ x, y }) => {
        const inset = axis === 'y' ? x : y
        const popoverNode = $popover()
        if (!popoverNode) {
          if (__DEV__) console.warn('popoverNode is missing')
          return;
        }
        // hide tail if popover is greatly misaligned due to collision shift
        if (inset < 5 || popoverNode[axis === 'y' ? 'offsetWidth' : 'offsetHeight'] - inset < 5) {
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
      }
    );
  }

  const cleanup = autoUpdate(
    anchor,
    node,
    placeArrow,
  );
  beforeUnmount(cleanup)
}