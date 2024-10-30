const htmlEvents = new Set([
  // Mouse Events
  "on:click",
  "on:dblclick",
  "on:mousedown",
  "on:mouseup",
  "on:mouseover",
  "on:mousemove",
  "on:mouseout",
  "on:mouseenter",
  "on:mouseleave",
  "on:contextmenu",
  
  // Keyboard Events
  "on:keydown",
  "on:keyup",
  
  // Focus Events
  "on:focus",
  "on:blur",
  "on:focusin",
  "on:focusout",
  
  // Form Events
  "on:input",
  "on:change",
  "on:submit",
  "on:reset",
  "on:select",
  "on:invalid",
  
  // Drag Events
  "on:drag",
  "on:dragstart",
  "on:dragend",
  "on:dragenter",
  "on:dragover",
  "on:dragleave",
  "on:drop",
  
  // Clipboard Events
  "on:copy",
  "on:cut",
  "on:paste",
  
  // Media Events
  "on:abort",
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
  "on:error",
  "on:load",
  "on:resize",
  "on:scroll",
  "on:wheel",
  
  // Touch Events
  "on:touchstart",
  "on:touchend",
  "on:touchmove",
  "on:touchcancel",
  
  // Pointer Events
  "on:pointerdown",
  "on:pointerup",
  "on:pointermove",
  "on:pointerover",
  "on:pointerout",
  "on:pointerenter",
  "on:pointerleave",
  "on:gotpointercapture",
  "on:lostpointercapture",
  "on:pointercancel",
  
  // Animation Events
  "on:animationstart",
  "on:animationend",
  "on:animationiteration",
  
  // Transition Events
  "on:transitionend"
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
  return globalHTMLAttributes.has(key) || key.startsWith('aria-') || key.startsWith('data-') //TODO: need to add element specific attributes
}