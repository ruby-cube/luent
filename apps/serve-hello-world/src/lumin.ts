import { hasSignal, watch } from "@rue/muonic";

type AnyObject = { [key: string | symbol | number]: any }
// export type StaticComponent<T extends AnyObject = AnyObject> = { render: () => string } & T;

// export type MaybePromise<T extends AnyObject = AnyObject> = T | Promise<T>

export function fromEntries<T>(list: T[], render: (item: T, index: number) => string) {
    let result = ''
    for (let i = 0; i < list.length; i++) {
        const item = list[i];
        result += render(item, i)
    }
    return result;
}

export function html(...args: any[]) {
    const values: any[] = [];

    for (let i = 1; i < args.length; i++) {
        const value = args[i]
        if (hasSignal(value)) {
            const pendingValue = new Promise((resolve) => {
                const 
                watch(value, (newValue) => {
                    resolve(newValue)
                }) //TODO: what is the reject case?
            })
        }
        else { //TODO: not sure what other types of values there might be yet
            values.push(value)
        }
    }

    return new StaticComponent(args[0]/* strings */, values)
}

function $pend(){
    
}

function compileHtml(strings: string[], values: any[]) {
    const resultStrings: string[] = [];
    const resultValues: any[] = [];

    for (let i = 0; i < strings.length; i++) {
        const value = values[i]
        const string = strings[i]
        if (value instanceof StaticComponent) {
            const result = compileHtml(value.strings, value.values)
            if (result.values.length === 0) {
                appendToLastString(resultStrings, string + result.strings[0])
            }
            else {

            }
        }
        else if (value instanceof Promise) {

        }
        else if (value instanceof Function) {
            appendToLastString(resultStrings, string + value())
        }
        else if (value instanceof Array) {
            //TODO:
        }
        else if (value != null) {
            appendToLastString(resultStrings, string + value)
        }
        else {
            // result += string
            appendToLastString(resultStrings, string)
        }
    }
    return {
        strings: resultStrings,
        values: resultValues
    };
}

function appendToLastString(strings: string[], value: string) {
    strings[strings.length - 1] = strings.at(-1) + value;
}


class StaticComponent {
    constructor(
        public strings: string[],
        public values: any[]
    ) { }
}



const cache: Map<string, any> = new Map()

export async function memoize<T extends (...args: any[]) => MaybePromise<StaticComponent>>(key: string, run: () => any) {
    let result = cache.get(key);
    if (!result) {
        result = await run();
        cache.set(key, result);
    }
    return result;
}