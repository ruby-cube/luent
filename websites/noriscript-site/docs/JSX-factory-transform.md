Definitions:
- JSX call expression: a call expression within a JSX expression container
- JSX fragment factory: an arrow function expression that returns a JSX fragment containing the element(s) that are transformed

**Explicit transform with `<:>`**
A JSX block consisting of one or more JSX elements (including JSX expression containers and JSX text) in a JSX call expression argument position will be transformed into a JSX fragment factory.

**Implicit transform**
A) A single root JSX element (excludes JSX expression containers and JSX text) in a JSX call expression argument position will be transformed into a JSX fragment factory.

B) A JSX block consisting of one or more JSX elements (excludes JSX expression containers and JSX text) in a JSX call expression argument position will be transformed into a JSX fragment factory.

C) A JSX block consisting of one or more JSX elements (including JSX expression containers and JSX text, but not leading with) in a JSX call expression argument position will be transformed into a JSX fragment factory.