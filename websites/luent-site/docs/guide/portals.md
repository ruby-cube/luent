# Portals
Portals allow content to be mounted into another part of the DOM while remaining logically associated with its original component.

## The Portal Tag
The portal tag renders its children into the parent element specified by its `to` attribute. The `to` attribute accepts either a DOM node or a selector string.
```tsx
function NotificationButton(setup: FromTag<{
  sidebar: HTMLElement | string,
  count: Ion<number>
}>) {
  const { sidebar, $count } = setup
  const $show = ion(false, {
    toggle() { $show.value = !$show.value }
  })

  return component(
    <>
      <button on:click={$show.toggle}>
        {() => $show() ? 'Hide' : 'Show'} notifications
      </button>

      {If($show,
        <o--portal to={sidebar}>
          <aside class='notification-badge'>
            {$count} unread notifications
          </aside>
        </o--portal>
      )}
    </>
  )
}
```

## Built-in portals
Luent provides 5 built-in portal tags, `<o--window>`, `<o--document>`, `<o--html>`, `<o--head>` and `<o--body>`, as shorthands for `<o--portal to='body'>`, etc. They can also be used to [register events](/guide/event-bindings).
```tsx
<o--body>
  <Modal message={msg}/>
</o--body>
```

## Head elements
Elements may also be prefixed with `o-` as shorthand for rendering them into the document `<head>`. This is particularly useful for declaring stylesheets, metadata, and other head elements directly from components.

```tsx
<o-link href='/src/counter.css' rel='stylesheet'/>
```