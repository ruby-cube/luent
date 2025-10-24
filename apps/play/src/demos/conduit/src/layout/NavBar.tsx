import { HubKey } from "../../../../../../../packages/lumo/src/hub/HubKey"
import { fromRoot } from "../../../../../../../packages/lumo/src/hub/provide"
import { component } from "../../../../../../../packages/lumo/src/component/Component"
import { FromTag } from "../../../../../../../packages/lumo/src/component/Input"

NavBar.router = HubKey<Router>()

function NavBar(input: FromTag<{}>) {
   const router = fromRoot(NavBar.router)

   return component(
      <div>
         hi
      </div>
   )
}