# Luent APIs

:::warning <span style='margin-right: .5rem'>🚧</span> UNDER CONSTRUCTION 
The API reference is in the works. In the meantime, here is an overview of Luent's APIs
:::

## Island rendering
#### Client-side
- `mountIsland()` to mount an interactive island onto static HTML
#### Server-side
<!-- - `withIslands()` <span class='doc-tag'>Experimental</span> to transform HTML to include islands -->
- `writeIsland()` to write an island as static HTML

## Reactivity
#### Primary reactivity
- `ion()` to create simple and derived reactive state
- `ionic()` to create structured reactive state
- `observe()` to observe state changes in ions and react to those changes

#### Secondary reactivity
- `ionize()` to create an ion of an ionic structure (equivalent to `ion(ionic(x))`)
- `observeCall()` to observe a synchronous task and rerun it on change.
- `awaitsPrelude()` to observe a prelude-phase task and rerun it on change.
- `awaitsRender()` to observe a render-phase task and rerun it on change.
- `awaitsLayout()` to observe a layout-phase task and rerun it on change.
- `awaitsTick()` to observe a task scheduled for the upcoming render cycle tick and rerun it on change.
- `Finitron()` to create a finite reactive state machine
- `$of()` to access property ions from an ionic object

## Component bindings
- `FromTag` to provide type validation and annotations for tag bindings

#### Binding annotations
- `on:` for event handlers
- `onv:` for event capture handlers
- `mu:` for mutable bindings
- `m:` for nested method bindings
- `xray:` for nested bindings

#### Special tag bindings
- `microclass` for utility classes
- `auto-bind` for forwarded bindings
- `ref` for node access
<!-- - `node` <span class='doc-tag'>Experimental</span> for pre-existing DOM nodes -->

## Context bindings
- `fromContext()` to access a value from the nearest providing context node
- `fromContext$()` to access an ion from the nearest providing context node
- `ContextKey()` to create a context key for context bindings
- `mergeKeys()` to merge multiple keys into one
- `<o:context>` to provide context bindings


## Centralized bindings
- `fromRoot()` to access a value from an island root
- `fromGround()` to access a globally provided value
- `<o—-root>` to provide root bindings
- `<o—-ground>` to provide global bindings

#### Convenience factories
- `RootBinding()` to define a tree-wide value and create its accessor
- `GroundBinding()` to define a global value and create its accessor
<!-- - `RootService()` to define an tree-wide value that exists only if in use and create its accessor -->
<!-- - `GroundService()` to define a global value that exists only if in use and create its accessor -->


## View control flow
Control flow functions are called within JSX to direct the control flow of view rendering.
- `If`/`ElseIf`/`Else`
- `Match`/`Case`/`Default`
- `As`/`Default`
- `For`/`Empty`
- `Thru`
- `Await`/`Meanwhile`/`Twiddle`/`Catch`
- `Try`/`Catch`

## Orbital tags
Orbital tags represent nodes that scope rendering behavior without rendering additional wrapper elements.
- `<o:context>`
- `<o:preserve>`
- `<o:transition>`
- `<o--portal>`
- `<o—-root>`
- `<o—-ground>`

## Built-in portals
- `<o—-window>`
- `<o—-document>`
- `<o--html>`
- `<o--head>`
- `<o--body>`
- `<o—-host>`
- `<o—-root>`
- `<o—-ground>`

## Teleported meta tags
- `<o-link>` to create and attach a `<link>` element to the document head
- `<o-style>` to create and attach a `<style>` element to the document head

## Node access
- `expose()` to expose a component instance
- `NodeRef()` to create a node accessor
- `asJSX()` <span class='doc-tag'>Experimental</span> for declaring bindings on existing DOM nodes and/or rendering pre-created DOM nodes
<!-- - `DOMNode()` <span class='doc-tag'>Experimental</span> to create a DOM node  -->

## Async rendering
- `$Promised()` to create a promise ion that batches the promises of other fetched-state ions.
- `$Fetched()` to create an ion with asynchronously updated state
- `Dispatch()` to create async actions
- `LazyView()` to create a lazy loaded component or render function
<!-- - `Lax()` to create async updates -->
<!-- - `lax()` for async updates -->

## Async tasks
- `awaiting()` for awaiting promises without losing context
<!-- - `ooo` for async sequences that preserve context -->

## Render cycle phases
- `awaitPrelude` to queue a task for before update is rendered to DOM
- `awaitRender` for DOM manipulation tasks
- `awaitLayout` for DOM layout reading tasks
- `awaitTick` to schedule a task for after update is painted to the DOM
- `prelude` promise for prelude phase
- `render` promise for render phase
- `layout` promise for layout phase
- `tick` promise for tick phase

#### Lifecycle hook prefixes
- `before` lifecycle hook prefix for before render phase
- `at` lifecycle hook prefix for render phase
- `after` lifecycle hook prefix for tick phase

## View lifecycle hooks
Lifecycle hooks register tasks to be run at certain points of a dynamic view's lifecycle. There are `before`, `at`, and `after` lifecycle hooks, which correspond to render cycle phases.
- `atAttach()` at mount and remount
- `atDetach()` at unmount and demount
- `atMount()` at initial mount only
- `atUnmount()` at final unmount only
- `atRemount()` at restored mount
- `atDemount()` at temporary unmount


## Effect lifecycle hooks
- `atEnd()` to schedule tasks for the end of an event handler or reaction's effect lifespan


## Batch cleanup
- `Scene()` to create a cleanup batch
- `scene.atEnd()` to schedule tasks for the end of a scene
- `scene.end()` to end a scene


## Types
- `Ion`
- `Ionic`
- `Ionized`
- `MutableIon`
- `RenderTag`
- `Xray`

## Event handling
- `event.from()` to check where event originated
- `listen()` for transient event handling

## Debugging
<span class='doc-tag'>WIP</span>
- `debug.log()`
- `debug.trace()` for async traces across the reactivity pipeline
- `debug.error()`
- `debug.warn()`
- `debug.logAtoms()`
- `debug.logCompounds()`