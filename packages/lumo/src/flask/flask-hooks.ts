import { $thisFlask } from "@rue/flask";

export function onMounted(task: (initial: boolean) => void) {
   const flask = $thisFlask()
   if (!flask) throw new Error('no flask :(')
   flask.onMounted(task);
}

export function onUnmount(task: (final: boolean) => void) {
   const flask = $thisFlask()
   if (!flask) throw new Error('no flask :(')
   flask.onUnmount(task);
}