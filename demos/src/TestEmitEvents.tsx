import { FromTag, HandleEvent } from "luent"

export function TestEmitEvents() {
  return <>
    <Child onClick={e => console.log('click', e)}></Child>
    <Child></Child>
  </>
}

function Child(setup: FromTag<{ onClick: HandleEvent<MouseEvent> }>) {
  const { emitClick } = setup;
  return <><button on:click={e => { console.log('hi'); emitClick(e) }}>click</button></>
}