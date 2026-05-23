import { component } from "@rue/luent";

function Grandparent() {

   return component(
      <Parent on:click={() => console.log('grandparent click')}></Parent>
   )
}

function Parent(setup: any) {

   return component(
      <Child on:click={() => console.log('parent click')} auto-bind={setup}></Child>
   )
}

function Child(setup: any) {

   return component(
      <div on:click={() => console.log('child click')} auto-bind={setup}></div>
   )
}

// function ChildA(setup: FromTag<'div'>) {

//    const {
//       styles,
//       microclasses,
//       emit, on: { click },
//    } = setup

//    return component(
//       <div microclass='' on:click={e => { console.log('child click'); emit(click, e) }} auto-bind={setup}></div>
//    )
// }

// TODO: implement emit

// a style-class 

function ChildB(setup: any) {

   return component(
      <div on:click={() => console.log('child click')} {...setup}></div>
   )
}

// Setup types
// - requested setup
// - forwarded setup
//    - blind batch forward
//    - selective forward

// requested setup
// - mu: attributes (gather)
// - attributes
// - ref?: override
// - at:hook type

// selective forwarded setup (can be blind)
// - Slot: override (can be requested)

// blind batch forward
// - ** Slot: override (can be requested)
// - * ref: override
// - * hooks: queue (does it have to match ref? does it need to be typed? no...)

// - classes: combine (rename)
// - styleClasses: 
// - styles: cascade (rename)
// - transitions: ?
// - events: queue (unpack)





// ** must land in component
// * may land in component or element .. depending on whether component exposes a public instance

// Child
// function makeComponent(Component: ComponentTag, fromTag: any) {
//    const setup = toSetup(fromTag) // unless emit has been extracted and used for something else...

//    const output = Component(setup)

//    if (output.as) {
//       const ref = composeRef(setup) // throw if ref already used
//       const hooks = composeHooks(setup)
//       if (ref) {

//       }
//       if (hooks) {

//       }
//    }
// }

// function makeElement(fromTag: any) {
//    const { slots, ref, showIf, events, attributes, styles, classes, microclasses, hooks, transitions, mutables } = composeBindings(fromTag)
// }


// component: raw bindings --> setup bindings
// element: raw bindings & nested setup bindings --> composed bindings



// TODO: composed events



// NOTE: currently transitions are overridden by parent component transitions.. not sure if this is the desired behavior


// child click
// parent click
// grandparent click