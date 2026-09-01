import { Code } from "@luent/websites-shared";
import type { RenderSlot } from "luent";
import { css, For, Style, type FromTag, type Ion } from "luent";
import type { CodeBlock, CodeTab, TourSection } from "./types";
import { toID, tourSections } from "./tour-content";


function toCodeBlock(section: TourSection): CodeBlock {
  const jsx = 'nsx' in section
  const ns = jsx ? 'nsx' : 'ns'
  const ts = jsx ? 'tsx' : 'ts'
  return {
    main: {
      code: section[ts]!,
      lang: ts,
      name: ts,
      hover: section.tsHover
    },
    alt: {
      code: section[ns]!,
      lang: ns,
      name: ns,
      hover: section.nsHover
    },
    highlight: (code, lang) => new Promise(resolve => resolve(code)) // FIX: standin
  }
}

export function TourList(setup: FromTag<{
  sections: TourSection[]
}>) {
  const { sections } = setup;
  console.log('TourList')

  return <>
    {For(sections, (section, index) =>
      <TourSection
        index={index}
        id={toID(section.heading)}
        heading={section.heading}
        url={section.url}
        tab={section.tab}
        code={toCodeBlock(section)}
        Description={section.Description}
        Note={section.Note}
      />
    )}
  </>
}

function TourSection(setup: FromTag<{
  index: number;
  id: string;
  heading: string;
  Description: RenderSlot;
  Note?: RenderSlot<{ tab: CodeTab }>
  url: string;
  tab: CodeTab & { toggle(): void },
  code: CodeBlock
}>) {
  const { id, index, heading, $tab, Description = tourSections[index].Description, Note = tourSections[index].Note, url, code } = setup
  console.log('heading', heading)
  console.log('Description', tourSections[index].Description)
  return <>
    <div class="tour-section" id={id}>
      <div class="info">
        <div class="section-num">[01 / 12]</div>
        <h3>{heading}</h3>
        <p>
          <Description />
        </p>

        {Note &&
          <p>
            <Note tab={$tab} />
          </p>
        }
        <a href={url} class="medium brand">
          Learn more
        </a>
      </div>
      <Code
        trusted
        tab={$tab}
        {...code}
      ></Code>
      {/* <div class="code">
        <span class="filename">index.ts</span>
        <pre>
          $ npm create luent@latest my-app
          $ cd my-app
          $ npm run dev

          luent v1.0  dev server running
          ➜ local: http://localhost:5173
        </pre>
      </div> */}
    </div>

    {Style(css`
      .tour-section {
        display: grid;
        grid-template-columns: 0.9fr 1.1fr;
        gap: 56px;
        align-content: center;
        padding: 72px 0;
        border-top: 1px solid var(--line);
        scroll-margin-top: 84px;
        min-width: 0;
      }

      .tour-section:first-child {
        border-top: none;
      }

      .tour-section.tall {
        min-height: 100vh;
      }

      .tour-section .info .section-num {
        font-family: "Fragment Mono", monospace;
        font-size: 12.5px;
        color: var(--teal-ink);
        margin-bottom: 18px;
      }

      .tour-section .info h3 {
        font-size: 26px;
        font-weight: 600;
        letter-spacing: -0.015em;
        margin-bottom: 14px;
      }

      .tour-section .info p {
        font-size: 15.5px;
        line-height: 1.7;
        color: var(--ink-2);
        max-width: 40ch;
      }

      .code {
        background: var(--code-bg);
        color: var(--code-ink);
        border: 1px solid var(--line);
        border-radius: 6px;
        font-family: "Fragment Mono", monospace;
        font-size: 13px;
        line-height: 1.75;
        padding: 24px 26px;
        overflow: auto;
        min-width: 0;
      }

      .code .filename {
        display: block;
        font-size: 11.5px;
        color: #6c6f78;
        margin-bottom: 14px;
        letter-spacing: 0.05em;
      }

      .code pre {
        white-space: pre;
        margin: 0;
      }
    `)}

  </>
}
