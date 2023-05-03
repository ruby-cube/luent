<nav><a id="readme-top" href="#"><b>goto: src</b></a></nav>

[@rue](https://github.com/ruby-cube/rue#readme-top)  &nbsp;&nbsp;|&nbsp; &nbsp;  **paravue**  &nbsp;&nbsp;|&nbsp; &nbsp; [watch](https://github.com/ruby-cube/rue/tree/main/packages/watch#readme-top)  &nbsp;&nbsp;|&nbsp; &nbsp; [signals](https://github.com/ruby-cube/rue/tree/main/packages/signals#readme-top)  &nbsp;&nbsp;|&nbsp; &nbsp; actionry

# Paravue 🌴

<aside>
⚠️ <b>Experimental:</b> Paravue is a work-in-progress, not well-tested nor optimized, with a volatile API. Look and play, but definitely don’t use…
</aside>

<p align="right"><a href="#">[src]</a></p>

## Overview

Paravue provides a handful of component utils, including a [flasked](https://github.com/ruby-cube/rue/tree/main/packages/flask#flaskedlisteners) version of Vue's `onUnmounted` lifecycle hook, useful for registering Vue components as a [covert flask](https://github.com/ruby-cube/rue/tree/main/packages/flask#covertflasks) in a [Flask event system](https://github.com/ruby-cube/rue/tree/main/packages/flask).

<p align="right"><a href="#">[src]</a></p>

## Installation

```bash
(coming soon ...)
```
<p align="right"><a href="#">[src]</a></p>

## Paravue API

<aside>
⚠️ <b>Note:</b> These docs use faux TS type definitions that aren’t actual usable TS types. They are simplified types for the purpose of clarity.
</aside>
</br>
</br>

[inComponentSetup()](#incomponentsetup)

[getComponent()](#getcomponent)

[onUnmounted()](#onunmounted)

[onViewUpdated()](#onviewupdated)

[nodeRef()](#nodeRef)

<p align="right"><a href="#readme-top">[top]</a></p>

## `inComponentSetup()`
Checks if function is being called during component setup.

### Syntax
```tsx
const isInComponentSetup = inComponentSetup()
          |
        boolean
```

### Usage
```tsx
function useTable() {
    if (inComponentSetup()) {
        // do something
    }
}
```

<p align="right"><a href="#readme-top">[top]</a></p>

## `getComponent()`
Returns the component instance of the component currently being set up. Returns `null`, if called outside of a Vue component's setup.

### Syntax
```tsx
const component = getComponent()
          |
 ComponentPublicInstance | null
```

### Usage
```tsx
function useTable() {
    const component = getComponent();
    if (component.isActive()) {
        // do something
    }
}
```

<p align="right"><a href="#readme-top">[top]</a></p>

## `onUnmounted()`
Flasked version of Vue's `onUnmounted`.


### Syntax
```tsx
const pendingOp = onUnmounted(handler, options)
          |                     |         |
     PendingOp                  |    HookOptions?
                                 () => void
```

### Type Definitions
```tsx
type PendingOp = {
    cancel: () => void
}

type HookOptions = {
    target?: ComponentPublicInstance;
    unlessCanceled?: (cancel: () => void) => PendingCancelOp;
}
```

### Usage
```tsx
onUnmounted(() => { 
    // do stuff
}, { unlessCanceled: onActionEscaped });
```

<p align="right"><a href="#readme-top">[top]</a></p>

## `nodeRef()`

An alias for VueUse’s awesome [templateRef](https://vueuse.org/core/templateRef/#templateref).

### Syntax
```tsx
const _nodeRef = nodeRef(key)
         |                |
         |             string
    Ref<Node | ComponentPublicInstance>
```

### Usage

```tsx
const inputRef = nodeRef("username");

onMounted(() => {
  inputRef.value.focus()
})
```

```html
<template>
  <input ref="username" />
</template>
```
<p align="right"><a href="#readme-top">[top]</a></p>

## `onViewUpdated()`
An alias for Vue's `nextTick` (see [nextTick](https://vuejs.org/api/general.html#nexttick))

<p align="right"><a href="#readme-top">[top]</a></p>

© 2023 - present [Ruby Y Wang](https://github.com/ruby-cube)