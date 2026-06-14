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

  <:: as={{ open, close }}>  
    {If(opened@, 
      <o--body>
        <div>{Slot()}</div>
      </o--body>
    )}
  </::>
}



`

const componentTranspiled =
`function Dialog({ Slot }) {
  const opened = ion(false)
  const open = () => { opened = true }
  const close = () => { opened = false }

  return JSXComponent({
    slot: <>
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
              <strong>Note:</strong> Reactivity depends on the getter implementation, which NextScript does not define. In this example, the getter implementation comes from Luent's <code>ion()</code>. 
            </p>
            <a href='/guide/getter-syntax' class='medium brand'>Learn more</a>
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
            <a href='/guide/getter-syntax#derivation-expressions'  class='medium brand'>Learn more</a>
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
            <a href='/guide/jsx-syntax'  class='medium brand'>Learn more</a>
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

        {/* <article class='tour-row code-left'>
          <div class='tour-copy'>
            <h3>JSX gateway function</h3>
            <code>(parameters) &lt;:&gt; JSX</code> | <code>&lt;:&gt; JSX</code>
            <p>
              —shorthand for arrow functions that return a JSX fragment
            </p>
            <a href='/guide/jsx-syntax#jsx-gateway-function'  class='medium brand'>Learn more</a>
          </div>
          <div class='tour-code'>
            <Code
              trusted
              main={{ name: 'nsx', code: gatewayNsx }}
              alt={{ name: 'tsx equivalent', code: gatewayTranspiled, lang: 'tsx' }}
              highlight={renderCodeToHtml}
            />
          </div>
        </article> */}

        <article class='tour-row code-left'>
          <div class='tour-copy'>
            <h3>JSX gateway return</h3>
            <code>{'() => {'} <i>statements;</i> {'<:>'} <i>jsx</i> {'}'}</code>
            <p>
              —shorthand JSX fragment return statements
            </p>
            <a href='/guide/jsx-syntax#jsx-gateway'   class='medium brand'>Learn more</a>
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

        <article class='tour-row code-right'>
          <div class='tour-copy'>
            <h3>JSX component</h3>
            <code>{'<::'} as={<i>component</i>}{'>'}<i>jsx</i>{'</::>'}</code>
            | <code>{'<::>'}<i>jsx</i>{'</::>'}</code>
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
    </>
  )
}

export function loadHomeTour(mountTarget = '#home-tour-root') {
  const host = document.querySelector(mountTarget)
  if (!host) return
  host.innerHTML = ''
  createRoot(() => <HomeTour />).mount(mountTarget)
}
