# Portals
Portals allow content to be mounted into another part of the DOM while remaining logically associated with its original component.

## The `<o--portal>` tag
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
Luent provides two built-in portal tags, `<o--body>` and `<o--head>`, as shorthands for `<o--portal to='body'>` and `<o--portal to='head'>`
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