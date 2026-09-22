import { css, FromTag, Ion, RenderTag, Style } from 'luent'
import { Code } from './Code';

export function CodeTour(setup: FromTag<{
  Slot: RenderTag
}>) {
  const { Slot } = setup;

  return (
    <>
      <section class='home-tour'>
        <Slot />
      </section>

      {Style(css`
        .home-tour {
          display: grid;
          gap: clamp(4.9rem, 8.85vw, 8.1rem);
          width: 100%;
          max-width: 1120px;
          margin: clamp(3.7rem, 6.65vw, 6.4rem) auto 0;
        }

        .home-tour .code-container {
          margin: 0;
        }

        @media (max-width: 959px) {
          .home-tour {
            margin-top: clamp(2.7rem, 12vw, 4rem);
          }
        
          .tour-row {
            padding: 0;
            border-top: 0;
          }
        }
      `)}
    </>
  )
}

export function TourSection(setup: FromTag<{
  columnRatio?: [number, number];
  tab?: Ion<"main" | "alt"> & { toggle: () => void },
  id?: string,
  filename?: string,
  Slot: RenderTag,
  mainCode: { name: string, code: string, lang?: string },
  altCode: { name: string, code: string, lang?: string },
  highlightCode: (code: string, lang: string) => Promise<string>,
  flow: 'code-right' | 'code-left',
  Note?: RenderTag
}>) {
  const { filename = 'example', Slot, flow, mainCode, altCode, highlightCode, id, $tab, Note, columnRatio=[1,1] } = setup
  return (
    <>
      <article id={id} class={`tour-row ${flow}`}>
        <div class='tour-copy'>
          <Slot />
        </div>
        <div class='tour-code'>
          <Code
            filename={filename}
            trusted
            main={mainCode}
            alt={altCode}
            highlight={highlightCode}
            tab={$tab}
          ></Code>
          {Note && <Note class='tour-note'/>}
        </div>
      </article>

      {Style(css`

        .tour-row {
          display: grid;
          grid-template-columns: minmax(0, 1fr);
          gap: 1.2rem;
          align-items: start;
          padding: clamp(1.2rem, 1.2vw, 1.6rem) 0;
        }

        .tour-row:first-child {
          border-top: 0;
          padding-top: 0;
        }

        .tour-copy, .tour-code {
          min-width: 0;
        }

        // .tour-copy h3 {
        //   margin-top: 0;
        //   margin-bottom: 0.75rem;
        //   font-size: clamp(1.5rem, 3.1vw, 2.35rem);
        //   line-height: 1.08;
        //   letter-spacing: -0.02em;
        //   color: var(--vp-c-text-1);
        // }

        // .tour-copy p {
        //   margin: 0 0 0.9rem;
        //   font-size: clamp(1rem, 1.25vw, 1.1rem);
        //   line-height: 1.7;
        //   color: var(--vp-c-text-2);
        //   max-width: 58ch;
        // }

        // .tour-copy p:not(.tour-note) {
        //   margin-bottom: 1.4rem;
        //   margin-top: .75rem;
        // }

        // .tour-copy p:last-child {
        //   margin-bottom: 0;
        // }

        // .tour-copy .tour-note {
        //   font-size: clamp(0.9rem, 0.95vw, 0.96rem);
        // }

        .tour-note {
          background-color: var(--vp-c-bg-soft);
          padding: 1rem;
          padding-inline: 1.5rem;
          border-radius: 12px;
          font-size: clamp(0.9rem, 0.95vw, 0.96rem);
          margin-block: 1.4rem; 
          color: var(--vp-c-text-2);
        }

        @media (min-width: 960px) {
          .tour-row {
            grid-template-columns: minmax(240px, ${columnRatio[0]}fr) minmax(0, ${columnRatio[1]}fr);
            gap: clamp(1.8rem, 3vw, 3rem);
          }
        
          .tour-row.code-left .tour-code {
            order: 1;
          }
        
          .tour-row.code-left .tour-copy {
            order: 2;
          }
        }
    `)}
    </>
  )
}