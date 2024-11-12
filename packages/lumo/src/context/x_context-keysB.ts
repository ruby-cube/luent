import { v } from "../InputTypes"
import { defineContextProp } from "./ContextKey"

export const CAT = Symbol('cat')

const catType = defineContextProp(CAT, v<number>)

declare module '@rue/lumo' {
    interface ContextKeyMap {
        [CAT]: typeof catType
    }
}