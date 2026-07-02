import { $_run_with_, $_snap_context, $_wrap_with_context, getFlask } from "@rue/flask";
import { atRender, atTick } from "../../../quarky/src/reactivity/RenderCycle";


export function beforeMount(task: () => void) {
   getFlask().onInitialMount($_wrap_with_context(task));
}
export function beforeRemount(task: () => void) {
   getFlask().onRemount($_wrap_with_context(task));
}

export function beforeAttach(task: (initial: boolean) => void) {
   getFlask().onInitialMount($_wrap_with_context(() => task(true)));
   getFlask().onRemount($_wrap_with_context(() => task(false)));
}

export function atMount(task: () => void) {
   const contextTask = $_wrap_with_context(task)
   getFlask().onInitialMount(() => { atRender(contextTask) });
}
export function atRemount(task: () => void) {
   const contextTask = $_wrap_with_context(task)
   getFlask().onRemount(() => { atRender(contextTask) });
}

export function atAttach(task: (initial: boolean) => void) {
   const context = $_snap_context()
   getFlask().onInitialMount(() => { atRender(() => $_run_with_(context, () => task(true))) });
   getFlask().onRemount(() => { atRender(() => $_run_with_(context, () => task(false))) });
}

export function afterMount(task: () => void) {
   const contextTask = $_wrap_with_context(task)
   getFlask().onInitialMount(() => { atTick(contextTask) });
}
export function afterRemount(task: () => void) {
   const contextTask = $_wrap_with_context(task)
   getFlask().onRemount(() => { atTick(contextTask) });
}

export function afterAttach(task: (initial: boolean) => void) {
   const context = $_snap_context()
   getFlask().onInitialMount(() => { atTick(() => $_run_with_(context, () => task(true))) });
   getFlask().onRemount(() => { atTick(() => $_run_with_(context, () => task(false))) });
}



export function beforeUnmount(task: () => void) {
   getFlask().onDiscard($_wrap_with_context(task));
}

export function beforeDemount(task: () => void) {
   getFlask().onDemount($_wrap_with_context(task));
}

export function beforeDetach(task: (final: boolean) => void) {
   getFlask().onDiscard($_wrap_with_context(() => task(true)));
   getFlask().onDemount($_wrap_with_context(() => task(false)));
}


export function atUnmount(task: () => void) {
   const contextTask = $_wrap_with_context(task)
   getFlask().onDiscard(() => { atRender(contextTask) });
}

export function atDemount(task: () => void) {
   const contextTask = $_wrap_with_context(task)
   getFlask().onDemount(() => { atRender(contextTask) });
}

export function atDetach(task: (final: boolean) => void) {
   const discardTask = $_wrap_with_context(() => task(true))
   const demountTask = $_wrap_with_context(() => task(false))

   getFlask().onDiscard(() => { atRender(discardTask) });
   getFlask().onDemount(() => { atRender(demountTask) });
}

export function afterUnmount(task: () => void) {
   const contextTask = $_wrap_with_context(task)
   getFlask().onDiscard(() => { atTick(contextTask) });
}

export function afterDemount(task: () => void) {
   const contextTask = $_wrap_with_context(task)
   getFlask().onDemount(() => { atTick(contextTask) });
}

export function afterDetach(task: (final: boolean) => void) {
   const discardTask = $_wrap_with_context(() => task(true))
   const demountTask = $_wrap_with_context(() => task(false))
   getFlask().onDiscard(() => { atTick(discardTask) });
   getFlask().onDemount(() => { atTick(demountTask) });
}


