// // import {jsx} from '@rue/jsx-dev-runtime'
// // console.log(jsx)
// // import { App } from './App';
import './style.css'
// import './demos/SierpinskiTriangles.css'
// import './demos/robofriends/robofriends.css'
// import './demos/tree-view.css'
// import {TreeApp} from './demos/tree-view'
// import { TestCounter } from './TestCounter';
// import { TestBox } from './TestBox';
// import { App } from './App';
// import { TestConditional } from './TestConditional';
import { configureFlask, genIncrementalId } from '../../../packages/flask/initFlask';
import { component, createApp, createGlobalCommons, fromTag, nodeRef} from '@rue/lumo';
import { CounterApp, TestCount } from './TestCounter';
import { TestApp } from './TestApp';
import { MountIf } from './TestMountIf';
import { List } from './TestReactiveModel';
import { MarkdownApp } from './demos/markdown-app/markdown-app';
import { View } from './demos/vue-data-fetching';
import { TabApp } from './demos/markdown-app/TestTabs';
import { TreeApp } from './demos/tree-view';
import { SortableTableApp } from './demos/sortable-table';
import { TodoMVC } from './demos/todo-mvc';
import { TestEffectCycle } from './TestEffectCycle';
import { TestShow } from './TestShow';
import { TestSetHas } from './TestSetHas';
import { TestCustomRadioSelection } from './TestSelected';
import { SevenGUIs } from './demos/7-guis';
import { CellsApp } from './demos/cells-app';
import { PolygonApp } from './demos/polygon-app';
import { TrafficLight } from './demos/traffic-lights';
import { VideoPlayer } from './video-player';
import { TestNested, TestNestedB } from './demos/TestNested';
import { ion } from '@rue/quarky';
import { TestViewFlasks } from './TestViewFlasks';
import { TestAnimationController } from './demos/animation-controller';
import { CounterModelApp } from './TestCounterModel';
import { Sidebar } from './demos/IfContextMenu';
import { FBApp } from './demos/FBChatBug';
import { PlainList } from './TestList';
import { TestBox } from './TestBox';
import { TestDerivedConditional } from './TestCreateMountShow';
import { TestDerived } from './TestCumulativeDerivedIon';
import { RoboFriendsApp } from './demos/robofriends/RoboFriends';
import { getPublicTrace } from '../../../packages/flask/debug';
import { TestPolymorph } from './TestPolymorph';
import { TestTry } from './API-exploration/TestTry';
import { TestAwait } from './TestAwait';
import { TestTooltipApp } from './TestTooltipLayoutThrash';
import { TriangleDemo } from './demos/SierpinskiTriangles';
// import { MountIf } from './TestMountIf';
// import { List } from './TestReactiveModel';
// import { TestDerived } from './testDerivedIon';
// import { TestDerivedConditional } from './testDerived';
// import { TestDebugApp } from './TestDebugTools';
// import { Transformers } from './jsx-$transform';
// import { TestCommons } from './TestCommons';
// import { TestApp } from './TestApp';
// import { MarkdownApp } from './demos/markdown-app/markdown-app';
// import { TabApp } from './demos/markdown-app/TestTabs';
// import { TestPropIons } from './TestPropIons';
// import { PlainList } from './TestList';
// import { HelloWorld } from './HelloWorld';
// import { Check } from './childrenTest';
// import { TestDerived } from './testDerivedIon';
// import { OverrideMethods } from './TestOverrideMethods';
// import { queueTask } from '@rue/thread';
// import { EffectCycle } from '@rue/quarky';
// import { MainSite } from './AwaitTest';
// import { ConditionalFlaskTest } from './ConditionalFlaskTest';
// import { Root } from './TreeTest';
// import { NestedPend } from './NestedPend';

// export const [
//    SYNC,
//    BATCHED
// ] = useReactivity()



// const $count = ion(0, {
//    increment() {
//       $count.state++
//    },
//    decrement() {
//       $count.state--
//    }
// })

// const $doubleCount = ion(() => $count() * 2)

// watch(() => {
//    console.trace()
//    console.log('+++++++++++++++++')
//    console.log('double count is now', $doubleCount())
//    console.log('count is', $count())
//    console.log('+++++++++++++++++')
// }, { phase: SYNC })

// function doStuff() {
//    $count.increment()
//    $count.decrement()
//    // $count.increment()
// }

// window.$count = $count
// window.$doubleCount = $doubleCount
// window.doStuff = doStuff


// const rootContext = createGlobalCommons()

// import { frog } from './TestReadonly';

// frog;

// const root = createRoot(document.getElementById('app'));
// root.render(<h1>Hello, world</h1>);

// if (__DEV__) configureFlask({
//    warnNoCleanup: true
// })

// const globalCommons = createGlobalCommons([
//    m(DOOR, () => doSomething())
// ])

// const app = createApp(
//    <SortableTableApp
//       hideApp={hideApp}
//       closeApp={closeApp}
//    />
// )

// const array = ionize([{ name: 'a' }, { name: 'b' }])
// console.log('Stringify', JSON.stringify(array))

// const root = document.getElementById('app')!
// const div = document.createElement('div')
// root.appendChild(div)
// const button = document.createElement('button')
// button.innerText = 'click'
// root.appendChild(button)

// let text = 'hello'

// button.addEventListener('click', () => {
//    // div.clientWidth

//    requestAnimationFrame(() => {
//       const textNode = document.createTextNode(text = text + '!')
//       div.appendChild(textNode);

//    })
//    // div.clientWidth
//    // div.clientWidth
//    requestAnimationFrame(() => {
//       div.clientWidth
//    })

//    // const textNodeB = document.createTextNode(text = text + '!')
//    // div.appendChild(textNodeB);




//    // read
// })
// button.addEventListener('click', () => {
//    // div.clientWidth

//    const textNode = document.createTextNode(text = text + '!')
//    div.appendChild(textNode);

//    requestAnimationFrame(() => {
//       div.clientWidth
//    })
//    // div.clientWidth

//    // const textNodeB = document.createTextNode(text = text + '!')
//    // div.appendChild(textNodeB);

//    // read
// })



const app = createApp(MountIf)

app.mount('#app')

// insertText(text: 'hi, position: 9)
// 
//  - textBlot.push({ text: 'hi' }): 
//     - textBlot.length: 2 -> 3
//     - textBlot: [{ text: 'a' }, { text: 'b' }]
//       -> [{ text: 'a' }, { text: 'b' }, { text: 'hi'}]

// action/mutation details:
// - state
// - duration
// - trace


// app.initialize('#app', {
//    globalCommons,
//    provide: []
// })

// function hideApp() {
//    app.demount()
// }

// function showApp() {
//    app.remount('#section-2')
// }

// function closeApp() {
//    app.close()
// }










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
// dynamicNode.discard()

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



let effectCycle;

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
//     if (!effectCycle) {
//         queueTask(() => {
//             effectCycle = null
//             console.log(msg, "TASK PRE")
//            requestAnimationFrame(() => {
//                 console.log(msg, "RENDER")
//                 console.log("-----------------")
//                 queueTask(() => {
//                     console.log(msg, "POST RENDER")
//                 })
//             })
//         })
//         effectCycle = true;
//     }
// }

