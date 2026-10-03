import { atUnmount, css, Else, For, If, ion, Ion, NodeRef, Style } from 'luent'
import { Tooltip, TOOLTIP_CONFIG, TooltipContent, TooltipKit, TooltipRoot } from '@luent/luent-ui'
import { $CodeTab, Code, CodeTour, TourSection } from '@luent/websites-shared'
import { highlightCode } from './highlighter'
import { pad, TourNav } from './TourNav'

let direction = 'code-right'
function flowDirection() {
  return 'code-right';
  if (direction === 'code-right') return direction = 'code-left'
  return direction = 'code-right'
}

function toId(heading: string) {
  return heading.toLowerCase().replaceAll(' ', '-')
}

const sections: {
  (...args: any[]): any,
  heading: string,
  filename: string,
  nsx?: string,
  tsx?: string,
  ns?: string,
  ts?: string,
  $tab?: Ion<'main' | 'alt'> & { toggle: () => void },
  nsHover?: { [key: string]: string },
  tsHover?: { [key: string]: string },
}[] = [
    FunctionalComponents,
    UnifiedReactivity,
    TypeExplicit,
    SelectiveReactivity,
    FlowExpressions,
    ViewPreservation,
    DynamicViewSetup,
    MutationSafety,
    ReusableLogic,
    // LifecycleHooks,
    Portals
    // ContextBindings,
  ]

export function CodeGlimpses() {

  return (
    <>
      <div class='tour-grid'>
        <div class='tour-main'>
          <CodeTour>
            {For(sections, (render, index) => {
              const jsx = 'nsx' in render
              const ns = jsx ? 'nsx' : 'ns'
              const ts = jsx ? 'tsx' : 'ts'
              const heading = render.heading

              return <TourSection
                columnRatio={[0.9, 1.1]}
                filename={render.filename}
                id={toId(heading)}
                flow={flowDirection()}
                mainCode={{ name: ts, code: render[ts], lang: ts, hover: render.tsHover }}
                altCode={{
                  name: ns,
                  // TabName() {
                  //   const { tooltip, setTooltipTrigger } = TooltipKit({ info: { nsx: '' } })
                  //   console.log('TabName render')
                  //   atUnmount(() => 'unmounting TabName')
                  //   return <>
                  //     <o:context provide={[TOOLTIP_CONFIG({})]}>
                  //       {ns} <small at:mount={setTooltipTrigger.nsx} class='more-info'>(?)</small>
                  //       <o--body>
                  //         <TooltipRoot
                  //           tooltip={tooltip}>
                  //           <TooltipContent
                  //           // microclass={() => `${tooltip.above ? 'origin-bottom' : tooltip.below ? 'origin-top' : tooltip.left ? 'origin-right' : 'origin-left'} rounded-md px-3 py-1.5 text-xs bg-foreground text-background z-50 w-fit max-w-xs`}
                  //           // style='background-color: var(--vp-c-text-3); font-family: var(--vp-font-family-mono); font-weight: 600;'
                  //           >
                  //             <p class='ns-note'>
                  //               <small>
                  //                 NoriScript is an extension of TypeScript + JSX that offers improvements in ergonomics and type-safety. It is currently preview-only, not ready for use.
                  //               </small>
                  //             </p>
                  //           </TooltipContent>
                  //         </TooltipRoot>
                  //       </o--body>
                  //     </o:context>
                  //   </>
                  // },
                  code: render[ns], hover: render.nsHover
                }}
                highlightCode={highlightCode}
                tab={render.$tab ?? $CodeTab()}
              >
                <div class='section-num'>[ {pad(index + 1)} ]</div>
                <h3>{heading}</h3>
                {render(render.$tab)}
              </TourSection>
            })}
          </CodeTour>
        </div>
        <aside class='railwrap'>
          <TourNav
            headings={sections.map(section => ({
              text: section.heading,
              id: toId(section.heading)
            }))} />
        </aside>
      </div>

      {Style(css`
        .section-num {
          font-family: 'Fragment Mono', monospace;
          font-size: 12.5px;
          color: var(--vp-c-brand-3);
          margin-bottom: 18px
        }

        .code-container .more-info {
          color: var(--vp-c-brand-3);
          font-weight: bold;
        }

        .code-container .selected .more-info {
          color: transparent;
        }

        .ns-note {
          background-color: var(--vp-c-black); 
          color: var(--vp-c-white);
          margin-block: 2rem; 
          max-width: 36ch;
          line-height: 1rem;
          padding: 1rem;
          padding-right: .5rem;
          border-radius: 1rem;
          border: 1px solid var(--vp-c-divider);
        }

        .tour-grid {
          display: grid;
          grid-template-columns: minmax(0, 1fr) 88px;
          gap: 0;
          align-items: start;
        }

        .tour-main .home-tour {
          max-width: none;
          margin: 0;
        }

        .tour-main {
          min-width: 0;
          padding-right: 56px;
        }

        .railwrap {
          position: relative;
          border-left: 1px solid var(--vp-c-divider);
          padding-top: 2rem;
          min-height: 100%;
        }

        .tour-copy h3 {
          margin-top: 0;
          margin-bottom: 0.75rem;
          font-size: 26px;
          font-weight: 600;
          line-height: 1.2;
          letter-spacing: -0.015em;
          color: var(--vp-c-text-1);
        }

        .tour-copy p {
          margin: 0 0 0.9rem;
          font-size: 15.5px;
          line-height: 1.7;
          color: var(--vp-c-text-2);
          max-width: 40ch;
        }

        @media (max-width:900px) {
          .tour-copy p {
            max-width: 100%;
          }
        }

        .tour-copy p:not(.tour-note) {
          margin-bottom: 1.4rem;
          margin-top: .75rem;
        }

        .tour-copy p:last-child {
          margin-bottom: 0;
        }

        .tour-copy .tour-note {
          font-size: 13.5px;
        }

        @media (max-width: 900px) {
          .tour-grid {
            grid-template-columns: 1fr;
          }

          .tour-main {
            padding-right: 0;
          }

          .railwrap {
            display: none;
          }
        }
      `)}
    </>
  )
}


