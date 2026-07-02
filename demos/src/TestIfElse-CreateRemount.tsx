import { template, mountIsland } from "@rue/luent";
import { TestIfElseMix } from "./TestIfElseMix";

if (__TEST__) mountIsland(() => <TestIfElseMix activation={['create', 'preserve']}></TestIfElseMix>, '#root')