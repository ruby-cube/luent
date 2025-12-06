import { getFlask } from "@rue/flask";
import { queueRender } from "../../../quarky/src/reactivity/RenderCycle";


// TODO: API

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




export function atMounted(task: (initial: boolean) => void) {
   // getFlask().onInitialMount(() => { queueRender(() => task(true)) });
   // getFlask().onRemount(() => { queueRender(() => task(false)) });
   getFlask().onInitialMount(() => { queueRender(() => task(true)) });
   getFlask().onRemount(() => { queueRender(() => task(false)) });
}

export function atUnmount(task: (final: boolean) => void) {
   getFlask().onDiscard(() => task(true));
   getFlask().onDemount(() => task(false));
}

export function atRemounted(task: () => void) {
   getFlask().onRemount(() => { queueRender(task) });
}

export function atDemount(task: () => void) {
   getFlask().onDemount(task);
}