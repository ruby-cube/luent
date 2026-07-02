// res.send(writeIslands(html, {
//  ‘counter-island’: Counter)
// }))

import { RenderPageWithStyles } from "../component/Style";
import { RenderFunction } from "../node/makeJSXNode";
import { runWithPortals, transformPortals } from "./portals";
import { writeIsland } from "./writeHTML";


export function withIslands(html: string, islands: { [key: string]: RenderFunction }) {
  const withPageContext = RenderPageWithStyles()
  for (const [id, renderIsland] of Object.entries(islands)) {
    const island = withPageContext(() => runWithPortals(() => writeIsland(renderIsland), 'page-key')) //TODO: page key OR I need a better portal system
    // TODO: write flexible regex for luent-island search
    html = html.replace(`<${id}'></${id}>`, `<${id}><template>${inner}</template>${island}</${id}>`)
  }
  transformPortals(html, 'page-key')
  return html
}

