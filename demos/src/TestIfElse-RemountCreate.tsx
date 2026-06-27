import { template, mount } from "@rue/luent";
import { TestIfElseMix } from "./TestIfElseMix";

if (__TEST__)
  mount(() => (
    <TestIfElseMix activation={['preserve', 'create']}></TestIfElseMix>
  ), '#root')