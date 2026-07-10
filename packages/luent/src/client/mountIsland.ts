import { ComponentTag } from "../component/Component";
import { AnyObject } from "@rue/types";
import { createRootContext } from "../context/provide";
import { popContext, pushContext } from "../context/context-stack";
import { Flask, flaskStack } from "@rue/flask";
import { load, atRender, atInternalRender } from "@rue/quarky";
import { mountDOMNodes, processJSXOutput, setUpNodeVine } from "../node/VineNode";
import { RenderFunction } from "../node/makeJSXNode";

export function mountIsland<T extends AnyObject>(App: ComponentTag<T> | RenderFunction, element: string | Element | HTMLElement | SVGAElement) {
  const rootContext = createRootContext()
  const flask = new Flask({ type: 'view' });
  console.log('document', document.body)
  const root = typeof element === 'string' ? document.querySelector(element) : element;
  if (!(root instanceof Element)) throw new Error('No root element to mount app to. Check selector string')
  load(() => { // FIX: Error are being swallowed up here despite being rethrown
    flaskStack.push(flask)
    pushContext(rootContext)
    try {
      const nodes = processJSXOutput(App())
      setUpNodeVine(nodes, root)
      atInternalRender(() => {
        console.log('*** nodes', nodes, root)
        mountDOMNodes(nodes, root)
      })
      flask.emitInitialMount()
    }
    finally {
      flaskStack.pop()
      popContext() // for sibling components to access parent, must be set AFTER `component()`
    }
  })
}


