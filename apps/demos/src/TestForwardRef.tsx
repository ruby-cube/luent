import { Component, FromTag, NodeRef, template } from "@rue/luent"

export function StyledComp() {
   const ædiv = NodeRef('div')
   const æcomp = NodeRef(Comp)

   return Component(
      <div>
         <Comp ref={æcomp} at:mounted={() => console.log('comp>>', æcomp())}></Comp>
         <BaseComp ref={ædiv} at:mounted={() => console.log('div>>', ædiv())}></BaseComp>
      </div>
   )
}

function BaseComp(input: FromTag<{
   ref?: NodeRef<'div'>
}>) {
   const { ref } = input

   return Component(
      <div ref={ref}>hi</div>
   )
}

function Comp(input: FromTag<{
}>) {
   return Component(
      <div>hi</div>
   )
      .ref({
         msg: 'hi'
      })
}