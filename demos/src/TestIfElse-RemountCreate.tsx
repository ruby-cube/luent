import { template, mountIsland } from "luent";
import { TestIfElseMix } from "./TestIfElseMix";

if (__TEST__)
  mountIsland(() => (
    <TestIfElseMix activation={['preserve', 'create']}></TestIfElseMix>
  ), '#root')