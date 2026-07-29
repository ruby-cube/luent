import { NodeRef } from "luent";
import {ion} from "@luent/quarky"

export function MainBlock() {

   const $hello = $PortableNode() as unknown as AtomicIon<PortableNode>
   const $bye = $PortableNode() as unknown as AtomicIon<PortableNode>

   const helloView = $hello()
   helloView.remove()
   helloView.moveTo($MainContent)
   helloView.moveTo()

   const $main_content = $MorphicPort([
      [$hello, () =>
         <div>hello</div>
      ],
      [$bye, () =>
         <div>bye</div>
      ]
   ], $hello) // if using directly in template

   const $list = ion(['ho'])

   const $records_list = $ListPort($records, (record) => (
      <h1>{record.content}</h1>
   ), { get: $recordNodes, IDKey: 'id' })

   function changeMainContent(index) {
      $main_content.as($bye)
      $main_content.as($recordsNodes, 9)
   }






   const $mainContent = NodeRef($MainContent)

   $mainContent.render('bye')

   return (
      <main>
         <$MainContent as='hello' ref={$mainContent} />
         <$records_list />
         <button on:click={changeMainContent}>click</button>
      </main>
   )
}

const $MainContent = MorphicNode({
   hello: () =>
      <div>hellow</div>
   ,
   bye: () =>
      <div>bey</div>
})

function $portable(render: (() => any) | AtomicIon<PortableNode>, $ref: AtomicIon<PortableNode> | (() => any)) {
   return render;
}

function $MorphicNode() {

}

function $MorphicPort(initialKey: string | AtomicIon<any>, switchMap: { [key: string]: () => any } | any[]): { (): any; as: (key: string) => any } {

   const $key = ion(initialKey)
   const renderphase = ion(switchMap[$key()])

   watch($key, (key) => {
      renderphase.update(switchMap[key])
   })

   function $Morphable() {
      return $morphling(renderphase)
   }

   $Morphable.set = $key.set

   return $Morphable as unknown as { (): any; set: (key: string) => any }
}

function MainContent() {

   const $mainContent = ion(() =>
      <div>hello</div>)

   function changeMainContent() {
      $mainContent.as(() =>
         <div>bye</div>
      )
   }

   return (
      <>
         {$morphling($mainContent)}
         <button on:click={changeMainContent}>click</button>
      </>
   )
}

function $morphling(renderphase: AtomicIon<() => any>) {
   return new MorphlingKit(renderphase)
}

class MorphlingKit {
   constructor(public renderphase: AtomicIon<() => any>) { }
}

function setUpMorphling(morphlingKit: MorphlingKit) {
   const renderphase = morphlingKit.renderphase
   watch(renderphase, (render) => {
      const output = render()
   }, { phase: RENDER })
}