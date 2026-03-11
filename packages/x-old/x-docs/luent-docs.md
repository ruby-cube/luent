# Luent Docs


The consistency and rigor of frameworks like React, Solid, and Angular.
The intuitiveness of frameworks like Vue and Svelte.

## Overview
### Anatomy of an App
### 
---
## Reactive State
Reactivity refers to state changes that trigger tasks, such as view updates. Tasks triggered by state changes are called effects. We link a view update effect to reactive state by binding it to a view template, which under the hood links a DOM-updating function to the reactive state.
### Ions<!-- {"fold":true} -->
Ions are the primary source of reactivity in Luent. There are two main types of ions: atomic ions and derivation ions. To create an atomic ion, we call the `Ion()` function and pass in the ion’s initial state. This gives us an ion—a state getter function with a value property. To access state, we call the ion. To set the state, we set its `value` property. To render it to the view reactively, we simply pass it to the template.

```jsx
function Counter() {

   const $count = Ion(0)
   
   console.log($count()) // 0
   
   return component(
      <div>
         <p>{$count}</p>
		 <button on:click={e => $count.value++}>+</button>
      </div>
   )
}
```

Note that calling an ion before passing it to the template will render the ion statically. This is because we are passing the value to the template rather than a reference to the ion.

```jsx
<p>start count: {$count()}</p> // static rendering (no reactivity)
<p>count: {$count}</p> // renders reactively
```

The above template compiles to the following JavaScript:

```javascript
[
   makeElement('p', {
      children: [ 'start count: ', $count()] // passing the value
   },
   makeElement('p', {
      children: [ 'count: ', $count] // passing the ion
   },
]
```

Under the hood, the `makeElement()` function can then link a DOM manipulation effect to the ion. In the above case, where a text node is being rendered to the screen, it looks something like this:

```javascript
/* code simplified for demonstration purposes */

const textNode = document.createTextNode(ion())

watch(ion, () => {
   textNode.data = ion()
})
```

#### Fine-grained Reactivity
The compiled code above reveals that reactivity in Lumo is fine-grained. That is to say, when state changes, only the affected parts of the template are updated. Components and templates run only once to set everything up, and from then on, ion watchers take care of updates.

> Related article: (LINK: see comparison with Solid.js)

#### Naming Convention
By convention, we prefix the ion variable with a $ to indicate that it is a getter function rather than a direct reference to the state. It’s essentially a shorthand for `get`, e.g. `$count` means `getCount`.  This naming convention highlights the dual nature of ions—technically, it is a container of state and can be passed around by reference, while conceptually, it represents the state itself, making it easier to read in view templates and derivations.

```jsx
<p>{$count}</p> // we're rendering the count
```
```jsx
<p>{getCount}</p> // reads as if we're rendering a function
```
 
Of course, you could be even more concise and name the ion `count`. You’re not required to use the $ prefix. However, you might find it to be a helpful reminder that the variable points to a getter function and not the state itself, reducing cognitive load.

The prefix can also help in certain scenarios, such as:
- easy access to the ions of an ionized object [LINK]
- storing the value in a variable: 
``` typescript
const _count = count()
```
```typescript
const count = $count() 
// no need to ponder what to name the variable, simply remove the $ prefix
```

While the framework encourages $-prefixing, ultimately, it is a matter of preference between technical clarity and visual clarity. 

If you do use $-prefixing, you’ll want to configure your IDE to select the $-character as part of a word.

> Note that the $ prefix does NOT represent reactivity. A function that is not prefixed with a $ may very well be reactive if it calls ions internally. Similarly, a function prefixed with a $ may simply be a non-reactive getter. For example, [[Node Refs|node refs]] in Lumo are non-reactive getters.

#### Cleaner Templates
Despite their benefits, $-prefixing and ion calling do add visual clutter to the template making it less readable. For more readable templates, it’s helpful to configure your IDE’s syntax highlighting to dim any visual clutter. This way you get can maintain technical clarity while gaining slightly more visual clarity.

#### State Reads
We’ve already covered that an ion’s state is accessed by calling it, e.g. `$count()`. Its state can be accessed through its value property, e.g. `$count.value`. However, accessing state this way is discouraged as it is less readable in derivations—the word ‘value’ is more difficult to verbally ignore than dollar signs and parentheses. It is also helpful for mutation tracking purposes to reserve the syntax `$[state].value` for writes. The only places where `value` should be accessed is when using operators such as the increment operator (++) that both read and write.

