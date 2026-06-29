// res.send(writeIslands(html, {
//  ‘counter-island’: Counter)
// }))

import { RenderPageWithStyles } from "../component/Style";
import { RenderFunction } from "../node/makeJSXNode";
import { runWithPortals, transformPortals } from "./portals";
import { writeIsland } from "./writeHTML";


export function writeIslands(html: string, islands: { [key: string]: RenderFunction }) {
  const withPageContext = RenderPageWithStyles()
  for (const [id, Island] of Object.entries(islands)) {
    const island = withPageContext(() => runWithPortals(() => writeIsland(Island), 'page-key')) //TODO: page key OR I need a better portal system
    // TODO: write flexible regex for luent-island search
    html = html.replace(`<luent-island id='${id}'></luent-island>`, `<luent-island id='${id}'>${island}</luent-island>`)
  }
  transformPortals(html, 'page-key')
  return html
}