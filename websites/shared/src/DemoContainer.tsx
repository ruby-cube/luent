import { callWithShadowRoot, component, css, FromTag, NodeRef, renderInShadow, RenderSlot, Style } from "@rue/luent";

// function Powerset(setup: {
//   'mu:powers': Ionic<string[]> & { addRandomPower(): void }
//   limit: number,
// }) {
//   const a = {
//     add(){}
//   }
//   const { mu, '-r': { powers }, limit } = setup;
//   <:>
//     <div class='powerset-panel'>
//       <Powers {powers}>
//       <button
//         disabled={() => powers.length === limit}
//         on:click={() => mu.powers.addRandomPower()}
//       >+</button>
//     </div>
//     <o--link href='/powerset.css' rel='stylesheet' />
//   </:>
// }

export function DemoContainer(setup: FromTag<{
  Slot: RenderSlot
}>) {
  const { Slot, ...rest } = setup
  const $div = NodeRef('div')

  return (
    <>
      <div ref={$div} class='demo-container' auto-bind={rest}>
        {import.meta.env.SSR
    ?
    <style-scope>
      <template>
        {callWithShadowRoot(Slot)}
      </template>
    </style-scope>
    : <shadow-root mode='open'>
      {Slot()}
    </shadow-root>}
      </div>

      {Style(css`
        .demo-container {
          position: relative;
          margin: 16px 0;
          padding: 28px;
          min-height: 180px;
          border: 1px solid var(--vp-c-divider);
          border-radius: 12px;
          display: grid;
          place-items: center;
          overflow: hidden;
        }

        .demo-container > * {
          position: relative;
          z-index: 1;
        }

        @media (max-width: 639px) {
          .demo-container {
            min-height: 150px;
            padding: 20px;
            border-radius: 10px;
          }
        }
      `)}
    </>
  )
}

