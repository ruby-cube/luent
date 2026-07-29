import { $listen, SustainedListenerOptions } from "@luent/flask";
import { instantUpdate, swiftUpdate } from "@luent/quarky";
import { AnyObject } from "@luent/types";
import { normalizeToArray } from "@luent/utils";
import { matchEventTarget } from "../events/target";

// TODO: figure out how to incorporate options into inline events
export function setUpEvents(node: Element, events: { [key: string]: EventListener[] }, options?: SustainedListenerOptions & AddEventListenerOptions) {
   for (const key in events) {
      if (key === 'event') {
         const batchEvents = events.event
         for (const key in batchEvents) {
            setUpListener(node, batchEvents, key, options)
         }
         continue;
      }
      setUpListener(node, events, key, options)
   }
}

function setUpListener(node: Element, events: AnyObject, key: string, options?: SustainedListenerOptions & AddEventListenerOptions) {
   const handlers = normalizeToArray(events[key]);
   for (const handler of handlers) {
      $listen(withUpdate(handler, key), options ? (options.preserve = true, options) : { preserve: true }, {
         // preserve since there is no need to pause listener when it is unmounted--it will never be triggered
         enroll: (cb) => {
            // console.warn('^^^ adding inline event listener', handler)
            node.addEventListener(key, cb, options);
         },
         remove: (cb) => {
            // console.warn('^^^ removing inline event listener', handler)
            node.removeEventListener(key, cb, options);
         }
      })
   }
}

export function withUpdate(handler: Function, event: string) {
   const update = getEventUpdater(event) ?? swiftUpdate
   return (e: any) => update(() => {
      e.from = matchEventTarget
      handler(e)
   })
}


export function getEventUpdater(event: string): ((task: () => unknown) => void) | undefined {
   return (<AnyObject>htmlEvents)[event]
}


const pointerUpdate = instantUpdate
// ThrottlePointer()

const htmlEvents = {
   event: swiftUpdate,
   // Mouse Events
   click: swiftUpdate,  // vvv user interaction
   dblclick: swiftUpdate,
   mousedown: swiftUpdate,
   mouseup: swiftUpdate,
   contextmenu: swiftUpdate,

   mouseover: pointerUpdate, // vvv user animation
   mousemove: pointerUpdate,
   mouseout: pointerUpdate,
   mouseenter: pointerUpdate,
   mouseleave: pointerUpdate,

   // Keyboard Events
   keydown: swiftUpdate, // vvv user interaction
   keyup: swiftUpdate, // Focus Events
   focus: swiftUpdate, // ???
   blur: swiftUpdate,
   focusin: swiftUpdate,
   focusout: swiftUpdate,

   // Form Events
   beforeinput: instantUpdate, // vvv user animation // TODO:
   input: instantUpdate, // vvv user animation // TODO:
   change: swiftUpdate,

   submit: swiftUpdate, // vvv user interaction
   reset: swiftUpdate,
   select: swiftUpdate,
   invalid: swiftUpdate,

   // Drag Events
   drag: pointerUpdate, // vvv user animation

   dragstart: swiftUpdate, // vvv user interaction
   dragend: swiftUpdate, // vvv user interaction
   dragenter: pointerUpdate, // vvv user animation
   dragover: pointerUpdate,
   dragleave: pointerUpdate,
   drop: swiftUpdate, // vvv user interaction 

   // Clipboard Events
   copy: swiftUpdate, // vvv user interaction
   cut: swiftUpdate, // vvv user interaction
   paste: swiftUpdate, // vvv user interaction

   // Media Events
   abort: swiftUpdate, // vvv ???
   canplay: swiftUpdate,
   canplaythrough: swiftUpdate,
   durationchange: swiftUpdate,
   ended: swiftUpdate,
   error: swiftUpdate,
   loadeddata: swiftUpdate,
   loadedmetadata: swiftUpdate,
   loadstart: swiftUpdate,
   pause: swiftUpdate,
   play: swiftUpdate,
   playing: swiftUpdate,
   progress: swiftUpdate,
   ratechange: swiftUpdate,
   seeked: swiftUpdate,
   seeking: swiftUpdate,
   stalled: swiftUpdate,
   suspend: swiftUpdate,
   timeupdate: swiftUpdate,
   volumechange: swiftUpdate,
   waiting: swiftUpdate,

   // Miscellaneous Events
   load: swiftUpdate, // ??? // window
   resize: pointerUpdate, // vvv user animation
   scroll: pointerUpdate, // vvv user animation
   scrollend: pointerUpdate, // vvv user interaction
   wheel: pointerUpdate, // vvv user animation 

   // Touch Events
   touchstart: swiftUpdate, // vvv user interaction
   touchend: swiftUpdate, // vvv user interaction
   touchcancel: swiftUpdate, // vvv user interaction
   touchmove: swiftUpdate, // vvv user animation 

   // Pointer Events
   pointerdown: swiftUpdate, // vvv user interaction
   pointerup: swiftUpdate, // vvv user interaction

   pointermove: pointerUpdate, // vvv user animation
   pointerover: pointerUpdate,
   pointerout: pointerUpdate,
   pointerenter: pointerUpdate,
   pointerleave: pointerUpdate,

   gotpointercapture: swiftUpdate, //???
   lostpointercapture: swiftUpdate, //???
   pointercancel: swiftUpdate, // vvv user interaction 

   // Animation Events
   animationstart: instantUpdate, // background animation
   animationend: instantUpdate, // background animation
   animationiteration: instantUpdate, // background animation 

   // Transition Events
   transitionend: instantUpdate // background animation
};

