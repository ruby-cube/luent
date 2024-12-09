import { v } from "../InputTypes"
import { defineContextProp } from "./ContextKey"

export const _dog_ = Symbol('dog')

const dogType = defineContextProp(_dog_, v<string>('?'))

declare module '@rue/lumo' {
    interface ContextKeyMap {
        [_dog_]: typeof dogType
    }
}