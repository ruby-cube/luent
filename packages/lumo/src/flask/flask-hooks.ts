import { $thisFlask } from "@rue/flask";


//TODO: API

// atMounted: initial mount       <div at:mounted={doSomething}> <div on:mountedremounted={doSomething}> 
// onRemounted: subsequent mounts <div on:remounted={doSomething}>
// onDemount: temporary unmount   <div on:demount={doSomething}> <div on:unmountdemount={doSomething}> 
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

// export function onDemount(task: () => void) {
//    $thisFlask().onDemount(task);
// }

// export function onDiscard(task: () => void) {
//    $thisFlask().onDiscard(task);
// }