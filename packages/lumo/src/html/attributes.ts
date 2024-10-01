const htmlEvents = new Set([
  // Mouse Events
  "onClick",
  "ondblclick",
  "onmousedown",
  "onmouseup",
  "onmouseover",
  "onmousemove",
  "onmouseout",
  "onmouseenter",
  "onmouseleave",
  "oncontextmenu",
  
  // Keyboard Events
  "onkeydown",
  "onkeyup",
  
  // Focus Events
  "onfocus",
  "onblur",
  "onfocusin",
  "onfocusout",
  
  // Form Events
  "oninput",
  "onchange",
  "onsubmit",
  "onreset",
  "onselect",
  "oninvalid",
  
  // Drag Events
  "ondrag",
  "ondragstart",
  "ondragend",
  "ondragenter",
  "ondragover",
  "ondragleave",
  "ondrop",
  
  // Clipboard Events
  "oncopy",
  "oncut",
  "onpaste",
  
  // Media Events
  "onabort",
  "oncanplay",
  "oncanplaythrough",
  "ondurationchange",
  "onended",
  "onerror",
  "onloadeddata",
  "onloadedmetadata",
  "onloadstart",
  "onpause",
  "onplay",
  "onplaying",
  "onprogress",
  "onratechange",
  "onseeked",
  "onseeking",
  "onstalled",
  "onsuspend",
  "ontimeupdate",
  "onvolumechange",
  "onwaiting",
  
  // Miscellaneous Events
  "onerror",
  "onload",
  "onresize",
  "onscroll",
  "onwheel",
  
  // Touch Events
  "ontouchstart",
  "ontouchend",
  "ontouchmove",
  "ontouchcancel",
  
  // Pointer Events
  "onpointerdown",
  "onpointerup",
  "onpointermove",
  "onpointerover",
  "onpointerout",
  "onpointerenter",
  "onpointerleave",
  "ongotpointercapture",
  "onlostpointercapture",
  "onpointercancel",
  
  // Animation Events
  "onanimationstart",
  "onanimationend",
  "onanimationiteration",
  
  // Transition Events
  "ontransitionend"
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