#### State Writes
We’ve also covered that an ion’s state is set via its value property. [TODO: read/write segregation?] mutation tracking

#### Ion methods
Ions may also be created with methods, 
providing a level of state encapsulation. [TODO:]

```jsx
function Counter() {

   const $count = Ion(0, {
      increment() {
         this.value++
      },
      decrement() {
         this.value--
      }
   })
   
   return component(
      <div>
         <p>{$count}</p>
		 <button on:click={e => $count.increment()}>+</button>
         <button on:click={e => $count.decrement()}>-</button>
      </div>
   )
}
```

[TODO] encapsulation and mutation tracking

### Derivation Ion<!-- {"fold":true} -->
So far, we’ve only seen atomic ions in action. Ions can also form ionic compounds where state is derived from other ions. To create a derivation ion, we call the `Ion()` function, passing in a derivation function instead of an initial state.

```typescript
const $count = Ion(0)
const $doubleCount = Ion(() => $count() * 2)
```

Now, whenever `$count`’s state changes, `$doubleCount`’s state will also change. 

Derivations are a simple and concise way to keep state consistent with each other and should be preferred over manually syncing a piece of state that depends on other state. Not only is manual syncing more verbose, but if not scheduled correctly, it can lead to inconsistent states, for example `$count()` becoming 1, while `$doubleCount()` remaining 0.

```typescript
// ❌ avoid syncing state like this this:
const $count = Ion(0)
const $doubleCount = Ion(0)

watch($count, () => {
   $doubleCount.value = $count
}, { phase: SYNC }) // (but if you must, schedule it synchronously)
```

#### Memoization
By default, derivation ions memoize state so that computations do not need to be rerun every time you call the derivation ion. This is typically the most efficient behavior. To opt out, pass in the option `'-memoize': false`.

```typescript
const $doubleCount = Ion(() => $count() * 2, { '-memoize': false })
```

> You’ll notice that options for reactive entities are prefixed with a dash. This is to differentiate options from methods.

#### Template derivations
Derivation may also be created impromptu within the template via a special syntax—the ‘pointless’ parentheses. In the template, parentheses that surround expressions for no apparent reason will be compiled to an arrow function.

```jsx
const $count = Ion(0)

<p>{$count} x 2 = {($count() * 2)}</p>
```

… essentially compiles to:

```typescript
makeElement('p', { 
   children: () => [
      $count, 
      ' x 2 = ', 
      () => $count() * 2
   ]
})
```

Here is an example of purposeful parentheses being used to group an expression for type casting purposes. The derivation will not compile to an arrow function and instead the value that the derivation evaluates to is passed to the template.

```jsx
<p>{$count} x 2 = {($count() * 2) as number}</p>
```
```typescript
makeElement('p', { 
   children: () => [
      $count, 
      ' x 2 = ', 
      $count() * 2
   ]
})
```

To pass a derivation function to the template, we would wrap the entire expression with another pair of parentheses:

```jsx
<p>{$count} x 2 = {(($count() * 2) as number)}</p>
```

#### Non-Ion Derivations
As seen above, derivations do not necessarily have to be ions. The following `$doubleCount` is equally valid as a reactive derivation:
```typescript
const $count = Ion(0)
const $doubleCount = () => $count() * 2
```

There are, however, a couple of trivial limitations of non-ion derivations:
- they will not be absorbed into ionic models [LINK] (a trivial concern given that ion absorption is about reducing visual clutter and only helpful in rare cases)
- they will be rejected as input if input is typed as `Ion`. (easily solved by wrapping the non-ion derivation in parentheses and calling it inside the template derivation)
```jsx
<SomeComponent doubleCount={($doubleCount())} />
```

Special types of derivations is covered in More Reactivity: Derivations

#### Deriving based on previous state
Whenever the derivation function is called, it receives the previous state, which can be useful for determining the next state.
```typescript
const $count = Ion(0)
const $doubleCount = Ion(prev => $count() * 2) [[ TODO: need an example ]]
```

prev state
settable derivations
writable derivations

#### Data Structures as State
Often it makes more sense to model state through a data structure rather than a bunch of independent primitives. One approach to [TODO:]

: immutable and mutable

