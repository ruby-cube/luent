import { createRoot } from "@rue/lumo"
import { TrafficLight } from "./TrafficLight"
import { CellsApp } from "./CellsApp"
import { CircleApp } from "./CircleApp"
import { SVGPolygonApp } from "./SVGPolygonApp"
import { TriangleDemo } from "./SierpinskiTriangles"
import { TestListSelectTransition } from "./TestListSelectTransition"
import { TestListTransit } from "./TestListTransit"
import { TestMountIf } from "./TestMountIf"
import { TodoMVC } from "./TodoMVC"
import { VideoPlayer } from "./VideoPlayer"
import { TestMarkdownApp } from "./MarkdownApp"
import { TreeApp } from "./TestTreeApp"
import { TestForKeys } from "./TestForKeys"
import { TestAsyncSelect } from "./TestAsyncSelect"
import { CRUDApp } from "./TestCRUDApp"
import { SortableTableApp } from "./SortableTable"
import { TestSettableDerivation } from "./TestSettableDerivations"
import { TestAsyncTabs } from "./TestAsyncTabs"
import { TestCounter } from "./TestCounter"
import { TestMoveBox } from "./TestBoxMove"

export function runDemo() {
   const app = createRoot(TestSettableDerivation)

   app.mount('#root')
}


