import { $thisFlask } from "@rue/flask";

export function onMount(task: (initial: boolean) => void) {
   const flask = $thisFlask()
   if (!flask) throw new Error('no flask :(')
   flask.onMount(task);
}

export function onUnmount(task: (final: boolean) => void) {
   const flask = $thisFlask()
   if (!flask) throw new Error('no flask :(')
   flask.onUnmount(task);
}