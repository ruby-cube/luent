::: tip This project is in early development.
Most core features have been designed and implemented, but substantial tooling work remains before the extension is fully usable. 

We'd love help getting this project off the ground. Learn how to contribute [here](https://github.com/ruby-cube/luent/blob/main/CONTRIBUTING.md).
:::

# JSX Terminology

## JSX Block
A JSX block refers to a series of one or more JSX entities. There are three types of JSX entities:
- JSX elements
- JSX fragments
- JSX expression containers


## JSX Factory 
`() => <jsx/>`

A JSX factory refers to any function that returns a JSX element or fragment.
```tsx
const renderRow = () => <tr><td>Hello</td></tr>
```

<p align="right"><a href="#terminology" style="text-decoration: none">[top]</a></p>


## JSX Array Factory 
`() => [jsx('tag'), 'string']`

A JSX array factory refers to any function that returns an array of `jsx()` calls or strings.
```tsx
const renderRow = () => [
  jsx('tr', { 
    Slot: () => [
      jsx('td', { Slot: () => ['hello'] })
    ]
  })
]
```


<p align="right"><a href="#terminology" style="text-decoration: none">[top]</a></p>

## JSX Call Expression 
`{callee()}`

A JSX call expression refers to a call expression directly embedded in a JSX expression container.
```tsx
<div>{foo(bar)}</div>
```

<div id="counter"></div>

<p align="right"><a href="#terminology" style="text-decoration: none">[top]</a></p>

