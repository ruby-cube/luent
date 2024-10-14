//@ts-nocheck
import { createApp } from '@rue/lumo';
// // import {jsx} from '@rue/jsx-dev-runtime'
// // console.log(jsx)
// // import { App } from './App';
import { watch } from '../../../packages/lumo/src/watch/watchAndPreserve';
import './style.css'
// import { TestCounter } from './TestCounter';
// import { TestBox } from './TestBox';
// import { App } from './App';
// import { TestConditional } from './TestConditional';
import { configureFlask, genIncrementalId } from '../../../packages/flask/initFlask';
import { List } from './TestReactiveModel';
import { MountIf } from './TestMountIf';
import { TestIonProp } from './TestIonProp';
import { TestMorphic } from './TestMorphic';
import { ParentBlock } from './ProvideState';
import { watchIonicEffect, ion, ionize, protect, isIonicModel } from '@rue/quarky';
import { TestIonicEffect } from './TestIonicEffect';
import { TestSelectiveTracking } from './TestSelectiveTracking';
import { TestCleanupScheduler } from './TestCustomCleanupScheduler';
// import { ionize, ionize } from '@rue/quarky';
// import { DeepReactiveModel, asMetaIonicModel, ionize, ionize } from '@rue/quarky';
// import { MountIf } from './TestMountIf';
// import { queueTask } from '@rue/thread';
// import { RenderCycle } from '@rue/quarky';
// import { MainSite } from './AwaitTest';
// import { ConditionalFlaskTest } from './ConditionalFlaskTest';
// import { Root } from './TreeTest';
// import { NestedPend } from './NestedPend';
const $count = ion(0, {
    set(count: number) {
        $count.as(count)
    },
    increment() {
        $count.as($count() + 1)
    }
})

// $count.set(2)
$count.increment()

console.log("count", $count())

// const app = createApp(TestCleanupScheduler)

// if (__DEV__) configureFlask({
//     warnNoCleanup: true
// })

// app.mount('#app')

// queueTask(()=>{
//     console.log("hi")
// })

// window.addEventListener('beforeunload', () => {
//     console.log("unloading...")
// })

// function doSomething() {
//     const dynamicNode = makeDynamicNode(false)
//     const unrelated = true;
//     const $count = ion(0)
//     function increment() {
//         $count.set(c => c + 1)
//     }
//     const $doubleCount = $(() => $count() * 2)
//     let prevDoubleCount = $doubleCount;
//     dynamicNode.activate(() => {
//         watchForRender($doubleCount, function $stubbornHandler() {
//             console.log("tada")
//             destroyDerivedSignal(prevDoubleCount)
//             prevDoubleCount = null;
//         }, { once: true })
//     })
//     return { $doubleCount, $count, increment, unrelated, dynamicNode };
// }

// export let { $doubleCount, $count, increment, unrelated, dynamicNode } = doSomething();
// increment()
// const number = $doubleCount();
// console.log(number)
// $doubleCount = null;
// dynamicNode.destroy()

// const outerDiv = document.querySelector("#outer")
// const innerButton = document.querySelector("#inner")

// outerDiv?.addEventListener("click", clickOuterDivA)
// outerDiv?.addEventListener("click", clickOuterDivB)
// innerButton?.addEventListener("click", clickInnerDivA)
// innerButton?.addEventListener("click", clickInnerDivB)
// outerDiv?.addEventListener("mousedown", mousedownOuterDiv)
// innerButton?.addEventListener("mousedown", mousedownInnerDiv)
// outerDiv?.addEventListener("mouseup", mouseupOuterDiv)
// innerButton?.addEventListener("mouseup", mouseupInnerDiv)

let rafID
let end = false;



let renderCycle;

// function clickOuterDivA() {
//     console.log("CLICK outer A")
//     que("ORIG")
// }

// function clickInnerDivA() {
//     console.log("CLICK inner A")
//     que("ORIG")
// }


// function clickOuterDivB() {
//     console.log("CLICK outer B")
//     que("ORIG")
//     end = true
// }

// function clickInnerDivB() {
//     console.log("CLICK inner B")
//     que("ORIG")
// }

// function mouseupOuterDiv() {
//     console.log("UP outer")
//     que("ORIG")
// }
// function mouseupInnerDiv() {
//     // requestAnimationFrame(()=>{
//     //     console.log("RAF render")
//     // })
//     console.log("UP outer")
//     que("ORIG")
// }
// function mousedownOuterDiv() {
//     console.log("DOWN outer")
//     que("ORIGDOWN")
// }


// function animate(){
//     requestAnimationFrame(() => {
//         console.log("RAF")
//         if (end === false) {
//             animate()
//         }
//     })
// }

// function mousedownInnerDiv() {
//     end = false;
//     // animate()
//     fetchThen()

//     console.log("============")
//     console.log("DOWN inner")
//     que("ORIGDOWN")
// }

// function fetchThen() {
//     setTimeout(() => {
//         console.log("DATA RECEIVED")
//         que("DATA")
//     }, 1)
// }

// function que(msg: string) {
//     if (!renderCycle) {
//         queueTask(() => {
//             renderCycle = null
//             console.log(msg, "TASK PRE")
//            requestAnimationFrame(() => {
//                 console.log(msg, "RENDER")
//                 console.log("-----------------")
//                 queueTask(() => {
//                     console.log(msg, "POST RENDER")
//                 })
//             })
//         })
//         renderCycle = true;
//     }
// }

