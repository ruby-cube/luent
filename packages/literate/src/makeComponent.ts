import { COMPONENT, ComponentConfig, getCurrentItemAndIndex, getNodeRef, InferSlotted, initializeListRef, initializeRef, InternalNodeRef, NodeSignal, PublicComponent, pushComponent, popComponent } from "@rue/lumo";
import { Literate } from "./Literate.js";
import { Signal } from "@rue/muonic";
import { AnyObject, MaybePromise } from "@rue/types";
import { collectEffects, getFlask } from "@rue/flask";
import { LifecycleHook, SSRComponent, SSRComponentSetup } from "./SSRComponent.js";
import { getCurrentComponent } from "../../lumo/src/component/componentStack.js";


// const allPromises: Promise<any>[] = [] // collect promises from $Suspense

// export function trackPromise(promise: Promise<any>) {  //FIX: I don't think I actually need this?
//     allPromises.push(promise);
// }


export function mO<T extends SSRComponentSetup<any>>( //TODO: Type should be SSRComponentSetupWithSlot
    Component: T,
    Slot: InferSlotted<T>,
    config?: ComponentConfig<T>
): SSRComponent
export function mO<T extends SSRComponentSetup<any>>(
    Component: T,
    Slot?: undefined,
    config?: ComponentConfig<T>
): SSRComponent
export function mO<T extends SSRComponentSetup>(
    Component: T,
    Slot?: InferSlotted<T> | undefined,
    config?: ComponentConfig<T>
): SSRComponent {
    const [_, $index] = getCurrentItemAndIndex()
    return makeComponent(Component, Slot, config, $index)
}

export function makeComponent(
    Component: SSRComponentSetup,
    Slot: InferSlotted | undefined,
    config: ComponentConfig,
    $index: Signal<number> | undefined
): SSRComponent {
    const parent = getCurrentComponent<SSRComponent>()
    const component = new SSRComponent(parent);
    pushComponent(component)
    runComponentSetup(Component, component, Slot, config, $index);
    component.emit(LifecycleHook.SETUP_COMPLETED)
    popComponent() // for sibling components to access parent, must be set AFTER `Component()`

    return component;
}


export function runComponentSetup(
    Component: SSRComponentSetup<{}>,
    component: SSRComponent,
    Slot: InferSlotted | undefined,
    config: ComponentConfig,
    $index: Signal<number> | undefined
) {
    collectEffects((flask, outerFlask) => {
        component.setFlask(flask);
        const output = Component({ ...config, Slot })
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
    ref: NodeSignal | undefined,
    $index: Signal<number> | undefined,
) {
    const _output = output instanceof Array ? output[1] : output;
    const publicComponent = output instanceof Array ? output[0] : null;

    component.output = _output;

    if (ref) {
        if ($index) initializeListRef(ref, publicComponent, $index)
        else initializeRef(ref, publicComponent)
    }

    // const flask = component.flask!;
    // flask.outer?.onDisposal(flask.dispose) // no outer flask means it's the root component
}

function validateOutput(output: any) {
    if (output instanceof Promise && !('pendingLiterateSSRComponent' in output))
        throw new Error("Components cannot return a promise. Use $Suspense and $await to handle promises within component setup")
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
