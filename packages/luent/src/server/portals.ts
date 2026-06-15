
type Portals = {
  head: string[]
  body: string[]
}

// type HeadConfig = [
//   string,                // Tag name (e.g., 'meta', 'link', 'script')
//   Record<string, string>, // Attributes (e.g., { rel: 'icon', href: '/favicon.ico' })
//   string?                // Optional inner content
// ]

const portalsByPage = new Map<string, Portals>()

export function getPortals(page: string): Portals {
  let portals = portalsByPage.get(page)
  if (!portals) {
    portals = { 
      head: [], 
      body: [] 
    }
    portalsByPage.set(page, portals)
  }
  return portals
}

let activePortals: null | Portals = null;

export function writeToPortal(to: 'head' | 'body', html: string) {
  activePortals?.[to].push(html)
}

export function runWithPortals(render: () => string, page: string) {
  try {
    activePortals = getPortals(page)
    return render()
  }
  finally {
    activePortals = null
  }
}
