import { createRoot } from "@rue/lumo"
import { TrafficLight } from "./src/TrafficLight"
import { CellsApp } from "./src/CellsApp"
import { CircleApp } from "./src/CircleApp"
import { SVGPolygonApp } from "./src/SVGPolygonApp"
import { TriangleDemo } from "./src/SierpinskiTriangles"
import { TestListSelectTransition } from "./src/TestListSelectTransition"
import { TestListTransit } from "./src/TestListTransit"
import { TestIfElse } from "./src/TestIfElse"
import { TodoMVC } from "./src/TodoMVC"
import { VideoPlayer } from "./src/VideoPlayer.qrx"
import { TestMarkdownApp } from "./src/MarkdownApp"
import { TreeApp } from "./src/TestTreeApp"
import { TestAsyncSelect } from "./src/TestAsyncSelect"
import { CRUDApp } from "./src/TestCRUDApp"
import { SortableTableApp } from "./src/SortableTable"
import { TestSettableDerivation } from "./src/TestSettableDerivations"
import { TestAsyncTabs } from "./src/TestAsyncTabs"
import { TestCounter } from "./src/TestCounter"
import { TestMoveBox } from "./src/TestBoxMove"
import { TestListSelection } from "./src/TestListSelection"
import { TestConsecutiveIfElse } from "./src/TestConsecutiveIfElse"
import { TestNestedIfElse } from "./src/TestNestedIfElse"
import { BottomlessBlokkis } from "./src/BottomlessBlokkis/BottomlessBlokkis"
import { TestCanvas } from "./src/CanvasApp/TestCanvas"
import { TestIfElseRemountView } from "./src/TestIfElseRemountView"
import { TestNamedSlots } from "./src/TestNamedSlots"
import { TestDerivationA } from "./src/TestDerivation"

export function runDemo() {
   const app = createRoot(TestDerivationA)

   app.mount('#root')
}


