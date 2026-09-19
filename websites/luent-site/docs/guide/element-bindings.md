# Element Bindings


## Attributes

JSX attributes may be written as either HTML/SVG attribute names or DOM property names.

**HTML attribute name**
```jsx
<div contenteditable="true">Write something...</div>
```

**DOM property name**
```jsx
<div contentEditable="true">Write something...</div>
```

<p align="right"><a href="#element-bindings" style="text-decoration: none">[top]</a></p>

### Static bindings
Static bindings provide constant values.
```tsx
<div contenteditable={contentEditable}>Write something...</div>
```

<p align="right"><a href="#element-bindings" style="text-decoration: none">[top]</a></p>

### Reactive bindings
To make a binding reactive, pass in a reactive ion.

**Atomic ion**
```tsx
const $disabled = ion(false);
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

```jsx
function Text(setup: FromTag<{
  isEditor: Ion<boolean>
  isActive: Ion<boolean>
}>) {
  const { isEditor, isActive } = setup
  const $text = ion('Write something...')
  return <>
    <div contenteditable={() => $isEditor() && $isActive()}>{$text}</div>
  </>
}
```
:::

<p align="right"><a href="#element-bindings" style="text-decoration: none">[top]</a></p>

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

## Events

Event handlers may be registered with event binding syntax, which binds an event handler function to events prefixed with the `on` namespace. This differs from inline HTML events, which bind scripts rather than functions. Under the hood, Luent attaches the event handler to the element with `Element.addEventListener()` and registers cleanup for when the view is discarded.

```tsx
<button on:click={submit}>submit</button>
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

```tsx
<button onv:click={submit}>submit</button>
```

### Targeted Event Handling

Luent extends the native event object with a method that checks if a selector matches the event target. This can be used to filter out specific event targets.

```tsx
<div on:click={(e) => e.from(".delete-btn") || selectItem(id)}>
  <button class="delete-btn">X</button>
  {item}
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

```tsx
<o--document on:click={deselect} />
```

```tsx
<o--body on:click={deselect} />
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

## Styles

Luent supports static and reactive style bindings through the `class`, `microclass`, and `style` attributes.

### Class attribute

The `class` attribute may be written as a string, ion, object, or array.

#### Static classes

For static classes, pass a string.

```tsx
<div class="square"></div>
```

#### Reactive classes

The class attribute may be reactively updated through ions, either passed directly to the attribute or through object notation.

**Ion notation**

```tsx
const $shape = ion("circle" as "square" | "circle");
```

```tsx
<div class={$shape}></div>
```

**Object notation**

```tsx
const $selected = ion(false);
```

```tsx
<div class={{ selected: $selected, "list-item": () => $count() > 1 }}></div>
```

Luent adds each class when its value is truthy and removes any classes with falsey values. Object notation is preferred for fine-grained updates.

Since some class names may be hyphenated, it is recommended to wrap classes in quotes for visual consistency.

#### Mixing dynamic and static classes

Static and dynamic classes may be mixed with object or array notation.

**Object notation**

```tsx
<div class={{ square: true, selected: $selected }}></div>
```

**Array notation**

```tsx
<div class={["square", { selected: $selected }]}></div>
```

### Microclass attribute

<div class='section-tags'>
<span class='doc-tag'>WIP</span><span class='doc-tag'>Experimental</span>
</div>

The `microclass` attribute is designed for utility-style class composition.

Unlike the standard `class` attribute, microclasses participate in utility class merging, especially when composed across component boundaries through [forwarded bindings](/guide/component-bindings#forwarded-bindings). This allows conflicting utility classes to be resolved predictably through utility merge strategies such as `twMerge()`.

#### Static microclasses

```tsx
<div microclass="size-2.5 rotate-45 rounded-[2px] bg-foreground fill-foreground z-50"></div>
```

#### Reactive microclasses

Reactive microclass strings may be generated through ionic derivations.

**with class ions**

```tsx
const $rotation = ion(45);
```

```tsx
<div
  microclass={() =>
    `size-2.5 rotate-${$rotation()} rounded-[2px] bg-foreground fill-foreground z-50`
  }
></div>
```

**with boolean ions**

```tsx
const $rounded = ion(true);
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

```tsx
<div style="background-color: #efefef"></div>
```

#### Reactive styles

**Ion notation**

```tsx
<div style={() => `background-color: ${$darkMode() ? "#222" : "#fff"}`}></div>
```

**Object notation**

```tsx
<div
  style={{ "background-color": () => ($darkMode() ? "#222" : "#fff") }}
></div>
```

For reactive styles, object notation is preferred for readability and fine-grained updates. Style property names should be written as CSS property names and wrapped in quotes.

## Slot

### Text nodes

```tsx
<div>count: {$count}</div>
```
:::info transpiled
```tsx
jsx('div', { Slot: () => ['count: ', $count] })
```
:::


### Text content
```tsx
<div>
  {{ text: $text }}
</div>
```

```tsx
<textarea>
  {{ 'mu:text': $text }}
</textarea>
```

### Inner HTML
```tsx
<div>
  {{ HTML: $text }}
</div>
```
```tsx
<div>
  {{ 'mu:HTML': $text }}
</div>
```
```tsx
<div>
  {{ trustedHTML: $text }}
</div>
```
