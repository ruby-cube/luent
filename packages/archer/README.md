#### [goto: src](https://github.com/ruby-cube/rue/tree/main/packages/archer)
[@rue](https://github.com/ruby-cube/rue#goto-src)  &nbsp;&nbsp;|&nbsp; &nbsp;  [planify](https://github.com/ruby-cube/rue/tree/main/packages/planify#goto-src)  &nbsp;&nbsp;|&nbsp; &nbsp; [thread](https://github.com/ruby-cube/rue/tree/main/packages/thread#goto-src)  &nbsp;&nbsp;|&nbsp; &nbsp; [pecherie](https://github.com/ruby-cube/rue/tree/main/packages/pecherie#goto-src)  &nbsp;&nbsp;|&nbsp; &nbsp; **archer**
# Archer 🏹

<aside>
⚠️ <b>Experimental:</b> Archer is a work-in-progress, not well-tested, with a volatile API. Look and play, but definitely don’t use…
</aside>
</br>
</br>

## Overview

Archer is a system for sending and receiving targeted messages/commands across scopes. Whereas [Pêcherie’s](https://github.com/ruby-cube/rue/tree/main/packages/pecherie#goto-src) listeners collect handlers to be run at a particular point in a process, Archer’s message senders request a *specific* callback to be run. 

<br/>

## Installation

```bash
(coming soon ...)
```
</br>

## Table of Contents

- [Archer API](https://github.com/ruby-cube/rue/tree/main/packages/archer#archer-api)
- [Basic Usage](https://github.com/ruby-cube/rue/tree/main/packages/archer#basic-usage)
- [Use Case](https://github.com/ruby-cube/rue/tree/main/packages/archer#use-case)
- [Targeted Listening](https://github.com/ruby-cube/rue/tree/main/packages/archer#targeted-listening)
</br>

## Archer API

[`defineMessage(config)`](https://github.com/ruby-cube/rue/tree/main/packages/archer#definemessageconfig) 

[`send(MESSAGE, {to: targetID }, data)`](https://github.com/ruby-cube/rue/tree/main/packages/archer#sendmessage-to-targetid--data)

[`heed(MESSAGE, targetID, callback)`](https://github.com/ruby-cube/rue/tree/main/packages/archer#heedmessage-targetid-handler)

</br>

## `defineMessage(config)`

### Syntax

```tsx
const MESSAGE = defineMessage(config)
         |                      |
    MessageConfig             Config
```

### Type Definitions

```tsx
type Config = {
    message?: string | undefined;
    targetID?: unknown;
    data?: any, 
    onceAsDefault?: true, 
    dataAsArg?: true;
    reply?: () => { 
        state: ReplyState, // { [key: string]: any };
        methods: ReplyMethods // { [key: string]: (...args: any[]) => void } 
    };
}
type MessageConfig = Config;
```

See [Hook Configuration](https://github.com/ruby-cube/rue/tree/main/packages/pecherie#hook-configuration) for info on configuration values.

</br>

## `send(MESSAGE, {to: targetID }, data)`

### Syntax

```tsx
const reply = send(MESSAGE, { to: targetID }, data)
       |              |               |         |
      Reply     MessageConfig      TargetID   Data/Context
```

### Type Definitions

```tsx
type Reply = ReplyState | void;
type TargetID = any;
type Data = any;
```
</br>

## `heed(MESSAGE, targetID, handler)`

 Called by the receiver. Defines how to handle the message.

### Syntax

```tsx
heed(MESSAGE, targetID, handler)
        |        |         |
MessageConfig  TargetID  Handler
```

### Type Definitions

```tsx
type TargetID = any;
type Handler = (data: Data) => any;
```
</br>

## Basic Usage

```tsx

// define the message in a shared dependency or in the emitter module
const HIDE_ITEM = defineMessage({
    message: "hide-item",
    targetID: $type as Object 
});

// emitter module
send(HIDE_ITEM, { to: item });
```

```tsx
// listener module
heed(HIDE_ITEM, item, () => {
    // mutate local state to hide the item
});
```
</br>

## Use Case

Note that use cases are rare. Message passing via an archer is unnecessary if the sender and receiver are declared in the same scope. Simple function declaration and invocation will suffice:

```tsx
// simple invocation

function hideItem() {
    // do work to hide item
}

function reButtonClick() {
    // do some other work
    hideItem();
}
```

However, message passing becomes useful when you are working across scopes. For example, let’s say you have a function, `hideSelectedItems` that mutates component state. This can be complicated if the event handler that calls `hideSelectedItems` is registered in a component that is not directly related to the component’s whose state is being mutated. This is where Archer comes in handy.


```tsx
// shared dependency 
// (or pass HIDE_ITEM to components via dependency injection)

const HIDE_ITEM = defineMessage({
    message: "hide-item",
    targetID: $type as Object,
    data: $type as { fade: boolean },
    dataAsArg: true
});
```

```jsx
// component A

// script
function hideSelectedItems(){
    const items = getSelectedItems();
    for (const item of items) {
        send(HIDE_ITEM, { to: item }, { fade: true })
    }
}

// template
<div @click="hideSelectedItems">CLICK ME</div>

```

```tsx
// component B

heed(HIDE_ITEM, item, (data) => {
   // hide item
})

```
</br>

## Targeted Listening

Archer’s heed function is a targeted listener for performance reasons. See [Planify: Targeted Listeners](https://github.com/ruby-cube/rue/tree/main/packages/planify#targeted-listeners) for more information on targeted listeners and how to generate deterministic target ids.

<br/>
<br/>

[[top]](https://github.com/ruby-cube/rue/tree/main/packages/archer#goto-src)

© 2023 - present [Ruby Y Wang](https://github.com/ruby-cube)
