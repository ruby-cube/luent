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

const renderTodo = (todo) => {
   const something = getSomething();
   return makeElement('li', {
      children: something
   })
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

const renderTodo = (todo) => {
   const something = getSomething();
   return makeElement('li', {
      children: something
   })
   return makeElement('li', {
      children: something
   })
}
```


### JSX fragment shorthand
- transform jsx templates encased in extraneous parentheses (make sure transform is comment-safe):

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

- statments are wrapped in double curly braces
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

- the last argument of template functions are normalized to render functions
```tsx
<li>
   {If(something,
      <div></div>
   )}
</li>

<li>
   {If(something, () => {
      return <div></div>
   })}
</li>
```
```tsx
<li>
   {If(something, () =>
      <div></div>
   )}
</li>

(no transform needed)
```

- last argument wrapped in parentheses are transformed into jsx fragments
```tsx
<li>
   {If(something, (
      <div></div>
   ))}
</li>

<li>
   {If(something, () => {
      return <>
         <div></div>
      </>
   })}
</li>
```

### Conformance checklist
| Area | Example input | Expected transform behavior | Must diagnostic? |
|---|---|---|---|
| JSX shorthand | parenthesized multi-node JSX | rewrites to fragment shorthand; comments preserved | No |