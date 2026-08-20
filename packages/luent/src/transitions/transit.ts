import { getActiveUpdate, queueRender, queueTask, toValue } from "@luent/quarky";
import { toClassNames } from "./transitions";
import { atListChanged } from "../iteratives/For";
import { MaybeIon } from "../component/bindings-types";
import { Flask, getFlask } from "@luent/flask";
import { atAttach, beforeDetach } from "../flask/flask-hooks";

export function setUpPositionTransition(node: HTMLElement, transitionClasses: MaybeIon<string>) {
  atListChanged(() => {
    const first = node.getBoundingClientRect()
    queueRender(() => {
      const last = node.getBoundingClientRect()
      startTransitionItem(node, first, last, toClassNames(toValue(transitionClasses)))
    })
  })
}


export function startTransitionItem(node: HTMLElement, first: DOMRect, last: DOMRect, classes: string[]) {
  const deltaY = first.top - last.top
  const deltaX = first.left - last.left
  if (deltaX || deltaY) {
    node.style.setProperty('transform', `translate(${deltaX}px, ${deltaY}px)`)
    requestAnimationFrame(() => {
      queueTask(() => {
        classes.forEach(className => node.classList.add(className))
        node.style.setProperty('transform', `translate(0px, 0px)`)
        node.addEventListener('transitionend', () => {
          classes.forEach(className => node.classList.remove(className))
          node.style.removeProperty('transform')
        }, { once: true })
      })
    })
  }
}

let ports: Ports | undefined

function usePorts() {
  return ports ?? (ports = new Ports())
}


class Ports {
  ports: Map<any, Map<any, any>> = new Map()

  addPort(port: any) {
    if (this.ports.has(port)) return;
    this.ports.set(port, new Map())
    getFlask()?.outer?.onDiscard(() => {
      this.ports.delete(port)
    })
  }

  sendToPort(portKey: any, key: any, rect: DOMRect) {
    const port = this.ports.get(portKey)
    if (!port) throw new Error('Port is missing, this should never happen')
    port?.set(key, rect)
  }

  getFromPort(portKey: any, key: any) {
    return this.ports.get(portKey)?.get(key)
  }

  deleteFromPort(portKey: any, key: any) {
    this.ports.get(portKey)?.delete(key)
  }
}

function send(key: any, node: HTMLElement, port: any) {
  const rect = node.getBoundingClientRect()
  usePorts().sendToPort(port, key, rect)
  getActiveUpdate()?.atComplete(() => {
    usePorts().deleteFromPort(port, key)
  })
}

function receive(key: any, node: HTMLElement, port: any, classes: string[]) {
  const first = usePorts().getFromPort(port, key)
  if (!first) return;
  startTransitionItem(node, first, node.getBoundingClientRect(), classes)
}

const ANY_PORT = Symbol('any port')
export function setUpTransit(node: HTMLElement, key: any, port: any = ANY_PORT, transitClasses: MaybeIon<string> = 'transition-position') {
  usePorts().addPort(port)
  atAttach(() => {
    receive(key, node, port, toClassNames(toValue(transitClasses)))
  })

  beforeDetach(() => {
    send(key, node, port)
  })
}
