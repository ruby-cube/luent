import { DOG } from "./context-keys"
import { CAT } from "./context-keysB"
import { ContextKeyMap } from "./ContextKey"

type Elmo = ContextKeyMap[typeof DOG]
type Elmo2 = ContextKeyMap[typeof CAT]