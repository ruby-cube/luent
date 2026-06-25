import { callWithShadowRoot, component, css, fromTag, NodeRef, RenderSlot, Style } from "@rue/luent";

export function DemoContainer(setup: {
  Slot: RenderSlot
}) {
  const { Slot, ...rest } = fromTag(setup)
  const $div = NodeRef('div')

  return component(
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
          </shadow-root>
        }
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

