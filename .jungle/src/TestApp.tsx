import { component, template } from "@rue/luent";
import { List } from "./wip-demos/TestListSelect";
import { MountIf } from "./demo/TestMountIf";
import { TestDerivedConditional } from "./TestCreateMountShow";
import { TestDerived } from "./TestCumulativeDerivedIon";
import { TestPropIons } from "./TestPropIons";


export function TestApp(){
   return component(
      <>
      {/* <h2>Counter: Ions and Derived</h2>
      <TestDerivedConditional></TestDerivedConditional> */}
      {/* <hr /> */}
      {/* <h2>Counter: Cumulative Derived</h2> */}
      {/* <TestDerived></TestDerived> */}
      <hr />
      <h2>Conditional Rendering</h2>
      <hr />
      <MountIf></MountIf>
      <hr />
      <h2>List Rendering</h2>
      <hr />
      <List></List>
      <hr />
      <h2>Prop Ions</h2>
      <hr />
      <TestPropIons></TestPropIons>
      </>
   )
}