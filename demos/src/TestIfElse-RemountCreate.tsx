import { template, createRoot } from "@rue/luent";
import { TestIfElseMix } from "./TestIfElseMix";

if (__TEST__) createRoot(() =>
   <TestIfElseMix activation={['remount', 'create']}></TestIfElseMix>
).mount('#root')