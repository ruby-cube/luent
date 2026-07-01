import { css, MICROCLASS_MERGE, provideRoot, Style } from '@rue/luent'
import { Code, CodeTour, TourSection } from '@rue/websites-shared'
import { highlightCode } from './highlighter'
import { twMerge } from 'tailwind-merge'

let direction = 'code-right'
function flowDirection() {
  if (direction === 'code-right') return direction = 'code-left'
  return direction = 'code-right'
}

export function CodeGlimpses() {
  provideRoot(MICROCLASS_MERGE, twMerge)
  return (
    <>
      <CodeTour>
        <TourSection
          flow={flowDirection()}
          mainCode={{ name: 'ns', code: accessorNS }}
          altCode={{ name: 'ts equivalent', code: accesorTS, lang: 'ts' }}
          highlightCode={highlightCode}
        >
          {AccessorVariables()}
        </TourSection>

        <TourSection
          flow={flowDirection()}
          mainCode={{ name: 'nsx', code: derivationNSX }}
          altCode={{ name: 'tsx equivalent', code: derivationTSX, lang: 'tsx' }}
          highlightCode={highlightCode}
        >
          {DerivationExpressions()}
        </TourSection>

        <TourSection
          flow={flowDirection()}
          mainCode={{ name: 'nsx', code: flowNSX }}
          altCode={{ name: 'tsx equivalent', code: flowTSX, lang: 'tsx' }}
          highlightCode={highlightCode}
        >
          {FlowExpressions()}
        </TourSection>

        <TourSection
          flow={flowDirection()}
          mainCode={{ name: 'nsx', code: gatewayNSX }}
          altCode={{ name: 'tsx equivalent', code: gatewayTSX, lang: 'tsx' }}
          highlightCode={highlightCode}
        >
          {GatewayReturn()}
        </TourSection>

        <TourSection
          flow={flowDirection()}
          mainCode={{ name: 'nsx', code: componentNSX }}
          altCode={{ name: 'tsx equivalent', code: componentTSX, lang: 'tsx' }}
          highlightCode={highlightCode}
        >
          {JSXComponent()}
        </TourSection>
      </CodeTour>

      {Style(css`
        .tour-copy h3 {
          margin-top: 0;
          margin-bottom: 0.75rem;
          font-size: clamp(1.5rem, 3.1vw, 2.35rem);
          line-height: 1.08;
          letter-spacing: -0.02em;
          color: var(--vp-c-text-1);
        }

        .tour-copy p {
          margin: 0 0 0.9rem;
          font-size: clamp(1rem, 1.25vw, 1.1rem);
          line-height: 1.7;
          color: var(--vp-c-text-2);
          max-width: 58ch;
        }

        .tour-copy p:not(.tour-note) {
          margin-bottom: 1.4rem;
          margin-top: .75rem;
        }

        .tour-copy p:last-child {
          margin-bottom: 0;
        }

        .tour-copy .tour-note {
          font-size: clamp(0.9rem, 0.95vw, 0.96rem);
        }
      `)}
    </>
  )
}


function AccessorVariables() {
  return <>
    <h3>Accessor variables</h3>
    <code>get variable = getter</code>
    <p>
      —scope-level, locally-bound, type-guard-aware counterpart to native accessor properties
    </p>
    <p class='tour-note'>
      <strong>Note:</strong> Reactivity depends on the getter implementation, which NextScript does not define. In this example, the getter implementation comes from Luent's <code>ion()</code>.
    </p>
    <a href='/guide/getter-syntax' class='medium brand'>Learn more</a>
  </>
}

const accessorNS =
  `get count = ion(initial)
get qty = ion(0, {
  increment() { qty++ },
  decrement() { qty-- }
})
get total = ion(() => count * qty)

`

const accesorTS =
  `const count = ion(initial)
const qty = ion(0, {
  increment() { qty.value++ },
  decrement() { qty.value-- }
})
const total = ion(() => count() * qty())

`


