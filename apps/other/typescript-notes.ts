import { IonizedModel, ReactiveGet } from "../../packages/quarky/src"

const TYPE = null as unknown

type Ant = {
    a: number
}

type Bear = {
    b: string
}

type Core = {
    c: true
}

type AnyObject = {
    [key: string | symbol | number]: any
}

type AntAndBear = Ant & Bear

type StringOrNumber = string | number

{
    doSomething(<Object>TYPE)  // BAD: Argument of type 'object' is not assignable to parameter of type 'Ant | Bear'
    doSomething(<object>TYPE)  // BAD: Argument of type 'object' is not assignable to parameter of type 'Ant | Bear'
    doSomething(<{}>TYPE)  // BAD: Argument of type '{}' is not assignable to parameter of type 'Ant | Bear'
    doSomething(<AnyObject>TYPE)  // BAD: Property 'a' is missing in type 'AnyObject' but required in type 'Ant'
    doSomething(<unknown>TYPE)  // BAD: Argument of type 'unknown' is not assignable to parameter of type 'Ant & Bear'
    doSomething(<Ant | Bear | Core>TYPE)  // X BAD: Type 'Core' is not assignable to type 'Ant | Bear'
    doSomething(<Ant>TYPE)  // GOOD
    doSomething(<any>TYPE)  // GOOD
    doSomething(<Ant & Bear & Core>TYPE)  // GOOD

    function doSomething(arg: Ant | Bear) { }
}

{
    doSomething(<{}>TYPE)  // BAD: Property 'a' is missing in type '{}' but required in type 'Ant'
    doSomething(<object>TYPE)  // BAD: Property 'a' is missing in type 'object' but required in type 'Ant'
    doSomething(<AnyObject>TYPE)  // BAD: Property 'a' is missing in type 'AnyObject' but required in type 'Ant'
    doSomething(<unknown>TYPE)  // BAD: Argument of type 'unknown' is not assignable to parameter of type 'Ant & Bear'
    doSomething(<Ant | Bear>TYPE)  // X BAD: Argument of type 'Ant | Bear' is not assignable to parameter of type 'Ant & Bear'
    doSomething(<Ant>TYPE)  // X BAD: Argument of type 'Ant' is not assignable to parameter of type 'Ant & Bear'
    doSomething(<any>TYPE)  // GOOD
    doSomething(<Ant & Bear & Core>TYPE)  // GOOD

    function doSomething(arg: Ant & Bear) { }
}

{
    doSomething(<(a: boolean) => void>TYPE)  // X BAD: Target signature provides too few arguments. Expected 1 or more, but got 0
    doSomething(<(a?: boolean) => void>TYPE)  // GOOD

    function doSomething(arg: () => void) { }
}

{
    doSomething(<(a: boolean) => void>TYPE)  // X BAD: Type 'boolean | undefined' is not assignable to type 'boolean'
    doSomething(<() => void>TYPE)  // GOOD

    function doSomething(arg: (a?: boolean) => void) { }
}

{
    doSomething(<(a: Ant & Bear & Core) => void>TYPE)  // X BAD: Type 'Ant & Bear' is not assignable to type 'Ant & Bear & Core'
    doSomething(<(a: Ant & Bear & Core) => void>TYPE)  // X BAD: Type 'Ant & Bear' is not assignable to type 'Ant & Bear & Core'
    doSomething(<(a?: Ant & Bear) => void>TYPE)  // GOOD
    doSomething(<(a: Ant) => void>TYPE)  // GOOD
    doSomething(<(a: Ant | Bear) => void>TYPE)  // GOOD
    doSomething(<(a: Ant | Bear | Core) => void>TYPE)  // GOOD
    doSomething(<(a: unknown) => void>TYPE)  // GOOD
    doSomething(<(a: any) => void>TYPE)  // GOOD
    doSomething(<(a: AnyObject) => void>TYPE)  // GOOD

    function doSomething(arg: (a: Ant & Bear) => void) { }
}

{
    doSomething(<() => Ant & Bear & Core>TYPE)  // GOOD
    doSomething(<() => Ant | Bear>TYPE)  // X BAD: Type 'Ant' is not assignable to type 'Ant & Bear'

    function doSomething(arg: () => Ant & Bear) { }
}

