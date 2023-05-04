<nav><a id="readme-top" href="#"><b>goto: src</b></a></nav>

[@rue](https://github.com/ruby-cube/rue#readme-top)  &nbsp;&nbsp;|&nbsp; &nbsp;  [flask](https://github.com/ruby-cube/rue/tree/main/packages/flask#readme-top)  &nbsp;&nbsp;|&nbsp; &nbsp; [thread](https://github.com/ruby-cube/rue/tree/main/packages/thread#readme-top)  &nbsp;&nbsp;|&nbsp; &nbsp; [pecherie](https://github.com/ruby-cube/rue/tree/main/packages/pecherie#readme-top)  &nbsp;&nbsp;|&nbsp; &nbsp; **archer**
# Archer 🏹

<aside>
⚠️ <b>Experimental:</b> Archer is a work-in-progress, not well-tested, with a volatile API. Look and play, but definitely don’t use…
</aside>

<p align="right"><a href="#">[src]</a></p>

## Overview

Archer is a system for sending and receiving targeted messages/commands across scopes. Whereas [Pêcherie’s](https://github.com/ruby-cube/rue/tree/main/packages/pecherie#readme-top) listeners collect handlers to be run at a particular point in a process, Archer’s message senders request a *specific* callback to be run. 

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

- [Archer API](#archer-api)
- [Basic Usage](#basic-usage)
- [Use Case](#use-case)
- [Targeted Listening](#targeted-listening)

<p align="right"><a href="#readme-top">[top]</a></p>

## Archer API

[defineMessage()](#definemessage) 

[send()](#send)

[re()](#re)

<p align="right"><a href="#table-of-contents">[toc]</a></p>

## `defineMessage()`

### Syntax

```ts
const MESSAGE = defineMessage(config)
         |                      |
    MessageConfig             Config
```

### Type Definitions

```ts
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

<p align="right"><a href="#table-of-contents">[toc]</a></p>

## `send()`

### Syntax

```ts
const reply = send(MESSAGE, { to: targetID }, data)
       |              |               |         |
      Reply     MessageConfig      TargetID   Data/Context
```

### Type Definitions

```ts
type Reply = ReplyState | void;
type TargetID = any;
type Data = any;
```
<p align="right"><a href="#table-of-contents">[toc]</a></p>

## `re()`

 Called by the receiver. Defines how to handle the message. Returns the handler.

### Syntax

```ts
const handler = re(MESSAGE, targetID, () => { /* ... */ })
         |             |         |        |
      Handler   MessageConfig  TargetID  Handler
```

### Type Definitions

```ts
type TargetID = any;
type Handler = (data: Data) => any;
```
<p align="right"><a href="#table-of-contents">[toc]</a></p>

## Basic Usage

```ts

// define the message in a shared dependency or in the emitter module
const HIDE_ITEM = defineMessage({
    message: "hide-item",
    targetID: $type as Object 
});

// emitter module
send(HIDE_ITEM, { to: item });
```

```ts
// listener module
re(HIDE_ITEM, item, () => {
    // mutate local state to hide the item
});
```
<p align="right"><a href="#table-of-contents">[toc]</a></p>

## Use Case

Note that use cases are rare. Message passing via an archer is unnecessary if the sender and receiver are declared in the same scope. Simple function declaration and invocation will suffice:

```ts
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


```ts
// shared dependency 
// (or pass HIDE_ITEM to components via dependency injection)

const HIDE_ITEM = defineMessage({
    message: "hide-item",
    targetID: $type as Object,
    data: $type as { fade: boolean },
    dataAsArg: true
});
```

```js
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

```ts
// component B

re(HIDE_ITEM, item, (data) => {
   // hide item
})

```
<p align="right"><a href="#table-of-contents">[toc]</a></p>

## Targeted Listening

Sometimes it is better for performance to target a particular instance when communicating via emitters. For this reason, Archer and [Pêcherie](https://github.com/ruby-cube/rue/tree/main/packages/pecherie#readme-top) allow for targeted listening. Targeted listeners take in a targetID, which can be any type, so long as the emitter module and listener module agree on what to use as an identifier. 

```ts
// using an object as the targetID with Archer API

// shared dependency
const HIDE_ITEM = defineMessage({
    message: "hide-item",
    targetID: $type as Object 
});

// listener module
re(HIDE_ITEM, item, () => {
    // mutate local state to hide the item
});

// emitter module
send(HIDE_ITEM, { to: item });
```

If you would like to generate a deterministic string ID, Rue Utils provides a simple ID generator that generates an ID based on a base id, optional prefixes, and an optional index.  

```ts
// using a generated string ID

// listener module
import { genTargetID } from "@rue/utils";
import { re } from "@rue/archer"

export default defineComponent({
    props: ["index", "item"],
    setup(props){
        const { item, index } = props;

        re(HIDE_ITEM, genTargetID({  // "Mirror-InfoPanel_item01_9"
            id: item.id, // "item01"
            prefixes: ["Mirror", "InfoPanel"], 
            index: index // 9
        }), () => {
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

<p align="right"><a href="#readme-top">[top]</a></p>

© 2023 - present [Ruby Y Wang](https://github.com/ruby-cube)
