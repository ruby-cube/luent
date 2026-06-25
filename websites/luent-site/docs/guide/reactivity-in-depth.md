# Reactivity in depth

Reactivity in Luent emerges from linking **effects** to **ions** through the process of **tracking**. A tracked ion's mutations will then **trigger** any linked effects, creating the illusion of reactivity.

:::info NOTE
The following document contains pseudo-implementations for explanatory purposes. Actual implementation details would obscure the concepts being illustrated.
:::

## Ions

An ion consists of:

- a **trackable accessor**
- one or more associated **triggering mutators**

```txt
ion
├─ trackable accessor
└─ triggering mutator(s)
```

Mutators may be associated directly with the ion, as is the case for atomic ions, or indirectly through an ionic compound's dependencies.

### Atomic ions

The simplest ions are atomic ions created through `ion()`, consisting of:

- a getter function — the trackable accessor
- an internal setter function — the triggering mutator

**Example:**

```ts
const $count = ion(0);

const count = $count(); // get
$count.value = 5; // set
```

**Implementation:**

```ts
function ion(initialState) {
  const _ion = {
    state: initialState,
    effects: [],
  };

  const get = () => {
    trackMe(_ion);
    return _ion.state;
  };

  return Object.defineProperty(get, "value", {
    get,
    set: (value) => {
      trigger(_ion);
      _ion.state = value;
    },
  });
}
```

### Ionic compounds

Atomic ions may form ionic compounds through derivations or ionic structures.

**Example:**

```ts
const position = ionic({ x: 0, y: 0 });

const x = position.x; // get x
position.x = 5; // set x
```

**Implementation:**

```tsx
function ionic(target) {
  return new Proxy(target, {
    get(target, key) {
      trackMe(asIon(target, key));
      return target[key];
    },
    set(target, key, value) {
      target[key] = value;
      trigger(asIon(target, key));
      return true;
    },
  });
}
```

## Effects
Effects are functions that run in reaction to state changes of ions tracked by the effect.

```ts
track($count, () => { // runs whenever count changes
  console.log("count is", $count());
});
```

### Tracking

In order to track ions, 




Linking ions to effects may seem straightforward in the above example. However, consider 

```ts
const $doubled = ion(() => $count() * 2)

track($doubled, () => {
  console.log("count x 2 is", $doubled());
});
```

Effects are able to track nested ions through implicit dependency tracking.

Trackable accessors are accessors that emit one or more "track me" signals originating from atomic ions when accessed. A compound ion will emit nested signals.

The signal is ultimately received by the tracker, which then links an effect to the ion, either directly or through an ionic compound.



```tsx
function track(target, effect) {
  typeof target === "function"
    ? trackSignals(target, effect)
    : trackStructure(target, effect);
}

let tracker: Effect | null = null;

function trackSignals(target, effect) {
  tracker = effect;
  target(); // emits 'track me' signal(s)
  tracker = null;
}

function trackMe(ion) {
  ion.effects.push(tracker);
}
```

### Triggering

Once tracked, any associated mutations will trigger the effect to run.

```tsx
function trigger(ion) {
  ion.effects.forEach((effect) => effect());
}
```

The relationships created by tracking an ion may be visualized as follows:

```txt
track:
  ion ─ effect
   |
   ├─ trackable accessor
   └─ triggering mutator(s)
```

...ultimately producing this reactive bond:

```txt
mutation → run effect
```

Tracking an ionic compound creates the same reactive bond between mutation(s) and effect:

```txt
track:
  ionic compound ─ effect
   |
  ion(s)
   |
   ├─ trackable accessor
   └─ triggering mutator(s)
```

### Terminology

Because these concepts are closely linked, the terms "track" and "trigger" are often used across different parts of the reactive pipeline.

Effects track ions and ionic compounds, but we could also say effects track:

- access operations
- mutations

Mutations trigger effects, but we could also say mutations trigger:

- ions
- ionic compounds

## Beyond getters and setters

Ions are not limited to getter/setter pairs.

For example, when a JavaScript `Set` instance is ionized, it contains the following ions:

- a `has` ion:
  - trackable accessor: `Set.has()`
  - triggering mutators: `Set.add()`, `Set.delete()`, and `Set.clear()`

- a `size` ion:
  - trackable accessor: `Set.size` getter
  - the triggering mutators: `Set.add()`, `Set.delete()`, and `Set.clear()`

Notice that a single mutator may be associated with multiple ions.

Conceptually, this may be thought of as:

```ts
class IonicSet extends Set {
  // ...
  has(item) {
    trackMe(asIon(this, "has"));
    return super.has(item);
  }

  add(item) {
    trigger(asIon(this, "has"));
    trigger(asIon(this, "[[get]] size"));
    return super.add(item);
  }
  // ...
}
```

Other examples of trackable accessors in ionic structures:

- `Array.map()`
- `Array.filter()`
- `Map.get()`
