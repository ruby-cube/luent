import { component, createRoot, css, Style } from '@rue/luent'
import { Code } from './Code'
import { codeHtml, renderCodeToHtml, toHtml } from './code-utils'

const accessorNsx =
  `get count = ion(initial)
get qty = ion(0, {
  increment() { qty++ },
  decrement() { qty-- }
})
get total = ion(() => count * qty)

`

const accessorTranspiled =
  `const count = ion(initial)
const qty = ion(0, {
  increment() { qty.value++ },
  decrement() { qty.value-- }
})
const total = ion(() => count() * qty())

`

const derivationNsx =
  `<button 
  on:click={() => count++} 
  disabled={(count === limit)@}
>
  +
</button>

`

const derivationTranspiled =
  `<button 
  on:click={() => count.value++} 
  disabled={() => count() === limit}
>
  +
</button>

`

const flowNsx =
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


const flowTranspiled =
  `<section>
  {If(inStock, () =>
    <>
      <span class='status'>In stock</span>
      <button on:click={addToCart}>Buy</button>
    </>
  )}
  {Else(() =>
    <>
      <span class='status'>Sold out</span>
    </>
  )}
</section>`


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

// const gatewayTranspiled =
//   `<div>
//   {If(folder, <:>
//     {If(open,
//       <ul>
//         {For(folder.items, item =>
//           <li>{item}</li>
//         )}
//       </ul>
//       <button on:click={addItem}>+</button>
//     )}
//   )}
// </div>

// `
// const gatewayTranspiled =
//   `<div>
//   {~If(folder, <:>
//     {~If(open, 
//       <ul>
//         {~For(folder.items, item =>
//           <li>{item}</li>
//         )}
//       </ul>
//       <button on:click={addItem}>+</button>
//     )}
//   )}
// </div>

// `

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

const gatewayReturn = 
`<article>
  {For(sections, section => {
    const highlight = HighlighterKit(section)
    <:>
    <section>
      <h2 class={highlight}>{section.title}</h2>
      <p>{section.body}</p>
    </section>
    <hr/>
  })}
</article>

`

const gatewayReturnTranspiled = 
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

const componentNsx =
  `function Dialog({ Slot }) {
  get opened = ion(false)
  const open = () => { opened = true }
  const close = () => { opened = false }

  <:component as={{ open, close }}>  
    {If(opened@, 
      <o--body>
        <div>{Slot()}</div>
      </o--body>
    )}
  </:component>
}



`

const componentTranspiled =
`function Dialog({ Slot }) {
  const opened = ion(false)
  const open = () => { opened = true }
  const close = () => { opened = false }

  return JSXComponent({
    Slot: <>
      {If(opened, 
        <o--body>
          <div>{Slot()}</div>
        </o--body>
      )}
    </>,
    as: { open, close }
  }) 
}
`

