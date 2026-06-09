# Preserving Views
By default, conditional views are recreated each time they are rendered. 

In cases where state should persist when a conditional view is unmounted, a conditional series may be wrapped in a `<remount-view>` node. This preserves a view's DOM nodes as well as any state created within the render function, avoiding the need to lift state higher in the application tree. 

When the view becomes active again, Luent will remount the preserved nodes rather than recreating the view.

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

Views may also be selectively preserved by passing in the mount type, 'remount'. The default mount type is 'create'.

```jsx
{If($sidebarOpen, 'remount',
  <Sidebar></Sidebar> // Sidebar state and DOM nodes are preserved
)}
{Else(
  <SidebarIcon></SidebarIcon> // Icon DOM nodes are created/destroyed
)}
```

#### Discarding preserved views
Views may also be preserved by creating a view ref and passing it as the mount type in place of 'remount'. Luent will populate the view ref with a view instance containing a `markDiscard` method. When `markDiscard` is called, the cache is cleared and the next time the view mounts, it will be recreated.

```jsx
function Foo() {
  const sidebarView = ViewRef()

  function closeSidebar() {
    sidebarView()?.markDiscard()
    hideSidebar()
  }

  function hideSidebar() {
    $sidebarOpen.value = false
  }
  
  return component(
    <>
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
  )
}
```

