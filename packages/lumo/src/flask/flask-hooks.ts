import { $_run_with_, $_snap_context, $_wrap_with_context, getFlask } from "@rue/flask";
import { queueRender, queueTask } from "../../../quarky/src/reactivity/RenderCycle";


export function atCreate(task: () => void) {
   getFlask().onInitialMount($_wrap_with_context(task));
}
export function atRemount(task: () => void) {
   getFlask().onRemount($_wrap_with_context(task));
}

export function atMount(task: (initial: boolean) => void) {
   getFlask().onInitialMount($_wrap_with_context(() => task(true)));
   getFlask().onRemount($_wrap_with_context(() => task(false)));
}

export function atCreated(task: () => void) {
   const contextTask = $_wrap_with_context(task)
   getFlask().onInitialMount(() => { queueRender(contextTask) });
}
export function atRemounted(task: () => void) {
   const contextTask = $_wrap_with_context(task)
   getFlask().onRemount(() => { queueRender(contextTask) });
}

export function atMounted(task: (initial: boolean) => void) {
   const context = $_snap_context()
   getFlask().onInitialMount(() => { queueRender(() => $_run_with_(context, () => task(true))) });
   getFlask().onRemount(() => { queueRender(() => $_run_with_(context, () => task(false))) });
}

export function afterCreated(task: () => void) {
   const contextTask = $_wrap_with_context(task)
   getFlask().onInitialMount(() => { queueTask(contextTask) });
}
export function afterRemounted(task: () => void) {
   const contextTask = $_wrap_with_context(task)
   getFlask().onRemount(() => { queueTask(contextTask) });
}

export function afterMounted(task: (initial: boolean) => void) {
   const context = $_snap_context()
   getFlask().onInitialMount(() => { queueTask(() => $_run_with_(context, () => task(true))) });
   getFlask().onRemount(() => { queueTask(() => $_run_with_(context, () => task(false))) });
}



export function atDiscard(task: () => void) {
   getFlask().onDiscard($_wrap_with_context(task));
}

export function atDemount(task: () => void) {
   getFlask().onDemount($_wrap_with_context(task));
}

export function atUnmount(task: (final: boolean) => void) {
   getFlask().onDiscard($_wrap_with_context(() => task(true)));
   getFlask().onDemount($_wrap_with_context(() => task(false)));
}


export function atDiscarded(task: () => void) {
   const contextTask = $_wrap_with_context(task)
   getFlask().onDiscard(() => { queueRender(contextTask) });
}

export function atDemounted(task: () => void) {
   const contextTask = $_wrap_with_context(task)
   getFlask().onDemount(() => { queueRender(contextTask) });
}

export function atUnmounted(task: (final: boolean) => void) {
   const discardTask = $_wrap_with_context(() => task(true))
   const demountTask = $_wrap_with_context(() => task(false))

   getFlask().onDiscard(() => { queueRender(discardTask) });
   getFlask().onDemount(() => { queueRender(demountTask) });
}

export function afterDiscarded(task: () => void) {
   const contextTask = $_wrap_with_context(task)
   getFlask().onDiscard(() => { queueRender(contextTask) });
}

export function afterDemounted(task: () => void) {
   const contextTask = $_wrap_with_context(task)
   getFlask().onDemount(() => { queueRender(contextTask) });
}

export function afterUnmounted(task: (final: boolean) => void) {
   const discardTask = $_wrap_with_context(() => task(true))
   const demountTask = $_wrap_with_context(() => task(false))
   getFlask().onDiscard(() => { queueRender(discardTask) });
   getFlask().onDemount(() => { queueRender(demountTask) });
}