{
    doSomething(<object>TYPE)  // GOOD
    doSomething(<{}>TYPE)  // GOOD
    doSomething(<Ant>TYPE)  // GOOD
    doSomething(<{ [key: number]: any }>TYPE)  // GOOD
    doSomething(<{ [key: string | number]: any }>TYPE)  // GOOD

    function doSomething(arg: { [key: string]: any }) { }
}

{
    doSomething(<object>TYPE)  // GOOD
    doSomething(<{}>TYPE)  // GOOD
    doSomething(<Ant>TYPE)  // GOOD
    doSomething(<{ [key: symbol]: any }>TYPE)  // GOOD
    doSomething(<{ [key: string]: any }>TYPE)  // GOOD

    function doSomething(arg: { [key: string | number]: any }) { }
}

{
    doSomething(<object>TYPE)  // GOOD
    doSomething(<{}>TYPE)  // GOOD
    doSomething(<{ [key: string]: any }>TYPE)  // GOOD

    function doSomething(arg: object) { }
}

{
    doSomething(<object>TYPE)  // GOOD
    doSomething(<Ant>TYPE)  // GOOD
    doSomething(<{}>TYPE)  // GOOD
    doSomething(<{ [key: string]: any }>TYPE)  // GOOD

    function doSomething(arg: {}) { }
}

{
    doSomething(<{ a: number }>TYPE)  // GOOD
    doSomething(<object>TYPE)  // GOOD
    doSomething(<Ant>TYPE)  // GOOD
    doSomething(<{}>TYPE)  // GOOD
    doSomething(<{ [key: string]: any }>TYPE)  // GOOD

    function doSomething(arg: { a?: number }) { }
}

{
    doSomething(<{ a?: number }>TYPE)  // X BAD: Type 'undefined' is not assignable to type 'number'
    doSomething(<object>TYPE)  // X BAD
    doSomething(<Ant>TYPE)  // X BAD
    doSomething(<{}>TYPE)  // X BAD
    doSomething(<{ [key: string]: any }>TYPE)  // X BAD

    function doSomething(arg: { a: number }) { }
}


{
    doSomething(<{}>TYPE, 'bye')  // GOOD
    doSomething(<0>TYPE, 'hi')  // GOOD

    function doSomething<T>(argA: T, argB: T extends number ? 'hi' : 'bye') { }
}


{
    doSomething(<{}>TYPE, 'bye')  // BAD
    doSomething(<{ a: number }>TYPE, 1)  // GOOD

    function doSomething<T>(argA: T, argB: T extends { a: infer V } ? V : never) { }
}

{
    function doSomething<T>(arg: T): T extends number ? 'hi' : 'bye' {
        if (typeof arg === 'number') {
            return 'hi' as T extends number ? 'hi' : 'bye';
        }
        return 'bye' as T extends number ? 'hi' : 'bye'
    }
}


{
    doSomething(<Ant>TYPE)  // GOOD
    doSomething(<any[]>TYPE)  // GOOD
    doSomething(<() => any>TYPE)  // GOOD

    function doSomething<T>(argA: Object) { }
}

type DeepReactiveModel<T extends AnyObject = AnyObject> = T & {ionize: any};
{
    function something<T extends AnyObject>(){
        doSomething(<DeepReactiveModel<T>>TYPE)  // GOOD
    }

    function doSomething<T>(argA: DeepReactiveModel<T extends AnyObject ? T : never>) { }
}

export type RawWatchTarget<T = any | AnyObject> = T extends AnyObject ? () => T | ReactiveGet<T> | IonizedModel<T> | DeepReactiveModel<T> : () => T | ReactiveGet<T> 
{
    function something<T extends AnyObject>(){
        doSomething(<IonizedModel<T>>TYPE)  // GOOD
    }

    function doSomething<T>(argA: T extends AnyObject ? () => T | ReactiveGet<T> | IonizedModel<T> | DeepReactiveModel<T> : () => T | ReactiveGet<T> ) { }
}