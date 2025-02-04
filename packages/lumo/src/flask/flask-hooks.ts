import { $thisFlask } from "@rue/flask";

export function onInitialMount(task: () => void) {
   const flask = $thisFlask()
   if (!flask) throw new Error('no flask :(')
   flask.onInitialMount(task);
}

export function onRemount(task: () => void) {
   const flask = $thisFlask()
   if (!flask) throw new Error('no flask :(')
   flask.onRemount(task);
}

export function onMount(task: () => void) {
   const flask = $thisFlask()
   if (!flask) throw new Error('no flask :(')
   flask.onMount(task);
}

export function onUnmount(task: () => void) {
   const flask = $thisFlask()
   if (!flask) throw new Error('no flask :(')
   flask.onUnmount(task);
}

export function onDemount(task: () => void) {
   const flask = $thisFlask()
   if (!flask) throw new Error('no flask :(')
   flask.onDemount(task);
}

export function onDiscard(task: () => void) {
   const flask = $thisFlask()
   if (!flask) throw new Error('no flask :(')
   flask.onDiscard(task);
}