Since ions only trigger effects if the new state is not strictly equal to the previous state, we must create a new object containing the new nested state and set it as the ion’s value. Note that mutating the object will NOT trigger updates:

```typescript
const $box = Ion({ x: 0, y: 0 })

function moveRight() {
   $box.value = { ...$box(), x: $box().x + 10 }
}

function moveRight() {
   $box().x += 10 // ❌ This will not trigger updates:
}

---

<div class='box' 
   style={{ transform: (`translate(${$box().x}px, ${$box().y}px)`) }}
></div>
<button on:click={moveRight}>{`>`}</button>
```


### Ionic Models<!-- {"fold":true} -->
For those who prefer a more intuitive, concise way of updating data structures, Lumo provides another type of ionic compound called ionic models. To create an ionic model, we call the `Ionic` function and pass in the object to be tracked. This will ‘ionize’ the object, turning all its properties into ions, in the form of a JavaScript proxy. Once an object is ionized, mutating it will trigger its effects:

```jsx
const box = Ionic({ x: 0, y: 0 })

function moveRight() {
   box.x += 10
}

---

<div class='box' 
   style={{ transform: (`translate(${box.x}px, ${box.y}px)`) }}
></div>
<p>coordinates: {(box.x)}, {(box.y)}</p>
<button on:click={moveRight}>{`>`}</button>
```

#### Classes
Class instances may also be ionized:
```typescript
class Box {
   x = 0
   y = 0

   moveRight() {
      this.x += 10
   }

   moveDown() {
      this.y += 10
   }
}

---

const box = Ionic(new Box())

---

<button on:click={e => box.moveRight()}>{`>`}</button>
```

Lumo also supports ionizing class instances that contain private properties. See here [LINK]

#### Extending Models
Models may be extended with methods that are more specific to the instance. Here an array that models a basket is extended with an `insertItem` method:
```typescript
const basket = Ionic(['🍄'], {
   insertItem(item: string, index: number) {
      this.splice(index, 0, item)
   }
})

const $selectedItem = Ion('Choose an item')

const items = ['🍀', '🍄', '🌰']

---

<ul class='basket'>
   {For(basket, ($item, index) => 
      <li>
        {$item}
        <button class='insert-btn' 
           on:click={e => basket.insertItem($selectedItem(), index)}
        ></button>
      </li>
   )}
</ul>

<p>{$selectedItem}</p>
<hr></hr>
<h3>Choose an item:</h3>
{For(items, item => 
   <button on:click={e => $selectedItem.value = item}>item</button>
)}

```

#### Proxy Identity Hazards
```typescript
class Swamp {
   frog = new Frog()

   createFrog() {
      const newFrog = this.frog = new Frog()
      newFrog.name = 'kermit'
   } // This would need a custom ionic method def, operate on raw

   getFrogs() {
      return [this.frog, this.frog]
   }
}

// auto-deep-ionize
const swamp = Ionic(new Swamp())

const frog = swamp.frog // Ionic
const 

```
auto-ionize: 
1) deionize target (keep target raw)
2) proxy returns ionized values
3) typescript requires pre-ionization, but will deionize when it sets the property

#### Ionic Nesting
[TODO]



### Watching & Effects<!-- {"fold":true} -->
atCleanup

#### The Render Cycle & Scheduling

### 
---
## Dynamic Templates
Dynamic rendering of templates, such as conditional or iterated templates, is achieved through special template functions. 
### Iteration<!-- {"fold":true} -->
#### `For` Keyed Item

#### `For` Index

#### `Thru`

#### Static `For`


### Control Flow<!-- {"fold":true} -->
#### `If`/`Else`


#### `Match`/`Case`

#### `As`


### Dynamic Views<!-- {"fold":true} -->
Render functions vs components
state within render functions
implicit render function
state kits in render functons [Link]
#### 

### Preserving Views<!-- {"fold":true} -->
By default, conditional views are recreated each time they’re rendered to the screen. In cases where state needs to be preserved when a conditional view unmounts, we can mark a conditional series as a `<remount-view>` render type. This preserves the nodes as well as any state created within the render function without having to ‘lift the state’ up the application tree.

```jsx
<remount-view>
   {If($sidebarOpen,
      <Sidebar></Sidebar> // Sidebar state and DOM nodes are preserved
   )}
   {Else(
      <Icon>{sidebarIcon}</Icon> // Icon DOM nodes are preserved
   )}
</remount-view>
```

