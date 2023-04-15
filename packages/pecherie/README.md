<p><a id="readme-top" href="#"><b>goto: src</b></a></p>

[@rue](https://github.com/ruby-cube/rue#readme-top)  &nbsp;&nbsp;|&nbsp; &nbsp;  [planify](https://github.com/ruby-cube/rue/tree/main/packages/planify#readme-top)  &nbsp;&nbsp;|&nbsp; &nbsp; [thread](https://github.com/ruby-cube/rue/tree/main/packages/thread#readme-top)  &nbsp;&nbsp;|&nbsp; &nbsp; **pecherie**  &nbsp;&nbsp;|&nbsp; &nbsp; [archer](https://github.com/ruby-cube/rue/tree/main/packages/archer#readme-top)
# Pêcherie 🐟

<aside>
⚠️ <b>Experimental:</b> Pêcherie is a work-in-progress, not well-tested nor optimized, with a volatile API. Look and play, but definitely don’t use…
</aside>

<p align="right"><a href="#">[src]</a></p>

## Overview

Pêcherie is an exploration into how to make asynchronous and event-driven programming more developer-friendly. It exposes an API that creates custom events (referred to as hooks in this library), targeted and un-targeted.

Pêcherie is based on the Planify event system. See [Planify](https://github.com/ruby-cube/rue/tree/main/packages/planify#readme-top) for an overview of foundational concepts as well as examples and explanations of one-time listeners vs sustained listeners, preventing memory leaks, and targeted listeners.

<p align="right"><a href="#">[src]</a></p>

## Installation

```bash
(coming soon ...)
```
<p align="right"><a href="#">[src]</a></p>

## Table of Contents

- [Pêcherie API](#pecherie-api)
- [Hook Configuration](#hook-configuration)
- [Target IDs](#target-ids)
<p align="right"><a href="#readme-top">[top]</a></p>

## Pecherie API

[`createHook(config)`](#createhookconfig)

[`createTargetedHook(config)`](#createtargetedhookconfig)

<p align="right"><a href="#table-of-contents">[toc]</a></p>

## `createHook(config)`

Creates an un-targeted hook.

### **Syntax**

```ts
const [emitter, listener] = createHook(config);
          |         |                    |
      CastHook      |               OptionalConfig
                    |
            SustainedListener | OneTimeListener
```

### Basic Usage

```js
// module A (service)
const [castPopulated, _onPopulated] = createHook({
    hook: "populated",
    data: $type as { dataset: Data[]}, // enables type hints
}) 

export onPopulated = _onPopulated // 'planified' listener

function populateTable(dataset: Data[]){
    // ...beep beep boop...
    castPopulated({ dataset }); // emitter
}
```

### Type Definitions

```ts
type CastHook = (context?: Context) => void | ReplyState;

type SustainedListener = (handler?: Handler, options?: ListenerOptions) => ActiveListener;

type OneTimeListener = (handler?: Handler, options?: ListenerOptions) => PendingOp  

type OptionalConfig = {
    hook?: Hook; // string; 
    data?: Data; // any;
    dataAsArg?: boolean;
    onceAsDefault?: boolean;
    reply?: () => { 
        state: ReplyState, // { [key: string]: any };
        methods: ReplyMethods // { [key: string]: (...args: any[]) => void } 
    };
}
```

```ts
type Context<DataAsArg, Hook, Data, ReplyMethods> = DataAsArg extends true ? Data : _Context<Hook, Data, ReplyMethods>

type _Context<Hook, Data, ReplyMethods> = 
    Data extends Object ? 
       { hook: Hook } & Data & ReplyMethods 
       : { hook: Hook } & { data: Data } & ReplyMethods

type ActiveListener = { stop: () => void; }

type PendingOp = Promise<ReturnType<Handler>> & { cancel: () => void; };

type ListenerOptions = { once: true } 
    | { sustain: true }
    | { unlessCanceled: ScheduleCancel }
    | { until: ScheduleStop }
    | { $lifetime: true }
    | { $tilStop: true }

type ScheduleCancel = OneTimeListener | Scheduler | SustainedListener
type ScheduleStop = OneTimeListener | Scheduler | SustainedListener
```
<p align="right"><a href="#table-of-contents">[toc]</a></p>

## `createTargetedHook(config)`

Creates a targeted hook. Emitters can target listeners using a target id.

### Syntax

```ts
const [emitter, listener] = createTargetedHook(config);
          |         |                            |
      CastHook      |                          Config
                    |
            SustainedListener | OneTimeListener
```

### Basic Usage

```ts
// module A (service)

const [castTablePopulated, _onTablePopulated] = createTargetedHook({
    hook: "table-populated",
    targetID: $type as Doc, // define target type
}) 
export onTablePopulated = _onTablePopulated

function tablePopulated(doc: Doc){
    // ...beep beep boop...
    castTablePopulated(doc); // cast hook to this particular doc
}
```

```js
// module B (consumer)

function initFormatting(doc: Doc){
    onTablePopulated(doc, ()=>{   // only this doc's callback will run
        // do work
    })
}
```

### Type Definitions

```ts
type CastTargetedHook = (target: TargetID, context?: Context) => void | ReplyState;

type SustainedTargetedListener = (target: TargetID, handler?: Handler, options?: ListenerOptions) => ActiveListener;

type OneTimeTargetedListener = (target: TargetID, handler?: Handler, options?: ListenerOptions) => PendingOp  

type Config = {
    hook?: Hook; // string; 
    targetID: TargetID // any;
    data?: Data; // any;
    dataAsArg?: boolean;
    onceAsDefault?: boolean;
    reply?: () => { 
        state: ReplyState, // { [key: string]: any };
        methods: ReplyMethods // { [key: string]: (...args: any[]) => void } 
    };
}
```
<p align="right"><a href="#table-of-contents">[toc]</a></p>

## Hook Configuration

- `hook`: *(optional)* name of the hook
- `data`: *(optional)* data to pass to the listener
- `dataAsArg`: *(optional)* by default, the emitter will pass a context object to the listener that may include a `hook` and `data` property as well as any `methods` defined by the `reply` option. You can choose to directly pass the data as the argument to the listener if there is no `reply` defined. Defaults to `false`.
- `onceAsDefault`: *(optional)* by default, listeners are created as `SustainedListener`. If you would like the listener to be created as a `OneTimeListener`, set this option to `true`. Note that due to listener morphing, `SustainedListener` and `OneTimeListener` can behave as either sustained listeners or one-time listeners depending on the options passed in or the context of use.
- `reply`: *(optional)* a factory function that generates state and methods to operate on that state. The listener can communicate back to the emitter by calling its methods. The mutated state will then be returned from the emitter.
    
    ```ts
    // module A (service)
    
    const [castBeforePopulated, _beforePopulated] = createHook({
        hook: "before-populated",
        reply: () => {
            const state = { defaultPrevented: false }
            return {
                state,
                methods: { 
                     preventDefault: () => { state.defaultPrevented = true; }
                }
            }
        }
    });
    export beforePopulated = _beforePopulated
    
    function tablePopulated(){
        const state = castBeforePopulated();
        if (state.defaultPrevented) return;
        // do default work...
    }
    ```
    
    ```ts
    // module B (consumer)
    
    function initFormatting(){
        beforePopulated((context)=>{
            context.preventDefault();  // communicate to the hook's source
            // do better work...
        })
    }
    ```
<p align="right"><a href="#table-of-contents">[toc]</a></p>

## Target IDs

The targetID can be any type so long as the emitter module and listener module agree on what to use as an identifier. See [Planify: Targeted Listeners](https://github.com/ruby-cube/rue/tree/main/packages/planify#targeted-listeners) for more information on targeted listeners and how to generate deterministic target ids.

<p align="right"><a href="#readme-top">[top]</a></p>

© 2023 - present [Ruby Y Wang](https://github.com/ruby-cube)
