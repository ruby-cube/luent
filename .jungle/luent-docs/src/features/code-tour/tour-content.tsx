import { Else, If, type FromTag, type Ion, type RenderTag } from 'luent'
import { $CodeTab } from '@luent/websites-shared'
import type { CodeTab, TourSection } from './types';


export function toID(heading: string) {
  return heading.toLowerCase().replaceAll(' ', '-')
}

const FunctionalComponents: TourSection = {
  heading: 'Functional components',
  Description() {
    return <>
      Write components as render functions that run once to create a view. Views are composed using JSX and updated through fine-grained reactivity.
    </>
  },
  Note() {
    return <>
      <small>
        <strong>Upcoming language alternative:</strong> <a href=''>NextScript (.nsx)</a> is an extension of TypeScript + JSX that offers improvements in ergonomics and type-safety. Preview the syntax with the language toggle.
      </small>
    </>
  },
  tab: $CodeTab(),
  url: '/guide/anatomy-of-an-app'
}

FunctionalComponents.tsx =
  `function EmojiCollection(setup: FromTag<{
  limit: number;
  getEmoji: () => string
}>) {
  const { limit, getEmoji } = setup;

  const emojis = ionic(['🍀', '🍄', '✨'])

  return <>
    <ul class='collection'>
      {For(emojis, emoji =>
        <Chip>{emoji}</Chip>
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
  limit: number;
  getEmoji: () => string
}>) {
  const { limit, getEmoji } = setup;

  const emojis = ionic(['🍀', '🍄', '✨'])

  <:>
    <ul class='collection'>
      {For(emojis, emoji :>
        <Chip>{emoji}</Chip>
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


const UnifiedReactivity: TourSection = {
  heading: 'Unified reactivity',
  Description() {
    return <>
      Manage simple, derived, async, and structured reactive state under a unified reactivity model through the primitives <code>ion()</code> and <code>ionic()</code>.
    </>
  },
  Note(setup: FromTag<{ tab: CodeTab }>) {
    const { $tab } = setup
    return <>
      <small>
        {If(() => $tab() === 'main',
          <>
            Note that the <code>$</code> prefix is a naming convention for state accessor functions and/or wrapper objects, not a reactivity marker. Reactivity exists independently of this convention.
          </>
        )}
        {Else(
          <>
            Note that, in NextScript (NSX), the <code>get</code> keyword declares accessor variables. It does not serve as a reactivity marker. The syntax exists independently of reactivity and vice versa.
          </>
        )}
      </small>
    </>
  },
  tab: $CodeTab(),
  url: '/guide/anatomy-of-an-app'
}

UnifiedReactivity.ns =
  `// atomic
get count = ion(0);

get qty = ion(1, {
  increment() { qty++ },
  decrement() { qty-- }
});

// derived
get total = ion(() => count * qty);

// async
get posts = ion([], { '-fetch': fetchRecentPosts });

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

// async
const $posts = ion([], { '-fetch': fetchRecentPosts });

// structured
const menu = ionic(['apples', 'peaches', 'pears']);

const position = ionic({ x: 0, y: 0 })

const user = ionic(new User())

`




const TypeExplicit: TourSection = {
  heading: 'Type-explicit reactivity',
  Description() {
    return <>
      Distinguish reactive variables from plain variables through type information. Hover variables in the example to inspect their types.
    </>
  },
  tab: $CodeTab(),
  url: '/guide/anatomy-of-an-app'
}



TypeExplicit.nsHover = {
  count: 'const count: number',
  total: 'get total: Ion<number>',
  total_1: 'get total: Ion<number>',
  qty: 'get qty: Ion<number>',
  list: 'const list: Ionic<List>',
  item: '(parameter) item: Item',
  item_1: '(parameter) item: Item',
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
  item: '(parameter) item: Item',
  item_1: '(parameter) item: Item',
}

TypeExplicit.nsx =
  `/* excerpts from function body */

get total = ion(() => count * qty);

// ---

<:>
  {For(list, item :> 
    <li>{item}</li>
  )}
  <div>{total@}</div>
</:>

`

TypeExplicit.tsx =
  `/* excerpts from function body */

const $total = ion(() => count * $qty())

// ---

return <>
  {For(list, item => 
    <li>{item}</li>
  )}
  <div>{$total}</div>
</>

`


const SelectiveReactivity: TourSection = {
  heading: 'Selective reactivity',
  Description() {
    return <>
      Apply reactivity where it matters. Selective reactivity reduces unnecessary performance overhead and offers clarity and control over what gets re-rendered.
    </>
  },
  Note() {
    return <>
      <small>
        <strong>Upcoming language alternative:</strong> <a href=''>NextScript (.nsx)</a> is an extension of TypeScript + JSX that offers improvements in ergonomics and type-safety. Preview the syntax with the language toggle.
      </small>
    </>
  },
  tab: $CodeTab(),
  url: '/guide/anatomy-of-an-app'
}

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
    <a href='/guide/accessor-syntax#derivation-expressions' class='medium brand'>Learn more</a>
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
  {If(selectedUser@, user :>
    <--->
    const { profile } = UserProfileKit(user.id)
    <--->
    <aside class="profile-card">
      <h3>{user.name}</h3>
      <p>{profile.bio}</p>
    </aside>
  })}
</section>

`

DynamicViewSetup.tsx =
  `<section>
  {If($selectedUser, user => {
    const { profile } = UserProfileKit(user.id)
    return (
      <aside class="profile-card">
        <h3>{user.name}</h3>
        <p>{profile.bio}</p>
      </aside>
    )
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

function Powerset(setup: FromTag<{
  'mu:powers': Ionic<string[]> & { addRandomPower(): void }
  limit: number,
}>) {
  const { mu: { powers }, limit } = setup;
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
  `{If($editing,
  <input
    type="text"
    at:mount={node => node.focus()}
    mu:value={$of(todo).title}
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
      Preserve the UI state and DOM nodes of temporarily hidden views with the <code>{'<o:preserve>'}</code> orbital tag or the <code>preserve</code> directive. Discard with <code>view.markDiscard()</code> when the view is no longer needed or state needs to be refreshed.
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

export const tourSections: TourSection[] = [
  FunctionalComponents,
  UnifiedReactivity,
  TypeExplicit,
  SelectiveReactivity,
  // ReusableLogic,
  // FlowExpressions,
  // DynamicViewSetup,
  // MutationSafety,
  // LifecycleHooks,
  // Portals,
  // ContextBindings,
  // ViewPreservation
]