We could alternatively pass the render type into the conditional template function to selectively preserve views.

```jsx
{If($sidebarOpen, 'remount',
   <Sidebar></Sidebar> // Sidebar state and DOM nodes are preserved
)}
{Else(
   <SidebarIcon></SidebarIcon> // Icon DOM nodes are created/destroyed
)}
```

#### Discarding remountable views
Remountable views may be manually discarded. Conditional render functions receive the view instance as the first parameter. When the discard method of the view instance is called, the cache is cleared and the next time the view mounts, it will be recreated.

```jsx
const $tab = Ion(0)
const tabViews = []

function closeTab(tab: number) {
   tabViews[tab]()?.discard()
   const index = openTabs.indexOf(tab)
   if ($tab() === tab) {
      $tab.value = openTabs[index + 1] ?? openTabs[index - 1]
   }
   openTabs.remove(tab)
}

---

<ul class="inline">
   {For(openTabs, m => m, tab => (
      <li class={{ selected: ($tab() === tab) }} 
         on:click={e => { !target('.close-btn') && $tab.value = tab }}
      >
         {tabNames[tab]}
         <span class='close-btn' on:click={closeTab}>x</span>
      </li>
   ))}
</ul>
<hr></hr>
{As($tab, { ref: tabViews, index: $tab() },
   <div>
      <Main content={tabContents[$tab()]}></Main>
   </div>
)}
```

#### Toggling CSS Display
Alternatively, if you never need to discard a view and simply need to show/hide an element on screen, toggling the display of the root element of a dynamic view instead of mounting to and unmounting from the DOM. If the dynamic view is stateful, state will be preserved when the view is hidden. Read more about the syntax of toggling CSS display here [LINK]

### Lifecycle hooks<!-- {"fold":true} -->
The instance created by a  are is 

In Lumo, lifecycle hooks are associated with dynamic views rather than components, since components are more or less arbitrary building blocks for your app, while dynamic views are the relevant unit that goes through a cycle of creation and disposal.

#### atCleanup
#### The Render Cycle
Scheduling

#### Template hooks

### 
---
## Events
### Event Binding<!-- {"fold":true} -->
#### Event Capture
### Targeting Elements
### Unbounded Listening<!-- {"fold":true} -->
`listen`
for one-time listeners and impromptu listeners
### 
---
## Styles
### Style Binding<!-- {"fold":true} -->
#### CSS Modules
### Show/Hide<!-- {"fold":true} -->
<show-view>
show-if attribute

### Transitions
### 
---
## Attributes
### Attribute Binding<!-- {"fold":true} -->
attribute names
innerHTML
### Mutable Binding
### 
---
## Component Input
### Tag Setup<!-- {"fold":true} -->
#### Input Validation<!-- {"fold":true} -->
FromTag
Defaults
#### Events
#### Styles
#### Normalization of inputs
#### Mutable Binding<!-- {"fold":true} -->
`mu:`
- Mutation Linter
##### Ion Access [EXPERIMENTAL]

```jsx
const article = Ionic(getArticle())

---
<h1>{(article.title)}</h1>
<article>{(article.content)}</article>
```

```jsx
const article = Ionic(getArticle())

---
<h1>{article.$title}</h1>
<article>{article.$content}</article>
```




### Context Tree<!-- {"fold":true} -->
Distant context
Context key in the template
fromContext
fromRoot
fromGround
### Dependency Injection
### 
---
## More Reactivity
### Finite States
### Writable Derivations<!-- {"fold":true} -->
#### Overwritable Derivations
#### Settable Derivations
### Ionic Tasks<!-- {"fold":true} -->
atCleanup
### Untracked
### Debugging Reactivity<!-- {"fold":true} -->
- Async traces
- `@set`
- log atoms
- console.log ionic models
### Custom Ionic Models
### 
---
## Application Matters
### Node Refs<!-- {"fold":true} -->
#### Node Refs in Iterated Templates
#### Component Refs<!-- {"fold":true} -->
- Absorbed ions?

### State Kits & Services
### Cleanup<!-- {"fold":true} -->
- atCleanup: atMount, watch, queueIonicTask, listen?, ooo.await, fetch/dispatch?, abort signal?
- flasks/scene? batch cleanup?
### Rendering Errors
### Portal<!-- {"fold":true} -->
<o--link>

