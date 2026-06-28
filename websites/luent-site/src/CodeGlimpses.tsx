import { css, For, Style } from '@rue/luent'
import { Code, CodeTour, TourSection } from '@rue/websites-shared'
import { highlightCode } from './highlighter'
import { TOOLTIP_CONFIG } from '@rue/luent-ui'
import { TourNav } from './TourNav'
import { AnyObject } from 'packages/types'

let direction = 'code-right'
function flowDirection() {
  if (direction === 'code-right') return direction = 'code-left'
  return direction = 'code-right'
}

function toId(heading: string) {
  return heading.toLowerCase().replaceAll(' ', '-')
}

const sections: {
  (): any,
  heading: string,
  nsx?: string,
  tsx?: string,
  ns?: string,
  ts?: string,
  nsHover?: {[key: string]: string},
  tsHover?: {[key: string]: string},
}[] = [
    FunctionalComponents,
    UnifiedReactivity,
    TypeExplicit,
    SelectiveReactivity,
    ReusableLogic,
    FlowExpressions,
    DynamicViewSetup,
    MutationSafety,
    LifecycleHooks,
    Portals,
    ContextBindings,
    ViewPreservation
  ]

export function CodeGlimpses() {

  return (
    <>
      <TourNav headings={sections.map(section => ({
        text: section.heading,
        id: toId(section.heading)
      }))}></TourNav>
      <CodeTour>
        {For(sections, (render) => {
          const jsx = 'nsx' in render
          const ns = jsx ? 'nsx' : 'ns'
          const ts = jsx ? 'tsx' : 'ts'
          const heading = render.heading
          return <TourSection
            id={toId(heading)}
            flow={flowDirection()}
            mainCode={{ name: ns, code: render[ns], hover: render.nsHover }}
            altCode={{ name: ts, code: render[ts], lang: ts, hover: render.tsHover }}
            highlightCode={highlightCode}
          >
            <h3>{heading}</h3>
            {render()}
          </TourSection>
        })}
        {/* 
        <TourSection
          flow={flowDirection()}
          mainCode={{ name: 'ns', code: UnifiedReactivity.ns }}
          altCode={{ name: 'ts', code: UnifiedReactivity.ts, lang: 'ts' }}
          highlightCode={highlightCode}
        >
          {UnifiedReactivity()}
        </TourSection>

        <TourSection
          flow={flowDirection()}
          mainCode={{ name: 'nsx', code: TypeExplicit.nsx }}
          altCode={{ name: 'tsx', code: TypeExplicit.tsx, lang: 'tsx' }}
          highlightCode={highlightCode}
        >
          {TypeExplicit()}
        </TourSection>

        <TourSection
          flow={flowDirection()}
          mainCode={{ name: 'nsx', code: SelectiveReactivity.nsx }}
          altCode={{ name: 'tsx', code: SelectiveReactivity.tsx, lang: 'tsx' }}
          highlightCode={highlightCode}
        >
          {SelectiveReactivity()}
        </TourSection>

        <TourSection
          flow={flowDirection()}
          mainCode={{ name: 'ns', code: ReusableLogic.ns }}
          altCode={{ name: 'ts', code: ReusableLogic.ts, lang: 'ts' }}
          highlightCode={highlightCode}
        >
          {ReusableLogic()}
        </TourSection>

        <TourSection
          flow={flowDirection()}
          mainCode={{ name: 'nsx', code: flowNSX }}
          altCode={{ name: 'tsx', code: flowTSX, lang: 'tsx' }}
          highlightCode={highlightCode}
        >
          {FlowExpressions()}
        </TourSection>

        <TourSection
          flow={flowDirection()}
          mainCode={{ name: 'nsx', code: DynamicViewSetup.nsx }}
          altCode={{ name: 'tsx', code: DynamicViewSetup.tsx, lang: 'tsx' }}
          highlightCode={highlightCode}
        >
          {DynamicViewSetup()}
        </TourSection>

        <TourSection
          flow={flowDirection()}
          mainCode={{ name: 'nsx', code: MutationSafety.nsx }}
          altCode={{ name: 'tsx', code: MutationSafety.tsx, lang: 'tsx' }}
          highlightCode={highlightCode}
        >
          {MutationSafety()}
        </TourSection>

        <TourSection
          flow={flowDirection()}
          mainCode={{ name: 'nsx', code: LifecycleHooks.nsx }}
          altCode={{ name: 'tsx', code: LifecycleHooks.tsx, lang: 'tsx' }}
          highlightCode={highlightCode}
        >
          {LifecycleHooks()}
        </TourSection>

        <TourSection
          flow={flowDirection()}
          mainCode={{ name: 'nsx', code: Portals.nsx }}
          altCode={{ name: 'tsx', code: Portals.tsx, lang: 'tsx' }}
          highlightCode={highlightCode}
        >
          {Portals()}
        </TourSection>

        <TourSection
          flow={flowDirection()}
          mainCode={{ name: 'nsx', code: ContextBindings.nsx }}
          altCode={{ name: 'tsx', code: ContextBindings.tsx, lang: 'tsx' }}
          highlightCode={highlightCode}
        >
          {ContextBindings()}
        </TourSection>

        <TourSection
          flow={flowDirection()}
          mainCode={{ name: 'nsx', code: ViewPreservation.nsx }}
          altCode={{ name: 'tsx', code: ViewPreservation.tsx, lang: 'tsx' }}
          highlightCode={highlightCode}
        >
          {ViewPreservation()}
        </TourSection> */}

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


FunctionalComponents.heading = 'Functional components'

function FunctionalComponents() {
  return <>
    <p style='text-wrap: balance'>
      Write components as render functions that run once to create a view. Views are composed using JSX or NSX and updated through fine-grained reactivity.
    </p>
    <a href='/guide/getter-syntax' class='medium brand'>Learn more</a>
  </>
}


FunctionalComponents.nsx =
  `function Counter() {
  get count = ion(0)

  <:>
    <button on:click={() => count++}>
      {count@}
    </button>

    <o-style>
      button {
        border: 1px solid gray;
        background-color: transparent;
      }
    </o-style>
  </:>
}

mount(Counter, '#app')

`

FunctionalComponents.tsx =
  `function Counter() {
  const $count = ion(0)

  return (
    <button on:click={() => count++}>
      {$count}
    </button>
  )
}

mount(Counter, '#app')

`

UnifiedReactivity.heading = 'Unified reactivity'
function UnifiedReactivity() {
  return <>
    <p>
      Manage simple, derived, and structured reactive state under a unified reactivity model. Reactive state is initialized through the primitives <code>ion()</code> and <code>ionic()</code>.
    </p>
    <a href='/guide/getter-syntax#derivation-expressions' class='medium brand'>Learn more</a>
  </>
}

UnifiedReactivity.ns =
  `// atomic
get count = ion(0);

get qty = ion(1, {
  increment() { qty++ },
  decrement() { qty-- },
});

// derived
get total = ion(() => count * qty);

// structured
const menu = ionic(['apples', 'peaches', 'pears']);

const position = ionic({ x: 0, y: 0 })

const user = ionic(new User())
`

UnifiedReactivity.ts =
  `const $count = ion(0);
const $total = ion(() => $count() * qty);
const list = ionic(['apples', 'peaches', 'pears']);

// TS examples use a $-prefix naming convention for accessor functions
`
ReusableLogic.heading = 'Reusable logic'
function ReusableLogic() {
  return <>
    <p style='text-wrap: balance'>
      Compose reusable logic independently of views. Define domain models with JavaScript classes and encapsulate stateful systems in destructurable kits—headless counterparts to components.
    </p>
    <a href='/guide/getter-syntax#derivation-expressions' class='medium brand'>Learn more</a>
  </>
}

ReusableLogic.ns =
  `function PointerInfoKit(position: Ionic<Pointer>) {
  get distance = ion(() =>
    Math.sqrt(position.x ** 2 + position.y ** 2)
  )

  get quadrant = ion(() => {
    if (position.x >= 0 && position.y >= 0) return 'I'
    if (position.x < 0 && position.y >= 0) return 'II'
    if (position.x < 0 && position.y < 0) return 'III'
    return 'IV'
})

  return { distance@, quadrant@ }
}

// ---

const pointer = ionic(new Pointer())

const { distance@, quadrant@ } = PointerInfoKit(pointer)
`

ReusableLogic.ts =
  `const $count = ion(0);
const $total = ion(() => $count() * qty);
const list = ionic(['apples', 'peaches', 'pears']);

// TS examples use a $-prefix naming convention for accessor functions
`
TypeExplicit.heading = 'Type-explicit reactivity'

function TypeExplicit() {
  // const { tooltip, setTooltipTrigger } = TooltipKit({
  //   info: { text: 'this is info' }
  // })
  return <>
    {/* <o:context provide={TOOLTIP_CONFIG({ delay: 500, hideDelay: 500 })}>
      <h3 before:mount={setTooltipTrigger.text}>Type-explicit reactivity</h3>
      <HoverInfo info={tooltip} placement='above' align='start'>
        {tooltip.info}
      </HoverInfo>
    </o:context> */}
    <p style='text-wrap: balance'>
      Distinguish reactive variables from plain variables through type information. Hover variables in the example to inspect their types.
    </p>
    <a href='/guide/getter-syntax#derivation-expressions' class='medium brand'>Learn more</a>
  </>
}


TypeExplicit.nsHover = {
  count: '(parameter) count: number',
  total: 'get total: Ion<number>',
  qty: 'get qty: Ion<number>',
}

TypeExplicit.tsHover = {
  count: '(parameter) count: number',
  $total: 'const $total: Ion<number>',
  $qty: 'const $qty: Ion<number>',
}

TypeExplicit.nsx =
  `get total = ion(() => count * qty)

<:>
  <div>{total@}</div>
  {For(list, item => 
    <li>{item}</li>
  )}
</:>

`

TypeExplicit.tsx =
  `const $total = ion(() => count * $qty())

<:>
  <div>{$total}</div>
  {For(list, item => 
    <li>{item}</li>
  )}
</:>
`
SelectiveReactivity.heading = 'Selective reactivity'
function SelectiveReactivity() {
  return <>
    <p>
      Apply reactivity where it matters. Selective reactivity reduces unnecessary performance overhead and offers clarity and control over what gets re-rendered.
    </p>
    <a href='/guide/getter-syntax#derivation-expressions' class='medium brand'>Learn more</a>
  </>
}

SelectiveReactivity.nsx =
  `function CartItem(setup: {
  name: string;
  price: number;
  qty: Ion<number>;
}) {
  const { name, price, qty@ } = fromTag(setup);

  <:>
    <li>
      <span class='item-name'>{name}</span>
      <span class='price'>{price} × {qty@}</span>
      <span class='total'>= {(price * qty)@}</span>
    </li>

    <o-link href='/cart-item.css' rel='stylesheet'/>
  </:>
}

`

SelectiveReactivity.tsx =
  `function CartItem(setup: {
  name: string;
  price: number;
  qty: Ion<number>;
}) {
  const { name, price, qty@ } = fromTag(setup);

  const item = ionic({
    selected: false,
    notes: ionic([]),
    meta: {
      sku: 'apple-01',
      taxable: true,
    } as const
  })

  get total = ion(() => price * qty)

  <:>
    {/* ... */}
  </:>
}
`

FlowExpressions.heading = 'View control flow'

function FlowExpressions() {
  return <>
    <p>
      Describe the control flow of dynamic views through flow functions such as <code>If</code>/<code>Else</code>, <code>For</code>/<code>Empty</code>, and <code>Await</code>/<code>Meanwhile</code>.
      {/* Control flow functions such as <code>If</code>/<code>Else</code>, <code>For</code>/<code>Empty</code>, and <code>Await</code>/<code>Meanwhile</code> create and manage dynamic views. */}
    </p>
    <a href='/guide/jsx-syntax' class='medium brand'>Learn more</a>
  </>
}

FlowExpressions.nsx =
  `<section>
  {If(online@,
    <span class="status">Online</span>
    <button on:click={sendMessage}>Send message</button>
  )}
  {Else(
    <span class="status">Offline</span>
  )}
</section>


`


FlowExpressions.tsx =
  `<section>
  {If($online,
    <>
      <span class="status">Online</span>
      <button on:click={sendMessage}>Send message</button>
    </>
  )}
  {Else(
    <span class="status">Offline</span>
  )}
</section>`






DynamicViewSetup.heading = 'Dynamic view setup'

function DynamicViewSetup() {
  return <>
    <p>
      Dynamic view logic may be set up locally, eliminating the need for premature component extraction. Resources are initialized and discarded alongside the view. Complexity is introduced only when needed. Logic is colocated where it is used.
    </p>
    <a href='' class='medium brand'>Learn more</a>
  </>
}
DynamicViewSetup.nsx =
  `<section>
  {If(selectedUser@, user => {
    const { profile@ } = UserProfileKit(user.id)
    <:/>
    <aside class="profile-card">
      <h3>{user.name}</h3>
      <p>{profile.bio}</p>
    </aside>
  })}
</section>



`

DynamicViewSetup.tsx =
  `<section>
  {If(selectedUser@, user => {
    const { profile@ } = UserProfileKit(user.id)
    <:/>
    <aside class="profile-card">
      <h3>{user.name}</h3>
      <p>{profile.bio}</p>
    </aside>
  })}
</section>
`

MutationSafety.heading = 'Mutation safety'

function MutationSafety() {
  return <>
    <p>
      Compile-time mutation checking prevent hidden nonlocal mutations, while explicit mutable bindings enable safe, statically traceable cross-boundary mutations.
    </p>
    <a href='/guide/jsx-syntax#jsx-gateway' class='medium brand'>Learn more</a>
  </>
}

MutationSafety.nsx =
  `function EmojiQuest({ powers }) {
  const powerset = ionic(['🍀', '🍄', '✨'], {
    addRandomPower() {
      this.push(chooseRandom(powers))
    }
  })
  <:>
    <EmojiBoard powers={powerset}/>
    <Powerset mu:powers={powerset} limit={10}/>
  </:>
}

function Powerset(setup: {
  'mu:powers': Ionic<string[]> & { addRandomPower(): void }
  limit: number,
}) {
  const { mu, '-r': { powers }, limit } = fromTag(setup);
  <:>
    <div class='powerset-panel'>
      <Powers {powers}>
      <button
        disabled={() => powers.length === limit}
        on:click={() => mu.powers.addRandomPower()}
      >+</button>
    </div>
    <o--link href='/powerset.css' rel='stylesheet' />
  </:>
}`

MutationSafety.tsx =
  `function EmojiQuest({ powers }) {
  const powerset = ionic(['🍀', '🍄', '✨'], {
    addRandomPower() {
      this.push(chooseRandom(powers))
    }
  })
  return <>
    <EmojiBoard powers={powerset}/>
    <Powerset mu:powers={powerset} limit={10}/>
  </>
}

function Powerset(setup: {
  'mu:powers': Ionic<string[]> & { addRandomPower(): void }
  limit: number,
}) {
  const { mu, '-r': { powers }, limit } = fromTag(setup);
  return <>
    <div class='powerset-panel'>
      <Powers powers={powers}>
      <button
        disabled={() => powers.length === limit}
        on:click={() => mu.powers.addRandomPower()}
      >+</button>
    </div>
    <o--link href='/powerset.css' rel='stylesheet' />
  </>
}`

LifecycleHooks.heading = 'Inline lifecycle hooks'

function LifecycleHooks() {
  return <>
    <p>
      Lifecycle behavior specific to a view node may be declared inline through lifecycle bindings such as <code>at:mount</code> and <code>before:unmount</code>.
    </p>
    <a href='/guide/jsx-syntax#jsx-gateway' class='medium brand'>Learn more</a>
  </>
}

LifecycleHooks.nsx =
  `{If(editing@,
  <input
    type="text"
    at:mount={node => node.focus()}
    mu:value={todo.title@}
    on:blur={e => doneEdit(todo)}
  />
)}



`

LifecycleHooks.tsx =
  `{If(editing@,
  <input
    type="text"
    at:mount={node => node.focus()}
    mu:value={todo.title@}
    on:blur={e => doneEdit(todo)}
  />
)}
`

Portals.heading = 'Portals'

function Portals() {
  return <>
    <p>
      Visually distinctive portal tags make it clear which sections of the view are rendered elsewhere in the DOM. Declare metadata locally in components through head elements like <code>{'<o-link>'}</code> and <code>{'<o-style>'}</code>.
    </p>
    <a href='/guide/jsx-syntax#jsx-gateway' class='medium brand'>Learn more</a>
  </>
}

Portals.nsx =
  `<o--portal to='#sidebar'>
  <Preview document={document}/>
</o--portal>

<o--body>
  {If(show@, 
    <Modal content={content}/>
  )}
</o--body>

<o-link href='./style.css' rel='stylesheet'/>
`

Portals.tsx =
  `<o--portal to='#sidebar'>
  <Preview document={document}/>
</o--portal>

<o--body>
  {If($show, 
    <Modal content={content}/>
  )}
</o--body>

<o-link href='./style.css' rel='stylesheet'/>
`

ContextBindings.heading = 'Context bindings'

function ContextBindings() {
  return <>
    <p>
      Provide multiple context bindings in a single <code>{'<o:context>'}</code> tag to avoid excessive tag nesting. Provide from the root of an application locally with <code>{'<o--root>'}</code> or from reusable kits with <code>provideRoot()</code>. Merge context keys to provide the same binding across multiple decoupled components.
    </p>
    <a href='/guide/jsx-syntax#jsx-gateway' class='medium brand'>Learn more</a>
  </>
}

ContextBindings.nsx =
  `const THEME = mergeKeys(Main.THEME, Sidebar.THEME)

<o:context provide={[THEME(theme@), SETTINGS(settings)]}>
  <Main/>
  <Sidebar/>
</o:context>

//--

Sidebar.THEME = ContextKey<Ion<Theme>>('theme')
Sidebar.SETTINGS = ContextKey<Settings>('settings')

export function Sidebar() {
  get theme = fromContext(THEME)@;
  const settings = fromContext(SETTINGS);
  /* ... */
}
`

ContextBindings.tsx =
  `const THEME = mergeKeys(Main.THEME, Sidebar.THEME)

<o:context provide={[THEME($theme), SETTINGS(settings)]}>
  <Main/>
  <Sidebar/>
</o:context>

//--

Sidebar.THEME = ContextKey<Ion<Theme>>('theme')
Sidebar.SETTINGS = ContextKey<Settings>('settings')

export function Sidebar() {
  const $theme = $fromContext(THEME);
  const settings = fromContext(SETTINGS);
  /* ... */
}
`

ViewPreservation.heading = 'Preserved views'

function ViewPreservation() {
  return <>
    <p>
      Preserve the UI state and DOM nodes of temporarily hidden views with the <code>{'<o:preserve>'}</code> orbital tag or the <code>’preserve’</code> directive. Discard with <code>`view.markDiscard()`</code> when the view is no longer needed or state needs to be refreshed.
    </p>
    <a href='/guide/jsx-syntax#jsx-gateway' class='medium brand'>Learn more</a>
  </>
}

ViewPreservation.nsx =
  `<div>
  {If(showSidebar@, 'preserve',
    <Sidebar selected={tab@}/>
  )}
  <o:preserve>
    {As(tab@,
      <Editor content={tabNames[tab]} />
    )}
    {Default(
      <p>No tabs open</p>
    )}
  </o:preserve>
</div>
`

ViewPreservation.tsx =
  `<div>
  {If($showSidebar, 'preserve',
    <Sidebar selected={$tab}/>
  )}
  <o:preserve>
    {As($tab,
      <Editor content={tabNames[$tab()]} />
    )}
    {Default(
      <p>No tabs open</p>
    )}
  </o:preserve>
</div>
`
