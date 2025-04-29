import { AnyObject } from "@rue/types"

class App {
    frog = 'hi'
}

type PublicApp = ReadOnly<App>

// export type { App as App }
export type { PublicApp as App }

export function isApp(x: any): x is PublicApp {
    return x instanceof App;
}



type B = {
    bog: 'sdf'
}

type PublicB = ReadOnly<B>

export type { PublicB as B }





const dog = {

}

export function doThis() { }



type ReadOnly<T extends AnyObject> = { readonly [K in keyof T]: T[K] }