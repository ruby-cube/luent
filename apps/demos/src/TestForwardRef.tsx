import { FromTag, NodeRef, template } from "@rue/luent"

export function StyledComp() {
   const ædiv = NodeRef('div')
   const æcomp = NodeRef(Comp)

   return template(
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

   return template(
      <div ref={ref}>hi</div>
   )
}

function Comp(input: FromTag<{
}>) {
   return template(
      <div>hi</div>
   )
      .ref({
         msg: 'hi'
      })
}