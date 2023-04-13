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

This library eliminates the need for writing `.value` while providing visual markers for reactivity for both refs and reactives that can be used in both SFC and non-SFC Vue apps.

<br/>

## Installation

```bash
(coming soon ...)
```
</br>

## The API

**for refs:**
- `r$(ref)`
- `nr(ref)`
- `set$(ref, value)`

**for reactives:**
- `v$(reactive.prop)`
- `nv(reactive.prop)`
- `set$: reactive.prop = value`

<br/>

## Reactivity Markers for Refs

```ts
const firstName = ref("Kermit");
const lastName = ref("The Frog");


// reactive reads
const fullName = computed(() => r$(firstName) + " " + r$(lastName));


// "non-reactive" reads
if (nr(firstName).startsWith("K")) {
    // do this
}


// reactive set
set$(firstName, "Sir Robin")


// being passed around (no reactive marker needed)
doSomething(firstName)
```

Note that the difference between `r$` and `nr` is purely cosmetic. They are the same function, which returns the `.value` value; the name difference simply allows the developer to see at a glance where reactive tracking is happening.

The function calls can potentially be transformed to `.value` during build time.

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


// "non-reactive" reads
if (bullet === nv(item.bullet)) {
   // do that
}


// reactive set
set$: item.bullet = "•"  // co-opting Javascript labels*


// being passed around (no reactive marker needed)
doSomething(item)
```

Note that in the case of reactive objects, the reactive marker functions do absolutely nothing functionally and simply returns the input value. The sole purpose is to make reactivity explicit to the developer. While this may seem extraneous, it offers consistency between refs and reactives as well as keeps the door open for potential build time transformations, such as transforming `nv(item.bullet)` to `toRaw(item).bullet`. Any extraneous calls can also be removed during build time.

⚠️ * co-opting Javascript’s features is controversial.. but it’s temptingly the most elegant and least error-prone solution as compared to alternatives:
- passing in key and value, `set$(item, “bullet”, “•”)`
- callback, `set$(() ⇒ item.bullet = “•”)` 
- co-opting a function call, `set$(item.bullet = “•”)` (yes, this is valid javascript)

⚠️ **Warning**: There are no safeguards in place for appropriate usage of these functions. It’s purely up to the developer whether the function correctly marks reactivity or not. Since they are cosmetic in nature, their usage can become incongruous during future code edits in a similar way comments can become outdated.

<br/>
<br/> 

## Closing Thoughts

Ultimately, the use of this library is a matter of personal preference. For many, using function calls as reactivity markers may be less pleasant than simply using `.value`. For others, it’s nicer to read `firstName` rather than `firstName.value` , even if it means passing the ref through an extraneous accessor function. 

Aesthetics aside, the primary purpose of this library to make reactive tracking and triggering explicit for both refs and reactive objects.

<br/>
<br/>

[[top]](https://github.com/ruby-cube/rue/tree/main/packages/paravue/docs/reactivity-markers.md#goto-src)

© 2023 - present [Ruby Y Wang](https://github.com/ruby-cube)
