// // import {jsx} from '@rue/jsx-dev-runtime'
// // console.log(jsx)
// // import { App } from './App';

// import './demos/robofriends/robofriends.css'
// import './demos/tree-view.css'
// import {TreeApp} from './demos/tree-view'
// import { TestCounter } from './TestCounter';
// import { TestBox } from './TestBox';
// import { App } from './App';
// import { TestConditional } from './TestConditional';
import {  SevenGUIs } from './wip-demos/7-guis';
import { View } from './wip-demos/vue-data-fetching';
import { configureFlask, genIncrementalId } from '../../../packages/flask/initFlask';
import { AsyncIon, template, createRoot } from '@rue/lumo';
import { CounterApp, TestCount, TestCounterModel } from './TestCounter';
import { TestApp } from './TestApp';
import { TestListSelect } from './wip-demos/TestListSelect';
import { TabApp } from './wip-demos/markdown-app/TestTabs';
import { TreeApp } from '../../demos/src/TestTreeApp';
import { SortableTableApp } from '../../demos/src/SortableTable';
import { TestEffectCycle } from './TestEffectCycle';
import { TestShow } from './TestShow';
import { TestSetHas } from './TestSetHas';
import { TestCustomRadioSelection } from './TestSelected';
import { TestNested, TestNestedB } from './wip-demos/TestNested';
import { TestViewFlasks } from './TestViewFlasks';
import { TestAnimationController } from './wip-demos/animation-controller';
import { CounterModelApp, TestMutableCounter } from './TestCounterModel';
import { Sidebar } from './wip-demos/IfContextMenu';
import { FBApp } from './wip-demos/FBChatBug';
import { PlainList } from './TestList';
import { TestBox } from './TestBox';
import { TestCreateMountShow, TestDerivedConditional } from './TestCreateMountShow';
import { TestDerived } from './TestCumulativeDerivedIon';
import { RoboFriendsApp } from './wip-demos/robofriends/RoboFriends';
import { getPublicTrace } from '../../../packages/flask/debug';
import { TestPolymorph } from './TestPolymorph';
import { TestTry } from './API-exploration/TestTry';
import { TestAwait } from './TestAwait';
import { TestTooltip } from './TestTooltipLayoutThrash';
import { TestSyncEffects } from './wip-demos/TestSyncEffects';
import { TestEffectCyclePhases } from './TestEffectCyclePhases';
import { TestTrackableOps } from './TestTrackableOps';
import { TestNormalizeToRenderFunction } from './TestNormalizeToRenderFunction';
import { TestIfElse } from './wip-demos/TestIfElse';
import { TestIonicTask } from './TestIonicTask';
import { TestJSON } from './TestJSON';
import { TestNestedConditional } from './TestNestedConditional';
import { DebugLeakyFlask } from './DebugLeakyFlask';
import { TestVineNodes } from './TestVineNodes';
import { For } from '../../../packages/lumo/src/iteratives/For';
import { DateApp } from './wip-demos/DateApp';
import { installIonizedDate } from '../../../packages/quarky/src/ionic/$$Date';
import { TestMultisetting } from './wip-demos/TestMultisetting';
import { TestVanillaStream } from './TestStream-await';
import { TestIonicList } from './TestIonicList';
import { $activeUpdate, Animation, instantUpdate, INTERNAL_RENDER, Ion, load, PRELUDE, queueInternalRender, queueIonicPostlude, queueIonicPrelude, queueIonicTask, RENDER, runIonicTask, slowUpdate, untracked, watch, watchToRender } from '@rue/quarky';
import { compareTaskPromise } from './TestMicrotask';
import { startCycle } from './TestGenerators';
import { TestAsyncMultipliers, TestAsyncMultiply, TestAsyncMultiplyB, TestAsyncMultiplyDrop, TestAsyncMultiplyQueue } from './wip-demos/TestAsyncMultiply';
import { Async, ooo } from '../../../packages/quarky/src/async/ooo';
import { Counter } from './TestCounterB';
import { fetchArticles } from './wip-demos/conduit/src/feature/article-feed/Articles.ionic';
import { TestMutableDerivation } from './wip-demos/TestMutableDerivations';
import { TestListDragDrop } from './wip-demos/TestListDragDrop';
import { MountIfAnimation } from './TestMountIf-animation';
import { List } from './App';
import { TestRenderFunctionSlot } from './TestRenderFunctionSlot';
import { TestListMounting } from './TestListMounting';
import { TestStyling } from './wip-demos/TestStyling';
import { TestThru } from '../../demos/src/TestThru';
import { TestForSetAndMap, TestForSetAndMapIons } from './wip-demos/TestForSetAndMap';
import { TestAsyncSelect } from '../../demos/src/TestAsyncSelect';
import { TestAsyncTabs } from '../../demos/src/TestAsyncTabs';
import { initMonacoEditor } from './TestMonacoEditor';
import { TestCreate } from './TestCreate';
import { TestAwaitConditional } from './TestAwaitConditional';
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
// import { UpdateCycle } from '@rue/quarky';
// import { MainSite } from './AwaitTest';
// import { ConditionalFlaskTest } from './ConditionalFlaskTest';
// import { Root } from './TreeTest';
// import { NestedPend } from './NestedPend';

