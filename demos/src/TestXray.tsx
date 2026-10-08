import { FromTag, Bindings } from "luent"
import { Xray } from "packages/luent/src/component/bindings"

export function TestXray() {
  return <>
    <Board
      style={{ 'color': 'red' }}
      on:click={e => console.log('click outer')}
      xray:button={x => <x.button on:click={() => console.log('clicked')} style='background-color: green' />}
    ></Board>
  </>
}




function Board(setup: Bindings<'div'> & FromTag<{
  'xray:button'?: Xray<'button'>
}>) {
  const { xray, ...rest } = setup
  console.log('xray?', xray)
  return (

    <div auto-bind={rest}>
      all red
      <button on:click={() => console.log('i click')} auto-bind={xray.button}>click</button>
    </div>
  )
}