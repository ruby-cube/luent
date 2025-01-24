import { component } from "@rue/lumo";
import { List } from "./TestReactiveModel";
import { MountIf } from "./TestMountIf";
import { TestDerivedConditional } from "./testDerived";
import { TestDerived } from "./testDerivedIon";

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
      </>
   )
}