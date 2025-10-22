import { NubKey } from "../../../../../../../packages/lumo/src/commons/NubKey"
import { fromRoot } from "../../../../../../../packages/lumo/src/commons/provide"
import { component } from "../../../../../../../packages/lumo/src/component/Component"
import { FromTag } from "../../../../../../../packages/lumo/src/component/Input"

NavBar.router = NubKey<Router>()

function NavBar(input: FromTag<{}>) {
   const router = fromRoot(NavBar.router)

   return component(
      <div>
         hi
      </div>
   )
}