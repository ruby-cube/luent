import { createRoot } from "@rue/lumo"
import { TrafficLight } from "./TrafficLight"
import { TestAsyncSelect } from "./TestAsyncSelect"
import { CellsApp } from "./CellsApp"
import { CircleApp } from "./CircleApp"
import { SVGPolygonApp } from "./SVGPolygonApp"
import { TriangleDemo } from "./SierpinskiTriangles"
import { TestAsyncTabs } from "./TestAsyncTabs"
import { TestListSelectTransition } from "./TestListSelectTransition"
import { TestListTransit } from "./TestListTransit"
import { TestMountIf } from "./TestMountIf"
import { TestSimpleCounter } from "./TestSimpleCounter"
import { TodoMVC } from "./TodoMVC"
import { VideoPlayer } from "./VideoPlayer"
import { TestMarkdownApp } from "./MarkdownApp"
import { TreeApp } from "./TestTreeApp"
import { instantUpdate, Ionic } from "@rue/quarky"

const app = createRoot(TestListSelectTransition)

app.mount('#root')

// const list = Ionic([])
// instantUpdate(()=> {
//    list[0] ={name: 'kermit'}
//    console.log('list???', [...list], list[0], list.length)

// })
