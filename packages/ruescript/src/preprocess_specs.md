## RueScript Preprocessing Specs
Transforms invalid JavaScript to valid JavaScript in preparation for parsing and AST transforms

Note: We do not check if patterns are in strings, comments, or JSXText at this stage. If transform occurs in one of these contexts, they will be reverted in postprocess. We do this to avoid implementing a custom parser for invalid tsx.

### `get` variable declaration transform

- search for the pattern: get[1][2][3]=
   - where [1] & [3] contain any amount of non-new-line whitespace and/or block comments
      - [1] must contain at least one non-new-line whitespace
      - [3] may contain zero characters/whitespace
   - [2] is any valid JavaScript variable
- transform the pattern to: gÆt[1][2][3]=
   - where [1]
      - replaces all whitespace with underscores
      - replaces block comment opening and closing with ƒº and ºƒ
   - where [3] preserves original source
- for each transform, push a new Edit object containing the position of the transform and length of the string.

Examples:
```ts
get count = ref(0)
gÆt_count = ref(0)
   |
  underscore count matches whitespace count
```

with trapped block comment
```ts
get /* note */ count = ref(0)
gÆt_ƒº_note_ºƒ_count = ref(0)
```


### `get` property colon notation

- within all object literals, search for the pattern: get[1][2][3]:
   - where [1] & [3] contain any amount of non-new-line whitespace and/or block comments
      - [1] must contain at least one non-new-line whitespace
      - [3] may contain zero characters/whitespace
   - [2] is any valid JavaScript unquoted string property key
- transform the pattern to: gÆt[1][2][3]:
   - where [1]
      - replaces all whitespace with underscores
      - replaces block comment opening and closing with ƒº and ºƒ
   - where [3] preserves original source
- for each transform, push a new Edit object containing the position of the transform and length of the string.

Example:
```ts
const obj = {
   get foo: ref(0)
}
const obj = {
   gÆt_foo: ref(0)
}     |
   underscore count matches whitespace count; potential trapped comment
```