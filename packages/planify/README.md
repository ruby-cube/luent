#### [goto: src](https://github.com/ruby-cube/rue/tree/main/packages/planify)
[@rue](https://github.com/ruby-cube/rue#goto-src)  &nbsp;&nbsp;|&nbsp; &nbsp;  **planify**  &nbsp;&nbsp;|&nbsp; &nbsp; [thread](https://github.com/ruby-cube/rue/tree/main/packages/thread#goto-src)  &nbsp;&nbsp;|&nbsp; &nbsp; [pecherie](https://github.com/ruby-cube/rue/tree/main/packages/pecherie#goto-src)  &nbsp;&nbsp;|&nbsp; &nbsp; [archer](https://github.com/ruby-cube/rue/tree/main/packages/archer#goto-src)
# Planify 🪶

<aside>
⚠️ <b>Experimental:</b> Planify is a work-in-progress, not well-tested nor optimized, with a volatile API. Look and play, but definitely don’t use…
</aside>
<br/>
<br/>

## Overview & Motivation

Event-driven programming enables loose-coupling, proper delegation of responsibilities, and extensibility, improving maintainability of complex applications. However, memory leaks and stale callbacks are an inevitable concern when it comes to event subscription, and while many event systems do provide methods of cleanup, the ones I’ve encountered have felt somewhat cumbersome and unintuitive to me. 

Performance is another potential concern when it comes to event-driven architecture. When an emitter emits too broadly, listeners are forced to filter out the majority of triggered events in order to respond to the event that is applicable to their particular instance. That is potentially a lot of extraneous function calls.

This project is the result of an exploration into how an event system might include a developer-friendly cleanup interface for better memory leak prevention as well as a method of targeted listening for better performance. 

Since Planify represents the overarching event system, this README presents more of a discussion of foundational concepts within the system rather than practical API usage. Because Planify is primarily a supporting dependency for other libraries, many examples will reference the APIs of other Rue libraries such as [Thread](https://github.com/ruby-cube/rue/tree/main/packages/thread#goto-src), [Pêcherie](https://github.com/ruby-cube/rue/tree/main/packages/pecherie#goto-src), and [Archer](https://github.com/ruby-cube/rue/tree/main/packages/archer#goto-src). 

<br/>

## Installation

```bash
(coming soon ...)
```
</br>

## Table of Contents

- [Concepts](https://github.com/ruby-cube/rue/tree/main/packages/planify#concepts)
    - [Event vs Hook vs Message vs Scheduling](https://github.com/ruby-cube/rue/tree/main/packages/planify#event-vs-hook-vs-message-vs-scheduling)
    - [One-time Listener vs Sustained Listener](https://github.com/ruby-cube/rue/tree/main/packages/planify#one-time-listener-vs-sustained-listener)
    - [Listener Morphing](https://github.com/ruby-cube/rue/tree/main/packages/planify#listener-morphing)
    - [Schedulers](https://github.com/ruby-cube/rue/tree/main/packages/planify#schedulers)
    - [Synchronous vs Asynchronous Handling](https://github.com/ruby-cube/rue/tree/main/packages/planify#synchronous-vs-asynchronous-handling)
- [Memory Leak Prevention](https://github.com/ruby-cube/rue/tree/main/packages/planify#memory-leak-prevention)
    - [Cleanup Strategies](https://github.com/ruby-cube/rue/tree/main/packages/planify#cleanup-strategies)
        - [Auto-cleanup](https://github.com/ruby-cube/rue/tree/main/packages/planify#auto-cleanup)
        - [Options argument](https://github.com/ruby-cube/rue/tree/main/packages/planify#the-options-argument)
        - [Stop/Cancel](https://github.com/ruby-cube/rue/tree/main/packages/planify#the-stopcancel-method)
        - [Scene Auto-cleanup](https://github.com/ruby-cube/rue/tree/main/packages/planify#scene-auto-cleanup)
    - [Memory Leak Warnings](https://github.com/ruby-cube/rue/tree/main/packages/planify#memory-leak-warnings)
- [Targeted Listeners](https://github.com/ruby-cube/rue/tree/main/packages/planify#targeted-listeners)
- [The APIs](https://github.com/ruby-cube/rue/tree/main/packages/planify#the-apis)
- [Planify API](https://github.com/ruby-cube/rue/tree/main/packages/planify#planify-api)
- [Planned Features](https://github.com/ruby-cube/rue/tree/main/packages/planify#planned-features)
- [Known Issues](https://github.com/ruby-cube/rue/tree/main/packages/planify#known-issues)
<br/>

## Concepts

In browser and Node.js API, the word “listener” refers to the callback function passed into the `addListener` function. This to me is a misnomer and it pains me to follow this convention. For clarity, this is how terms are used within the Planify system:

```jsx
// Event: "mousedown"

onMouseDown(document, () => {}, { until: onDestroyed })
    |           |          |             |   
targeted     target     callback       options
listener
```

```jsx
// Hook: "table-populated"

onTablePopulated((context) => { context.dataset })
    |                        |
listener                  callback

castTablePopulated({ dataset });
  |                 |
emitter     context, data, or event object
```
<br/>

### Event vs Hook vs Message vs Scheduling

Planify supports four distinct categories of asynchronous progamming:

- user events
- application events & process hooks
- messages/commands
- scheduling callbacks

These Rue libraries address the corresponding categories:
- [**Thread**](https://github.com/ruby-cube/rue/tree/main/packages/thread#goto-src): user events & scheduling callbacks
- [**Pêcherie**](https://github.com/ruby-cube/rue/tree/main/packages/pecherie#goto-src): application events & process hooks
- [**Archer**](https://github.com/ruby-cube/rue/tree/main/packages/archer#goto-src): messages/commands

The example listeners in this README (usually prefixed with "on" or "before") represent listeners created via one of the above libraries.

<br/>

### One-time listener vs Sustained listener

There are two main types of listeners: one-time listeners and sustained listeners. As their names suggest, one-time listeners will listen once (i.e. the handler will run once) and the sustained listeners will continue to listen so long as the listener remains active (i.e. the handler will run every time the event or hook is emitted).

**Sustained listeners** return an `ActiveListener` object. This object has a single `stop` method, which can be called to stop the listener.

```jsx
const mouseMoveListener = 
    onMouseMove(document, () => { 
        // do work 
    });

onMouseUp(document, () => {
    mouseMoveListener.stop();
});
```

**One-time listeners** return a `PendingOp` object, which is a cancellable `Promise`. If canceled, the handler will never run.

```jsx
const pendingOp = onTextInserted(() => {
    // do work
    return result;
});

onActionCanceled(() => {
    pendingOp.cancel();
});

const result = await pendingOp;
```

Note: The `cancel` method will not survive a `.then` chain. This is by design. Since the return of a `.then` chain is too easily mistaken for the return of the first call rather than the last call of the chain, it is preferred to save the `PendingOp` to a variable before chaining or awaiting if you need to call the cancel method.

<br/>

### Listener Morphing

A one-time listener can be turned into a sustained listener and vice-versa via the options parameter. The listener’s type definition will indicate whether it returns a `PendingOp` (as a one-time listener) or an `ActiveListener` (as a sustained listener). 
Besides listener morphing, the options parameter is useful for marking listeners as one-time or sustained explicitly in the code.

```jsx
onTextInserted(() => {   // sustained listener
    // do work
}, { sustained: true });

onTextInserted(() => {   // one-time listener
    // do work
}, { once: true });

onTextInserted(() => {   // sustained listener
    // do work
}, { until: onActionCanceled });

onTextInserted(() => {   // one-time listener
    // do work
}, { unlessCanceled: onActionCanceled });
```

Listeners can also morph from their default depending on the usage context. For example, if a listener is being passed into another listener as a cleanup scheduler as is the case with `onActionCanceled` above, it will behave as a one-time listener even if it is a `SustainedListener`.

<br/>

### Schedulers

Schedulers are one-time listeners that cannot be converted into a sustained listeners. These are typically functions that queue a task to the main thread such as: `queueTask`, `beforeScreenPaint` (planified `requestAnimationFrame`), and `onTimeout` (planified `setTimeout`). See [Thread](https://github.com/ruby-cube/rue/tree/main/packages/thread#goto-src) for more on existing schedulers.

<br/>

### Synchronous vs Asynchronous Handling

Handlers are called synchronously at the time of event emission. This allows for “before event” hooks as well as the possibility of handlers communicating back to the source of the event (see [`reply`](https://github.com/ruby-cube/rue/tree/main/packages/pecherie#hook-configuration)). 

If asynchronous handling is needed, the developer can call an async scheduler or one-time listener from within the handler. In the example below, the synchonous handler calls the `addPS` scheduler (an alias for `queueMicrotask`) for asynchronous handling.

```tsx
onPopulated(() => addPS(() => {
    // do something
}))
```

Alternatively, when using [Pêcherie](https://github.com/ruby-cube/rue/tree/main/packages/pecherie#goto-src) hooks, omit the callback function and options parameter to queue a microtask after an event is emitted via a promise:

```tsx
onPopulated()
    .then(() => { 
        // do something
    })

/* or */

await onPopulated();
// do something
```
<br/>

## Memory Leak Prevention

Planify prevents memory leaks via three main approaches:

- by making handler cleanup more developer-friendly
- by logging warnings during development if a cleanup strategy is not in place
- with Typescript errors during development
<br/>

### Cleanup Strategies

Planify provides four main cleanup strategies:
<br/>

#### Auto-cleanup

One-time listeners enjoy automatic cleanup inherently. Sustained listeners can also enjoy automatic cleanup if initialized within a scope for which auto-cleanup has been defined. To enable auto-cleanup, define an auto-cleanup function before initializing an app:

```tsx
// main.ts

defineAutoCleanup((cleanup) => { // callback receives a cleanup function as the argument
    if (isSettingUpComponent()) {
        return onUnmounted(cleanup); // must return a PendingOp
    }
    if (isMakingModel()) {
        return onDestroyed(cleanup); // must return a PendingOp
    }
})

const app = createApp(App);
app.mount('#app');
```

```jsx
// App.vue

export default defineComponent({
    setup(){
        onPopulated(() => {  // auto-cleanup when component unmounts
            // do work
        })
    }
})
```
Note: The `onUnmounted` lifecycle hook in the example above is not the original hook provided by Vue; it is a planified version provided by Paravue. The planified version must be used to ensure auto-cleanup of auto-cleanup by returning a `PendingOp`. See [Planify API](https://github.com/ruby-cube/rue/tree/main/packages/planify#planify-api) for how to planify existing hooks.

<br/>

#### The options argument

Specify when to stop/cancel a listener with the `until` / `unlessCanceled` property of the options argument.
    
```jsx
onPopulated(() => {
    // so much work...
}, { until: onDocClosed })    
```

```jsx
// if the listener requires additional parameters beyond the handler:

onPopulated(() => {
    // so much work...
}, { unlessCanceled: (cancel) => onTimeout(5000, cancel) }) 
```

```jsx
// NOT RECOMMENDED: using a non-planified listener 
// (requires verbosity and conscientious programming to prevent memory leaks)

onPopulated(() => {
    // so much work...
}, { until: (stop) => doc.addEventListener("blur", stop, { once: true }) }) 
```

**Note:** `stop` and `cancel` functions will only run once (if ever) and will be auto-cleaned-up if passed into a planified listener. If passed into a non-planified listener, the developer will be responsible for cleaning up the cleanup, resulting in cleanup hell. To avoid this, you can planify existing listeners/schedulers using the Planify API or create new planified listeners using the [Pêcherie API](https://github.com/ruby-cube/rue/tree/main/packages/pecherie#p-cherie-api).
    
**Important:** The cancellation scheduler (`onDocClosed` in the example below) must return a `PendingCancelOp` to ensure the cancel function is cleaned up once the handler is run. Typescript will safeguard against malformed cancellation schedulers by erroring:
    
```jsx
// GOOD:
onPopulated(() => {
    // do work...
}, { unlessCanceled: onDocClosed })

// GOOD, but unnecessarily verbose:
onPopulated(() => {
    // do work...
}, { unlessCanceled: (cancel) => onDocClosed(cancel) })

// BAD:
onPopulated(() => {
    // do work...
}, { unlessCanceled: (cancel) => { onDocClosed(cancel) } }) // returns void, Typescript will throw error

// GOOD, but unnecessarily verbose
onPopulated(() => {
    // do work...
}, { unlessCanceled: (cancel) => { return onDocClosed(cancel); } })
```
<br/>

#### The stop/cancel method

Stop a listener by calling the stop method on an `ActiveListener`; cancel a pending op by calling the cancel method on a `PendingOp`.
    
```jsx
// stop an active listener

const mouseMoveListener = 
    onMouseMove(document, () => { 
        // do work 
    });

onMouseUp(document, () => {
    mouseMoveListener.stop();
})
```
<br/>

#### Scene Auto-Cleanup

Manage the lifetime of listeners by creating an impromptu listener scope, a “scene”, with  `beginScene`
    
```js
// SFC script
import { beginScene } from "@rue/planify"

// create a 'dragging' scene
function initDrag(event){
    const el = event.target;
    
    beginScene((dragging) => { // callback runs synchronously
        
        onMouseEnter(el, () => {
            // do work
        });
 
        onMouseLeave(el, () => {
            // do work
        });

        onMouseMove(document, () => {
            // do work
        });

        onMouseUp(document, () => {
            // do work
            dragging.end();  // stops all listeners registered during scene
        });
    });
}
```

```html
<!-- SFC template -->
<div @mousedown="initDrag">item</div>
```
    
The `Scene` object can alternatively be accessed from outside the scene:

```jsx
// This example doesn't represent a good use case; will replace with better example if I think of one...

function initDrag(event){
    const el = event.target;

    const dragging = 
        beginScene(() => {

            onMouseEnter(el, () => {
                // do work
            });
 
            onMouseLeave(el, () => {
                // do work
            });

            onMouseMove(document, () => {
                // do work
            });
        });

    onMouseUp(document, () => {
        // do work
        dragging.end();  // stops all listeners registered during scene
    }, { once: true } );
}
```
<br/>

### Memory Leak Warnings

Unless the developer is impeccably conscientious about cleanup, memory leaks will inevitably creep into your system when using event listeners. As an additional guard against memory leaks, Planify will log a warning during development if it does not detect a cleanup strategy in place for a listener. 

<br/>

## Targeted Listeners

Sometimes it is better for performance to target a particular instance when communicating via emitters. For this reason, [Pêcherie](https://github.com/ruby-cube/rue/tree/main/packages/pecherie#goto-src) and [Archer](https://github.com/ruby-cube/rue/tree/main/packages/archer#goto-src) provide targeted listeners. Targeted listeners take in a targetID, which can be any type, so long as the emitter module and listener module agree on what to use as an identifier. 

```tsx
// using an object as the targetID with Archer API

// shared dependency
const HIDE_ITEM = defineMessage({
    message: "hide-item",
    targetID: $type as Object 
});

// listener module
heed(HIDE_ITEM, item, () => {
    // mutate local state to hide the item
});

// emitter module
send(HIDE_ITEM, { to: item });
```

If you would like to generate a deterministic string ID, Planify provides a simple ID generator that generates an ID based on a base id, optional prefixes, and an optional index.  

```tsx
// using a generated string ID

// listener module
import { genTargetID } from "@rue/planify";
import { heed } from "@rue/archer"

export default defineComponent({
    props: ["index", "item"],
    setup(props){
        const { item, index } = props;

        heed(HIDE_ITEM, genTargetID({
            id: item.id, // "item01"
            prefixes: ["Mirror", "InfoPanel"], 
            index: index // 9
        }), // "Mirror-InfoPanel_item01_9"
        () => {
            // mutate local state to hide the item
        });
    }
})

// emitter module
import { genTargetID } from "@rue/planify";
import { dispatch } from "@rue/archer"

const HIDE_ITEM = defineMessage({
    message: "hide-item",
    targetID: $type as string 
});

function workHard(item, index){
    // do work
        
    send(HIDE_ITEM, {
       to: genTargetID({
          id: item.id, 
          prefixes: ["Mirror", "InfoPanel"], 
          index
       }), // "Mirror-InfoPanel_item01_9"
    });
}
```
<br/>

## The APIs

[`$listen(handler, options, config)`](https://github.com/ruby-cube/rue/tree/main/packages/planify#listenhandler-options-config)

[`$schedule(handler, options, config)`](https://github.com/ruby-cube/rue/tree/main/packages/planify#schedulehandler-options-config)

[`$subscribe(handler, options, config)`](https://github.com/ruby-cube/rue/tree/main/packages/planify#subscribehandler-options-config)

[`beginScene(sceneDef)`](https://github.com/ruby-cube/rue/tree/main/packages/planify#scene-auto-cleanup) (Scene API)

[`defineAutoCleanup(cleanupFn)`](https://github.com/ruby-cube/rue/tree/main/packages/planify#auto-cleanup) (Auto Cleanup API)

[`genTargetID(config)`](https://github.com/ruby-cube/rue/tree/main/packages/planify#targeted-listeners) (Target ID API)

<br/>

## Planify API

The functions provided by [Pêcherie](https://github.com/ruby-cube/rue/tree/main/packages/pecherie#goto-src), [Archer](https://github.com/ruby-cube/rue/tree/main/packages/archer#goto-src), [Thread](https://github.com/ruby-cube/rue/tree/main/packages/thread#goto-src), and [Paravue](https://github.com/ruby-cube/rue/tree/main/packages/paravue#goto-src) should cover most use cases. However, if you would like to planify an existing listener or scheduler, Planify provides the `$listen`, `$schedule`, and `$subscribe` functions to acheive this.

<br/>

### `$listen(handler, options, config)`
Sets up a listener. Depending on options and config, this could behave as a one-time listener or a sustained listener.

#### Syntax
```tsx
const activeListener = $listen(handler, options, config)
        |                        |         |        |
 PendingOp | ActiveListener   Handler      |   ListenerConfig
                                     ListenerOptions
```

#### Type Definitions
```tsx
type ListenerConfig = {
    enroll: (handler) => void, 
    remove: (handlerOrReturnVal) => void, 
    onceAsDefault?: true | undefined
}
```
<br/>

### `$schedule(handler, options, config)`
Sets up a one-time listener.

#### Syntax
```tsx
const pendingOp = $schedule(handler, options, config)
           |                  |         |        |
      PendingOp            Handler      |   SchedulerConfig
                                  ListenerOptions
```

#### Type Definitions
```tsx
type SchedulerConfig = {
    enroll: (handler) => void, 
    remove: (handlerOrReturnVal) => void, 
}

type PendingOp = Promise<ReturnType<Handler>> & { cancel: () => void }
```
<br/>

### `$subscribe(handler, options, config)`
Sets up a sustained listener.

#### Syntax
```tsx
const activeListener = $subscribe(handler, options, config)
           |                        |         |        |
        ActiveListener            Handler     |   SubscribeConfig
                                       ListenerOptions
```

#### Type Definitions
```tsx
type SubscribeConfig = {
    enroll: (handler) => void, 
    remove: (handlerOrReturnVal) => void, 
}

type ActiveListener = { stop: () => void }
```
<br/>

### Basic Usage

The `enroll` and `remove` functions must define how a handler is registered and removed. Both functions are passed a wrapped handler (`cb` in the example). Note that you must pass the listener and remover the *wrapped handler*, not the original handler. If, for example, you would like to planify an Node.js EventEmitter event, you might write something like this:
```tsx
// planifying a Node EventEmitter listener

export function onDataReceived(handler, options?) {
    return $listen(handler, options, {
        enroll(cb) {
            eventEmitter.on('data-received', cb); // pass in `cb`, not `handler`
        },
        remove(cb) {
            eventEmitter.off('data-received', cb);  // pass in `cb`, not `handler`
        }
    });
}
```
If the `enroll` function returns something other than `void`, the return value will be passed to the remove function instead of the wrapped handler.
```tsx
// planifying a setTimeout

export function onTimeout(delay, handler, options?) {
    return $schedule(handler, options, {
        enroll(cb) {
            return setTimeout(cb, delay);
        },
        remove: clearTimeout
    });
}
```
<br/>

### Advanced Usage

To provide better developer experience for users of the listener/scheduler, use Typescript generics so that `$listen` and `$schedule` return the appropriate type based on the callback and options passed into it.

```tsx
// planifying Vue's `watch`

type Watch = typeof watch;

export function onChange<
CB extends Parameters<Watch>[1], 
OPT extends ListenerOptions & WatchOptions,
>(target: Parameters<Watch>[0], handler: CB, options?: OPT) {

    return $listen(handler, options, {
        enroll(cb) {
            return watch(target, cb, options);
        },
        remove(unwatch) {
            unwatch();
        }
    });
}
```

```tsx
// planifying `requestAnimationFrame`

export function beforeScreenPaint<
CB extends Callback,
OPT extends ListenerOptions
>(handler: CB, options?: OPT) {

    return $schedule(handler, options, {
        enroll: requestAnimationFrame,
        remove: cancelAnimationFrame
    });
}
```
<br/>

## Planned Features

Event-driven code is notoriously difficult to debug. Additional support for easing the debugging experience is in the works.

<br/>

## Known Issues

- [ ]  `dataAsArg` blocks VSCode’s Intellisense when configuring the creation of a hook or message. A work-around (for until I fix this) is to temporarily comment out the `dataAsArg: true` option when you want to access Intellisense.
    
    ```jsx
    // The issue:
    const [castPopulated, _onPopulated] = createHook({
        hook: "populated",
        data: $type as Data[],
        dataAsArg: true,
        // Intellisense (via CTRL+SPACE) fails to show rest of the options :(
    });
    ```
    ```jsx
    // Temporary fix
    const [castPopulated, _onPopulated] = createHook({
        hook: "populated",
        data: $type as Data[],
        // dataAsArg: true,
        // Intellisense can now show the rest of the options
    });
    ```

<br/>
<br/>

[[top]](https://github.com/ruby-cube/rue/tree/main/packages/planify#goto-src)

© 2023 - present [Ruby Y Wang](https://github.com/ruby-cube)
