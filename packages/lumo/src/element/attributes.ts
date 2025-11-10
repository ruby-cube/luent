const htmlEvents = new Set([
  // Mouse Events
  "on:click",  // vvv user interaction
  "on:dblclick",
  "on:mousedown",
  "on:mouseup",
  "on:contextmenu",
  "on:mouseover", // vvv user animation
  "on:mousemove",
  "on:mouseout",
  "on:mouseenter",
  "on:mouseleave",
  
  // Keyboard Events
  "on:keydown", // vvv user interaction
  "on:keyup",
  
  // Focus Events
  "on:focus", // ???
  "on:blur", 
  "on:focusin",
  "on:focusout",
  
  // Form Events
  "on:input", // vvv user animation
  "on:change",
  "on:submit", // vvv user interaction
  "on:reset", 
  "on:select", 
  "on:invalid",
  
  // Drag Events
  "on:drag", // vvv user animation
  "on:dragstart", // vvv user interaction
  "on:dragend", // vvv user interaction
  "on:dragenter", // vvv user animation
  "on:dragover",
  "on:dragleave",
  "on:drop", // vvv user interaction
  
  // Clipboard Events
  "on:copy", // vvv user interaction
  "on:cut", // vvv user interaction
  "on:paste", // vvv user interaction
  
  // Media Events
  "on:abort", // vvv ???
  "on:canplay",
  "on:canplaythrough",
  "on:durationchange",
  "on:ended",
  "on:error",
  "on:loadeddata",
  "on:loadedmetadata",
  "on:loadstart",
  "on:pause",
  "on:play",
  "on:playing",
  "on:progress",
  "on:ratechange",
  "on:seeked",
  "on:seeking",
  "on:stalled",
  "on:suspend",
  "on:timeupdate",
  "on:volumechange",
  "on:waiting",
  
  // Miscellaneous Events
  "on:error", // vvv background event
  "on:load", // ???

  // window
  "on:resize", // vvv user animation
  "on:scroll", // vvv user animation
  "on:scrollend", // vvv user interaction
  "on:wheel", // vvv user animation
  
  // Touch Events
  "on:touchstart", // vvv user interaction
  "on:touchend", // vvv user interaction
  "on:touchcancel", // vvv user interaction
  "on:touchmove", // vvv user animation
  
  // Pointer Events
  "on:pointerdown", // vvv user interaction
  "on:pointerup", // vvv user interaction
  "on:pointermove", // vvv user animation
  "on:pointerover",
  "on:pointerout",
  "on:pointerenter",
  "on:pointerleave",
  "on:gotpointercapture", //???
  "on:lostpointercapture", //???
  "on:pointercancel", // vvv user interaction
  
  // Animation Events
  "on:animationstart", // background animation
  "on:animationend", // background animation
  "on:animationiteration", // background animation
  
  // Transition Events
  "on:transitionend" // background animation
]);

export function isHTMLEvent(attibuteName: string){
  return htmlEvents.has(attibuteName)
}

const globalHTMLAttributes = new Set([
  'accesskey', 'class', 'contenteditable', 'contextmenu', 'data-*', 'dir',
  'draggable', 'hidden', 'id', 'lang', 'spellcheck', 'style', 'tabindex', 
  'title', 'translate'
])

export function isHTMLAttribute(key: string, tag: keyof HTMLElementTagNameMap) {
  return globalHTMLAttributes.has(key) || key.startsWith('aria-') || key.startsWith('data-') // TODO: need to add element specific attributes
}

