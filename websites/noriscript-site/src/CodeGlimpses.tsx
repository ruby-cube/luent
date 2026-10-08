import { Bindings, css, MICROCLASS_MERGE, provideRoot, Style } from 'luent'
import { Code, CodeTour, TourSection } from '@luent/websites-shared'
import { highlightCode } from './highlighter'
import { twMerge } from 'tailwind-merge'

// let direction = 'code-right'
function flowDirection() {
  return 'code-left' as const
  // if (direction === 'code-right') return direction = 'code-left'
  // return direction = 'code-right'
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
          Note={AccessorVariables.Note}
          filename={AccessorVariables.filename}
        >
          {AccessorVariables()}
        </TourSection>

        <TourSection
          flow={flowDirection()}
          mainCode={{ name: 'nsx', code: derivationNSX }}
          altCode={{ name: 'tsx equivalent', code: derivationTSX, lang: 'tsx' }}
          highlightCode={highlightCode}
          Note={DerivationExpressions.Note}
          filename={DerivationExpressions.filename}
        >
          {DerivationExpressions()}
        </TourSection>

        <TourSection
          flow={flowDirection()}
          mainCode={{ name: 'nsx', code: fragmentNSX }}
          altCode={{ name: 'tsx equivalent', code: fragmentTSX, lang: 'tsx' }}
          highlightCode={highlightCode}
          filename={JSXFragmentReturn.filename}
        >
          {JSXFragmentReturn()}
        </TourSection>

        <TourSection
          flow={flowDirection()}
          mainCode={{ name: 'nsx', code: flowNSX }}
          altCode={{ name: 'tsx equivalent', code: flowTSX, lang: 'tsx' }}
          highlightCode={highlightCode}
          filename={FlowExpressions.filename}
        >
          {FlowExpressions()}
        </TourSection>

        <TourSection
          flow={flowDirection()}
          mainCode={{ name: 'nsx', code: gatewayFnNSX }}
          altCode={{ name: 'tsx equivalent', code: gatewayFnTSX, lang: 'tsx' }}
          highlightCode={highlightCode}
          filename={GatewayFunction.filename}
        >
          {GatewayFunction()}
        </TourSection>

        {/* <TourSection
          flow={flowDirection()}
          mainCode={{ name: 'nsx', code: styleNSX }}
          altCode={{ name: 'tsx equivalent', code: styleTSX, lang: 'tsx' }}
          highlightCode={highlightCode}
          filename={TaggedTemplateStyles.filename}
        >
          {TaggedTemplateStyles()}
        </TourSection> */}

        <TourSection
          flow={flowDirection()}
          mainCode={{ name: 'ns', code: typeguardNSX }}
          altCode={{ name: 'ts equivalent', code: typeguardTSX, lang: 'ts' }}
          highlightCode={highlightCode}
          filename={TypeGuards.filename}
        >
          {TypeGuards()}
        </TourSection>

        <TourSection
          flow={flowDirection()}
          mainCode={{ name: 'ns', code: ArgumentAnnotation.nsx }}
          altCode={{ name: 'ts equivalent', code: ArgumentAnnotation.tsx, lang: 'ts' }}
          highlightCode={highlightCode}
          filename={ArgumentAnnotation.filename}
        >
          {ArgumentAnnotation()}
        </TourSection>

        <TourSection
          flow={flowDirection()}
          mainCode={{ name: 'ns', code: StatementFences.nsx }}
          altCode={{ name: 'ts equivalent', code: StatementFences.tsx, lang: 'ts' }}
          highlightCode={highlightCode}
          filename={StatementFences.filename}
        >
          {StatementFences()}
        </TourSection>

        

      </CodeTour>

      {Style(css`
        // .tour-row {
        //   grid-template-columns: minmax(240px, 1fr) minmax(0, 1fr) !important;
        // }

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
          margin-block: 1.4rem;
        }

        .tour-copy p:last-child {
          margin-bottom: 0;
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
    {/* <a href='/guide/accessor-syntax' class='medium brand'>Learn more</a> */}
  </>
}

AccessorVariables.Note = (setup: Bindings<'p'>) => {
  const { ...rest } = setup
  return <>
    <p auto-bind={rest}>
      <strong>Note:</strong> Reactivity depends on the getter implementation, which NoriScript does not define. In this example, the getter implementation comes from Luent's <code>ion()</code>.
    </p>
  </>
}

AccessorVariables.filename = 'Total'

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
    {/* <a href='/guide/accessor-syntax#derivation-expressions' class='medium brand'>Learn more</a> */}
  </>
}

DerivationExpressions.Note = (setup: Bindings<'p'>) =>
  <p auto-bind={setup}>
    <strong>Note:</strong> This example assumes a conservative JSX to JavaScript transpilation strategy that maps tag bindings directly to object properties. NoriScript itself transpiles only to TypeScript and JSX. It does not define how TypeScript and JSX are ultimately transpiled to JavaScript.
  </p>

DerivationExpressions.filename = 'Counter'

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
    {/* <a href='/guide/jsx-syntax#jsx-flow-expressions' class='medium brand'>Learn more</a> */}
  </>
}

FlowExpressions.filename = 'Product'

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
  {If(inStock, () => <>
    <span class='status'>In stock</span>
    <button on:click={addToCart}>Buy</button>
  </>)}
  {Else(() =>
    <span class='status'>Sold out</span>
  )}
</section>`



function GatewayFunction() {
  return <>
    <h3>JSX flow gateway function</h3>
    <code><i>parameters</i> {':>'} <i>jsx</i></code>
    <p>
      —shorthand for an arrow function expression that returns a JSX fragment in flow expressions
    </p>
    {/* <a href='/guide/jsx-syntax#jsx-flow-gateway-function' class='medium brand'>Learn more</a> */}
  </>
}

GatewayFunction.filename = 'Article'

const gatewayFnNSX =
  `<article>
  {For(sections, section :>
    <section>
      <h2>{section.title}</h2>
      <p>{section.body}</p>
    </section>
    <hr/>
  )}
</article>
`

const gatewayFnTSX =
  `<article>
  {For(sections, section => <>
    <section>
      <h2>{section.title}</h2>
      <p>{section.body}</p>
    </section>
    <hr/>
  </>)}
</article>
`


function GatewayReturn() {
  return <>
    <h3>JSX gateway return</h3>
    <code>{'() => {'} <i>statements;</i> {'<:/>'} <i>jsx</i> {'}'}</code>
    <p>
      —shorthand JSX fragment return statements
    </p>
    {/* <a href='/guide/jsx-syntax#jsx-gateway' class='medium brand'>Learn more</a> */}
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
    return <>
      <section>
        <h2 class={highlight}>{section.title}</h2>
        <p>{section.body}</p>
      </section>
      <hr/>
    </>
  })}
</article>
`

function JSXFragmentReturn() {
  return <>
    <h3>JSX fragment return</h3>
    <code>{'<:>'}<i>jsx</i>{'</:>'}</code>
    <p>
      —auto-returned fragment
    </p>
    {/* <a href='/guide/jsx-syntax#jsx-fragment-return' class='medium brand'>Learn more</a> */}
  </>
}

JSXFragmentReturn.filename = 'Counter'


const fragmentNSX =
  `function Counter() {
  get count = ion(0);
  <:>
    <button on:click={() => count++}>
      {count@}
    </button>
  </:>
}
`

const fragmentTSX =
  `function Counter() {
  const $count = ion(0);
  return <>
    <button on:click={() => $count.value++}>
      {$count}
    </button>
  </>
}
`


function JSXComponent() {
  return <>
    <h3>JSX component</h3>
    <code>{'<::'} as={<i>component</i>}{'>'}<i>jsx</i>{'</::>'}</code>
    | <code>{'<::>'}<i>jsx</i>{'</::>'}</code>
    <p>
      —auto-returned component with component instance type information
    </p>
    {/* <a href='' class='medium brand'>Learn more</a> */}
  </>
}
const componentNSX =
  `function Dialog({ Slot }: { Slot: RenderTag }) {
  get opened = ion(false)
  const dialog = {
    open() { opened = true },
    close() { opened = false }
  }

  <:: as={dialog}>  
    {If(opened@, 
      <o--body>
        <div>
          <Slot/>
        </div>
      </o--body>
    )}
  </::>
}



`

const componentTSX =
  `function Dialog({ Slot }: { Slot: RenderTag }) {
  const opened = ion(false)
  const dialog = {
    open() { opened = true },
    close() { opened = false }
  }

  return JSXComponent({
    slot: <>
      {If(opened, 
        <o--body>
          <div>
            <Slot/>
          </div>
        </o--body>
      )}
    </>,
    as: dialog
  }) 
}
`



function TaggedTemplateStyles() {
  return <>
    <h3>Tagged template styles</h3>
    <code>{'<'}<i>node</i> {'style=`'}<i>css</i>{'`>'}</code> | <code>{'<style>'}<i>css</i>{'</style>'}</code>
    <p>
      —tagged template literals for style bindings and style tags
    </p>
    {/* <a href='/guide/jsx-syntax#jsx-style-tags' class='medium brand'>Learn more</a> */}
  </>
}

TaggedTemplateStyles.filename = 'Draggable'

const styleNSX =
  `<div style=\`
  z-index: \${(drag ? order(index) : 0)@};
  transform: \${(drag ? transform : undefined)@};
\`></div>

<style>
  .dragging {
    cursor: grabbing;
    box-shadow: -5px 0px 5px 0px rgba(0, 0, 0, 0.25);
  }
</style>
`

const styleTSX =
  `<div style={css\`
  z-index: \${() => drag() ? order(index) : 0};
  transform: \${() => drag() ? transform() : undefined)@};
\`}></div>

<style>{css\`
  .dragging {
    cursor: grabbing;
    box-shadow: -5px 0px 5px 0px rgba(0, 0, 0, 0.25);
  }
\`}</style>
`



function ArgumentAnnotation() {
  return <>
    <h3>Binding annotations</h3>
    <code>+<i>annot</i> <i>binding</i></code> | <code>+<i>annot</i>:<i>binding</i></code>
    <p>
      —syntax for attaching metadata, such as mutation capabilities, to bindings
    </p>
    {/* <p><small>* currently in development, not yet available</small></p> */}
    {/* <a href='/guide/mutation-safety' class='medium brand'>Learn more</a> */}
  </>
}

ArgumentAnnotation.filename = 'EmojiQuest'
ArgumentAnnotation.nsx =
  `function EmojiQuest({ powers }) {
  const powerset = ionic(['🍀', '🍄', '✨'], {
    addRandomPower() {
      this.push(chooseRandom(powers))
    }
  })
  <:>
    <EmojiBoard powers={powerset} />
    <Powerset mu:powers={powerset} limit={10} />
  </:>
}

function Powerset(setup: FromTag<{
  +mu:powers: Ionic<string[]> & { addRandomPower(): void }
  limit: number,
}>) {
  const { +mu:powers, limit } = setup;
  <:>
    <div class='powerset-panel'>
      <Powers {powers}>
      <button
        disabled={(powers.length === limit)@}
        on:click={() => powers.addRandomPower()}
      >+</button>
    </div>
    <o-link href='/powerset.css' rel='stylesheet' />
  </:>
} `

ArgumentAnnotation.tsx =
  `function EmojiQuest({ powers }) {
  const powerset = ionic(['🍀', '🍄', '✨'], {
    addRandomPower() {
      this.push(chooseRandom(powers))
    }
  })
  return <>
    <EmojiBoard powers={powerset} />
    <Powerset mu:powers={powerset} limit={10} />
  </>
}

function Powerset(setup: FromTag<{
  'mu:powers': Ionic<string[]> & { addRandomPower(): void }
  limit: number,
}>) {
  const { mu: { powers }, limit } = setup;
  return <>
    <div class='powerset-panel'>
      <Powers powers={powers}>
        <button
          disabled={() => powers.length === limit}
          on:click={() => powers.addRandomPower()}
        >+</button>
    </div>
    <o-link href='/powerset.css' rel='stylesheet' />
  </>
} `


function TypeGuards() {
  return <>
    <h3>Accessor variable type guards</h3>
    {/* e.g. <code>if(obj) {'{'} return obj.property {'}'}</code> */}
    <p>
      —type narrowing and widening of accessor variables
    </p>
    {/* <a href='/guide/accessor-syntax#type-guards' class='medium brand'>Learn more</a> */}
  </>
}

TypeGuards.filename = 'profile'

const typeguardNSX =
  `get user = ion(getUser())

function logUsername() {
  if (!user) return;
  log('username:' user.name)
}`

const typeguardTSX =
  `const user = ion(getUser())

function logUsername() {
  if (!user()) return;
  log('username:' user()!.name)
}`





function StatementFences() {
  return <>
    <h3>JSX statements fences</h3>
    <code>{'<--->'} <i>statement(s)</i> {'<--->'}</code>
    <p>
      —syntax for embedding JavaScript statements within a JSX block
    </p>
    {/* <a href='' class='medium brand'>Learn more</a> */}
  </>
}
StatementFences.filename = 'UserProfile'
StatementFences.nsx =
  `<section>
  {If(selectedUser@, user :>
    <--->
    const { profile } = UserProfileKit(user.id)
    <--->
    <aside class="profile-card">
      <h3>{user.name}</h3>
      <p>{profile.bio}</p>
    </aside>
  )}
</section>

`

StatementFences.tsx =
  `<section>
  {If($selectedUser, user => {
    const { profile } = UserProfileKit(user.id)
    return <>
      <aside class="profile-card">
        <h3>{user.name}</h3>
        <p>{profile.bio}</p>
      </aside>
    </>
  })}
</section>

`