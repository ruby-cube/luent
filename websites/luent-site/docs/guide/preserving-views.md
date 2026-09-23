# Preserving Views
By default, conditional views are recreated each time they are rendered. 

In cases where state should persist when a conditional view is unmounted, a conditional series may be wrapped in a `<o:preserve>` node. This preserves a view's DOM nodes as well as any state created within the render function, without having to lift state higher in the application tree. 

When the view becomes active again, Luent will remount the preserved nodes rather than recreating the view.

```nsx
<o:preserve>
  {If(sidebarOpen@,
    <Sidebar></Sidebar> // Sidebar state and DOM nodes are preserved
  )}
  {Else(
    <Icon>{sidebarIcon}</Icon> // Icon DOM nodes are preserved
  )}
</o:preserve>
```
```tsx
<o:preserve>
  {If($sidebarOpen,
    <Sidebar></Sidebar> // Sidebar state and DOM nodes are preserved
  )}
  {Else(
    <Icon>{sidebarIcon}</Icon> // Icon DOM nodes are preserved
  )}
</o:preserve>
```
:::details CODE SWITCH
**React:** `<Activity mode={...}>`

**Vue:** `<KeepAlive>`
:::

Views may also be selectively preserved by passing in the view type, 'preserve'. The default view type is 'create'.

```nsx
{If(sidebarOpen@, 'preserve',
  <Sidebar></Sidebar> // Sidebar state and DOM nodes are preserved
)}
{Else(
  <SidebarIcon></SidebarIcon> // Icon DOM nodes are created/destroyed
)}
```
```tsx
{If($sidebarOpen, 'preserve',
  <Sidebar></Sidebar> // Sidebar state and DOM nodes are preserved
)}
{Else(
  <SidebarIcon></SidebarIcon> // Icon DOM nodes are created/destroyed
)}
```

#### Discarding preserved views
Views may also be preserved by creating a view ref and passing it as the view type in place of 'preserve'. Luent will populate the view ref with a view instance containing a `markDiscard` method. When `markDiscard` is called, the cache is cleared and the next time the view mounts, it will be recreated.

```nsx
function Foo() {
  get sidebarOpen = ion(true)
  get sidebarView = ViewRef()

  function closeSidebar() {
    sidebarView?.markDiscard()
    hideSidebar()
  }

  function hideSidebar() {
    sidebarOpen = false
  }
  
  <:>
    <main>
      <Articles/>
    </main>
    {If(sidebarOpen@, sidebarView,
      <Sidebar 
        hide={hideSidebar}
        close={closeSidebar}
      />
    )}
  </:>
}
```

```tsx
function Foo() {
  const $sidebarOpen = ion(true)
  const $sidebarView = ViewRef()

  function closeSidebar() {
    $sidebarView()?.markDiscard()
    hideSidebar()
  }

  function hideSidebar() {
    $sidebarOpen.value = false
  }
  
  return <>
    <main>
      <Articles/>
    </main>
    {If($sidebarOpen, sidebarView,
      <Sidebar 
        hide={hideSidebar}
        close={closeSidebar}
      />
    )}
  </>
}
```

<p align="right"><a href="#preserving-views" style="text-decoration: none">[top]</a></p>
