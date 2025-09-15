import { $thisFlask } from "@rue/flask";


//TODO: API

// atMounted: initial mount       <div at:mounted={doSomething}> <div on:mountedremounted={doSomething}> 
// atRemounted: subsequent mounts <div on:remounted={doSomething}>
// atDemount: temporary unmount   <div on:demount={doSomething}> <div on:unmountdemount={doSomething}> 
// atUnmount: permanent unmount on <div at:unmount={doSomething}>

// atMounted.Remounted(()=>{
// 
// })

// atUnmount.Demount(()=>{
//
// })



// export function onInitialMount(task: () => void) {
//    $thisFlask().onInitialMount(task);
// }

// export function onRemount(task: () => void) {
//    $thisFlask().onRemount(task);
// }

export function atMounted(task: (initial: boolean) => void) {
   $thisFlask().atMounted(task);
}

export function atUnmount(task: (final: boolean) => void) {
   $thisFlask().atUnmount(task);
}

export function atRemounted(task: () => void) {
   $thisFlask().atRemounted(task);
}

export function atDemount(task: () => void) {
   $thisFlask().atDemount(task);
}

// export function atDemount(task: () => void) {
//    $thisFlask().atDemount(task);
// }

// export function onDiscard(task: () => void) {
//    $thisFlask().onDiscard(task);
// }