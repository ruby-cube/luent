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
import { configureFlask } from '../../../packages/flask/initFlask';
import { List } from './TestReactiveModel';
import { MountIf } from './TestMountIf';
import { TestIonProp } from './TestIonProp';
// import { ionize, ionize } from '@rue/quarky';
// import { DeepReactiveModel, getMetaReactive, ionize, ionize } from '@rue/quarky';
// import { MountIf } from './TestMountIf';
// import { queueTask } from '@rue/thread';
// import { RenderCycle } from '@rue/quarky';
// import { MainSite } from './AwaitTest';
// import { ConditionalFlaskTest } from './ConditionalFlaskTest';
// import { Root } from './TreeTest';
// import { NestedPend } from './NestedPend';

// class Frog {
//     qualities = { a: "brave" }
//     setQualities(qualities: { a: string }) {
//         console.log("setting qualities", this)
//         this.qualities = qualities
//         return this.qualities
//     }
//     getQualities() {
//         return [this.qualities, 1]
//     }
// }


// const frog$$ = ionize(new Frog())
// console.log("qualiites", frog$$.getQualities())

// const list$ = ionize([{
//     id: 'dkjl',
//     content: "hi"
// }])

// watch(() => list$[0], (newValue, oldValue) => {
//     console.log("changed", newValue, oldValue)
// })

// const item = list$.pop()
// console.log(item)

// watch(frog$$, (val, old) => {
//     console.log("new", val)
//     console.log("old", old)
// })
// frog$$._$.setQualities({ a: "gallant" })
//   frog$$._$.qualities = {a: "gallant"} 

// console.log("qualities", frog$$.qualities)
//   msg.value = isReactive(frog.getQualities()[0])

const app = createApp(List)

if (__DEV__) configureFlask({
    warnNoCleanup: false
})

app.mount('#app')

// queueTask(()=>{
//     console.log("hi")
// })

// window.addEventListener('beforeunload', () => {
//     console.log("unloading...")
// })

// function doSomething() {
//     const dynamicNode = makeDynamicNode(false)
//     const unrelated = true;
//     const $count = Ion(0)
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

