import { component, FromTag, NodeRef, template } from "@rue/luent"

export function StyledComp() {
   const $div = NodeRef('div')
   const $comp = NodeRef(Comp)

   return (

      <div>
         <Comp ref={$comp} at:attach={() => console.log('comp>>', $comp())}></Comp>
         <BaseComp ref={$div} at:attach={() => console.log('div>>', $div())}></BaseComp>
      </div>
   )
}

function BaseComp(input: {
   ref?: NodeRef<'div'>
}) {
   const { ref } = input

   return (

      <div ref={ref}>hi</div>
   )
}

function Comp(input: {
}) {
   return (

      <div>hi</div>
   )
      .ref({
         msg: 'hi'
      })
}