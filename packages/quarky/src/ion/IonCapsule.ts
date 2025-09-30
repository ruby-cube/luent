import { debug } from "@rue/utils"
import { Methods } from "./Ion"
import { AnyObject } from "@rue/types"

type StateDef<InitialState> = { [key: string]: InitialState }

export function defineIonCapsule<
T,
M
>(stateDefinition: T & StateDef<unknown>, methods: M & Methods & ThisType<M & (T extends StateDef<unknown> ? T : {})>): AsMutableIon<T, M>(){
// const [stateKey, initialState] = methods ? getStateKeyAndInitialState(initialStateDefinition as AnyObject) : ['value', initialStateDefinition]
}

function getStateKeyAndInitialState(initialStateDefinition: AnyObject) {
   const defKeys = Object.keys(initialStateDefinition)
   if (defKeys.length !== 1) debug.error('[Invalid Input]: Ion state definition of an ion capsule must have one (and only one) property. The key must be a string')
   const stateKey = defKeys[0] ?? 'value'
   const initialState = initialStateDefinition[stateKey]
   return [stateKey, initialState]
}