function DerivationExpressions() {
  return <>
    <h3>Derivation expressions</h3>
    <code>(expression)@</code>
    <p>
      —derivation-first shorthand for derivational arrow function expressions
    </p>
    <p class='tour-note'>
      <strong>Note:</strong> This example assumes a conservative JSX to JavaScript transpilation strategy that maps tag bindings directly to object properties. NextScript itself transpiles only to TypeScript and JSX. It does not define how TypeScript and JSX are ultimately transpiled to JavaScript.
    </p>
    <a href='/guide/getter-syntax#derivation-expressions' class='medium brand'>Learn more</a>
  </>
}

const derivationNSX =
  `<button 
  on:click={() => count++} 
  disabled={(count === limit)@}
>
  +
</button>

`

const derivationTSX =
  `<button 
  on:click={() => count.value++} 
  disabled={() => count() === limit}
>
  +
</button>

`



function FlowExpressions() {
  return <>
    <h3>JSX flow expressions</h3>
    <code>{`{Fn(...args, <tag/>)}`}</code>
    <p>
      —view control flow with implicit JSX fragment factories
    </p>
    <a href='/guide/jsx-syntax' class='medium brand'>Learn more</a>
  </>
}

const flowNSX =
  `<section>
  {If(inStock,
    <span class='status'>In stock</span>
    <button on:click={addToCart}>Buy</button>
  )}
  {Else(
    <span class='status'>Sold out</span>
  )}
</section>


`


const flowTSX =
  `<section>
  {If(inStock, () =>
    <>
      <span class='status'>In stock</span>
      <button on:click={addToCart}>Buy</button>
    </>
  )}
  {Else(() =>
    <span class='status'>Sold out</span>
  )}
</section>`



function GatewayReturn() {
  return <>
    <h3>JSX gateway return</h3>
    <code>{'() => {'} <i>statements;</i> {'<:/>'} <i>jsx</i> {'}'}</code>
    <p>
      —shorthand JSX fragment return statements
    </p>
    <a href='/guide/jsx-syntax#jsx-gateway' class='medium brand'>Learn more</a>
  </>
}

const gatewayNSX =
  `<article>
  {For(sections, section => {
    const highlight = HighlighterKit(section)
    <:/>
    <section>
      <h2 class={highlight}>{section.title}</h2>
      <p>{section.body}</p>
    </section>
    <hr/>
  })}
</article>



`

const gatewayTSX =
  `<article>
  {For(sections, section => {
    const highlight = HighlighterKit(section)
    return (
      <>
        <section>
          <h2 class={highlight}>{section.title}</h2>
          <p>{section.body}</p>
        </section>
        <hr/>
      </>
    )
  })}
</article>
`


function JSXComponent() {
  return <>
    <h3>JSX component</h3>
    <code>{'<::'} as={<i>component</i>}{'>'}<i>jsx</i>{'</::>'}</code>
    | <code>{'<::>'}<i>jsx</i>{'</::>'}</code>
    <p>
      —auto-returned component with component instance type information
    </p>
    <a href='' class='medium brand'>Learn more</a>
  </>
}
const componentNSX =
  `function Dialog({ Slot }: { Slot: RenderSlot }) {
  get opened = ion(false)
  const dialog = {
    open() { opened = true },
    close() { opened = false }
  }

  <:: as={dialog}>  
    {If(opened@, 
      <o--body>
        <div>{Slot()}</div>
      </o--body>
    )}
  </::>
}



`

const componentTSX =
  `function Dialog({ Slot }: { Slot: RenderSlot }) {
  const opened = ion(false)
  const dialog = {
    open() { opened = true },
    close() { opened = false }
  }

  return JSXComponent({
    slot: <>
      {If(opened, 
        <o--body>
          <div>{Slot()}</div>
        </o--body>
      )}
    </>,
    as: dialog
  }) 
}
`




const gatewayNsx =
  `<div>
  {If(folder, <:>
    {If(open,
      <ul>
        {For(folder.items, item =>
          <li>{item}</li>
        )}
      </ul>
    )}
  )}
</div>


`

const gatewayTranspiled =
  `<div>
  {If(folder, () =>
    <>
      {If(open, () =>
        <ul>
          {For(folder!.items, item =>
            <li>{item}</li>
          )}
        </ul>
      )}
    </>
  )}
</div>
`