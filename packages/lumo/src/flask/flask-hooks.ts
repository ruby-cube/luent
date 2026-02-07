import { getFlask } from "@rue/flask";
import { queueRender } from "../../../quarky/src/reactivity/RenderCycle";
import { instantUpdate } from "@rue/quarky";


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



export function atCreate(task: () => void) {
   getFlask().onInitialMount(task);
}
export function atRemount(task: () => void) {
   getFlask().onRemount(task);
}

export function atMount(task: (initial: boolean) => void) {
   getFlask().onInitialMount(() => task(true));
   getFlask().onRemount(() => task(false));
   // getFlask().onInitialMount(() => { queueRender(() => instantUpdate(() => task(true))) });
   // getFlask().onRemount(() => { queueRender(() => instantUpdate(() => task(false))) });

   // getFlask().onInitialMount(() => task(true));
   // getFlask().onRemount(() => task(false));
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
   // getFlask().onInitialMount(() => { queueRender(() => instantUpdate(() => task(true))) });
   // getFlask().onRemount(() => { queueRender(() => instantUpdate(() => task(false))) });

   // getFlask().onInitialMount(() => task(true));
   // getFlask().onRemount(() => task(false));
}

export function atDestroy(task: () => void) {
   getFlask().onDiscard(task);
}

export function atDemount(task: () => void) {
   getFlask().onDemount(task);
}

export function atUnmount(task: (final: boolean) => void) {
   getFlask().onDiscard(() => task(true));
   getFlask().onDemount(() => task(false));
}


