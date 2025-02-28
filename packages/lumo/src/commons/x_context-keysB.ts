import { v } from "../component/InputTypes"
import { CommonsKey, createCommonsKey } from "./CommonsKey"
import { _ContextInputType } from "./provide"

export const _cat_ = Symbol('cat')

const catType = CommonsKey(_cat_, v<number>)

declare module '@rue/lumo' {
    interface CommonsKeyMap {
        [_cat_]: typeof catType
    }
}

export const _monkey_ = createCommonsKey(v<number>)

declare module '@rue/lumo' {
   interface CommonsKeyMap {
       [_monkey_]: typeof _monkey_
   }
}

export type CommonsEntries<T> = {
   [K in keyof T]: K extends keyof CommonsKeyMap ? _ContextInputType<CommonsKeyMap[K]> : any;
}

//API

type Provide<T> = {
   [K in keyof T]: _ContextInputType<K>
}

export function Commons<T>(input: {
   provide: T,
}) {}

Commons({provide: {[_monkey_]: 'hi'}})

const provide={[_monkey_]: 'hi'}

type Typeof = _ContextInputType<typeof _monkey_>


type Keys = typeof _monkey_

const provid: Record<Keys, _ContextInputType<Keys>> = {
   [_monkey_]: 'hi'
}