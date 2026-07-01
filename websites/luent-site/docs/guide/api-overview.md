# Luent APIs

:::warning <span style='margin-right: .5rem'>🚧</span> UNDER CONSTRUCTION 
The <u>API</u> reference is still being written. In the meantime, here is a quick reference of Luent's APIs
:::

## App rendering
Apps, or interactive islands, may be rendered on the client or on the server.
#### Client-side
- `mount()` to mount an interactive island
#### Server-side
- `writeIslands()` [experimental] to transform HTML to include auto-hydrating islands

## Reactivity
- `ion()` to create simple and derived reactive state
- `ionic()` to create structured reactive state
- `ionize()` to create an ion of an ionic structure
- `track()` to link effect to ions
- `trackEffect()` to track an ionic effect
- `Finitron()` to create finite reactive state

## Context binding
- `FromTag` to type tag bindings
- `fromContext()` to access a binding from nearest providing context node
- `fromRoot()` to access a binding from root
- `fromGround()` to access a global binding
- `provideRoot()` to provide a binding from root of app
- `provideGround()` to provide a global binding
- `ContextKey()` to create a context binding key
- `mergeKeys()` to merge multiple keys into one
- `RootService()` to define a root binding that exists only if used
- `GroundService()` to define a ground binding that exists only if used

#### Context tags
- `<o:context>` to provide context bindings
- `<o—root>` to provide root bindings
- `<o—ground>` to provide global bindings

## Binding namespaces
- `on:` for event handlers
- `onv:` for event capture handlers
- `mu:` for mutable bindings
- `r:` for accessor method bindings
- `Slot:` for named slots
- `xray:` for nested bindings

## Special tag bindings
- `microclass` for utility classes
- `auto-bind` for forwarded bindings
- `ref` for node access
- `node` [experimental] for pre-existing DOM nodes

## Flow functions
Flow functions are called within JSX to direct the control flow of view rendering.
- `If`/`ElseIf`/`Else`
- `Match`/`Case`/`Default`
- `As`/`Default`
- `For`/`Empty`
- `Thru`
- `Await`/`Meanwhile`/`Catch`
- `Try`/`Catch`

## Orbital tags
Orbital tags represent nodes that scope rendering behavior without rendering additional wrapper elements.
- `<o:context>`
- `<o:preserve>`
- `<o:transition>`
- `<o--portal>`

## Built-in portals
- `<o—-window>`
- `<o—-document>`
- `<o--html>`
- `<o--head>`
- `<o--body>`
- `<o—-root>`
- `<o—-ground>`

## Teleported meta tags
- `<o-link>` to create and attach a `<link>` element to the document head
- `<o-style>` to create and attach a `<style>` element to the document head

## Node access
- `component()` to expose a component instance
- `NodeRef()` to create a node accessor
- `DOMNode()` [experimental] to create a DOM node 

## Async rendering
- `Suspense()` to batch async state
- `Lazy()` to create a lazy loaded component or render function
- `Dispatch()` to create async actions
- `dispatch()` for async updates

## Render cycle phases
- `atPrelude()` before update is rendered to DOM
* `atRender()` for DOM manipulation tasks
* `atLayout()` for DOM layout reading tasks
* `atTick()` after update is painted to the DOM
* `before` lifecycle hook prefix for before render phase
* `at` lifecycle hook prefix for render phase
* `after` lifecycle hook prefix for tick phase

## Lifecycle hooks
Lifecycle hooks register tasks to be run at certain points of a dynamic view's lifecycle. There are `before`, `at`, and `after` lifecycle hooks, which correspond to render cycle phases.
- `atAttach()` at mount and remount
- `atDetach()` at unmount and demount
- `atMount()` at initial mount only
- `atUnmount()` at final unmount only
- `atRemount()` at restored mount
- `atDemount()` at temporary unmount

## Batch cleanup
- `Scene()` to batch subscriptions cleanup
- `scene.atEnd()` to run task at end of scene or effect
- `scene.end()` to end a scene


## Types
- `Ion`
- `Ionic`
- `Ionized`
- `MutableIon`
- `RenderSlot`
- `Xray`

## Event handling
- `event.from()` to check where event originated
- `listen()` for one-time, transient, or abortable event handling

## Debugging
- `debug.log()`
- `debug.trace()` for tracing effects
- `debug.error()`
- `debug.warn()`
- `debug.logAtoms()`
- `debug.logCompounds()`