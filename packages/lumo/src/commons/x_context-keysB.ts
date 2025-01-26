import { v } from "../InputTypes"
import { defineContextProp } from "./CommonsKey"

export const _cat_ = Symbol('cat')

const catType = defineContextProp(_cat_, v<number>)

declare module '@rue/lumo' {
    interface ContextKeyMap {
        [_cat_]: typeof catType
    }
}