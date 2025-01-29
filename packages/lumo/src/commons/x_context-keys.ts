import { v } from "../InputTypes"
import { defineCommonsEntry } from "./CommonsKey"

export const _dog_ = Symbol('dog')

const dogType = defineCommonsEntry(_dog_, v<string>('?'))

declare module '@rue/lumo' {
    interface CommonsKeyMap {
        [_dog_]: typeof dogType
    }
}