### Schedulers<!-- {"fold":true} -->
- queuePrelude
- queueLayout
- queueRender
- queuePostlude
- queueTask
### Lazy Loading
### Heavy Updates [EXPERIMENTAL]
### 
---
## Async Rendering
### Await Syntax<!-- {"fold":true} -->
`ooo.await`
- $prelude, $layout, $render, $postlude, $tick
- atCleanup
### Async Ions<!-- {"fold":true} -->
#### Async Template Derivations
### Suspense Ions
### Awaiting Views<!-- {"fold":true} -->
#### `Await`/`Meanwhile`
### Streams
### 
---
## Server-Side
### [PLANNED]
### 
---
## Code Switch
### From React<!-- {"fold":true} -->
- effects as in ‘cause and effect’ vs ‘side effect’
- components run only once

### From Solid<!-- {"fold":true} -->
- Yes! Ions are essentially signals. The original fine-grained implementation of reactivity was created before the framework author was aware of Solid.js. It was, embarrassingly enough, based on a mistaken understanding of how Vue’s reactivity system worked. (I tried my hand at recreating Vue’s reactivity system and was puzzled to find that there was no need to diff a virtual DOM). State getters was influenced by my study of Quill’s codebase.
- independently of work done by other frameworks.   Ryan Carniato is 
- However, since Lumo has been significantly influenced by the brilliant   and insightful articles has helped to shape    
  - normalization of component input
  - derivations need not be special entities, they can simply be functions

- The term “signal” didn’t quite resonate with ‘track’ and ‘trigger’ functions are signals, but the entity that app developers actually touch—the getter and setter and just that—getters and setters. 
- calling signals in template vs passing ion to the template
For those coming from Solid.js, you may be wondering why, in Solid, we call signals in the template while, in Lumo, we pass ions to the template without calling them (in order to render reactively).  This difference boils down to how each framework has decided to compile JSX. Lumo compiles JSX children in the same way React does, which allows for destructuring of component input (props). 

Solid compiles JSX children into a props object of getters, in order to provide an extra conceptual protective measure against mutating component input, the tradeoff being, the inability to destructure component props. 

a different philosophical stance on mutating component input:
Mutating component input is not an evil thing, **as long as the mutation can be tracked at compile-time and traced at runtime**. Lumo provides ways to track and trace mutations as well as protective measures against untracked mutations. [LINK] 

The are benefits to mutating component input. 
- more concise, readable code
- more intuitive than passing in a setter

Solid’s compiler also creates visual consistency between derivations and atomic signals in the template. Lumo, on the other hand, embraces the visual distinction between atomic ions and derivation ions. This distinction mirrors the way you would pass atomic ions into a regular JavaScript function, providing logical consistency of passing in arguments, whether to a template or a function.




### From Svelte<!-- {"fold":true} -->
#### State Access
We’ve seen that Now this may seem like a verbose way to access state. There’s an important reason for containing reactive state withing getter functions rather than directly referencing them. It allows reactive state to be passed into other function scopes and still maintain reference to its state. This is crucial to implementing fine-grained reactivity without the use of compiler magic and breaking language rules. While it may be tempting to [TODO…] for the sake of syntactic elegance, exceptions to the rules adds cognitive load to the process of building an app and makes it bug-prone. [TODO: FINISH] [Should reactivity transform be mentioned here?]

We are looking into the possibility of code transformations to add more visual clarity as well as to further unify the syntax of ‘variable getters’ and property getters. The proposed syntax:

```typescript
get count = Ion(0)
```
```jsx
<p>{(count)}</p>
<button on:click={e => count++}>+</button>
```


But we could also provide a different ‘state has changed’ checker 
```typescript
const $box = Ion({ x: 0, y: 0 }, {
   '@set'({ newValue, value }) {
      return diffProperties(newValue, value)
   }
})

function moveRight() {
   $box().x += 10
   $box.value = $box()
}
```

For better performance, avoid passing objects where methods are the object’s “own property”. Instead, methods should be in the object’s prototype chain. In other words, ionize class instances or object literals without methods. This 
```typescript
// ❌ avoid object literals with methods
const box = Ionic({ 
   x: 0,
   y: 0,

   moveRight() { 
      this.x += 10 
   }
})
```


### From Vue
