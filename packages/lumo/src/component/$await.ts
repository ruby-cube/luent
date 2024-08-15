import { InternalComponent } from "./InternalComponent";
import { NodeEntity } from "../node/makeNode";
import { $Signal } from "@rue/muonic";
import { setUpComponent } from "./setUpComponent";
import { _NodePod } from "../node/NodePod";

class AwaitKit {
    constructor(
        public component: InternalComponent,
        public Placeholder?: (...args: any[]) => NodeEntity | NodeEntity[],
        public timeout?: number,
        public ErrorView?: (...args: any[]) => NodeEntity | NodeEntity[]
    ) { }
}

function $await(component: InternalComponent, config: {
    Placeholder?: (...args: any[]) => NodeEntity | NodeEntity[],
    timeout?: number,
    ErrorView?: (...args: any[]) => NodeEntity | NodeEntity[]

}) {
    return new AwaitKit(
        component,
        config.Placeholder,
        config.timeout,
        config.ErrorView
    )
}


function setUpAwaited(awaitKit: AwaitKit) {
    const { component, ErrorView, Placeholder, timeout } = awaitKit;
    const $loading = $Signal(true);
    const $timedOut = $Signal(false);
    const $loaded = $Signal(false);
    let timeoutID: any;

        const pendingNodeEntities = component.nodeEntities as Promise<any>;
        if (timeout) {
            timeoutID = setTimeout(() => {
                $timedOut.set(() => true);
                $loading.set(() => false)
            }, timeout)
        }
        pendingNodeEntities.then(() => {
            clearTimeout(timeoutID)
            setUpComponent(parentComponent, parent, component, _NodePod, fragment)
            $loading.set(() => false)
            $loaded.set(() => true)
        })


    if (Placeholder && ErrorView) {
        return (props: P) => (
            <>
            { $if($loading, 'create', () =>
        <Placeholder { ...props } > </Placeholder>
                )
    }
    {
        $elseIf($timedOut, () =>
            <ErrorView { ...props } > </ErrorView>
        )
    }
    {
        $else(() =>
            <Component { ...props } > </Component>
        )
    }
    </>
        )
}
if (Placeholder) {
    return (props: P) => (
        <>
        { $if($loading, 'create', () =>
    <Placeholder { ...props } > </Placeholder>
                )
}
{
    $elseIf($loaded, () =>
        <Component { ...props } > </Component>
    )
}
</>
        )
    }
if (ErrorView) {
    return (props: P) => (
        <>
        { $if($timedOut, 'create', () =>
    <ErrorView { ...props } > </ErrorView>
                )
}
{
    $elseIf($loaded, () =>
        <Component { ...props } > </Component>
    )
}
</>
        )
    }
return (props: P) => (
    <>
    { $if($loaded, 'create', () => {
    return <Component { ...props } > </Component>
}
            )}
</>
    )
}