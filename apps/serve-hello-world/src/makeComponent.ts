import { COMPONENT, ComponentConfig, getCurrentItemAndIndex, getNodeRef, InferSlotted, initializeListRef, initializeRef, InternalNodeRef, NodeSignal, popComponent, PublicComponent, pushComponent } from "@rue/lumo";
import { SSRComponent, SSRComponentSetup, TemplateLiteral } from "./lumin.js";
import { Signal } from "@rue/muonic";
import { AnyObject, MaybePromise } from "@rue/types";
import { collectEffects, getFlask } from "@rue/flask";
import { storeResolvedValue } from "./pendingComponent.js";
import { getPendingTimeout } from "./createSSRApp.js";


// const allPromises: Promise<any>[] = [] // collect promises from $pend

// export function trackPromise(promise: Promise<any>) {  //FIX: I don't think I actually need this?
//     allPromises.push(promise);
// }


export function mO<T extends SSRComponentSetup>( //TODO: Type should be SSRComponentSetupWithSlot
    Component: T,
    slotted: InferSlotted<T>,
    config?: ComponentConfig<T>
): MaybePromise<SSRComponent>
export function mO<T extends SSRComponentSetup>(
    Component: T,
    slotted?: undefined,
    config?: ComponentConfig<T>
): MaybePromise<SSRComponent>
export function mO<T extends SSRComponentSetup>(
    Component: T,
    slotted?: InferSlotted<T> | undefined,
    config?: ComponentConfig<T>
): MaybePromise<SSRComponent> {
    const [_, $index] = getCurrentItemAndIndex()
    return makeComponent(Component, slotted, config, $index)
}

export function makeComponent(
    Component: SSRComponentSetup,
    slotted: InferSlotted | undefined,
    config: ComponentConfig,
    $index: Signal<number> | undefined
): MaybePromise<SSRComponent> {

    const component = new SSRComponent();
    //@ts-expect-error
    pushComponent(component)
    runComponentSetup(Component, component, slotted, config, $index);
    popComponent() // for sibling components to access parent, must be set AFTER `Component()`

    // if (allPromises.length === 0) {
        return component;
    // }
    // const pendingComponent: Promise<SSRComponent>
    //     = new Promise((resolve) => {
    //         const promise = Promise.all(allPromises);
    //         let resolved = false;
    //         promise.then(resolveIfNeeded)
    //         getPendingTimeout().then(resolveIfNeeded)

    //         function resolveIfNeeded() {
    //             if (resolved) return;
    //             storeResolvedValue(pendingComponent, component)
    //             resolved = true;
    //             resolve(component);
    //         }
    //     })
    // allPromises.length = 0;
    // return pendingComponent;
}


export function runComponentSetup(
    Component: SSRComponentSetup,
    component: SSRComponent,
    slotted: InferSlotted | undefined,
    config: ComponentConfig,
    $index: Signal<number> | undefined
) {
    collectEffects((flask, outerFlask) => {
        component.setFlask(flask);
        const output = Component({ ...config, slotted })
        try {
            validateOutput(output);
            initializeComponent(component, output, config.ref, $index)
        }
        catch (err) {
            if (__DEV__) console.error(err);
        }
    }, Component.name)
}

function initializeComponent(
    component: SSRComponent,
    output: TemplateLiteral | Promise<SSRComponent> | [PublicComponent, TemplateLiteral],
    ref: NodeSignal | undefined,
    $index: Signal<number> | undefined,
) {
    const templateLiteral = output instanceof Array ? output[1] : output;
    const publicComponent = output instanceof Array ? output[0] : null;

    component.templateLiteral = templateLiteral;

    if (ref) {
        if ($index) initializeListRef(ref, publicComponent, $index)
        else initializeRef(ref, publicComponent)
    }

    const flask = component.flask!;
    flask.outer?.onDisposal(flask.dispose) // no outer flask means it's the root component
}

function validateOutput(output: any) {
    // if (output instanceof Promise)
        // throw new Error("Components cannot return a promise. Use $pend and $await to handle promises within component setup")
    if (output instanceof TemplateLiteral) return;
    if (isComponentTuple(output)) return;
    throw new Error("INVALID RETURN: Component setup must return either a TemplateLiteral or a ComponentTuple ([PublicComponent, TemplateLiteral])")
}

function isComponentTuple(output: TemplateLiteral | [PublicComponent, TemplateLiteral]) {
    if (!(output instanceof Array)) return false;
    if (output.length === 2
        && output[0] instanceof Object
        && COMPONENT in output[0]
    ) {
        return output.pop();
    }
    return output;
}
