import { $thisFlask } from "@rue/flask";


//TODO: API

// onMounted: initial mount       <div on:mounted={doSomething}> <div on:mountedremounted={doSomething}> 
// onRemounted: subsequent mounts <div on:remounted={doSomething}>
// onDemount: temporary unmount   <div on:demount={doSomething}> <div on:unmountdemount={doSomething}> 
// onUnmount: permanent unmount on <div on:unmount={doSomething}>

// onMounted.Remounted(()=>{
// 
// })

// onUnmount.Demount(()=>{
//
// })



// export function onInitialMount(task: () => void) {
//    $thisFlask().onInitialMount(task);
// }

// export function onRemount(task: () => void) {
//    $thisFlask().onRemount(task);
// }

export function onMounted(task: (initial: boolean) => void) {
   $thisFlask().onMounted(task);
}

export function onUnmount(task: (final: boolean) => void) {
   $thisFlask().onUnmount(task);
}

// export function onDemount(task: () => void) {
//    $thisFlask().onDemount(task);
// }

// export function onDiscard(task: () => void) {
//    $thisFlask().onDiscard(task);
// }