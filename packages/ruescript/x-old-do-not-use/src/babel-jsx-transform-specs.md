### Namespaced attributes (Babel transform)
```tsx
<div mu:value={something} mu:frog={frog}>
```
-->
```tsx
<div mu:ø={{ value: something, frog: frog }}>
```


### Slot transform
Slots are transformed into render functions that auto-wrap JSX expressions in a JSX fragment
```tsx
<div>
   <p>{foo}</p>
   <p>{bar}</p>
</div>
```
```tsx
<div Slot={() => {
   return <>
      <p>{foo}</p>
      <p>{bar}</p>
   </>
}} />
```

