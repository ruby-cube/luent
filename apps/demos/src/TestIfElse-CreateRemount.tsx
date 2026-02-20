import { template, createRoot } from "@rue/lumo";
import { TestIfElseMix } from "./TestIfElseMix";

if (__TEST__) createRoot(() => <TestIfElseMix activation={['create', 'remount']}></TestIfElseMix>).mount('#root')