FunctionalComponents.heading = 'Functional components'

function FunctionalComponents($tab: Ion<'main' | 'alt'>) {
  return <>
    <p style='text-wrap: balance'>
      Write components as render functions that run once to create a view. Views are composed using JSX and updated through fine-grained reactivity.
    </p>
    {/* <a href='/guide/rendering-views' class='medium brand'>Learn more</a> */}
    {/* <p>
      Luent components may be written in <a href='https://www.typescriptlang.org/docs/handbook/jsx.html' target="_blank">TypeScript + JSX</a> (.tsx) or <a href='' target="_blank">NoriScript</a> (.ns/.nsx), an extension of TypeScript + JSX.
    </p> */}
  </>
}

FunctionalComponents.$tab = $CodeTab()
FunctionalComponents.filename = 'main'
FunctionalComponents.tsx =
  `function EmojiCollection(setup: FromTag<{
  limit?: number;
}>) {
  const { limit = 9 } = setup;

  const emojis = ionic(['🍀', '🍄', '✨'])

  return <>
    <ul class='collection'>
      {For(emojis, $emoji =>
        <Chip>{$emoji}</Chip>
      )}
    </ul>
    <button
      disabled={() => emojis.length === limit}
      on:click={() => emojis.push(getEmoji())}
    >add emoji</button>

    {Style(css\`
      .collection {
        display: flex;  
        flex-wrap: wrap;
      }
    \`)}
  </>
}

mountIsland(EmojiCollection, '#app')
`

FunctionalComponents.nsx =
  `function EmojiCollection(setup: FromTag<{
  limit?: number;
}>) {
  const { limit = 9 } = setup;

  const emojis = ionic(['🍀', '🍄', '✨'])

  <:>
    <ul class='collection'>
      {For(emojis, emoji@ :>
        <Chip>{emoji@}</Chip>
      )}
    </ul>
    <button
      disabled={(emojis.length === limit)@}
      on:click={() => emojis.push(getEmoji())}
    >add emoji</button>

    <o-style>
      .collection {
        display: flex;  
        flex-wrap: wrap;
      }
    </o-style>
  </:>
}

mountIsland(EmojiCollection, '#app')
`

UnifiedReactivity.heading = 'Unified reactivity'

