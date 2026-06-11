import { ContextKey } from "../../../../../../../packages/luent/src/context/ContextKey"
import { fromRoot } from "../../../../../../../packages/luent/src/context/provide"
import { template } from "../../../../../../../packages/luent/src/component/Component"

NavBar.router = ContextKey<Router>()

function NavBar(input: {}) {
   const router = fromRoot(NavBar.router)

   return component(
      <div>
         hi
      </div>
   )
}