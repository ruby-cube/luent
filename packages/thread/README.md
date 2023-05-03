<nav><a id="readme-top" href="#"><b>goto: src</b></a></nav>

[@rue](https://github.com/ruby-cube/rue#readme-top)  &nbsp;&nbsp;|&nbsp; &nbsp;  [planify](https://github.com/ruby-cube/rue/tree/main/packages/planify#readme-top)  &nbsp;&nbsp;|&nbsp; &nbsp; **thread**  &nbsp;&nbsp;|&nbsp; &nbsp; [pecherie](https://github.com/ruby-cube/rue/tree/main/packages/pecherie#readme-top)  &nbsp;&nbsp;|&nbsp; &nbsp; [archer](https://github.com/ruby-cube/rue/tree/main/packages/archer#readme-top)
# Thread ⏳

<aside>
⚠️ <b>Experimental:</b> Thread is a work-in-progress, not well-tested nor optimized, with a volatile API. Look and play, but definitely don’t use…
</aside>

<p align="right"><a href="#">[src]</a></p>

## Overview

Thread provides planified versions of schedulers and event listeners from Web APIs.

<p align="right"><a href="#">[src]</a></p>

## Installation

```bash
(coming soon ...)
```
<p align="right"><a href="#">[src]</a></p>

## Table of Contents

<aside>
⚠️ <b>Note:</b> These docs use faux TS type definitions that aren’t actual usable TS types. They are simplified types for the purpose of clarity.
</aside>
</br>
</br>

- [Thread API](#thread-api)
- [Event Listeners API](#event-listeners-api)
- [Naming Conventions](#naming-conventions)
<p align="right"><a href="#readme-top">[top]</a></p>

## Thread API

Planified schedulers return a `ScheduledOp`, which is essentially a cancellable `Promise`. The only option they take is a `unlessCanceled` cancellation scheduler.

[addPS()](#addps) 

[queueTask()](#queuetask)

[beforeScreenPaint()](#beforescreenpaint)

[onTimeout()](#ontimeout)

<p align="right"><a href="#table-of-contents">[toc]</a></p>

## `addPS()` 

an alias for `queueMicrotask` from browser API. Here, microtasks are conceptualized as postscripts to event loop tasks.

### Syntax
```tsx
addPS(callback);
```

### Usage

```js
addPS(() => {
    // code that will run after the original task/handlers 
    // and previously queued microtasks finish running
    // but before the next event loop task
});
```
<p align="right"><a href="#table-of-contents">[toc]</a></p>

## `queueTask()`

planified `setImmediate` (as implemented by https://github.com/yuzujs/setImmediate). It essentially queues a task in the event loop’s task queue.

### Syntax
```tsx
queueTask(callback, options);
                       |
                SchedulerOptions?
```

### Type Definitions
```tsx
type SchedulerOptions = {
    unlessCanceled: (stop: () => void) => PendingOp;
}
```

### Usage

```js
queueTask(() => {
    // code that will run after any previously 
    // queued tasks/events in the event loop
    // (unless canceled by the action-completed hook)
}, { unlessCanceled: onActionCompleted });
```
<p align="right"><a href="#table-of-contents">[toc]</a></p>

## `beforeScreenPaint()`

planified `requestAnimationFrame`, which schedules code to run before the next screen paint.

### Syntax
```tsx
requestAnimationFrame(callback, options);
                                   |
                           SchedulerOptions?
```

### Type Definitions
```tsx
type SchedulerOptions = {
    unlessCanceled: (stop: () => void) => PendingOp;
}
```

### Usage

```js
beforeScreenPaint(() => {
    // code that will after any previously queued rAF callbacks
    // and before the next screen paint
});
```
<p align="right"><a href="#table-of-contents">[toc]</a></p>

## `onTimeout()`

planified `setTimeout`

```tsx
onTimeout(delay, callback, options);
            |                   |
          number         SchedulerOptions?
```

### Type Definitions
```tsx
type SchedulerOptions = {
    unlessCanceled: (stop: () => void) => PendingOp;
}
```

### Usage

```js
onTimeout(500, () => {
    // code that will run after 500ms
});
```

<p align="right"><a href="#table-of-contents">[toc]</a></p>

## Event Listeners API

The Event Listeners API provides planified browser event listeners with the `useEventListener` function. `useEventListener` returns the requested event listener if it already exists in the app, otherwise, it creates the listener and stores it for future access to avoid redundant instances.

### Usage

```js
const onMouseDown = useEventListener("mousedown");

onMouseDown(element, () => {
    // handle mouse down
});
```
<p align="right"><a href="#table-of-contents">[toc]</a></p>

## Naming Conventions

People often name event handlers using the prefix “on-” followed by the event name, e.g. `onMouseUp`, as a concise alternative to the prefix “handle-”. When using Planify listeners, it’s helpful to distinguish handlers from listeners with a different naming convention for better clarity. In my own codebase, I use the prefix “re-”, as in “regarding” or “replying to” or “RE: Your email”, e.g. `reMouseUp`. 

```js
// handler
function reMouseDown(event) {
    // handle mouse down...
    // if this case, do this
    // if that case, do that

    // listener
    onMouseUp(document, () => {
       // handle mouse up
    }, { once: true });
}
```

Template:

```ts
<div @mousedown="reMouseDown">{{ item }}</div>
```

Of course if a handler performs a specific action, it would make sense to simply name it that, e.g. `incrementCount`

<p align="right"><a href="#readme-top">[top]</a></p>

© 2023 - present [Ruby Y Wang](https://github.com/ruby-cube)
