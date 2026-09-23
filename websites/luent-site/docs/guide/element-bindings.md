# Element Bindings


## Attributes

JSX attributes may be written as either HTML/SVG attribute names or DOM property names.

**With HTML attribute name**
```nsx
<div contenteditable="true">Write something...</div>
```
```tsx
<div contenteditable="true">Write something...</div>
```

**With DOM property name**
```nsx
<div contentEditable="true">Write something...</div>
```
```tsx
<div contentEditable="true">Write something...</div>
```


### Static bindings
Static bindings provide constant values.
```nsx
<div contenteditable={contentEditable}>Write something...</div>
```
```tsx
<div contenteditable={contentEditable}>Write something...</div>
```


### Reactive bindings
To make a binding reactive, pass in an ion.

**Atomic ion**
```nsx
get disabled = ion(false);
```
```tsx
const $disabled = ion(false);
```
```nsx
<button on:click={open} disabled={disabled@}>
  open
</button>
```
```tsx
<button on:click={open} disabled={$disabled}>
  open
</button>
```

**Compound ion**
```nsx
<button 
  on:click={increment} 
  disabled={(count === limit)@}
>+</button>
```
```tsx
<button 
  on:click={increment} 
  disabled={() => $count() === limit}
>+</button>
```

:::warning Potentially inert ions
Keep in mind that since component setup bindings are [normalized to ions](/guide/components.html#ion-normalization), ions derived from inputs are potentially inert. Passing in an externally derived ion therefore does not guarantee reactivity.

```nsx
function Text(setup: FromTag<{
  isEditor: Ion<boolean>
  isActive: Ion<boolean>
}>) {
  const { isEditor@, isActive@ } = setup;
  get html = ion('Write something...')
  return <>
    <div contenteditable={() => isEditor && isActive} mu:HTMLSlot>
      {html@}
    </div>
  </>
}
```
```tsx
function Text(setup: FromTag<{
  isEditor: Ion<boolean>
  isActive: Ion<boolean>
}>) {
  const { $isEditor, $isActive } = setup;
  const $html = ion('Write something...')
  return <>
    <div contenteditable={() => $isEditor() && $isActive()} mu:HTMLSlot>
      {$html}
    </div>
  </>
}
```
:::


### Mutable bindings
See [Mutation safety: Element bindings](/guide/mutation-safety#element-bindings).

<!-- 
Under the hood, Luent applies each binding using the appropriate DOM mechanism. Most standard attributes are applied through property assignment, while `data-*` and ARIA attributes are applied through `Element.setAttribute()`.

### Property assignment


:::info under the hood

```js
element[toDOMProperty(attribute)] = value;
```

:::

### Attribute update

```jsx
<div class="callout" data-variant="warning">
  ...
</div>
```

:::info under the hood

```js
element.setAttribute(attribute, value);
```

::: -->

<p align="right"><a href="#element-bindings" style="text-decoration: none">[top]</a></p>

## Events

Event handlers may be registered with event binding syntax, which binds an event handler function to events prefixed with the `on` namespace. This differs from inline HTML events, which bind scripts rather than functions. Under the hood, Luent attaches the event handler to the element with `Element.addEventListener()` and registers cleanup for when the view is discarded.

```nsx
<button on:click={submit}>submit</button>
```
```tsx
<button on:click={submit}>submit</button>
```

```nsx
<button on:click={(e) => console.log("clicked", count++)}>+</button>
```
```tsx
<button on:click={(e) => console.log("clicked", count++)}>+</button>
```

:::info under the hood

```js
element.addEventListener(event, handler);
view.onDiscard(() => element.removeEventListener(event, handler));
```

:::

### Event Capture

To handle an event during the capture phase, postfix the `on` namespace with a `v`, which visually represents downward event propagation.

```nsx
<button onv:click={submit}>submit</button>
```
```tsx
<button onv:click={submit}>submit</button>
```

### Targeted Event Handling

Luent extends the native event object with a method that checks if a selector matches the event target. This can be used to filter out specific event targets.

```nsx
<div on:click={(e) => e.from(".delete-btn") || selectItem(id)}>
  <button class="delete-btn">X</button>
  {item}
</div>
```
```tsx
<div on:click={(e) => e.from(".delete-btn") || selectItem(id)}>
  <button class="delete-btn">X</button>
  {item}
</div>
```

```nsx
<div on:click={(e) => e.from("p") && selectItem(e.target.dataset.id)}>
  <h1>{heading}</h1>
  {For(items, (item) => (
    <p data-id={item.id}>{item}</p>
  ))}
</div>
```
```tsx
<div on:click={(e) => e.from("p") && selectItem(e.target.dataset.id)}>
  <h1>{heading}</h1>
  {For(items, (item) => (
    <p data-id={item.id}>{item}</p>
  ))}
</div>
```

### Portal events

To handle events on the window, document, html, head, or body, use the built-in [portal tags](/guide/portals#built-in-tags).

```nsx
<o--document on:click={deselect} />
```

```tsx
<o--document on:click={deselect} />
```
<!-- 
### Transient Listeners

For transient event listeners whose lifetime should not span the lifetime of its encompassing view, Luent provides `listen()`.
It is recommended over `Element.addEventListener()` as it provides automatic cleanup and ensures that any reactions triggered during the event do not block rendering.

`listen()` is useful for

- one-time listeners
- temporary listeners
- abortable listeners

**one-time listener**

```tsx
listen(window, "keydown", (e) => {
  if (e.key === "Escape") close();
}, { once: true });
```

**temporary listener**

```tsx
function initDrag() {
  const dragging = $thisScene();

  listen(window, "mousemove", drag);
  listen(window, "mouseup", () => {
    endDrag();
    dragging.end();
  });
}
```

**abortable listener**

```tsx
const controller = new AbortController();

listen(window, "mousemove", animateMouseTail, {
  signal: controller.signal,
});

listen(window, "mousedown", () => {
  endMouseTail();
  controller.abort();
}, { signal: controller.signal });
``` -->

<p align="right"><a href="#element-bindings" style="text-decoration: none">[top]</a></p>

## Styles

Luent supports static and reactive style bindings through the `class`, `microclass`, and `style` attributes.

### Class attribute

The `class` attribute may be written as a string, ion, object, or array.

#### Static classes

For static classes, pass a string.

```nsx
<div class="square"></div>
```
```tsx
<div class="square"></div>
```

#### Reactive classes

The class attribute may be reactively updated through ions, either passed directly to the attribute or through object notation.

**Ion notation**

```nsx
get shape = ion("circle" as "square" | "circle");
```
```tsx
const $shape = ion("circle" as "square" | "circle");
```

```nsx
<div class={shape@}></div>
```
```tsx
<div class={$shape}></div>
```

**Object notation**

```nsx
get selected = ion(false);
```
```tsx
const $selected = ion(false);
```

```nsx
<div class={{ "selected": selected@, "list-item": (count > 1)@ }}></div>
```
```tsx
<div class={{ "selected": $selected, "list-item": () => $count() > 1 }}></div>
```

Luent adds each class when its value is truthy and removes any classes with falsey values. Object notation is preferred for fine-grained updates.

Since some class names may be hyphenated, it is recommended to wrap classes in quotes for visual consistency.

#### Mixing dynamic and static classes

Static and dynamic classes may be mixed with object or array notation.

**Object notation**

```nsx
<div class={{ "square": true, "selected": selected@ }}></div>
```
```tsx
<div class={{ "square": true, "selected": $selected }}></div>
```

**Array notation**

```nsx
<div class={["square", { "selected": selected@ }]}></div>
```
```tsx
<div class={["square", { "selected": $selected }]}></div>
```

### Microclass attribute

<div class='section-tags'>
<span class='doc-tag'>WIP</span><span class='doc-tag'>Experimental</span>
</div>

The `microclass` attribute is designed for utility-style class composition.

Unlike the standard `class` attribute, microclasses participate in utility class merging, especially when composed across component boundaries through [forwarded bindings](/guide/component-bindings#forwarded-bindings). This allows conflicting utility classes to be resolved predictably through utility merge strategies such as `twMerge()`.

#### Static microclasses

```nsx
<div microclass="size-2.5 rotate-45 rounded-[2px] bg-foreground fill-foreground z-50"></div>
```
```tsx
<div microclass="size-2.5 rotate-45 rounded-[2px] bg-foreground fill-foreground z-50"></div>
```

#### Reactive microclasses

Reactive microclass strings may be generated through ionic derivations.

**with class ions**

```nsx
get rotation = ion(45);
```
```tsx
const $rotation = ion(45);
```

```nsx
<div
  microclass={(
    `size-2.5 rotate-${rotation} rounded-[2px] bg-foreground fill-foreground z-50`
  )@}
></div>
```
```tsx
<div
  microclass={() =>
    `size-2.5 rotate-${$rotation()} rounded-[2px] bg-foreground fill-foreground z-50`
  }
></div>
```

**with boolean ions**

```nsx
get rounded = ion(true);
```

```tsx
const $rounded = ion(true);
```

```nsx
<div
  microclass={(
    `size-2.5 rotate-45 ${rounded ? "rounded-[2px]" : ""} bg-foreground fill-foreground z-50`
  )@}
></div>
```
```tsx
<div
  microclass={() =>
    `size-2.5 rotate-45 ${$rounded() ? "rounded-[2px]" : ""} bg-foreground fill-foreground z-50`
  }
></div>
```

### Style attribute

The `style` attribute may be written as a string or an object.

#### Static styles

```nsx
<div style="background-color: #efefef; color: red">Hello world</div>
```
```tsx
<div style="background-color: #efefef; color: red">Hello world</div>
```

#### Reactive styles

**...via ion**

A style ion updates the value of the style attributes. For even more fine-grained updates, use style objects or the `css` tag function.
```nsx
<div style={(`
  background-color: ${darkMode ? "#222" : "#fff"};
  color: red
`)@}>Hello world</div>
```
```tsx
<div style={() => `
  background-color: ${$darkMode() ? "#222" : "#fff"};
  color: red
`}>Hello world</div>
```

**...via object**

A style object enables Luent to update at the level of style properties. Style property names should be written as CSS property names and wrapped in quotes.
```nsx
<div style={{ 
  'background-color': (darkMode ? "#222" : "#fff")@
  'color': 'red'
}}>Hello world</div>
```
```tsx
<div style={{ 
  'background-color': () => $darkMode() ? "#222" : "#fff" 
  'color': 'red'
}}>Hello world</div>
```

<b>...via the <code>css</code> tag function</b>

The `css` tag function returns a style object. The syntax allows drop-in migration between style bindings and stylesheets.
```nsx
<div style={css`
  background-color: ${($darkMode ? "#222" : "#fff")@};
  color: red;
`}>Hello world</div>
```
```tsx
<div style={css`
  background-color: ${() => $darkMode() ? "#222" : "#fff"};
  color: red;
`}>Hello world</div>
```

<p align="right"><a href="#element-bindings" style="text-decoration: none">[top]</a></p>


## Slot

### Text nodes

```nsx
<div>count: {count@}</div>
```
```tsx
<div>count: {$count}</div>
```
:::info transpiled
```jsx
jsx('div', { Slot: () => ['count: ', $count] })
```
:::

### Textarea
```nsx
<textarea mu:TextSlot>{text@}</textarea>
```
```tsx
<textarea mu:TextSlot>{$text}</textarea>
```

### Inner HTML

```nsx
<div trusted:HTMLSlot>{html@}</div>
```
```tsx
<div trusted:HTMLSlot>{$html}</div>
```

```nsx
<div mu:HTMLSlot>{html@}</div>
```
```tsx
<div mu:HTMLSlot>{$html}</div>
```

```nsx
<div HTMLSlot>{html@}</div>
```
```tsx
<div HTMLSlot>{$html}</div>
```

<p align="right"><a href="#element-bindings" style="text-decoration: none">[top]</a></p>
