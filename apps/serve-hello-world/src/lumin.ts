import { EffectFlask } from "@rue/flask";
import { PublicComponent } from "@rue/lumo";
import { hasSignal, watch } from "@rue/muonic";
import { getResolvedValue, isResolved, storeResolvedValue } from "./pendingComponent.js";
import { MaybePromise } from "@rue/types";

type AnyObject = { [key: string | symbol | number]: any }
// export type SSRComponent<T extends AnyObject = AnyObject> = { render: () => string } & T;

// export type MaybePromise<T extends AnyObject = AnyObject> = T | Promise<T>

export function fromEntries<T>(list: T[], render: (item: T, index: number) => string) {
    let result = ''
    for (let i = 0; i < list.length; i++) {
        const item = list[i];
        result += render(item, i)
    }
    return result;
}


function exposes() {

}

export function html(...args: any[]) {
    // const values: any[] = [];

    // for (let i = 1; i < args.length; i++) {
    //     const value = args[i]
    //     // if (hasSignal(value)) {
    //     //     const pendingValue = new Promise((resolve) => {
    //     //         watch(value, (newValue) => {
    //     //             resolve(newValue)
    //     //         })
    //     //     })
    //     //     values.push(pendingValue);
    //     // }
    //     // else {
    //         values.push(value)
    //     }
    // }

    return new TemplateLiteral(args[0], args.slice(1))
}

export class TemplateLiteral {
    constructor(
        public strings: string[],
        public values: any[]
    ) { }
}

function $pend() {

}

type PromiseValue = Promise<SSRComponent> | { strings: string[], values: PromiseValue[] }

function buildHTML(strings: string[], values: any[]) {
    const resultStrings: string[] = [];
    const resultValues: PromiseValue[] = [];

    for (let i = 0; i < strings.length; i++) {
        const value = values[i]
        const string = strings[i]
        processValue(value, string, resultStrings, resultValues)
    }
    return {
        strings: resultStrings,
        values: resultValues
    };
}

function processValue(value: any, string: string, resultStrings: string[], resultValues: any[]) {
    if (value instanceof TemplateLiteral) {
        processTemplateLiteral(value, string, resultStrings, resultValues)
    }
    else if (value instanceof SSRComponent) {
        processSSRComponent(value, string, resultStrings, resultValues)
    }
    else if (value instanceof Function) {
        const output = value();
        processValue(output, string, resultStrings, resultValues)
    }
    else if (value != null) {
        appendToLastString(resultStrings, string + value)
    }
    else {
        appendToLastString(resultStrings, string)
    }
}


function processTemplateLiteral(output: TemplateLiteral, string: string, resultStrings: string[], resultValues: any[]) {
    const result = buildHTML(output.strings, output.values)
    if (result.values.length === 0) {
        appendToLastString(resultStrings, string + result.strings[0])
    }
    else {
        resultValues.push(result)
    }
}

function processSSRComponent(component: SSRComponent, string: string, resultStrings: string[], resultValues: any[]) {
    const templateLiteral = component.templateLiteral;
    if (templateLiteral instanceof Promise) {
        if (isResolved(templateLiteral)) {
            processTemplateLiteral(<TemplateLiteral>getResolvedValue(templateLiteral).templateLiteral, string, resultStrings, resultValues)
        }
        else {
            resultStrings.push("");
            resultValues.push(templateLiteral);
        }
    }
    else {
        processTemplateLiteral(templateLiteral, string, resultStrings, resultValues)
    }
}


function appendToLastString(strings: string[], value: string) {
    strings[strings.length - 1] = strings.at(-1) + value;
}

// export type ComponentSetup = (props: AnyObject) => SSRComponent | [AnyObject, SSRComponent]


export type SSRComponentSetup<P = any> = P extends never ?
    (() => TemplateLiteral | Promise<SSRComponent>) | (() => [PublicComponent, TemplateLiteral]) :
    ((props: P) => TemplateLiteral) | ((props: P) => [PublicComponent, TemplateLiteral])

export class SSRComponent<T extends AnyObject = AnyObject> {
    flask!: EffectFlask
    setFlask(flask: EffectFlask) {
        this.flask = flask
    }
    // strings!: string[];
    // values!: any[];
    templateLiteral!: TemplateLiteral | Promise<SSRComponent>
    component!: PublicComponent | null

    initialize(templateLiteral: TemplateLiteral | Promise<SSRComponent>, component: PublicComponent | null) {
        this.templateLiteral = templateLiteral
        this.component = component
    }
}



const cache: Map<string, any> = new Map()

export async function memoize<T extends (...args: any[]) => SSRComponent>(key: string, run: () => any) {
    let result = cache.get(key);
    if (!result) {
        result = await run();
        cache.set(key, result);
    }
    return result;
}