export function isHTMLEvent(name: string) {
   return name in htmlEvents
}


// const htmlEvents = new Set([
//   // Mouse Events
//   "on:click",  // vvv user interaction
//   "on:dblclick",
//   "on:mousedown",
//   "on:mouseup",
//   "on:contextmenu",
//   "on:mouseover", // vvv user animation
//   "on:mousemove",
//   "on:mouseout",
//   "on:mouseenter",
//   "on:mouseleave",

//   // Keyboard Events
//   "on:keydown", // vvv user interaction
//   "on:keyup",

//   // Focus Events
//   "on:focus", // ???
//   "on:blur", 
//   "on:focusin",
//   "on:focusout",

//   // Form Events
//   "on:input", // vvv user animation
//   "on:change",
//   "on:submit", // vvv user interaction
//   "on:reset", 
//   "on:select", 
//   "on:invalid",

//   // Drag Events
//   "on:drag", // vvv user animation
//   "on:dragstart", // vvv user interaction
//   "on:dragend", // vvv user interaction
//   "on:dragenter", // vvv user animation
//   "on:dragover",
//   "on:dragleave",
//   "on:drop", // vvv user interaction

//   // Clipboard Events
//   "on:copy", // vvv user interaction
//   "on:cut", // vvv user interaction
//   "on:paste", // vvv user interaction

//   // Media Events
//   "on:abort", // vvv ???
//   "on:canplay",
//   "on:canplaythrough",
//   "on:durationchange",
//   "on:ended",
//   "on:error",
//   "on:loadeddata",
//   "on:loadedmetadata",
//   "on:loadstart",
//   "on:pause",
//   "on:play",
//   "on:playing",
//   "on:progress",
//   "on:ratechange",
//   "on:seeked",
//   "on:seeking",
//   "on:stalled",
//   "on:suspend",
//   "on:timeupdate",
//   "on:volumechange",
//   "on:waiting",

//   // Miscellaneous Events
//   "on:error", // vvv background event
//   "on:load", // ???

//   // window
//   "on:resize", // vvv user animation
//   "on:scroll", // vvv user animation
//   "on:scrollend", // vvv user interaction
//   "on:wheel", // vvv user animation

//   // Touch Events
//   "on:touchstart", // vvv user interaction
//   "on:touchend", // vvv user interaction
//   "on:touchcancel", // vvv user interaction
//   "on:touchmove", // vvv user animation

//   // Pointer Events
//   "on:pointerdown", // vvv user interaction
//   "on:pointerup", // vvv user interaction
//   "on:pointermove", // vvv user animation
//   "on:pointerover",
//   "on:pointerout",
//   "on:pointerenter",
//   "on:pointerleave",
//   "on:gotpointercapture", //???
//   "on:lostpointercapture", //???
//   "on:pointercancel", // vvv user interaction

//   // Animation Events
//   "on:animationstart", // background animation
//   "on:animationend", // background animation
//   "on:animationiteration", // background animation

//   // Transition Events
//   "on:transitionend" // background animation
// ]);


