<nav><a id="readme-top" href="#"><b>goto: src</b></a></nav>

[@rue](https://github.com/ruby-cube/rue#readme-top)  &nbsp;&nbsp;|&nbsp; &nbsp;  [paravue](https://github.com/ruby-cube/rue/tree/main/packages/paravue#readme-top)  &nbsp;&nbsp;|&nbsp; &nbsp; **watch**  &nbsp;&nbsp;|&nbsp; &nbsp; [signals](https://github.com/ruby-cube/rue/tree/main/packages/signals#readme-top)  &nbsp;&nbsp;|&nbsp; &nbsp; actionry
# Watch ⏳

<aside>
⚠️ <b>Experimental:</b> Watch is a work-in-progress, not well-tested nor optimized, with a volatile API. Look and play, but definitely don’t use…
</aside>

<p align="right"><a href="#">[src]</a></p>

## Overview

Watch provides [flasked](https://github.com/ruby-cube/rue/tree/main/packages/flask#flaskedlisteners) versions of Vue's `watch`, `watchEffect`, and `computed`.

<p align="right"><a href="#">[src]</a></p>

## Installation

```bash
(coming soon ...)
```
<p align="right"><a href="#">[src]</a></p>

## Watch API

<aside>
⚠️ <b>Note:</b> These docs use faux TS type definitions that aren’t actual usable TS types. They are simplified types for the purpose of clarity.
</aside>
</br>
</br>

[compute()](#compute)

[onChange()](#onchange)

[initReactiveEffect()](#initreactiveeffect)

[afterReactiveFlush()](#afterreactiveflush)

<p align="right"><a href="#readme-top">[top]</a></p>

## `compute()`
Flasked version of Vue's `computed`.

### Syntax
```tsx
const computedRef = compute(computation, options)
          |                      |          |
    ComputedRef<R>            () => R     SubscribeOptions?
```

### Type Definitions
```tsx
type SubscribeOptions = {
    $outlive?: true;
    until?: (stop: () => void) => PendingCancelOp;
}
```

### Usage
```tsx
const count = ref(0);

const doubleCount = compute(() => count.value * 2, { until: onDeactivated})
```

<p align="right"><a href="#readme-top">[top]</a></p>

## `onChange()`
Flasked version of Vue's `watch`. Runs handler whenever value of reactive reference changes.

### Syntax
```tsx
const activeWatcher = onChange(getter, handler, options)
          |                      |       |          |
     ActiveListener           () => T    |    ListenerOptions?
                                  (value: T, prevValue: T) => void
```

### Type Definitions
```tsx
type ActiveListener = {
    stop: () => void
}

type ListenerOptions = {
    once?: true;
    sustain?: true;
    unlessCanceled?: ScheduleCancel;
    until?: ScheduleStop;
    $lifetime?: true;
    $tilStop?: true;
    $outlive?: true;
    immediate?: boolean // default: false
    deep?: boolean // default: false
    flush?: 'pre' | 'post' | 'sync' // default: 'pre'
    onTrack?: (event: DebuggerEvent) => void
    onTrigger?: (event: DebuggerEvent) => void
}
```

### Usage
```tsx
const count = ref(0);

const activeWatcher = onChange(() => count.value, (count) => { 
    // do something
});

onMouseUp(el, () => {
    if (/* ... */) {
        activeWatcher.stop()
    }
});
```

<p align="right"><a href="#readme-top">[top]</a></p>

## `initReactiveEffect()`
Flasked version of Vue's `watchEffect`. Runs the effect synchronously, and re-run every time the value of any reactive references accessed in the effect changes.


### Syntax
```tsx
const activeWatcher = initReactiveEffect(effect, options)
          |                                |         |
     ActiveListener                        |    ListenerOptions?
                                       () => void
```

### Type Definitions
```tsx
type ActiveListener = {
    stop: () => void
}

type ListenerOptions = {
    once?: true;
    sustain?: true;
    unlessCanceled?: ScheduleCancel;
    until?: ScheduleStop;
    $lifetime?: true;
    $tilStop?: true;
    $outlive?: true;
    flush?: 'pre' | 'post' | 'sync' // default: 'pre'
    onTrack?: (event: DebuggerEvent) => void
    onTrigger?: (event: DebuggerEvent) => void
}
```

### Usage
```tsx
const count = ref(0);

const activeWatcher = initReactiveEffect(() => { 
    if (count.value > 10) {
        // do something
    }
});

onMouseDown(el, () => {
    if (/* ... */) {
        activeWatcher.stop()
    }
});
```

<p align="right"><a href="#readme-top">[top]</a></p>

## `afterReactiveFlush()`
an alias for Vue's `nextTick` (see [nextTick](https://vuejs.org/api/general.html#nexttick))

<p align="right"><a href="#readme-top">[top]</a></p>

© 2023 - present [Ruby Y Wang](https://github.com/ruby-cube)