import { $_run_with_, $_snap_context, $_wrap_with_context, getFlask } from "@rue/flask";
import { atRender, atTick } from "../../../quarky/src/reactivity/RenderCycle";


export function beforeInstall(task: () => void) {
   getFlask().onInitialMount($_wrap_with_context(task));
}
export function beforeRemount(task: () => void) {
   getFlask().onRemount($_wrap_with_context(task));
}

export function beforeMount(task: (initial: boolean) => void) {
   getFlask().onInitialMount($_wrap_with_context(() => task(true)));
   getFlask().onRemount($_wrap_with_context(() => task(false)));
}

export function atInstall(task: () => void) {
   const contextTask = $_wrap_with_context(task)
   getFlask().onInitialMount(() => { atRender(contextTask) });
}
export function atRemount(task: () => void) {
   const contextTask = $_wrap_with_context(task)
   getFlask().onRemount(() => { atRender(contextTask) });
}

export function atMount(task: (initial: boolean) => void) {
   const context = $_snap_context()
   getFlask().onInitialMount(() => { atRender(() => $_run_with_(context, () => task(true))) });
   getFlask().onRemount(() => { atRender(() => $_run_with_(context, () => task(false))) });
}

export function afterInstall(task: () => void) {
   const contextTask = $_wrap_with_context(task)
   getFlask().onInitialMount(() => { atTick(contextTask) });
}
export function afterRemount(task: () => void) {
   const contextTask = $_wrap_with_context(task)
   getFlask().onRemount(() => { atTick(contextTask) });
}

export function afterMount(task: (initial: boolean) => void) {
   const context = $_snap_context()
   getFlask().onInitialMount(() => { atTick(() => $_run_with_(context, () => task(true))) });
   getFlask().onRemount(() => { atTick(() => $_run_with_(context, () => task(false))) });
}



export function beforeUninstall(task: () => void) {
   getFlask().onDiscard($_wrap_with_context(task));
}

export function beforeDemount(task: () => void) {
   getFlask().onDemount($_wrap_with_context(task));
}

export function beforeUnmount(task: (final: boolean) => void) {
   getFlask().onDiscard($_wrap_with_context(() => task(true)));
   getFlask().onDemount($_wrap_with_context(() => task(false)));
}


export function atUninstall(task: () => void) {
   const contextTask = $_wrap_with_context(task)
   getFlask().onDiscard(() => { atRender(contextTask) });
}

export function atDemount(task: () => void) {
   const contextTask = $_wrap_with_context(task)
   getFlask().onDemount(() => { atRender(contextTask) });
}

export function atUnmount(task: (final: boolean) => void) {
   const discardTask = $_wrap_with_context(() => task(true))
   const demountTask = $_wrap_with_context(() => task(false))

   getFlask().onDiscard(() => { atRender(discardTask) });
   getFlask().onDemount(() => { atRender(demountTask) });
}

export function afterUninstall(task: () => void) {
   const contextTask = $_wrap_with_context(task)
   getFlask().onDiscard(() => { atRender(contextTask) });
}

export function afterDemount(task: () => void) {
   const contextTask = $_wrap_with_context(task)
   getFlask().onDemount(() => { atRender(contextTask) });
}

export function afterUnmount(task: (final: boolean) => void) {
   const discardTask = $_wrap_with_context(() => task(true))
   const demountTask = $_wrap_with_context(() => task(false))
   getFlask().onDiscard(() => { atRender(discardTask) });
   getFlask().onDemount(() => { atRender(demountTask) });
}


