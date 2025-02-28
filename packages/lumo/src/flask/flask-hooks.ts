import { $thisFlask } from "@rue/flask";

export function onInitialMount(task: () => void) {
   $thisFlask().onInitialMount(task);
}

export function onRemount(task: () => void) {
   $thisFlask().onRemount(task);
}

export function onMount(task: () => void) {
   $thisFlask().onMount(task);
}

export function onUnmount(task: () => void) {
   $thisFlask().onUnmount(task);
}

export function onDemount(task: () => void) {
   $thisFlask().onDemount(task);
}

export function onDiscard(task: () => void) {
   $thisFlask().onDiscard(task);
}