import { Component, FromTag, NodeRef, template } from "@rue/luent"

export function StyledComp() {
   const $div = NodeRef('div')
   const $comp = NodeRef(Comp)

   return Component(
      <div>
         <Comp ref={$comp} at:mounted={() => console.log('comp>>', $comp())}></Comp>
         <BaseComp ref={$div} at:mounted={() => console.log('div>>', $div())}></BaseComp>
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