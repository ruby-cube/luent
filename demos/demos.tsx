import { createRoot, MICROCLASS_MERGE, provideRoot } from "@rue/luent"
import { CellsApp } from "./src/CellsApp"
import { CircleApp } from "./src/CircleApp"
import { SVGPolygonApp } from "./src/SVGPolygonApp"
import { TriangleDemo } from "./src/SierpinskiTriangles"
import { TestListSelectTransition } from "./src/TestListSelectTransition"
import { TestListTransit } from "./src/TestListTransit"
import { TestIfElse } from "./src/TestIfElse"
import { TodoMVC } from "./src/TodoMVC"
// import { } from "./src/TodoMVC"
import { TrafficLight } from "./src/TrafficLight.nsx"
import { VideoPlayer } from "./src/VideoPlayer.nsx"
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
import { TestSyncEffects } from "./src/TestSyncEffects"
import { StyledComp } from "./src/TestForwardRef"
import { TestOnceEager } from "./src/TestOnceEager"
import { TestPortal, TestPortalB } from "./src/TestPortal"
import { TooltipDemo } from "./src/ui-shadcn/examples/TooltipDemo"
import { TestIfElseMix } from "./src/TestIfElseMix"
import { TestHookForwarding } from "./src/TestHookForwarding"
import { TestUndefinedTextNode } from "./src/TestUndefinedTextNode"
import { TestNullIon } from "./src/TestNullIon"
import { TestRetracking } from "./src/TestRetracking"
import { Grandparent } from "./src/TestEventBubbling"
import { TestXray } from "./src/TestXray"
import { EmojiQuest } from "./src/EmojiQuest"
import { HabitTracker } from "./src/HabitTracker"
import { BulletJournal } from "./src/SimpleTodo"
import { TestInnerHTML } from "./src/TestInnerHTML"
import { Counter } from "./src/CounterApp"
import { TestStylesBindings } from "./src/TestStylesBindings"
import { twMerge } from "tailwind-merge"

export function runDemo() {
  createRoot(() => {
    provideRoot(MICROCLASS_MERGE, twMerge);
    // <HabitTracker habit="water" goal={8}></HabitTracker>
    return <TestHookForwarding />
  })
    // createRoot(() => )
    .mount('#root')
}

