# Error rendering
`Try`/`Catch` render a fallback when part of a view throws during rendering. `Try()` delineates the scope of the error boundary, which extends until nested `Try`/`Catch`s. 

The render function passed to `Catch()` receives the thrown error and a retry function that attempts to render the failed view again.

```nsx
<div>
  {Try(
    <Foo/>
  )}
  {Catch((error, retry) =>
    <ErrorNotice error={error} retry={retry}/>
  )}
</div>
```
```tsx
<div>
  {Try(
    <Foo/>
  )}
  {Catch((error, retry) =>
    <ErrorNotice error={error} retry={retry}/>
  )}
</div>
```

## Rendering errors elsewhere
Errors do not need to be rendered in place of the failed view. Use `ErrableView()` when error state should be exposed elsewhere. This is useful when the error UI belongs in a shared location, such as a banner, sidebar, toast region, or page-level notice.

```nsx
function FooApp() {
  const errable = ErrableView()

  <:>
    <Notices>
      {If(errable.error@, 
        <ErrorNotice error={errable.error} retry={() => errable.retry()}/>
      )}
    </Notices>
    <div>
      <h1>Welcome</h1>
      {Try(
        <Foo/>
      )}
      {Catch(errable)}
    </div>
  </:>
}
```

```tsx
function FooApp() {
  const errable = ErrableView()

  return <>
    <Notices>
      {If($$(errable).error, 
        <ErrorNotice error={errable.error} retry={() => errable.retry()}/>
      )}
    </Notices>
    <div>
      <h1>Welcome</h1>
      {Try(
        <Foo/>
      )}
      {Catch(errable)}
    </div>
  </>
}
```