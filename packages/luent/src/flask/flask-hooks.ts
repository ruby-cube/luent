import { $_run_with_, $_snap_context, $_wrap_with_context, getFlask } from "@luent/flask";
import { queueRender, awaitTick } from "@luent/quarky";


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
   getFlask().onInitialMount(() => { queueRender(contextTask) });
}
export function atRemount(task: () => void) {
   const contextTask = $_wrap_with_context(task)
   getFlask().onRemount(() => { queueRender(contextTask) });
}

export function atAttach(task: (initial: boolean) => void) {
   const context = $_snap_context()
   getFlask().onInitialMount(() => { queueRender(() => $_run_with_(context, () => task(true))) });
   getFlask().onRemount(() => { queueRender(() => $_run_with_(context, () => task(false))) });
}

export function afterMount(task: () => void) {
   const contextTask = $_wrap_with_context(task)
   getFlask().onInitialMount(() => { awaitTick(contextTask) });
}
export function afterRemount(task: () => void) {
   const contextTask = $_wrap_with_context(task)
   getFlask().onRemount(() => { awaitTick(contextTask) });
}

export function afterAttach(task: (initial: boolean) => void) {
   const context = $_snap_context()
   getFlask().onInitialMount(() => { awaitTick(() => $_run_with_(context, () => task(true))) });
   getFlask().onRemount(() => { awaitTick(() => $_run_with_(context, () => task(false))) });
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
   getFlask().onDiscard(() => { queueRender(contextTask) });
}

export function atDemount(task: () => void) {
   const contextTask = $_wrap_with_context(task)
   getFlask().onDemount(() => { queueRender(contextTask) });
}

export function atDetach(task: (final: boolean) => void) {
   const discardTask = $_wrap_with_context(() => task(true))
   const demountTask = $_wrap_with_context(() => task(false))

   getFlask().onDiscard(() => { queueRender(discardTask) });
   getFlask().onDemount(() => { queueRender(demountTask) });
}

export function afterUnmount(task: () => void) {
   const contextTask = $_wrap_with_context(task)
   getFlask().onDiscard(() => { awaitTick(contextTask) });
}

export function afterDemount(task: () => void) {
   const contextTask = $_wrap_with_context(task)
   getFlask().onDemount(() => { awaitTick(contextTask) });
}

export function afterDetach(task: (final: boolean) => void) {
   const discardTask = $_wrap_with_context(() => task(true))
   const demountTask = $_wrap_with_context(() => task(false))
   getFlask().onDiscard(() => { awaitTick(discardTask) });
   getFlask().onDemount(() => { awaitTick(demountTask) });
}


