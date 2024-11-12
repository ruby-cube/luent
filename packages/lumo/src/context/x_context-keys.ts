import { v } from "../InputTypes"
import { defineContextProp } from "./ContextKey"

export const DOG = Symbol('dog')

const dogType = defineContextProp(DOG, v<string>('?'))

declare module './ContextKey' {
    interface ContextKeyMap {
        [DOG]: typeof dogType
    }
}