<nav><a id="readme-top" href="#"><b>goto: src</b></a></nav>

[@rue](https://github.com/ruby-cube/rue#readme-top)  &nbsp;&nbsp;|&nbsp; &nbsp;  **flask**  &nbsp;&nbsp;|&nbsp; &nbsp; [thread](https://github.com/ruby-cube/rue/tree/main/packages/thread#readme-top)  &nbsp;&nbsp;|&nbsp; &nbsp; [pecherie](https://github.com/ruby-cube/rue/tree/main/packages/pecherie#readme-top)  &nbsp;&nbsp;|&nbsp; &nbsp; [archer](https://github.com/ruby-cube/rue/tree/main/packages/archer#readme-top)
# Flask ⚗️

<aside>
⚠️ <b>Experimental:</b> Flask is a work-in-progress, not well-tested nor optimized, with a volatile API. Look and play, but definitely don’t use…
</aside>

<p align="right"><a href="#">[src]</a></p>

## Overview

Event-driven programming is a useful paradigm that enables loose-coupling, proper delegation of responsibilities, and extensibility of modules, overall improving application maintainability. However, memory leaks and bugs from lingering handlers are inevitably a concern when it comes to event listeners, as cleaning up subscriptions can be easily forgotten. Furthermore, messy cleanup can make code more cluttered and less readable.

Flask offers a developer-friendly event system where listeners and reactive effects are contained in “flasks” for easy cleanup, allowing application code to be more clean, readable, and less prone to memory leaks.

<p align="right"><a href="#">[src]</a></p>

## Inspiration & Motivation

This library is very much inspired by my experiences with [Vue.js](https://vuejs.org/) and its thoughtful design. The auto-cleanup of event listeners in Flask was inspired by Vue’s auto-cleanup of reactive effects. The concept of batching cleanup of reactive effects and nested effect scopes comes from [Anthony Fu’s `effectScope` Vue RFC proposal](https://github.com/vuejs/rfcs/blob/master/active-rfcs/0041-reactivity-effect-scope.md). Lastly, the idea of resuming effect scopes comes from [Jods’ Async Setup Vue RFC proposal](https://github.com/vuejs/rfcs/discussions/234#issuecomment-728955621).

<p align="right"><a href="#">[src]</a></p>

## Table of Contents

<aside>
⚠️ <b>Note:</b> These docs use faux TS type definitions that aren’t actual usable TS types. They are simplified types for the purpose of clarity.
</aside>
</br>
</br>

- [Examples](#examples)
    - [Individual Cleanup with Flasked Listeners](#individual-cleanup-with-flasked-listeners)
    - [Batch Cleanup with Flasks](#batch-cleanup-with-flasks)
- Concepts
    - [Flasked Listeners](#flasked-listeners)
        - [One-time Listeners vs Sustained Listeners](#one-time-listener-vs-sustained-listener)
        - [Listener Morphing](#listener-morphing)
        - [Schedulers](#schedulers)
        - [Subscriptions](#subscriptions)
        - [Synchronous vs Asynchronous Handling](#synchronous-vs-asynchronous-handling)
    - [Flasks](#flasks)
        - [Covert Flasks](#covert-flasks)
        - [Scenes](#scenes)
        - [Nestable Flasks](#nestable-flasks)
        - [Asynchronous Listener Registration](#asynchronous-listener-registration)
    - [Outlive](#outlive)
- [Flask API](#flask-api)
- [Flasked Listeners API](#flasked-listeners-api)
- [Enflask API](#enflask-api)
- [Memory Leak Prevention](#memory-leak-prevention)
- [Planned Features](#planned-features)
<p align="right"><a href="#readme-top">[top]</a></p>

## Examples

Note that the event listeners in the examples below are not directly provided by Flask. They are examples of “flasked listeners” created using [Flask’s API](#flasked-listeners-api). Note also: the Flask cleanup system will only work with flasked listeners. For how to create or obtain flasked listeners, see [Flasked Listeners](#flasked-listeners). Lastly, these examples do not represent real use cases; they were fabricated for demonstration purposes.

<p align="right"><a href="#table-of-contents">[toc]</a></p>

### Individual Cleanup with Flasked Listeners

Here are examples of what cleanup may look like at the individual level using a flasked listener:

**…via an options argument:**

```tsx
onPopulated(() => {
		// do work...
}, { until: onDocClosed });
```

**…via a cancellable promise (for one-time listeners):**

```tsx
const pendingTask = queueTask(() => {
		// do work...
});

onMounted(() => {
    if (isFull()) {
        pendingTask.cancel();
    }
});
```

**…via a stop method (for sustained listeners):**

```tsx
// stop an active listener

const mouseMoveListener = 
    onMouseMove(document, () => { 
        // do work 
    });

onMouseUp(document, () => {
    mouseMoveListener.stop();
}, { once: true });
```
<p align="right"><a href="#table-of-contents">[toc]</a></p>

### Batch Cleanup with Flasks

Here are examples of what cleanup may look like using Flask’s batch cleanup strategies:

… **via covert flask auto-cleanup**

The Flask event system can be configured to have “covert flasks” within which auto-cleanup occurs. In this example, the component setup is the covert flask. All listeners registered during component setup will be automatically cleaned up when the component unmounts. (See [Covert Flasks](#covert-flasks)).

```tsx
// TableBlock.vue

export default defineComponent({
    setup(){
        onDataReceived(() => {
	          // do work
        });

        onPopulated(() => {
	          // do work
        });

        onFormatted(() => {
	          // do work
        });

        return { /* ... */ };
    }
})
```

… **via nestable flask cleanup**

Listeners and reactive effects registered within a nestable flask can be handled independently of an outer flask via the [Enflask API](#enflask-api). Listeners and reactive effects are collected in a flask (created either by `flaskSetup()` or `enflask()`) and disposed of when the flask is disposed of:

```tsx
import { flaskSetup } from "@rue/flask";

function useTable() {
    return flaskSetup((flask) => {
    
        const values = reactive([1, 2, 3]);
    
        const total = compute(() => /* ... */ );

        onDataReceived(() => {
	          // do work
        });

        onPopulated(() => {
            // do work
        });

        onExited(() => {
            // do work
            flask.dispose();
        });
        
        return { /* ... */ };
    });
}
```

Nestable flasks can be configured to “outlive” its outer flask via the `outlive` parameter. For readability, Flask provides an `OUTLIVE` constant that can be passed in as the argument:

```tsx
import { flaskSetup, OUTLIVE } from "@rue/flask";

function useTable() {
    return flaskSetup((flask, outerFlask) => {
    
        const values = reactive([1, 2, 3]);
    
        const total = compute(() => /* ... */ );

        onDataReceived(() => { /* do work */ });

        onPopulated(() => { /* do work */ });

        onExited(() => {
            // do work
            flask.dispose();
        });

        outerFlask.onDisposed(() => {
            // do work
        });
        
        return { /* ... */ };

    }, OUTLIVE);
}
```

… **via scene cleanup**

Flask’s [Scene API](#scene-api) offers an alternative way of thinking about batch cleanup. Listeners are contained within a “scene” and are stopped when the scene ends. This is particularly useful for event handlers that need to register their own event listeners. See [Flasks](#flasks) to understand the difference between a scene and other types of flasks.

```jsx
// SFC script
import { sceneSetup } from "@rue/flask"

// create a 'dragging' scene
function initDrag(event){
    sceneSetup((dragging) => {
        const item = event.target;

        onMouseEnter(item, () => {
            // do work
        });
 
        onMouseLeave(item, () => {
            // do work
        });

        onMouseMove(document, () => {
            // do work
        });

        onMouseUp(document, () => {
            // do work
            dragging.end()  // stops all listeners registered during scene
        });
    });
}
```

```html
<!-- SFC template -->
<div @mousedown="initDrag">item</div>
```
<p align="right"><a href="#table-of-contents">[toc]</a></p>

## Flasked Listeners

Flasked listeners are listeners that are hooked into the Flask event system, where the mess of listener cleanup is handled under the hood. Flasked listeners can be obtained through several ways:

- [the Flasked Listener API](#flasked-listeners-api), which can be used to turn existing listeners into flasked listeners as well as to create new flasked listeners
- [the Pecherie library](https://github.com/ruby-cube/rue/tree/main/packages/pecherie#readme-top), which creates flasked listeners for application events and process hooks
- [the Archer library](https://github.com/ruby-cube/rue/tree/main/packages/archer#readme-top), which provides a flasked listener for targeted messages
- [the Thread library](https://github.com/ruby-cube/rue/tree/main/packages/thread#readme-top), which provides flasked schedulers and flasked user event listeners from Web API
- [the Watch library](https://github.com/ruby-cube/rue/tree/main/packages/watch#readme-top), which provides flasked versions of Vue’s watch, watchEffect, and computed

Note that in browser and Node.js API, the word “listener” refers to the callback passed into the `addListener` function. This to me is a misnomer and it pains me to follow this convention. For clarity, here is how terms are used within the Flask system:

```tsx
onPopulated((context) => { context.data }, { until: onDocClosed })
    |                 |                         |         |
listener           handler                  listener   cleanup
                                             options   scheduler
```

```tsx
onMouseDown(document, () => {}, { until: onDestroyed })
    |           |        |           |
targeted     target   handler     listener
listener                           options
```
<p align="right"><a href="#table-of-contents">[toc]</a></p>

### One-time listener vs Sustained listener

There are two main types of flasked listeners: one-time listeners and sustained listeners. As their names suggest, one-time listeners will listen at most once (i.e. the handler can run at most one time) and the sustained listeners will continue to listen so long as the listener remains active (i.e. the handler will run every time the event or hook is emitted).

**Sustained listeners** return an `ActiveListener` object. This object has a single `stop` method, which can be called to stop the listener.

```tsx
const mouseMoveListener =
    onMouseMove(document, () => {
        // do work
    });

onMouseUp(document, () => {
    mouseMoveListener.stop();
});
```

**One-time listeners** return a `PendingOp` object, which is a cancellable `Promise`. If canceled, the handler will never run.

```tsx
const pendingOp = onTextInserted(() => {
    // do work
    return result;
});

onActionCanceled(() => {
    pendingOp.cancel();
});

const result = await pendingOp;
```

**Note**: The `cancel` method will not survive a `.then` chain. This is by design. Since the return of a `.then` chain is too easily mistaken for the return of the first call rather than the last call of the chain, it is preferred to save the `PendingOp` to a variable before chaining or awaiting if you need to call the cancel method.

<p align="right"><a href="#table-of-contents">[toc]</a></p>

### Listener Morphing

If created as a morphable listener, a one-time listener can be turned into a sustained listener and vice-versa via the options parameter. The listener’s type definition will indicate whether it returns a `PendingOp` (as a one-time listener) or an `ActiveListener` (as a sustained listener). Besides listener morphing, the options parameter can be useful for marking listeners as one-time or sustained explicitly in the code, if so desired.

```tsx
onPopulated(() => {   // sustained listener
    // do work
}, { sustained: true });

onPopulated(() => {   // one-time listener
    // do work
}, { once: true });

onPopulated(() => {   // sustained listener
    // do work
}, { until: onActionCanceled });

onPopulated(() => {   // one-time listener
    // do work
}, { unlessCanceled: onActionCanceled });
```

Sustained listeners can also morph into a one-time listener if it is passed into another listener as a cleanup scheduler as is the case with `onActionCanceled` above.

To create a morphable listener, use `$listen` from the Flasked Listeners API.

<p align="right"><a href="#table-of-contents">[toc]</a></p>

### Schedulers

Schedulers are one-time listeners that cannot morph into a sustained listeners. These are typically functions that queue a task to the main thread such as: `queueTask`, `beforeScreenPaint` (flasked `requestAnimationFrame`), and `onTimeout` (flasked `setTimeout`). See [Thread](https://github.com/ruby-cube/rue/tree/main/packages/thread#readme-top) for more on existing schedulers.

To create a scheduler, use `$schedule` from [the Flasked Listeners API](#flasked-listeners-api).

<p align="right"><a href="#table-of-contents">[toc]</a></p>

### Subscriptions

Conversely, subscriptions are sustained listeners that cannot morph into a one-time listener. To create subscription functions, use `$subscribe` from [the Flasked Listeners API](#flasked-listeners-api).

<p align="right"><a href="#table-of-contents">[toc]</a></p>

### Synchronous vs Asynchronous Handling

Handlers are called synchronously at the time of event emission. This allows for “before event” hooks as well as the possibility of handlers communicating back to the source of the event (see [reply](https://github.com/ruby-cube/rue/tree/main/packages/pecherie#hook-configuration)). 

If asynchronous handling is needed, the developer can call an async scheduler or one-time listener from within the handler. In the example below, the synchonous handler calls the `addPS` scheduler (an alias for `queueMicrotask`) for asynchronous handling.

```ts
onPopulated(() => addPS(() => {
    // do something
}))
```

Alternatively, when using [Pêcherie](https://github.com/ruby-cube/rue/tree/main/packages/pecherie#readme-top) hooks, omit the callback function and options parameter to queue a microtask after an event is emitted via a promise:

```ts
onPopulated()
    .then(() => { 
        // do something
    })

/* or */

await onPopulated();
// do something
```
<p align="right"><a href="#table-of-contents">[toc]</a></p>

## Flasks

A key feature of this library is the ability to perform batch cleanups. This is achieved through the concept of flasked scopes, or flasks. A flask collects listeners and reactive effects that are registered during its setup and performs cleanup upon its disposal. This all happens under the hood so as not to clutter application code.

There are three distinct types of flasks: 
- [covert flasks](#covert-flasks)
- [scenes](#scenes)
- [nestable flasks](#nestable-flasks)

<p align="right"><a href="#table-of-contents">[toc]</a></p>

### Covert Flasks

Covert flasks are the vessels for automatic batch cleanup. Any entity that is instantiated through some sort of setup or constructor function and which exposes a lifecycle end hook (e.g. `onUnmounted`, `onDestroyed`, etc) can serve as a covert flask. The lifecycle hook must be made into a [flasked listener](#flasked-listeners-api) (or at least return an object that implements the `PendingOp` interface). Note that these requirements exclude Vue Options API components.

Covert flasks must be registered at initiation of the flask event system via `initFlask()`. Below is an example of registering Vue components as covert flasks (using functions provided by [the Paravue library](https://github.com/ruby-cube/rue/tree/main/packages/paravue#readme-top):

```tsx
// main.ts

import { initFlask } from "@rue/flask";
import { onUnmounted, getComponent } from "@rue/paravue";

initFlask({
    covertFlasks: [{
        entityGetter: getComponent,
        autoCleanupScheduler: onUnmounted // a flasked listener
    }]
});
```

(Note: This example assumes the covert flask will contain only synchronous code. To learn how to register a covert flask that can survive asynchronous code, see [Asynchronous Listener Registration](#asynchronous-listener-registration).)

After initiation, any flasked listener that is registered within a covert flask will enjoy automatic cleanup when the entity is unmounted/destroyed/disposed of/etc.

```tsx
// TableBlock.vue

export default defineComponent({
    setup(){
        onDataReceived(() => {
	          // do work
        });

        onPopulated(() => {
	          // do work
        });

        onFormatted(() => {
	          // do work
        });

        return { /* ... */ };
    }
})
```
<p align="right"><a href="#table-of-contents">[toc]</a></p>

### Scenes

A scene is essentially an impromptu covert flask, useful for automatic batch cleanup of listeners that are registered within an event handler instead of, say, a component setup function.

A scene can be created via `sceneSetup()`, or alternatively `enscene()`. `sceneSetup()` sets up a scene within the function it’s called in:

```jsx
// SFC script
import { sceneSetup } from "@rue/flask"

// create a 'dragging' scene
function initDrag(event){
    sceneSetup((dragging) => {
        const item = event.target;

        onMouseEnter(item, () => {
            // do work
        });
 
        onMouseLeave(item, () => {
            // do work
        });

        onMouseMove(document, () => {
            // do work
        });

        onMouseUp(document, () => {
            // do work
            dragging.end()  // stops all listeners registered during scene
        });
    });
}
```

```html
<!-- SFC template -->
<div @mousedown="initDrag">item</div>
```

`enscene()` returns a wrapped function:

```jsx
import { enscene } from "@rue/flask"

// create a 'drawing' scene
onMouseDown(document, enscene((drawing, event) => {
    let x = event.clientX;
    let y = event.clientY;    

    onMouseMove(document, (event) => {
        // do work
    });

    onMouseUp(document, (event) => {
        // do work
        drawing.end()  // stops all listeners registered during scene
    });
});
```

Scenes are useful for sharing state across the handlers of event flows like [ mouse down —> mouse move —> mouse up ] or [ key down —> before input —> input ].

<p align="right"><a href="#table-of-contents">[toc]</a></p>

### Nestable Flasks

A nestable flask can be created within any other flask or serve as a root flask itself. This allows for more fine-grained control over when listeners are disposed of: a nested flask can be disposed of earlier than its outer flask or even outlive its outer flask. 

A nestable flask can be created via `flaskSetup()`, or alternatively `enflask()`. `flaskSetup()` sets up a flask within the function it’s called in:

```tsx
import { flaskSetup, OUTLIVE } from "@rue/flask";

function useTable() {
    return flaskSetup((flask, outerFlask) => {
    
        const values = reactive([1, 2, 3]);
    
        const total = compute(() => /* ... */ );

        onDataReceived(() => { /* do work */ });

        onPopulated(() => { /* do work */ });

        onExited(() => {
            // do work
            flask.dispose();
        });

        outerFlask.onDisposed(() => {
            // do work
        });
        
        return { /* ... */ };

    }, OUTLIVE);
}
```

`enflask()` returns an wrapped function:

```tsx
const useTable = enflask((flask) => {
    
    const values = reactive([1, 2, 3]);
    
    const total = computed(() => /* ... */ )

    onDataReceived(() => {
	      // do work
    });

    onPopulated(() => {
        // do work
    });

    onFormatted(() => {
        // do work
    });

    onExited(() => {
        // do work
        flask.dispose();
    });

    return { /* ... */ };
});
```

Nestable flasks are useful for managing shared state across multiple usages of a composable—initiating shared state when there is at least one usage and cleaning up the state when no longer used.

<p align="right"><a href="#table-of-contents">[toc]</a></p>

## Outlive

Just as a nestable flask can outlive its outer flask, a listener can outlive its containing flask by configuring the options argument with the `$outlive` constant.

```tsx
import { $outlive } from "@rue/flask";

export default defineComponent({
    setup(){
        onPopulated(() => {
            // do stuff
        }, { $outlive, until: onExpired })

        return { /* ... */ };
    }
});
```
<p align="right"><a href="#table-of-contents">[toc]</a></p>

## **Asynchronous Listener registration**

Both the [Scene API](#scene-api) and [Enflask API](#enflask-api) provide ways of restoring the flask for listeners that must be registered after awaiting a promise.

Normally, if you register a listener after awaiting a promise, the listener will be registered outside of the enflasked scope and therefore will not be cleaned up along with the flask. In the example below, `onSomeEvent` will not be cleaned up when the flask is disposed of.

```tsx
function useTable() {
    return flaskSetup(async(flask) => {
    
        const values = reactive([1, 2, 3]);
    
        const total = compute(() => /* ... */ );

        onExited(() => {
            // do work
            flask.dispose();
        });

        const data = await fetchData(/* ... */);

        onSomeEvent(() => { // Oh no! This will not be cleaned up!
            data; // do stuff with the data
        });
        
        return { /* ... */ };
    });
}
```

To solve this, a promise must be passed into the `.after()` method of a scene or a flask before being awaited. This will allow the scene to resume or the flask to be restored once the promise is settled.

```tsx
function useTable() {
    return flaskSetup(async(flask) => {
    
        const values = reactive([1, 2, 3]);
    
        const total = compute(() => /* ... */ );

        onExited(() => {
            // do work
            flask.dispose();
        });

        const [data, error] = await flask.after(
            fetchData(/* ... */)
        );

        onSomeEvent(() => { 
            data; // do stuff with the data
        });
        
        return { /* ... */ };
    });
}
```

Note that in order for covert flasks to be restored after awaiting a promise, the registered `autoCleanupScheduler` must be written in a way that targets a specific instance of the covert flask entity. The `autoCleanupScheduler` will become a method on the covert flask, which has an `entity` property whose value is the return value of the `entityGetter`. In this way, the target instance can be passed into the lifecycle end hook.

```tsx
// main.ts

import { initFlask } from "@rue/flask";
import { onUnmounted, getComponent } from "@rue/paravue";

initFlask({
    covertFlasks: [{
        entityGetter: getComponent,
        autoCleanupScheduler(cleanup) {
            return onUnmounted(cleanup, {target: this.entity}); // flasked listener
        }
    }]
});
```
<p align="right"><a href="#table-of-contents">[toc]</a></p>

## Flask API

[initFlask()](#initflask)

<p align="right"><a href="#table-of-contents">[toc]</a></p>

## `initFlask()`

### Syntax

```tsx
initFlask(config)
             |
    { covertFlasks: CovertFlaskConfig[] }
```

### Type Definitions

```tsx
type CovertFlaskConfig = { 
    entityGetter: () => any;
    autoCleanupScheduler: (cleanup: () => void) => PendingOp;
}
```

### Usage

(See [Covert Flasks](#covert-flasks) and [Asynchronous Listener Registration](#asynchronous-listener-registration) for notes on usage)

```tsx
// main.ts

import { initFlask } from "@rue/flask";
import { getComponent, onUnmounted } from "@rue/paravue";

initFlask({
    covertFlasks: [{
        entityGetter: getComponent,
        autoCleanupScheduler: onUnmounted // a flasked listener
    }]
});
```
<p align="right"><a href="#table-of-contents">[toc]</a></p>

## Scene API

[sceneSetup()](#scenesetup)

[enscene()](#enscene)

<p align="right"><a href="#table-of-contents">[toc]</a></p>

## `sceneSetup()`

### Syntax

```tsx
sceneSetup(setUpScene)
             |
       (scene: Scene) => void
```

### Type Definitions

```tsx
type Scene = {
    end: () => void;
    onEnded: (callback: () => unknown) => PendingOp<unknown>;
    after: (Promise<unknown>) => Promise<unknown>
}
```

### Usage

(See [Scenes](#scenes) for notes on usage)

```jsx
// SFC script
import { sceneSetup } from "@rue/flask"

// create a 'dragging' scene
function initDrag(event){
    sceneSetup((dragging) => {
        const item = event.target;

        onMouseEnter(item, () => {
            // do work
        });
 
        onMouseLeave(item, () => {
            // do work
        });

        onMouseMove(document, () => {
            // do work
        });

        onMouseUp(document, () => {
            // do work
            dragging.end()  // stops all listeners registered during scene
        });
    });
}
```

```html
<!-- SFC template -->
<div @mousedown="initDrag">item</div>
```
<p align="right"><a href="#table-of-contents">[toc]</a></p>

## `enscene()`

### Syntax

```tsx
const handler = enscene(setUpScene)
        |                    |
 EnscenedHandler         SetUpScene
```

### Type Definitions

```tsx
type SetUpScene = (scene: Scene, ...args: any[]) => void;

type EscenedHandler = (...args: any[]) => void;

type Scene = {
    end: () => void;
    onEnded: (cb: () => void) => PendingOp<void>;
    after: (Promise<any>) => Promise<any>;
}
```

### Usage

(See [Scenes](#scenes) for notes on usage)

```jsx
import { enscene } from "@rue/flask"

// create a 'drawing' scene
onMouseDown(document, enscene((drawing, event) => {
    let x = event.clientX;
    let y = event.clientY;    

    onMouseMove(document, (event) => {
        // do work
    });

    onMouseUp(document, (event) => {
        // do work
        drawing.end()  // stops all listeners registered during scene
    });
});
```
<p align="right"><a href="#table-of-contents">[toc]</a></p>

## Enflask API

[flaskSetup()](#flasksetup)

[enflask()](#enflask)

OUTLIVE`

<p align="right"><a href="#table-of-contents">[toc]</a></p>

## `flaskSetup()`

### Syntax

```tsx
const returnValue = flaskSetup(setUpFlask, OUTLIVE)
           |                        |         | 
           R                    SetUpFlask   true
```

### Type Definitions

```tsx
type SetUpFlask = (flask: NestableFlask, outerFlask: Flask) => R

type NestableFlask = {
    outlivesOuter: boolean;
    dispose: () => void;
    onDisposed: (cb: () => void) => PendingOp<void>;
    after: (Promise<any>) => Promise<any>;
}

type Flask = {
    onDisposed: (cb: () => void) => PendingOp<void>;
}
```

### Usage

(See [Nestable Flasks](#nestable-flasks) for notes on usage)

```tsx
import { flaskSetup, OUTLIVE } from "@rue/flask";

function useTable() {
    return flaskSetup((flask, outerFlask) => {
    
        const values = reactive([1, 2, 3]);
    
        const total = compute(() => /* ... */ );

        onDataReceived(() => { /* do work */ });

        onPopulated(() => { /* do work */ });

        onExited(() => {
            // do work
            flask.dispose();
        });

        outerFlask.onDisposed(() => {
            // do work
        });
        
        return { /* ... */ };

    }, OUTLIVE);
}
```
<p align="right"><a href="#table-of-contents">[toc]</a></p>

## `enflask()`

### Syntax

```tsx
const someFunction = enflask(setUpFlask)
           |                    |
  EnflaskedFunction         SetUpFlask
```

### Type Definitions

```tsx
type SetUpFlask = (flask: NestableFlask, outerFlask: Flask, ...args: any[]) => void;

type EnflaskedFunction = (...args: any[]) => void;

type NestableFlask = {
    outlivesOuter: boolean;
    dispose: () => void;
    onDisposed: (cb: () => void) => PendingOp<void>;
    after: (Promise<any>) => Promise<any>;
}

type Flask = {
    onDisposed: (cb: () => void) => PendingOp<void>;
}
```

### Usage

(See [Nestable Flasks](#nestable-flasks) for notes on usage)

```jsx
const useTable = enflask((flask) => {
    
    const values = reactive([1, 2, 3]);
    
    const total = computed(() => /* ... */ )

    onDataReceived(() => {
	      // do work
    });

    onPopulated(() => {
        // do work
    });

    onExited(() => {
        // do work
        flask.dispose();
    });

    return { /* ... */ };
});
```
<p align="right"><a href="#table-of-contents">[toc]</a></p>

## Flasked Listeners API

The functions provided by [Pêcherie](https://github.com/ruby-cube/rue/tree/main/packages/pecherie#readme-top), [Archer](https://github.com/ruby-cube/rue/tree/main/packages/archer#readme-top), [Thread](https://github.com/ruby-cube/rue/tree/main/packages/thread#readme-top), and [Paravue](https://github.com/ruby-cube/rue/tree/main/packages/paravue#readme-top) should cover most use cases. However, if you would like to flask an existing listener or scheduler, Flask provides the `$listen`, `$schedule`, and `$subscribe` functions to acheive this.

[$listen(handler, options, config)](#listenhandler-options-config)

[$schedule(callback, options, config)](#schedulehandler-options-config)

[$subscribe(handler, options, config)](#subscribehandler-options-config)

$outlive

<p align="right"><a href="#table-of-contents">[toc]</a></p>

### `$listen(handler, options, config)`
Sets up a listener. Depending on options and config, this could behave as a one-time listener or a sustained listener.

#### Syntax
```ts
const activeListener = $listen(handler, options, config)
        |                        |         |        |
 PendingOp | ActiveListener   Handler      |   ListenerConfig
                                     ListenerOptions
```

#### Type Definitions
```ts
type ListenerConfig = {
    enroll: (handler) => void, 
    remove: (handlerOrReturnVal) => void, 
    onceAsDefault?: true | undefined
}

type ListenerOptions = {
    once?: true;
    sustain?: true;
    unlessCanceled?: ScheduleCancel;
    until?: ScheduleStop;
    $lifetime?: true;
    $tilStop?: true;
    $outlive?: true;
}
```
<p align="right"><a href="#table-of-contents">[toc]</a></p>

### `$schedule(handler, options, config)`
Sets up a one-time listener.

#### Syntax
```ts
const pendingOp = $schedule(handler, options, config)
           |                  |         |        |
      PendingOp            Handler      |   SchedulerConfig
                                  ListenerOptions
```

#### Type Definitions
```ts
type SchedulerConfig = {
    enroll: (handler) => void, 
    remove: (handlerOrReturnVal) => void, 
};

type PendingOp = Promise<ReturnType<Handler>> & { cancel: () => void };

type ListenerOptions = {
    unlessCanceled?: ScheduleCancel;
    $lifetime?: true;
    $outlive?: true;
}
```
<p align="right"><a href="#table-of-contents">[toc]</a></p>

### `$subscribe(handler, options, config)`
Sets up a sustained listener.

#### Syntax
```ts
const activeListener = $subscribe(handler, options, config)
           |                        |         |        |
        ActiveListener            Handler     |   SubscribeConfig
                                       ListenerOptions
```

#### Type Definitions
```ts
type SubscribeConfig = {
    enroll: (handler) => void, 
    remove: (handlerOrReturnVal) => void, 
}

type ActiveListener = { stop: () => void };

type ListenerOptions = {
    until?: ScheduleStop;
    $lifetime?: true;
    $tilStop?: true;
    $outlive?: true;
}
```
<p align="right"><a href="#table-of-contents">[toc]</a></p>

### Basic Usage

The `enroll` and `remove` functions must define how a handler is registered and removed. Both functions are passed a wrapped handler (`cb` in the example). Note that you must pass the listener and remover the *wrapped handler*, not the original handler. If, for example, you would like to flask an Node.js EventEmitter event, you might write something like this:
```ts
// flasking a Node EventEmitter listener

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
```ts
// flasking a setTimeout

export function onTimeout(delay, handler, options?) {
    return $schedule(handler, options, {
        enroll(cb) {
            return setTimeout(cb, delay);
        },
        remove: clearTimeout
    });
}
```
<p align="right"><a href="#table-of-contents">[toc]</a></p>

### Advanced Usage

To provide better developer experience for users of the listener/scheduler, use Typescript generics so that `$listen` and `$schedule` return the appropriate type based on the callback and options passed into it.

```ts
// flasking Vue's `watch`

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

```ts
// flasking `requestAnimationFrame`

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

<p align="right"><a href="#table-of-contents">[toc]</a></p>

## Memory Leak Prevention

Flask prevents memory leaks with three main approaches:

- by making handler cleanup more user-friendly
- by logging warnings during development if a cleanup strategy is not in place
- with Typescript errors during development

### Memory Leak Warnings

Unless the developer is impeccably conscientious about cleanup, memory leaks will inevitably creep into your system when using event listeners. As an additional guard against memory leaks, Flask will log a warning during development if it does not detect a cleanup strategy in place for a listener.

<p align="right"><a href="#table-of-contents">[toc]</a></p>

## Planned Features

Event-driven code is notoriously difficult to debug. Additional support for easing the debugging experience is in the works.

<p align="right"><a href="#readme-top">[top]</a></p>

© 2023 - present [Ruby Y Wang](https://github.com/ruby-cube)