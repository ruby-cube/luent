import { CommonsKey } from "../../../../../../../packages/lumo/src/commons/CommonsKey"
import { fromRoot } from "../../../../../../../packages/lumo/src/commons/provide"
import { component } from "../../../../../../../packages/lumo/src/component/Component"
import { FromTag } from "../../../../../../../packages/lumo/src/component/Input"

NavBar.router = CommonsKey<Router>()

function NavBar(input: FromTag<{}>) {
   const router = fromRoot(NavBar.router)

   return component(
      <div>
         hi
      </div>
   )
}