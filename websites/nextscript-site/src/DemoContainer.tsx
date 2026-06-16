import { component, css, fromTag, RenderSlot, Style } from "@rue/luent";

export function DemoContainer(setup: { Slot: RenderSlot }) {
  const { Slot } = fromTag(setup)
  return component(
    <>
      <div class='demo-container'>
        {Slot()}
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