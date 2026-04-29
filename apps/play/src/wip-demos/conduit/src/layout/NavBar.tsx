import { ContextKey } from "../../../../../../../packages/luent/src/context/ContextKey"
import { fromRoot } from "../../../../../../../packages/luent/src/context/provide"
import { template } from "../../../../../../../packages/luent/src/component/Component"
import { FromTag } from "../../../../../../../packages/luent/src/component/x-Input"

NavBar.router = ContextKey<Router>()

function NavBar(input: FromTag<{}>) {
   const router = fromRoot(NavBar.router)

   return template(
      <div>
         hi
      </div>
   )
}