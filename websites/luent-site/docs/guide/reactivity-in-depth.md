# Reactivity in depth

Conceptually, reactivity in Luent emerges from linking **effects** to **ions** through the process of **tracking**.

## Ions
An ion fundamentally consists of:
- a **trackable accessor**
- one or more associated **triggering mutators**

```txt
ion
├─ trackable accessor
└─ triggering mutator(s)
```

Triggering mutators may be associated directly with the ion, as is the case for atomic ions, or indirectly through a compound ion's dependencies.

### Atomic ions

The simplest ions are atomic ions created through `ion()`, consisting of:
- a getter function — the trackable accessor
- an internal setter function — the triggering mutator


### Ions beyond getters and setters

Ions are not limited to getter/setter pairs.

For example, when a JavaScript `Set` object is ionized, it contains the following ions:

- the `has` ion: 
  - trackable accessor: `Set.has()`
  - triggering mutators: `Set.add()`, `Set.delete()`, and `Set.clear()`

- the `size` ion:
  - trackable accessor: `Set.size` getter
  - the triggering mutators: `Set.add()`, `Set.delete()`, and `Set.clear()`

Notice that a single mutator may be associated with multiple ions.

Conceptually, this may be thought of as:

```ts
class IonicSet {
  ...
  has(item) {
    this.#ionicCore.track('has')
    // `has` logic
  }

  add(item) {
    this.#ionicCore.trigger('has')
    this.#ionicCore.trigger('[[get]] size')
    // `add` logic
  }
}
```

### Trackable accessors
Trackable accessors are accessors that emit one or more "track me" signals when accessed. They may internally emit nested signals as a compound ion.

Examples of trackable accessors in ionic structures:
- `Array.map()`
- `Array.filter()`
- `Map.get()`

## Tracking
The signal is ultimately received by the tracker, which then links an effect to the ion, either directly or through an ionic compound. Once tracked, any associated mutations will trigger the effect to run.

The relationships created by the tracking an ion may be visualized as follows:
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

## Track and trigger terminology

Because these concepts are closely linked, the terms "track" and "trigger" are often used across different parts of the reactive pipeline with a sort of "terminological referential transparency".

We track ions, ionic structures, and effects (as ionic compounds), but we could also say we track:
- an access operation
- mutations

We trigger an effect, but we could also say we trigger:
- an ion
- an ionic structure
