#### [goto: src](https://github.com/ruby-cube/rue/tree/main/packages/pecherie)
[@rue](https://github.com/ruby-cube/rue#goto-src)  &nbsp;&nbsp;|&nbsp; &nbsp;  [planify](https://github.com/ruby-cube/rue/tree/main/packages/planify#goto-src)  &nbsp;&nbsp;|&nbsp; &nbsp; [thread](https://github.com/ruby-cube/rue/tree/main/packages/thread#goto-src)  &nbsp;&nbsp;|&nbsp; &nbsp; **pecherie**  &nbsp;&nbsp;|&nbsp; &nbsp; [archer](https://github.com/ruby-cube/rue/tree/main/packages/archer#goto-src)
# Pêcherie 🐟

<aside>
⚠️ <b>Experimental:</b> Pêcherie is a work-in-progress, not well-tested nor optimized, with a volatile API. Look and play, but definitely don’t use…
</aside>
<br/>
<br/>

## Overview

Pêcherie is an exploration into how to make asynchronous and event-driven programming more developer-friendly. It exposes an API that creates custom events (referred to as hooks in this library), targeted and un-targeted.

Pêcherie is based on the Planify event system. See [Planify](https://github.com/ruby-cube/rue/tree/main/packages/planify#goto-src) for an overview of foundational concepts as well as examples and explanations of one-time listeners vs sustained listeners, preventing memory leaks, and targeted listeners.

<br/>

## Installation

```bash
(coming soon ...)
```
</br>

## Table of Contents

- [Pêcherie API](https://github.com/ruby-cube/rue/tree/main/packages/pecherie#pecherie-api)
- [Hook Configuration](https://github.com/ruby-cube/rue/tree/main/packages/pecherie#hook-configuration)
- [Target IDs](https://github.com/ruby-cube/rue/tree/main/packages/pecherie#target-ids)

<br/>

## Pecherie API

[`createHook(config)`](https://github.com/ruby-cube/rue/tree/main/packages/pecherie#createhookconfig)

[`createTargetedHook(config)`](https://github.com/ruby-cube/rue/tree/main/packages/pecherie#createtargetedhookconfig)

<br/>

## `createHook(config)`

Creates an un-targeted hook.
<br/>

### **Syntax**

```tsx
const [emitter, listener] = createHook(config);
          |         |                    |
      CastHook      |               OptionalConfig
                    |
            SustainedListener | OneTimeListener
```

### Basic Usage

```jsx
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

```tsx
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

```tsx
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
<br/>

## `createTargetedHook(config)`

Creates a targeted hook. Emitters can target listeners using a target id.
<br/>

### Syntax

```tsx
const [emitter, listener] = createTargetedHook(config);
          |         |                            |
      CastHook      |                          Config
                    |
            SustainedListener | OneTimeListener
```

### Basic Usage

```tsx
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

```jsx
// module B (consumer)

function initFormatting(doc: Doc){
    onTablePopulated(doc, ()=>{   // only this doc's callback will run
        // do work
    })
}
```

### Type Definitions

```tsx
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
<br/>

## Hook Configuration

- `hook`: *(optional)* name of the hook
- `data`: *(optional)* data to pass to the listener
- `dataAsArg`: *(optional)* by default, the emitter will pass a context object to the listener that may include a `hook` and `data` property as well as any `methods` defined by the `reply` option. You can choose to directly pass the data as the argument to the listener if there is no `reply` defined. Defaults to `false`.
- `onceAsDefault`: *(optional)* by default, listeners are created as `SustainedListener`. If you would like the listener to be created as a `OneTimeListener`, set this option to `true`. Note that due to listener morphing, `SustainedListener` and `OneTimeListener` can behave as either sustained listeners or one-time listeners depending on the options passed in or the context of use.
- `reply`: *(optional)* a factory function that generates state and methods to operate on that state. The listener can communicate back to the emitter by calling its methods. The mutated state will then be returned from the emitter.
    
    ```tsx
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
    
    ```tsx
    // module B (consumer)
    
    function initFormatting(){
        beforePopulated((context)=>{
            context.preventDefault();  // communicate to the hook's source
            // do better work...
        })
    }
    ```
<br/>

## Target IDs

The targetID can be any type so long as the emitter module and listener module agree on what to use as an identifier. See [Planify: Targeted Listeners](https://github.com/ruby-cube/rue/tree/main/packages/planify#targeted-listeners) for more information on targeted listeners and how to generate deterministic target ids.

<br/>
<br/>

[[top]](https://github.com/ruby-cube/rue/tree/main/packages/pecherie#goto-src)

© 2023 - present [Ruby Y Wang](https://github.com/ruby-cube)