UnifiedReactivity.$tab = $CodeTab()
function UnifiedReactivity($tab: Ion<'main' | 'alt'>) {
  return <>
    <p>
      Manage atomic, derived, and structured reactive state under a unified reactivity model using the primitives <code>ion()</code> and <code>ionic()</code>.
    </p>
    <p style='text-wrap: balance'>
      {If(() => $tab() === 'main',
        <>
          <strong>Note:</strong> The <code>$</code> prefix is a naming convention for state accessor functions and/or wrapper objects, not a reactivity marker. Reactivity exists independently of this convention.
        </>
      )}
      {Else(
        <>
          <strong>Note:</strong> In NoriScript (NSX), the <code>get</code> keyword declares accessor variables. It does not serve as a reactivity marker. The syntax exists independently of reactivity and vice versa.
        </>
      )}
    </p>
    {/* <a href='/guide/reactivity-in-depth' class='medium brand'>Learn more</a> */}
  </>
}

UnifiedReactivity.filename = 'examples'
UnifiedReactivity.ns =
  `// atomic
get count = ion(0);

get qty = ion(1, {
  increment() { qty++ },
  decrement() { qty-- }
});

// derived
get total = ion(() => count * qty);

// structured
const menu = ionic(['apples', 'peaches', 'pears']);

const position = ionic({ x: 0, y: 0 })

const user = ionic(new User())

`



UnifiedReactivity.ts =
  `// atomic
const $count = ion(0);

const $qty = ion(1, {
  increment() { $qty.value++ },
  decrement() { $qty.value-- }
});

// derived
const $total = ion(() => $count() * $qty());

// structured
const menu = ionic(['apples', 'peaches', 'pears']);

const position = ionic({ x: 0, y: 0 })

const user = ionic(new User())

`

TypeExplicit.heading = 'Type-explicit reactivity'

function TypeExplicit() {
  return <>
    <p style='text-wrap: balance'>
      Distinguish reactive variables from plain variables through type information. Hover/tap variables in the example to inspect their types.
    </p>
    {/* <a href='/guide/reactive-structures' class='medium brand'>Learn more</a> */}
  </>
}

TypeExplicit.nsHover = {
  count: 'const count: number',
  total: 'get total: Ion<number>',
  total_1: 'get total: Ion<number>',
  qty: 'get qty: Ion<number>',
  list: 'const list: Ionic<List>',
  item: '(@ parameter) item: Ion<Item>',
  item_1: '(@ parameter) item: Ion<Item>',
}
// [
//   ['count', 'const count: number'],
//   ['total', 'get total: Ion<number>'],
//   ['total', 'get total: Ion<number>'],
//   ['qty', 'get qty: Ion<number>'],
//   ['list', 'const list: Ionic<List>'],
//   ['item', '(parameter) item: Item'],
//   ['item', '(parameter) item: Item'],
// ]

TypeExplicit.tsHover = {
  count: 'const count: number',
  '$total': 'const $total: Ion<number>',
  '$total_1': 'const $total: Ion<number>',
  '$qty': 'const $qty: Ion<number>',
  list: 'const list: Ionic<List>',
  item: '(parameter) $item: Ion<Item>',
  item_1: '(parameter) $item: Ion<Item>',
}
TypeExplicit.filename = 'examples'
TypeExplicit.nsx =
  `get total = ion(() => count * qty);

// ---

{For(list, item@ :> 
  <li>{item@}</li>
)}
<div>{total@}</div>

`

TypeExplicit.tsx =
  `const $total = ion(() => count * $qty())

// ---

{For(list, $item => 
  <li>{$item}</li>
)}
<div>{$total}</div>

`
SelectiveReactivity.heading = 'Selective reactivity'

function SelectiveReactivity() {
  return <>
    <p>
      Apply reactivity where it matters. Selective reactivity reduces unnecessary performance overhead and offers clarity and control over what gets re-rendered.
    </p>
    {/* <a href='/guide/component-bindings' class='medium brand'>Learn more</a> */}
  </>
}
SelectiveReactivity.filename = 'CartItem'
SelectiveReactivity.nsx =
  `function CartItem(setup: FromTag<{
  name: string;
  price: number;
  qty: Ion<number>;
}>) {
  const { name, price, qty@ } = setup;

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
  `function CartItem(setup: FromTag<{
  name: string;
  price: number;
  qty: Ion<number>;
}>) {
  const { name, price, $qty } = setup;

  return <>
    <li>
      <span class='item-name'>{name}</span>
      <span class='price'>{price} × {$qty}</span>
      <span class='total'>= {() => price * $qty()}</span>
    </li>

    <o-link href='/cart-item.css' rel='stylesheet'/>
  </>
}

