// // import {jsx} from '@rue/jsx-dev-runtime'
// // console.log(jsx)
// // import { App } from './App';
import './style.css'
// import { TestCounter } from './TestCounter';
// import { TestBox } from './TestBox';
// import { App } from './App';
// import { TestConditional } from './TestConditional';
import { configureFlask, genIncrementalId } from '../../../packages/flask/initFlask';
import { component, createApp } from '@rue/lumo';
// import { ionize, ionize } from '@rue/quarky';
// import { DeepReactiveModel, asMetaIonizedModel, ionize, ionize } from '@rue/quarky';
import { MountIf } from './TestMountIf';
import { ionize } from '@rue/quarky';
import { List } from './TestReactiveModel';
// import { PlainList } from './TestList';
// import { HelloWorld } from './HelloWorld';
// import { Check } from './childrenTest';
// import { TestDerived } from './testDerivedIon';
// import { OverrideMethods } from './TestOverrideMethods';
// import { queueTask } from '@rue/thread';
// import { RenderCycle } from '@rue/quarky';
// import { MainSite } from './AwaitTest';
// import { ConditionalFlaskTest } from './ConditionalFlaskTest';
// import { Root } from './TreeTest';
// import { NestedPend } from './NestedPend';


// const rootContext = createGlobalContext()


const app = createApp(List)

if (__DEV__) configureFlask({
    warnNoCleanup: true
})

app.mount('#app')




// function doSomething() {
//     const dynamicNode = makeDynamicNode(false)
//     const unrelated = true;
//     const $count = ion(0)
//     function increment() {
//         $count.set(c => c + 1)
//     }
//     const $doubleCount = $(() => $count() * 2)
//     let prevDoubleCount = $doubleCount;
//     dynamicNode.mount(() => {
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

