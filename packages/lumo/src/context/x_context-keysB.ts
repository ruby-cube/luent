import { v } from "../InputTypes"
import { defineContextProp } from "./ContextKey"

export const CAT = Symbol('cat')

const catType = defineContextProp(CAT, v<number>)

declare module './ContextKey' {
    interface ContextKeyMap {
        [CAT]: typeof catType
    }
}