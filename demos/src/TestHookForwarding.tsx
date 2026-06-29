//@ts-nocheck
import { component, fromTag, If, WithRef, Xray } from "@rue/luent";
import { ion } from "@rue/quarky";


export function TestHookForwarding() {

  return (

    <Comp
      before:attach={node => console.warn('node', node)}
      xray:button={x => <x.ray
        before:attach={node => console.warn('div node', node)}
        on:click={e => console.log('clicked the button')} />}
    ></Comp>
  )
}


function Comp(setup: {
  'xray:button'?: WithRef<'button'>
}) {
  const { xray } = fromTag(setup)
  const $active = ion(true)

  return component.as({
    hey: true
  })(
    <div>
      <button on:click={e => $active.value = !$active()} auto-bind={xray.button}>click</button>
      {If($active,
        <div>yeah</div>
      )}
    </div>
  )
}

// export function TestHookForwarding() {

//   return (

//     <Comp
//       before:attach={node => console.warn('node', node)}
//       bind:button={{
//         'before:attach': node => console.warn('div node', node),
//         'on:click': e => console.log('clicked the button')
//       }}
//     ></Comp>
//   )
// }


// function Comp(setup: {
//   'bind:button'?: WithRef<'button'>
// }) {
//   const { bind } = fromTag(setup)
//   const $active = ion(true)

//   return component.as({
//     hey: true
//   })(
//     <div>
//       <button on:click={e => $active.value = !$active()} auto-bind={bind.button}>click</button>
//       {If($active,
//         <div>yeah</div>
//       )}
//     </div>
//   )
// }