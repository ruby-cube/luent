import { v } from "../InputTypes"
import { defineContextProp } from "./ContextKey"

export const _cat_ = Symbol('cat')

const catType = defineContextProp(_cat_, v<number>)

declare module '@rue/lumo' {
    interface ContextKeyMap {
        [_cat_]: typeof catType
    }
}