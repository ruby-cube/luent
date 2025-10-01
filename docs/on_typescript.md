## Type narrowing with Ions

As with any getter-based reactivity API (i.e. signals), ions will not undergo type-narrowing within control flow.

```ts
function formatItemsInList($list: Ion<string | null>) {
   if ($list()) {
      return $list().map(item => format(item)) // ts error!
   }
   else {
      return $list.value = []
   }
}
```

To achieve type-narrowing, store the current state to a variable.

```ts
function formatItemsInList($list: Ion<string | null>) {
   const list = $list()
   if (list) {
      return list.map(item => format(item)) // OK!
   }
   else {
      return $list.value = []
   }
}

```

Keep in mind to only use that variable within the same function scope that state was accessed unless you mean to reference a frozen state. To get the current state in another function scope that will potentially run asynchronously, call the ion anew.

```ts
const list = $list()

if (list) {
   return list.map(item => format(item))
}

setTimeout(() => {
   console.log(list) // will not log the current state of the list
}, 100)

setTimeout(() => {
   console.log($list()) // will log the current state of the list
}, 100)

```


## Type-narrowing in the Template
The `If()` and `ElseIf()` template functions will pass the type-narrowed condition to the render function:
```ts
   <>
      {If($rect, ($rect) =>
         <Tooltip rect={$rect()}>info</Tooltip>
      )}
   </>
```