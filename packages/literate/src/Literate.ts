import { EffectFlask } from "@rue/flask";
import { PublicComponent } from "@rue/lumo";
import { SSRComponent } from "./SSRComponent.js";
import { getResolvedComponent, isResolved } from "./PendingComponentMap.js";
import { hasSignal, Signal } from "@rue/muonic";

type AnyObject = { [key: string | symbol | number]: any }
// export type SSRComponent<T extends AnyObject = AnyObject> = { render: () => string } & T;

// export type MaybePromise<T extends AnyObject = AnyObject> = T | Promise<T>

export function fromEntries<T>(list: T[] | Signal<T[]>, render: (item: T, index: number) => string) {
    if (hasSignal(list)) {
        return () => buildList(list)
    }

    function buildList(list: T[] | Signal<T[]>) {
        const _list = hasSignal(list) ? list() : list
        let result = ''
        for (let i = 0; i < _list.length; i++) {
            const item = _list[i];
            result += render(item, i)
        }
        return result;
    }
    return buildList(list)
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

    return new Literate(args[0], args.slice(1))
}

export class Literate {
    constructor(
        public strings: string[],
        public values: any[]
    ) { }
}



type PromiseValue = Promise<SSRComponent> | { strings: string[], values: PromiseValue[] }

export function buildHTML(templateLiteral: Literate) {
    const { strings, values } = templateLiteral
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
    if (value instanceof Literate) {
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


function processTemplateLiteral(output: Literate, string: string, resultStrings: string[], resultValues: any[]) {
    const result = buildHTML(output)
    if (result.values.length === 0) {
        appendToLastString(resultStrings, string + result.strings[0])
    }
    else {
        resultValues.push(result)
    }
}

function processSSRComponent(component: SSRComponent, string: string, resultStrings: string[], resultValues: any[]) {
    const output = component.output;
    if (output instanceof Promise) {
        if (isResolved(output)) {
            processTemplateLiteral(<Literate>getResolvedComponent(output).output, string, resultStrings, resultValues)
        }
        else {
            resultStrings.push("");
            resultValues.push(output);
        }
    }
    else {
        processTemplateLiteral(output, string, resultStrings, resultValues)
    }
}


function appendToLastString(strings: string[], value: string) {
    strings[strings.length - 1] = strings.at(-1) + value;
}

// export type ComponentSetup = (props: AnyObject) => SSRComponent | [AnyObject, SSRComponent]