`


ReusableLogic.heading = 'Reusable logic'

function ReusableLogic() {
  return <>
    <p style='text-wrap: balance'>
      Compose reusable logic independently of views. Define domain models with JavaScript classes and encapsulate stateful systems in destructurable kits—headless counterparts to components.
    </p>
    {/* <a href='/guide/reusable-logic' class='medium brand'>Learn more</a> */}
  </>
}

ReusableLogic.filename = 'PointerInfoKit'
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
  `function PointerInfoKit(position: Ionic<Pointer>) {
  const $distance = ion(() =>
    Math.sqrt(position.x ** 2 + position.y ** 2)
  )

  const $quadrant = ion(() => {
    if (position.x >= 0 && position.y >= 0) return 'I'
    if (position.x < 0 && position.y >= 0) return 'II'
    if (position.x < 0 && position.y < 0) return 'III'
    return 'IV'
})

  return { $distance, $quadrant }
}

// ---

const pointer = ionic(new Pointer())

const { $distance, $quadrant } = PointerInfoKit(pointer)

`

FlowExpressions.heading = 'View control flow'

function FlowExpressions() {
  return <>
    <p>
      Describe the control flow of dynamic views through flow functions such as <code>If</code>/<code>Else</code>, <code>For</code>/<code>Empty</code>, and <code>Await</code>/<code>Meanwhile</code>.
      {/* Control flow functions such as <code>If</code>/<code>Else</code>, <code>For</code>/<code>Empty</code>, and <code>Await</code>/<code>Meanwhile</code> create and manage dynamic views. */}
    </p>
    {/* <a href='/guide/view-control-flow' class='medium brand'>Learn more</a> */}
  </>
}

FlowExpressions.filename = "ChatApp"
FlowExpressions.nsx =
  `<section>
  {If(online@,
    <span class="status">Online</span>
    <button on:click={sendMessage}>Send message</button>
  )}
  {Else(
    <span class="status">Offline</span>
  )}
</section>`


FlowExpressions.tsx =
  `<section>
  {If($online, <>
      <span class="status">Online</span>
      <button on:click={sendMessage}>Send message</button>
  </>)}
  {Else(
    <span class="status">Offline</span>
  )}
</section>`






DynamicViewSetup.heading = 'Colocation'

function DynamicViewSetup() {
  return <>
    <p>
      Variables and logic may be set up next to the portion of the view it applies to, eliminating the need for premature component extraction. Resources are initialized and discarded alongside dynamic views. Complexity is introduced only when needed. Logic is colocated where it is used.
    </p>
    {/* <a href='' class='medium brand'>Learn more</a> */}
  </>
}
DynamicViewSetup.filename = 'UserProfile'
DynamicViewSetup.nsx =
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

DynamicViewSetup.tsx =
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


MutationSafety.heading = 'Mutation safety'

function MutationSafety() {
    return <>
      <p>
        Compile-time mutation checking* prevent hidden nonlocal mutations, while explicit mutable bindings enable safer, statically traceable cross-boundary mutations.
      </p>
      <p><small>* currently in development, not yet available</small></p>
      {/* <a href='/guide/mutation-safety' class='medium brand'>Learn more</a> */}
    </>
  }

MutationSafety.filename = 'EmojiQuest'
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

function Powerset(setup: FromTag<{
  +mu:powers: Ionic<string[]> & { addRandomPower(): void }
  limit: number,
}>) {
  const { +mu:powers, limit } = setup;
  <:>
    <div class='powerset-panel'>
      <Powers {powers}>
      <button
        disabled={() => powers.length === limit}
        on:click={() => powers.addRandomPower()}
      >+</button>
    </div>
    <o-link href='/powerset.css' rel='stylesheet' />
  </:>
} `

MutationSafety.tsx =
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

LifecycleHooks.heading = 'Inline lifecycle hooks'