function HomeTour() {
  return component(
    <>
      <section class='home-tour'>
        <article class='tour-row code-right'>
          <div class='tour-copy'>
            <h3>Accessor variables</h3>
            <code>get variable = getter</code>
            <p>
              —scope-level, locally-bound, type-guard-aware counterpart to native accessor properties
            </p>
            <p class='tour-note'>
              <strong>Note:</strong> Reactivity depends on the getter implementation, which NextScript does not define. In this example, the getter implementation comes from Luent's <code>ion()</code>. Accessor variables are equally useful for non-reactive use cases, such as template refs.
            </p>
            <a href='' class='medium brand'>Learn more</a>
          </div>
          <div class='tour-code'>
            <Code
              trusted
              main={{ name: 'ns', code: accessorNsx }}
              alt={{ name: 'ts equivalent', code: accessorTranspiled, lang: 'ts' }}
              highlight={renderCodeToHtml}
            />
          </div>
        </article>

        <article class='tour-row code-left'>
          <div class='tour-copy'>
            <h3>Derivation expressions</h3>
            <code>(expression)@</code>
            <p>
              —derivation-first shorthand for derivational arrow function expressions
            </p>
            <p class='tour-note'>
              <strong>Note:</strong> This example assumes a conservative JSX to JavaScript transpilation strategy that maps tag bindings directly to object properties. NextScript itself transpiles only to TypeScript and JSX. It does not define how TypeScript and JSX are ultimately transpiled to JavaScript.
            </p>
            <a href='' class='medium brand'>Learn more</a>
          </div>
          <div class='tour-code'>
            <Code
              trusted
              main={{ name: 'nsx', code: derivationNsx }}
              alt={{ name: 'tsx equivalent', code: derivationTranspiled, lang: 'tsx' }}
              highlight={renderCodeToHtml}
            />
          </div>
        </article>

        <article class='tour-row code-right'>
          <div class='tour-copy'>
            <h3>JSX flow expressions</h3>
            <code>{`{Fn(...args, <tag/>)}`}</code>
            <p>
              —template control flow with implicit JSX fragment factories
            </p>
            <a href='' class='medium brand'>Learn more</a>
          </div>
          <div class='tour-code'>
            <Code
              trusted
              main={{ name: 'nsx', code: flowNsx }}
              alt={{ name: 'tsx equivalent', code: flowTranspiled, lang: 'tsx' }}
              highlight={renderCodeToHtml}
            />
          </div>
        </article>

        <article class='tour-row code-left'>
          <div class='tour-copy'>
            <h3>JSX gateway function</h3>
            <code>(parameters) &lt;:&gt; JSX</code> | <code>&lt;:&gt; JSX</code>
            <p>
              —shorthand for arrow functions that return a JSX fragment
            </p>
            <a href='' class='medium brand'>Learn more</a>
          </div>
          <div class='tour-code'>
            <Code
              trusted
              main={{ name: 'nsx', code: gatewayNsx }}
              alt={{ name: 'tsx equivalent', code: gatewayTranspiled, lang: 'tsx' }}
              highlight={renderCodeToHtml}
            />
          </div>
        </article>

        <article class='tour-row code-right'>
          <div class='tour-copy'>
            <h3>JSX gateway return</h3>
            <code>{'() => {'} <i>statements;</i> {'<:>'} <i>jsx</i> {'}'}</code>
            <p>
              —shorthand JSX fragment return statements
            </p>
            <a href='' class='medium brand'>Learn more</a>
          </div>
          <div class='tour-code'>
            <Code
              trusted
              main={{ name: 'nsx', code: gatewayReturn }}
              alt={{ name: 'tsx equivalent', code: gatewayReturnTranspiled, lang: 'tsx' }}
              highlight={renderCodeToHtml}
            />
          </div>
        </article>

        <article class='tour-row code-left'>
          <div class='tour-copy'>
            <h3>JSX component</h3>
            <code>{'<:component'} as={<i>component</i>}{'>'}<i>jsx</i>{'</:component>'}</code><br/>
            | <code>{'<:component>'}<i>jsx</i>{'</:component>'}</code>
            <p>
              —auto-returned component with component instance type information
            </p>
            <a href='' class='medium brand'>Learn more</a>
          </div>
          <div class='tour-code'>
            <Code
              trusted
              main={{ name: 'nsx', code: componentNsx }}
              alt={{ name: 'tsx equivalent', code: componentTranspiled, lang: 'tsx' }}
              highlight={renderCodeToHtml}
            />
          </div>
        </article>
      </section>

      {Style(css`
        .home-tour {
          display: grid;
          gap: clamp(4.9rem, 8.85vw, 8.1rem);
          width: 100%;
          max-width: 1120px;
          margin: clamp(3.7rem, 6.65vw, 6.4rem) auto 0;
        }

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

        .tour-copy {
          min-width: 0;
        }

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

        .tour-code {
          min-width: 0;
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

        @media (min-width: 960px) {
          .tour-row {
            grid-template-columns: minmax(240px, 0.9fr) minmax(0, 1.1fr);
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

export function loadHomeTour(mountTarget = '#home-tour-root') {
  const host = document.querySelector(mountTarget)
  if (!host) return
  host.innerHTML = ''
  createRoot(() => <HomeTour />).mount(mountTarget)
}
