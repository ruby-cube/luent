
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


export function transformPortals(code: string, key: string) {
  const portals = getPortals(key)
  if (!portals || portals.head.length === 0 && portals.body.length === 0) {
    return code;
  }

  const newCode = code
    .replace('</head>', `${portals.head.join('\n')}\n</head>`)
    .replace('</body>', `${portals.body.join('\n')}\n</body>`)
  return newCode
}