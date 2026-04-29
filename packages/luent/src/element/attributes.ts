import { getFlask } from "@rue/flask";
import { instantUpdate, isGetter, queueRender, RUN_EAGERLY, swiftUpdate, toValue, watchToRender } from "@rue/quarky";
import { MaybeIon } from "../component/x-Input";
import { setUpInnerHTML } from "../node/InnerHTML";
import { isHydrating } from "../hydration/hydration";
import { AnyObject } from "@rue/types";

const globalHTMLAttributes = new Set([
   'accesskey', 'class', 'contenteditable', 'contextmenu', 'data-*', 'dir',
   'draggable', 'hidden', 'id', 'lang', 'spellcheck', 'style', 'tabindex',
   'title', 'translate'
])

export function isHTMLAttribute(key: string, tag: keyof HTMLElementTagNameMap) {
   return globalHTMLAttributes.has(key) || key.startsWith('aria-') || key.startsWith('data-') // TODO: need to add element specific attributes
}


export function setUpAttributes(node: Element, attributes: { [key: string]: MaybeIon<any> }) {
   const flask = getFlask()
   for (const key in attributes) {
      if (key === 'innerHTML') {
         setUpInnerHTML({ innerHTML: attributes.innerHTML }, node)
         continue;
      }
      if (key === 'Slot') continue;
      const _key = key.startsWith('mu:') ? key.slice(3) : key;
      if (__DEV__ && key.startsWith('mu:')) console.warn(`The attribute ${_key} is not a valid two-way binding attribute`)
      // valid two-way binding should have already been removed with by bindViewInput, so any remaining 'mu:' keys are invalid
      const value = attributes[key]
      // TODO: only attributes that affect layout should be scheduled for render phase
      if (isGetter(value)) {
         watchToRender(value, ({ current, previous }) => {
            // if (current === previous) return;
            queueRender(() => {
               setAttribute(node, _key, toValue(value())) // toValue for mu getters
            })
         }, flask, RUN_EAGERLY)
      }
      // else if (isViewBindingKit(value)) {
      //    watch(value.ion, ({ newState }) => {
      //       if (value.isSameAsView(newState)) {
      //          return;
      //       }
      //       setAttribute(node, _key, newState)
      //    }, { eager: true, phase: Phase.RENDER })
      // }
      else if (!isHydrating()) {
         setAttribute(node, _key, toString(value))
      }
   }
}

function setAttribute(node: AnyObject, attribute: string, value: any) {

   if (isBooleanAttribute(attribute)) {
      const _value = value === 'true' ? true : value === 'false' ? false : Boolean(value)
      // if (_value === false) node.removeAttribute(attribute)
      // else node.setAttribute(attribute, _value)
      node[attribute] = _value
   }
   else if (node instanceof SVGElement || isAttributeOnly(attribute)) {
      node.setAttribute(attribute, toString(value) ?? '')
   }
   else {
      if (attribute === 'textContent') console.log('$$$ SETTING TEXTCONTENT', value)
      node[toElementProperty(attribute)] = isNumberValue(attribute) ? toNumber(value) : toString(value) ?? '';
   }
}

function toNumber(value: any) {
   const type = typeof value;
   return type === 'string' ? Number(value) : type === 'number' ? value : undefined
}

// TODO:
// HTML Attribute | DOM Property | Notes
// value (on <option>) | value | JS returns the value set by DOM, not necessarily the attribute.

// TODO:
// Writable properties with no html attribute
// innerText	Represents the visible text content of an element, considering CSS visibility/display.
// valueAsNumber	For <input type="number">, represents the value as a number.
// valueAsDate	For <input type="date">, represents the value as a Date object.
// scrollTop	Number of pixels the element’s content is scrolled vertically.
// scrollLeft	Number of pixels the element’s content is scrolled horizontally.

const attributeOnly = {
   "role": true,           // Role attribute
   "nonce": true,          // Script/Style nonce attribute
   "crossorigin": true,    // Cross-origin attribute
   "integrity": true,      // Subresource Integrity attribute
   "http-equiv": true,     // Meta http-equiv attribute
   "content": true,        // Meta content attribute
   "charset": true,        // Meta charset attribute
   "itemprop": true,       // Microdata itemprop attribute
   "itemscope": true,      // Microdata itemscope attribute
   "itemtype": true,       // Microdata itemtype attribute
   "manifest": true,       // Manifest attribute (deprecated)
   "part": true            // Web components part attribute
};

function isAttributeOnly(attribute: string) {
   if (attribute.startsWith('aria-') || attribute.startsWith('data-')) return true;
   return attribute in attributeOnly
}


const attributeToPropertyMap: Record<string, string> = {

   // Global/common attributes
   for: 'htmlFor',
   accesskey: 'accessKey',
   contenteditable: 'contentEditable',
   tabindex: 'tabIndex',
   spellcheck: 'spellCheck',
   autocapitalize: 'autoCapitalize',
   inputmode: 'inputMode',

   // Form-related attributes
   readonly: 'readOnly',
   maxlength: 'maxLength',
   minlength: 'minLength',
   formaction: 'formAction',
   formenctype: 'formEnctype',
   formmethod: 'formMethod',
   formnovalidate: 'formNoValidate',
   formtarget: 'formTarget',

   // Table attributes
   colspan: 'colSpan',
   rowspan: 'rowSpan',

   // Media/iframe
   usemap: 'useMap',
   frameborder: 'frameBorder',
   allowfullscreen: 'allowFullscreen',

   // non-html attributes
   scrolltop: 'scrollTop',
   scrollleft: 'scrollLeft'
}


function toElementProperty(attribute: string) {
   return attributeToPropertyMap[attribute] ?? attribute;
}

const booleanAttributes = { // TODO: there are so many more boolean attributes
   async: true,
   autofocus: true,
   autoplay: true,
   checked: true,
   controls: true,
   default: true,
   defer: true,
   disabled: true,
   formnovalidate: true,
   hidden: true,
   inert: true,
   ismap: true,
   itemscope: true,
   loop: true,
   multiple: true,
   muted: true,
   nomodule: true,
   novalidate: true,
   open: true,
   playsinline: true,
   readonly: true,
   required: true,
   reversed: true,
   selected: true,
   truespeed: true,
};

const numberTypedAttributes: Record<string, true> = {
   // Form/input-related
   maxlength: true,
   minlength: true,
   tabindex: true,
   size: true,
   rows: true,
   cols: true,

   // Table
   colspan: true,
   rowspan: true,

   // Media/image
   width: true,
   height: true,

   // Meter/progress
   // value: true,     // for <meter>, <progress>
   min: true,
   max: true,
   low: true,
   high: true,
   optimum: true,

}


function isBooleanAttribute(attribute: string) {
   return attribute in booleanAttributes
}

function isNumberValue(attribute: string) {
   return attribute in numberTypedAttributes
}

export function toString(value: any) {
   return value?.toString() ?? ""; // TODO: make sure it works with any value
}


