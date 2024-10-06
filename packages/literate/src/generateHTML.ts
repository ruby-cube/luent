import { initializeRootProvider, popProvider, provide, pushProvider } from "@rue/lumo";
import { buildHTML, Literate } from "./Literate.js";
import { runComponentSetup } from "./makeComponent.js";
import { LifecycleHook, SSRComponent, SSRComponentSetup } from "./SSRComponent.js";
import { RESPONSE_TIMER, ResponseTimer } from "./ResponseTimer.js";
import { getResolvedComponent } from "./PendingComponentMap.js";


export async function generateHTML(Root: SSRComponentSetup, timeout: number) {
    const timer = timeout != null ? new ResponseTimer(timeout) : undefined;
    const allPromises: Promise<Literate>[] = [] // collect Suspense promises

    const component = makeRootComponent(Root, timer)

    const output = component.output;
    if (output instanceof Promise) {
        if (allPromises.length === 0)
            throw new Error("Mismatch between allPromises and component readiness. This should never happen")
        await Promise.allSettled(allPromises)
        const component = getResolvedComponent(output)
        const resolvedOutput = component.output
        if (resolvedOutput instanceof Promise)
            throw new Error("Mismatch between promise and component readiness. This should never happen")
        return completeHTML(resolvedOutput)
    }
    else if (output instanceof Literate) {
        const templateLiteral = buildHTML(output);
        if (allSettled(allPromises, templateLiteral))
            return templateLiteral.strings[0];
        await Promise.allSettled(allPromises);
        return completeHTML(templateLiteral)
    }
    throw new Error("Invalid component output")
}

function completeHTML(templateLiteral: Literate) {
    const _templateLiteral = buildHTML(templateLiteral)
    if (!templateLiteralIsReady(_templateLiteral)) throw new Error("Unresolved promises. This should never happen")
    return _templateLiteral.strings[0];
}

function allSettled(allPromises: Promise<Literate>[], templateLiteral: Literate) {
    if (allPromises.length === 0 && !templateLiteralIsReady(templateLiteral) || allPromises.length > 0 && templateLiteralIsReady(templateLiteral))
        throw new Error("Mismatch between all promises and template literal readiness. This should never happen")
    return allPromises.length === 0;
}

function templateLiteralIsReady(templateLiteral: Literate) {
    return templateLiteral.strings.length === 1 && templateLiteral.values.length === 0;
}


function makeRootComponent(Root: SSRComponentSetup, timer: ResponseTimer | undefined) {
    const component = new SSRComponent(null);
    pushProvider(component)
    if (timer) provide(RESPONSE_TIMER, timer)
    runComponentSetup(Root, component, undefined, undefined, undefined);
    component.emit(LifecycleHook.ON_CREATED)
    popProvider() // for sibling components to access parent, must be set AFTER `Component()`
    return component
}