// initMonacoEditor()

// const $count = Ion(0, {
//    increment() {
//       this.value++
//    }
// })

// watchToRender($count, () => {
//       console.log('Count is now', $count())
// })

// setInterval(() => {
//    $count.increment()
// }, 1000)

// window.addEventListener('click', () => $count.increment())

// slowUpdate(() => {
//    let i = 1000000000
//    // Artificially long execution time.
//    while (i--) { }
// })


const app = createRoot(TestAsyncMultiplyB)

app.mount('#root')


// function TestApp2() {
//    return template(
//       <div contenteditable on:beforeinput={e => (console.log('before input'), queueTask(()=>console.log('task!')))} on:input={e => console.log('input')}>
//          hi
//       </div>
//    )
// }

// function animate(){
//    requestAnimationFrame(() => {
//       animate()
//    })
// }
// animate()
// window.addEventListener('click', startCycle)

// instantUpdate(() => {
//    runIonicTask(() => {
//       console.log('*** A')
//    })

//    runIonicTask(() => {
//       console.log('*** B')
//    })

//    runIonicTask(() => {
//       console.log('*** C')
//    })
// })
// instantUpdate(() => {
//    const $count = Ion(0)

//    queueIonicPostlude(() => {
//       console.log('ionic task')
//       $count()
//    })

//    listen(window, 'click', () => {
//       $count.value = $count() + 1
//    })
// })


// load(() => {
//    const $count = Ion(0)
//    // const $other = Ion(true)

//    const $suspense = Suspense()

//    const $async = AsyncIon(() => {
//       const count = $count();
//       return new Promise(res => setTimeout(() => res(count), 500))
//    }, { suspense: $suspense })

//    watch($async, () => {
//       console.log('render', $async())
//    }, {phase: INTERNAL_RENDER})


//    // queueIonicPrelude(() => {
//    //    console.log('ionic prelude', $count(), $activeUpdate()?.cycle.currentPhase)

//    //    $other.value = !untracked($other)
//    // })

//    // watch($other, () => {
//    //    console.log('Suspense other', $other(), $activeUpdate()?.cycle.currentPhase)
//    // }, {
//    //    phase: PRELUDE,
//    //    eager: true
//    // })

// listen(window, 'click', () => {
//    doSomething('frog').then((value) => console.log('final:', value))
// })

//    // listen(window, 'contextmenu', (e) => {
//    //    e.preventDefault()
//    //    $other.value = !$other.value
//    // })
// })

// function A() {
//    const something =
//       await fetchSomething()
//          .catch(err => console.error(err))
//          .finally(() => console.log('done'))

//    console.log('something', something)
// }


// function B() {
//    fetchSomething()
//       .then(something => console.log('something', something))
//       .catch(err => console.error(err))
//       .finally(() => console.log('done'))
// }



