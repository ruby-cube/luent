import { template, createRoot } from "@rue/lumo";
import { TestIfElseMix } from "./TestIfElseMix";

if (__TEST__) createRoot(() =>
   <TestIfElseMix activation={['remount', 'create']}></TestIfElseMix>
).mount('#root')