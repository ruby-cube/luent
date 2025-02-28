import { v } from "../component/InputTypes"
import { CommonsKey } from "./CommonsKey"

export const _dog_ = Symbol('dog')

const dogType = CommonsKey(_dog_, v<string>('?'))

declare module '@rue/lumo' {
    interface CommonsKeyMap {
        [_dog_]: typeof dogType
    }
}

