import { getFlask } from "@rue/flask";
import { queueRender } from "../../../quarky/src/reactivity/RenderCycle";
import { queueTask } from "../../../x-old/thread";


export function atCreate(task: () => void) {
   getFlask().onInitialMount(task);
}
export function atRemount(task: () => void) {
   getFlask().onRemount(task);
}

export function atMount(task: (initial: boolean) => void) {
   getFlask().onInitialMount(() => task(true));
   getFlask().onRemount(() => task(false));
}

export function atCreated(task: () => void) {
   getFlask().onInitialMount(() => { queueRender(task) });
}
export function atRemounted(task: () => void) {
   getFlask().onRemount(() => { queueRender(task) });
}

export function atMounted(task: (initial: boolean) => void) {
   getFlask().onInitialMount(() => { queueRender(() => task(true)) });
   getFlask().onRemount(() => { queueRender(() => task(false)) });
}

export function afterCreated(task: () => void) {
   getFlask().onInitialMount(() => { queueTask(task) });
}
export function afterRemounted(task: () => void) {
   getFlask().onRemount(() => { queueTask(task) });
}

export function afterMounted(task: (initial: boolean) => void) {
   getFlask().onInitialMount(() => { queueTask(() => task(true)) });
   getFlask().onRemount(() => { queueTask(() => task(false)) });
}



export function atDiscard(task: () => void) {
   getFlask().onDiscard(task);
}

export function atDemount(task: () => void) {
   getFlask().onDemount(task);
}

export function atUnmount(task: (final: boolean) => void) {
   getFlask().onDiscard(() => task(true));
   getFlask().onDemount(() => task(false));
}


export function atDiscarded(task: () => void) {
   getFlask().onDiscard(() => { queueRender(task) });
}

export function atDemounted(task: () => void) {
   getFlask().onDemount(() => { queueRender(task) });
}

export function atUnmounted(task: (final: boolean) => void) {
   getFlask().onDiscard(() => { queueRender(() => task(true)) });
   getFlask().onDemount(() => { queueRender(() => task(false)) });
}

export function afterDiscarded(task: () => void) {
   getFlask().onDiscard(() => { queueRender(task) });
}

export function afterDemounted(task: () => void) {
   getFlask().onDemount(() => { queueRender(task) });
}

export function afterUnmounted(task: (final: boolean) => void) {
   getFlask().onDiscard(() => { queueRender(() => task(true)) });
   getFlask().onDemount(() => { queueRender(() => task(false)) });
}