function LifecycleHooks() {
    return <>
      <p>
        Lifecycle behavior specific to a view node may be declared inline through lifecycle bindings such as <code>at:mount</code> and <code>before:unmount</code>.
      </p>
      {/* <a href='/guide/lifecycle-hooks' class='medium brand'>Learn more</a> */}
    </>
  }

LifecycleHooks.filename = 'Editor'
LifecycleHooks.nsx =
  `{
  If(editing@,
    <input
      type="text"
      at:mount={node => node.focus()}
      mu:value={todo.title@}
      on: blur = { e => doneEdit(todo) }
  />
)}

`

LifecycleHooks.tsx =
  `{
  If($editing,
    <input
      type="text"
      at:mount={node => node.focus()}
      mu:value={$$(todo).title}
      on:blur={e => doneEdit(todo)}
    />
  )
}

`

Portals.heading = 'Portals'

function Portals() {
    return <>
      <p>
        Visually distinctive portal tags make it clear which sections of the view are rendered elsewhere in the DOM. Declare metadata locally in components through head elements like <code>{'<o-link>'}</code> and <code>{'<o-style>'}</code>.
      </p>
      {/* <a href='/guide/portals' class='medium brand'>Learn more</a> */}
    </>
  }

Portals.filename = 'portal-examples'
Portals.nsx =
  `<o--portal to='#sidebar'>
  <Preview document={document} />
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
  <Preview document={document} />
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
        Provide multiple context bindings in a single <code>{'<o:context>'}</code> tag to avoid excessive tag nesting. Merge context keys to provide the same binding across multiple decoupled components.
      </p>
      {/* <a href='/guide/contextual-bindings' class='medium brand'>Learn more</a> */}
    </>
  }
// Provide from the root of an application locally with <code>{'<o--root>'}</code> or from reusable kits with <code>provideRoot()</code>. 

ContextBindings.filename = 'App'

ContextBindings.nsx =
  `import { Sidebar, type Theme } from './Sidebar';
import { Main } from './Main';

const THEME = mergeKeys(Main.THEME, Sidebar.THEME)
const SETTINGS = mergeKeys(Main.SETTINGS, Sidebar.SETTINGS)

function App() {
  get theme = ion('dark' as Theme);
  const settings = new Settings();
  <:>
    <o:context map={[THEME(theme@), SETTINGS(settings)]}>
      <Main />
      <Sidebar />
    </o:context>
  </:>
}

// --
// Sidebar.tsx

const THEME = Sidebar.THEME = ContextKey<Ion<Theme>>()
const SETTINGS = Sidebar.SETTINGS = ContextKey<Settings>()

export function Sidebar() {
  get theme = fromContext(THEME)@;
  const settings = fromContext(SETTINGS);
  /* ... */
}

`

ContextBindings.tsx =
  `import { Sidebar, type Theme } from './Sidebar';
import { Main } from './Main';

const THEME = mergeKeys(Main.THEME, Sidebar.THEME)
const SETTINGS = mergeKeys(Main.SETTINGS, Sidebar.SETTINGS)

function App() {
  const $theme = ion('dark' as Theme);
  const settings = new Settings();
  return <>
    <o:context map={[THEME($theme), SETTINGS(settings)]}>
      <Main />
      <Sidebar />
    </o:context>
  </>
}

// --
// Sidebar.tsx

const THEME = Sidebar.THEME = ContextKey<Ion<Theme>>()
const SETTINGS = Sidebar.SETTINGS = ContextKey<Settings>()

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
        Preserve the UI state and DOM nodes of temporarily hidden views with the <code>{'<o:preserve>'}</code> orbital tag or the <code>"preserve"</code> directive. Discard with <code>view.markDiscard()</code> when the view is no longer needed or state needs to be refreshed.
      </p>
      {/* <a href='/guide/preserving-views' class='medium brand'>Learn more</a> */}
    </>
  }

ViewPreservation.filename = 'App'
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
</div >

  `

ViewPreservation.tsx =
  `<div>
  {If($showSidebar, 'preserve',
    <Sidebar selected={$tab} />
  )}
<o:preserve>
  {As($tab,
    <Editor content={tabNames[$tab()]} />
  )}
  {Default(
    <p>No tabs open</p>
  )}
</o:preserve>
</div >

  `
