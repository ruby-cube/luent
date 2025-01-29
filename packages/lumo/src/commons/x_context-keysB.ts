import { v } from "../InputTypes"
import { defineCommonsEntry } from "./CommonsKey"

export const _cat_ = Symbol('cat')

const catType = defineCommonsEntry(_cat_, v<number>)

declare module '@rue/lumo' {
    interface CommonsKeyMap {
        [_cat_]: typeof catType
    }
}