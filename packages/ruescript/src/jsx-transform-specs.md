### Render function implicit return
Render functions are functions that contain jsx expressions at the root level (not assigned to a variable or passed into an argument).
- [ ] Render functions that are block bodied will auto-return root level jsx expressions

 ```tsx
const renderTodo = (todo) => {
   const something = getSomething();
   <li>
      {something}
   </li>
}

const renderTodo = (todo) => {
   const something = getSomething();
   return <li>
      {something}
   </li>
}
```

```tsx
const renderTodo = (todo) => {
   const something = getSomething();
   <li>
      {something}
   </li>
   <li>
      {something}
   </li>
}

const renderTodo = (todo) => {
   const something = getSomething();
   return <li>
      {something}
   </li>
   return <li>
      {something}
   </li>
}
```


### Slot transform
- slots are transformed into render functions-- all expressions are auto wrapped in a jsx-fragment
```tsx

<li>
   <label>
      {other}
   </label>
   <label>
      {other}
   </label>
</li>

<li Slot={() => {
   return <>
      <label>
         {other}
      </label>
      <label>
         {other}
      </label>
   </>
}} />

```

### JSX Statements
- statements are wrapped in double curly braces
- statements cannot appear after jsx expressions
Note: Use cases are extremely rare--only useful for component slots that render slot conditionally
```tsx

<Tooltip>
   {{const other = foo()}}
   {{const another = foo()}}
   <label>
      {other}
   </label>
   <label>
      {another}
   </label>
</Tooltip>


<Tooltip Slot={() => {
   const other = foo();
   const another = foo();
   return <>
      <label>
         {other}
      </label>
      <label>
         {another}
      </label>
   </>
}} />

```

```tsx

<li>
   {{const other = foo()}}
   <label>
      {other}
   </label>
   {{const another = foo()}}
   <label>
      {another}
   </label>
</li>

<li Slot={() => {
   const other = foo()
   return <>
      <label>
         {other}
      </label>
      {{const another = foo()}} // SyntaxError
      <label>
         {another}
      </label>
   </>
}} />
```

```tsx
<li>
   {{const other = foo()}}
   {If(something, 
      <div></div>
   )}
</li>

<li Slot={() => {
   const other = foo();
   return <>
      {If(something, 
         <div></div>
      )}
   </>
}} />
```

### Implicit Template Render Functions & JSX Fragment
- [ ] the last argument of template functions are normalized to render functions with jsx fragment as root
```tsx
<li>
   {If(something,
      <div></div>
      <div></div>
   )}
</li>

<li>
   {If(something, () => {
      return <><div></div>
         <div></div>
      </>
   })}
</li>
```

```tsx
<li>
   {If(something, 
      hello world
   )}
</li>

<li>
   {If(something, () => {
      return <>hello world</>
   })}
</li>

<li>
   {If(something, 
      {If(other,
         <div>hi</div>
      )}
   )}
</li>

<li>
   {If(something, () => {
      return <>{If(other,
         <div>hi</div>
      )}</>
   })}
</li>

<li>
   {If(something, () => {
      return <div></div>
   })}
</li>
```


### Attribute shorthand
```tsx
const frog;
<div {frog}></div>
```
-->
```tsx
const frog;
<div frog={frog}></div>
```

### Component Tag
```tsx
function Compo() {
   <Component as={exposed}>
      <div></div>
   </Component>
}

function Compo() {
   return Component.as(exposed)(<>
      <div></div>
   </>)
}
```


### Conformance checklist
| Area | Example input | Expected transform behavior | Must diagnostic? |
|---|---|---|---|
| JSX shorthand | parenthesized multi-node JSX | rewrites to fragment shorthand; comments preserved | No |



### Cancelled

---

### JSX fragment shorthand
- [ ] transform jsx templates encased in extraneous parentheses (make sure transform is comment-safe):
```
(
   <div></div>
   <div></div>
)
```

-->

```
<>
   <div></div>
   <div></div>
</>
```