import type { AstroIntegration } from 'astro';
import tailwindcss from '@tailwindcss/vite'
//@ts-expect-error
import luent from 'vite-plugin-luent'


// TODO: need to implement portals for other elements, using selectors
type Portals = Map<string, string[]>


function deriveRouteKey(request: Request, options: { routeData?: { route?: string; component?: string } }) {
  const pathname = new URL(request.url).pathname
  const routePattern = options.routeData?.route ?? options.routeData?.component ?? 'unknown-route'
  return `${routePattern}::${pathname}`
}


export default function luent(): AstroIntegration {
  return {
    name: 'astro-plugin-luent',

    hooks: {
      'astro:config:setup': ({ addRenderer, updateConfig }) => {

        addRenderer({
          name: 'astro-plugin-luent',
          serverEntrypoint: 'astro-plugin-luent/server',
          clientEntrypoint: 'astro-plugin-luent/client',
        })
        updateConfig({
          vite: {
            // esbuild: {
            //   charset: 'utf8'
            // },
            resolve: {
              conditions: ['luentWorkspace'],
              // Keep Vite defaults for extensionless imports and add .nsx for NoriScript files.
              extensions: ['.mjs', '.js', '.mts', '.ts', '.jsx', '.tsx', '.json', '.nsx']
            },
            plugins: [
              tailwindcss(),
              luent()
            ],
            define: {
              __DEV__: JSON.stringify(process.env.NODE_ENV === 'development'),
              __INTERNAL__: JSON.stringify(process.env.NODE_ENV === 'development'),
              __SSR__: false,
              __TEST__: JSON.stringify(process.env.NODE_ENV === 'test'),
              __STYLE__: JSON.stringify(process.env.NODE_ENV === 'style')
            }
          }
        })
      },
      'astro:build:start': ({ setPrerenderer }) => {
        setPrerenderer((renderer) => {
          return {
            ...renderer,
            name: 'luent-prerenderer',
            async render(request, options) {

              const { injectPortals, extractPortals } = ((renderer as any).app?.manifest?.renderers?.[0]?.ssr) as {
                injectPortals?: (code: string, portals: Portals) => string
                extractPortals?: (html: string) => { html: string; portals: Portals; }
              }

              if (!injectPortals || !extractPortals)
                throw new Error('Failed to access injectPortals and extractPortals')

              const rendered = await renderer.render(request, options)
                .then(res => res instanceof Response
                  ? res.text()
                  : res.response.text()
                )

              const { html, portals } = extractPortals(rendered)

              if (portals.size === 0) return new Response(html)
              return new Response(injectPortals(html, portals))
            }
          }
        })
      }
    },
  };
}

// export function withIslands(html: string, islands: { [key: string]: RenderFunction }) {
//   const withPageContext = RenderPageWithStyles()
//   for (const [id, renderIsland] of Object.entries(islands)) {
//     const island = withPageContext(() => encodePortals(() => writeIsland(renderIsland), 'page-key')) //TODO: page key OR I need a better portal system
//     // TODO: write flexible regex for luent-island search
//     html = html.replace(`<${id}'></${id}>`, `<${id}><template>${inner}</template>${island}</${id}>`)
//   }
//   transformPortals(html, 'page-key')
//   return html
// }
