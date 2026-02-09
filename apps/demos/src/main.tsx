import { createRoot } from "@rue/lumo"
import { TrafficLight } from "./TrafficLight"
import { CellsApp } from "./CellsApp"
import { CircleApp } from "./CircleApp"
import { SVGPolygonApp } from "./SVGPolygonApp"
import { TriangleDemo } from "./SierpinskiTriangles"
import { TestListSelectTransition } from "./TestListSelectTransition"
import { TestListTransit } from "./TestListTransit"
import { TestMountIf } from "./TestMountIf"
import { TestSimpleCounter } from "./TestSimpleCounter"
import { TodoMVC } from "./TodoMVC"
import { VideoPlayer } from "./VideoPlayer"
import { TestMarkdownApp } from "./MarkdownApp"
import { TreeApp } from "./TestTreeApp"
import { TestForKeys } from "./TestForKeys"
import { TestAsyncSelect } from "./TestAsyncSelect"

const app = createRoot(TestAsyncSelect)

app.mount('#root')


