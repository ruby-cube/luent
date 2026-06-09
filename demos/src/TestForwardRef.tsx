import { component, FromTag, NodeRef, template } from "@rue/luent"

export function StyledComp() {
   const $div = NodeRef('div')
   const $comp = NodeRef(Comp)

   return component(
      <div>
         <Comp ref={$comp} at:mount={() => console.log('comp>>', $comp())}></Comp>
         <BaseComp ref={$div} at:mount={() => console.log('div>>', $div())}></BaseComp>
      </div>
   )
}

function BaseComp(input: FromTag<{
   ref?: NodeRef<'div'>
}>) {
   const { ref } = input

   return component(
      <div ref={ref}>hi</div>
   )
}

function Comp(input: FromTag<{
}>) {
   return component(
      <div>hi</div>
   )
      .ref({
         msg: 'hi'
      })
}