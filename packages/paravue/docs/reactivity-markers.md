#### [goto: src](https://github.com/ruby-cube/rue/tree/main/packages/paravue)
[@rue](https://github.com/ruby-cube/rue#goto-src)  &nbsp;&nbsp;|&nbsp; &nbsp;  [paravue](https://github.com/ruby-cube/rue/tree/main/packages/paravue#goto-src)  &nbsp;&nbsp;|&nbsp; &nbsp; [planified reactivity](https://github.com/ruby-cube/rue/tree/main/packages/paravue/docs/planified-reactivity.md#goto-src)  &nbsp;&nbsp;|&nbsp; &nbsp; **reactivity markers**
# Reactivity Markers

<aside>
⚠️ <b>Experimental:</b> Reactivity Markers is a work-in-progress, not well-tested, with a volatile API. Look and play, but definitely don’t use…
</aside>
<br/>
<br/>

## Overview

Reactivity markers address two seemingly conflicting desires in the Vue community. On the one hand, people have expressed interest in eliminating `.value` , resulting in the experimental but ultimately abandoned Reactivity Transform. On the other hand, people have also expressed appreciation for how `.value` serves to make reactivity more explicit.

This library reduces the need for writing `.value` while providing visual markers for reactivity for both refs and reactives that can be used in both SFC and non-SFC Vue apps.

<br/>

## Installation

```bash
(coming soon ...)
```
</br>

## The API

**for refs:**
- `r$(ref)`
- `set$(ref, value)`

**for reactives:**
- `v$(reactive.prop)`
- `$(reactive.prop = value)`

<br/>

## Reactivity Markers for Refs

```ts
const count = ref(0);


// reactive reads
const doubleCount = computed(() => r$(count) * 2);


// non-reactive reads  (see note on using .value)
if (count.value === 1) {
    /* do stuff */
}


// reactive set
set$(count, count.value + 1)


// being passed around (no reactive marker needed)
doSomething(count)
```

The function calls can potentially be transformed to `.value` during build time. 

Note that I still used `count.value` in the above example. The goal of this library is not to eliminate `.value`. I think it is important for developers to still conceptualize refs as refs so they don't lose sight of the reactivity and special handling it requires. The main goal is to provide reactive markers so the developer can see at a glance where reactivity is happening.

<br/>

## Reactivity Markers for Reactives

The same pattern can be applied to reactive objects:

```js
const item = reactive({
    content: "Type here...",
    bullet: null,
    created: Date()
})


// reactive reads
const enthusedContent = computed(() => v$(item.content) + "!")


// reactive set
$(item.bullet = "•")  // yes, this is valid Javascript


// being passed around (no reactive marker needed)
doSomething(item)
```

Note that in the case of reactive objects, the reactive marker functions do absolutely nothing functionally and simply returns the input value. The sole purpose is to make reactivity explicit to the developer. While this may seem extraneous, it offers consistency between refs and reactives. Any extraneous calls can also be removed during build time.

<br/>

⚠️ **Warning**: There is currently no way to enforce appropriate usage of these functions. It’s purely up to the developer whether the function correctly marks reactivity or not. Since they are cosmetic in nature, their usage can become incongruous during future code edits in a similar way comments can become outdated.

<br/>
<br/> 

## Closing Thoughts

Ultimately, the use of this library is a matter of personal preference. For many, using function calls as reactivity markers may be less pleasant than simply using `.value`. For others, it’s nicer to read `firstName` rather than `firstName.value` , even if it means passing the ref through an extraneous accessor function. 

Aesthetics aside, the primary purpose of this library to make reactive tracking and triggering explicit for both refs and reactive objects.

<br/>
<br/>

[[top]](https://github.com/ruby-cube/rue/tree/main/packages/paravue/docs/reactivity-markers.md#goto-src)

© 2023 - present [Ruby Y Wang](https://github.com/ruby-cube)
