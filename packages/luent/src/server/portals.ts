export { defineStyleScopeElement } from "../component/shadow"

console.log('run portals module')
/**
 * per-page/route portals
 */
type Portals = Map<string, string[]>



// function clonePortals(portals: Portals): Portals {
//   return {
//     head: [...portals.head],
//     body: [...portals.body],
//   }
// }

type PortalRuntimeState = {
  // portalsByPage: Map<string, Portals>
  activePortalsStack: (Portals | null)[]
}

const PORTAL_STATE_KEY = Symbol.for('luent.portals.state')

/**
 * We need global state to share portals across module instances 
 * in frameworks like Astro, which runs this module twice.
 */
function getPortalRuntimeState(): PortalRuntimeState {
  const globals = globalThis as typeof globalThis & {
    [PORTAL_STATE_KEY]?: PortalRuntimeState
  }

  if (!globals[PORTAL_STATE_KEY]) {
    globals[PORTAL_STATE_KEY] = {
      // portalsByPage: new Map<string, Portals>(),
      activePortalsStack: []
    }
  }

  return globals[PORTAL_STATE_KEY]
}

// type HeadConfig = [
//   string,                // Tag name (e.g., 'meta', 'link', 'script')
//   Record<string, string>, // Attributes (e.g., { rel: 'icon', href: '/favicon.ico' })
//   string?                // Optional inner content
// ]


export function writeToPortal(to: 'head' | 'body', html: string) {
  const activePortals = usePortals()
  addPortal(activePortals, to, html)
}

function usePortals() {
  const { activePortalsStack } = getPortalRuntimeState()
  let portals = activePortalsStack.at(-1)
  if (!portals) {
    portals = new Map()
    activePortalsStack[activePortalsStack.length - 1] = portals;
    return portals
  }
  return portals
}

function addPortal(portals: Portals, to: string, html: string) {
  const collection = portals.get(to) ?? (portals.set(to, []), portals.get(to)!);
  collection.push(html)
}






const PORTAL_MARKER_PREFIX = '<!--luent-portals:'
const PORTAL_MARKER_RE = /<!--luent-portals:([A-Za-z0-9+/=]+)-->/g

function _encodePortals(render: () => string): string {
  const html = render()
  const portals = drainPortals()
  if (!portals || portals.size === 0) return html;

  const payload = Buffer.from(JSON.stringify(Object.fromEntries(portals)), 'utf8').toString('base64')
  return `${PORTAL_MARKER_PREFIX}${payload}-->${html}`
}


export function encodePortals(render: () => string) {
  const { activePortalsStack } = getPortalRuntimeState()
  activePortalsStack.push(null)

  try {
    return _encodePortals(render);
  }
  finally {
    activePortalsStack.pop()
  }
}

export function drainPortals() {
  const { activePortalsStack } = getPortalRuntimeState()
  const portals = activePortalsStack.at(-1);
  activePortalsStack[activePortalsStack.length - 1] = null;
  return portals
}



export function extractPortals(html: string) {
  const combined: Portals = new Map()
  const seen: { [key: string]: Set<string> } = Object.create(null)

  function useSeen(key: string) {
    return seen[key] ?? (seen[key] = new Set())
  }

  function usePortal(key: string) {
    return combined.get(key) ?? (combined.set(key, []), combined.get(key)!)
  }

  const htmlWithoutMarkers = html.replace(PORTAL_MARKER_RE, (_, payload: string) => {
    try {
      const decoded = Buffer.from(payload, 'base64').toString('utf8')
      const parsed = JSON.parse(decoded) as { [key: string]: string[] }
      for (const key in parsed) {
        if (Array.isArray(parsed[key])) {
          for (const item of parsed[key]) {
            if (typeof item !== 'string' || useSeen(key).has(item)) 
              continue;
            useSeen(key).add(item)
            usePortal(key).push(item)
          }
        }
      }
    } catch {
      // Ignore malformed marker payloads to avoid breaking page generation.
    }

    return ''
  })

  return {
    html: htmlWithoutMarkers,
    portals: combined,
  }
}

export function injectPortals(code: string, portals: Portals) {
  if (portals.size === 0) return code;

  return code
    .replace('</head>', `${(portals.get('head') ?? []).join('\n')}\n</head>`)
    .replace('</body>', `${(portals.get('body') ?? []).join('\n')}\n</body>`)
}