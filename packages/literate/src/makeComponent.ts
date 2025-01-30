import { COMPONENT, ComponentConfig, InferSlot, initializeListRef, initializeRef, NodeRef, NodesRef, PublicComponent } from "@rue/lumo";
import { Literate } from "./Literate.js";
import { AtomicIon, ion, isAtomicIon } from "../../quarky/src/index.js";
import { collectEffects, getActiveFlask } from "@rue/flask";
import { LifecycleHook, SSRComponent, SSRComponentSetup } from "./SSRComponent.js";


// const allPromises: Promise<any>[] = [] // collect promises from Suspense

// export function trackPromise(promise: Promise<any>) {  //FIX: I don't think I actually need this?
//     allPromises.push(promise);
// }


export function mO<T extends SSRComponentSetup<any>>( //TODO: Type should be SSRComponentSetupWithSlot
    Component: T,
    Slot: InferSlot<T>,
    config?: ComponentConfig<T>
): SSRComponent
export function mO<T extends SSRComponentSetup<any>>(
    Component: T,
    Slot?: undefined,
    config?: ComponentConfig<T>
): SSRComponent
export function mO<T extends SSRComponentSetup>(
    Component: T,
    Slot?: InferSlot<T> | undefined,
    config?: ComponentConfig<T>
): SSRComponent {
    const $index = getCurrentIndex()
    return makeComponent(Component, Slot, config, $index)
}

export function makeComponent(
    Component: SSRComponentSetup,
    Slot: InferSlot | undefined,
    config: ComponentConfig,
    $index: AtomicIon<number> | undefined
): SSRComponent {
    const parent = getCurrentComponent<SSRComponent>()
    const component = new SSRComponent(parent);
    pushProvider(component)
    runComponentSetup(Component, component, Slot, config, $index);
    component.emit(LifecycleHook.ON_CREATED)
    popProvider() // for sibling components to access parent, must be set AFTER `component()`

    return component;
}


export function runComponentSetup(
    Component: SSRComponentSetup<{}>,
    component: SSRComponent,
    Slot: InferSlot | undefined,
    config: ComponentConfig,
    $index: AtomicIon<number> | undefined
) {
    collectEffects((flask, outerFlask) => {
        component.setFlask(flask);
        const output = component({ ...config, Slot })
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
    output: Literate | Promise<SSRComponent> | [PublicComponent, Literate],
    ref: NodeRef | NodesRef | undefined,
    $index: AtomicIon<number> | undefined,
) {
    const _output = output instanceof Array ? output[1] : output;
    const publicComponent = output instanceof Array ? output[0] : undefined;

    component.output = _output;

    if (ref) {
        if (!isAtomicIon(ref)) throw new Error("INVALID INPUT: Must use NodeRef or NodesRef ion as ref")
        if ($index) {
            initializeListRef(ref, publicComponent, $index)
        }
        else {
            initializeRef(ref, publicComponent)
        }
    }

    // const flask = component.flask!;
    // flask.outer?.onDiscard(flask.emitDiscard) // no outer flask means it's the root component
}

function validateOutput(output: any) {
    if (output instanceof Promise && !('pendingLiterateSSRComponent' in output))
        throw new Error("Components cannot return a promise. Use Suspense and pend to handle promises within component setup")
    if (output instanceof Literate) return;
    if (isComponentTuple(output)) return;
    throw new Error("INVALID RETURN: Component setup must return either a Literate or a ComponentTuple ([PublicComponent, Literate])")
}

function isComponentTuple(output: Literate | [PublicComponent, Literate]) {
    if (!(output instanceof Array)) return false;
    if (output.length === 2
        && output[0] instanceof Object
        && COMPONENT in output[0]
    ) {
        return output.pop();
    }
    return output;
}