// const doSomething = Async((name: string) => {
//    return ooo.await(FetchSomething('one', rando()), res => {
//       console.log('(1)', res, name)
//       // return 'something'
//       return FetchSomething('piped one', rando())()
//    })
//       .then(id => fetchArticles(id))
//       .await(id => fetchArticle(id), () => {

//       })
//       .then(piped => {
//          console.log('(2)', piped)
//          return 'song'
//       })
//       .await(FetchSomething('two', rando()), (cities, piped) => {
//          console.log('(3)', cities, 'piped:', word)
//          return 'puffball'
//       })
//       .then(value => console.log('then...', value))
// })

// const doSomething = Async((name: string) => {
//    return ooo
//       .await(FetchSomething('one', rando()), (res, context) => {
//          console.log('(1)', res, name, 'context', context)
//       })
//       .await(FetchSomething('piped one', rando()), piped => {
//          console.log('(2)', piped)
//          return { piped }
//       })
//       .await(FetchSomething('pipette', rando()), (pipette, c) => {
//          console.log('(3)', pipette, 'context', c)
//          return { pipette }
//       })
//       .catch((err, c) => console.error(err, c))
//       .finally(c => console.log('context', c))
//       .await(FetchSomething('two', rando()), (cities, context) => {
//          console.log('(4)', cities, 'context:', context)
//          return 'puffball'
//       })
//    // .then(value => console.log('then...', value))
// })

// FetchSomething('kermit', 1000)().then(res => {

//    return FetchSomething('a', rando())()
// }).then(piped => {

//    return FetchSomething('two', rando())
// }).then((res) => {
//    onFulfilled(res, piped)
//    return Promise.all([promise, FetchSomething()])
// })



// await + (awaited) => value
// then (value) => {}

// await + (awaited) => promise
// then (res) => {}

// await
// then (res) => {}

// --

// await + (awaited) => value
// await + (res, value) => {}

// await + (awaited) => promise
// await (res, res) => {}

// await
// await (res) => {}

// --

// await + (awaited) => value
// finally()

// await + (awaited) => promise
// then (res) => {}

// await
// then (res) => {}





// FetchSomething('kermit', 1000)()
//    .then(value => {
//       console.log('value', value)
//       return new Promise((res, rej) => {
//          setTimeout(() => {
//             res('hi')
//          }, 500)
//       })
//    }, error => {
//       console.warn(error)
//    })
//    .finally(() => {
//       console.log('finally')
//    })
//    .then(value => {
//       console.log('last value', value)
//    })


// function rando() {
//    return Math.random() * 1000
// }


// function FetchSomething(word: string, time: number) {
//    return () => new Promise((resolve, reject) => {
//       setTimeout(() => {
//          // reject('oops')
//          // throw new Error('oops')
//          resolve('Kermit' + ' ' + Math.round(time) + ' ' + word)
//       }, time)
//    })
// }


// const frog = ionize({ name: 'sir robin' })

// watch(frog.$name, ({ current: name }) => {
//    console.log('name:', name)
// })

// document.addEventListener('click', () => {
//    frog.name = 'kermit'
// })


// const rootContext = createGlobalCommons()

// import { frog } from './TestReadonly';

// frog;

// const root = createRoot(document.getElementById('app'));
// root.render(<h1>Hello, world</h1>);

// if ( __DEV__) configureFlask({
//    warnNoCleanup: true
// })

// const globalCommons = createGlobalCommons([
//    m(DOOR, () => doSomething())
// ])

// const app = createRoot(
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



// const $frog = Ion('kermit')

// const obj = {
//    frog: $frog
// }

// console.log(obj)
// function Appo(){
//    const list = ionize([1])
//    list.push(4)
//    const sList = JSON.stringify(list)

//    console.log(sList)
//    return template(<>hi</>)
// }





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
//     const $count = Ion(0)
//     function increment() {
//         $count.set(c => c + 1)
//     }
//     const $doubleCount = $(() => $count() * 2)
//     let prevDoubleCount = $doubleCount;
//     dynamicNode.mount(() => {
//         watchToRender($doubleCount, function $stubbornHandler() {
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

