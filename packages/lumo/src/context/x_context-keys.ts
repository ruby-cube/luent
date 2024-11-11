import { v } from "../InputTypes"
import { defineContextProp } from "./ContextKey"

export const DOG = Symbol('dog')

const dogType = defineContextProp(DOG, v<{ bark: 'woof', setDog(): number }>)

declare module './ContextKey' {
    interface ContextKeyMap {
        [DOG]: typeof dogType
    }
}