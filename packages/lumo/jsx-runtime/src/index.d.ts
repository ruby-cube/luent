/// <reference path="global.d.ts" />

import * as CSS from "csstype";
import * as Lumo from "@rue/lumo";
import * as Quarky from "@rue/quarky";
import { NodeRef } from "../../src/node/NodeRef";
import { NodeRefsConfig } from "../../src/node/NodeRefs";
import { COMPONENT_ATTRIBUTES, ContextKeyMap, _ContextInputType, Component, SuspenseNodeInput, TryNodeInput, TransitionNodeInput } from "@rue/lumo";
import { AnyObject, Booleanny } from "@rue/types";
import { PortalNodeInput } from "../../src/boundaries/Portal";

type NativeAnimationEvent = AnimationEvent;
type NativeClipboardEvent = ClipboardEvent;
type NativeCompositionEvent = CompositionEvent;
type NativeDragEvent = DragEvent;
type NativeFocusEvent = FocusEvent;
type NativeKeyboardEvent = KeyboardEvent;
type NativeMouseEvent = MouseEvent;
type NativeTouchEvent = TouchEvent;
type NativePointerEvent = PointerEvent;
type NativeTransitionEvent = TransitionEvent;
type NativeWheelEvent = WheelEvent;

type NativeUIEvent = UIEvent;
type NativeEvent = Event;


/**
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/HTML/Attributes/crossorigin MDN}
*/
type CrossOrigin = "anonymous" | "use-credentials" | "" | undefined;


declare global {
   /**
    * Used to represent DOM API's where users can either pass
    * true or false as a boolean or as its equivalent strings.
    */
   type Booleanish = boolean | "true" | "false";

   namespace L {

      // ----------------------------------------------------------------------
      // #region: Event Objects
      // ----------------------------------------------------------------------


      interface Event<T> extends NativeEvent {
         /**
         * The **`currentTarget`** read-only property of the Event interface identifies the element to which the event handler has been attached.
         *
         * [MDN Reference](https://developer.mozilla.org/docs/Web/API/Event/currentTarget)
         */
         currentTarget: EventTarget & T

         by: typeof Lumo.matchEventTarget
      }


      interface ClipboardEvent<T = Element> extends Event<T>, NativeClipboardEvent {
         clipboardData: DataTransfer;
      }


      interface CompositionEvent<T = Element> extends Event<T>, NativeCompositionEvent {
      }


      interface DragEvent<T = Element> extends MouseEvent<T>, NativeDragEvent {
         dataTransfer: DataTransfer;
      }


      interface PointerEvent<T = Element> extends MouseEvent<T>, NativePointerEvent {
         pointerType: "mouse" | "pen" | "touch";
      }


      interface FocusEvent<T = Element, RelatedTarget = Element> extends Event<T>, NativeFocusEvent {
         relatedTarget: (EventTarget & RelatedTarget) | null;
         target: EventTarget & T;
      }


      interface FormEvent<T = Element> extends Event<T> {
         target: EventTarget & T;
      }


      interface InvalidEvent<T = Element> extends Event<T> {
         target: EventTarget & T;
      }


      interface StateChangeEvent<T = Element> extends Event<T> {
         target: EventTarget & T;
      }


      interface KeyboardEvent<T = Element> extends Event<T>, NativeKeyboardEvent {
         /**
          * See [DOM Level 3 Events spec](https://www.w3.org/TR/uievents-key/#keys-modifier). for a list of valid (case-sensitive) arguments to this method.
          */
         getModifierState(key: ModifierKey): boolean;
         /**
          * The KeyboardEvent interface's **`key`** read-only property returns the value of the key pressed by the user, taking into consideration the state of modifier keys such as <kbd>Shift</kbd> as well as the keyboard locale and layout.
          *
          * [MDN Reference](https://developer.mozilla.org/docs/Web/API/KeyboardEvent/key)
          *
          * See the [DOM Level 3 Events spec](https://www.w3.org/TR/uievents-key/#named-key-attribute-values). for possible values
          */
         key: string;
      }


      interface MouseEvent<E = Element> extends Event<E>, NativeMouseEvent {

         /**
         * The **`MouseEvent.getModifierState()`** method returns the current state of the specified modifier key: `true` if the modifier is active (i.e., the modifier key is pressed or locked), otherwise, `false`.
         *
         * [MDN Reference](https://developer.mozilla.org/docs/Web/API/MouseEvent/getModifierState)
         * 
         * See [DOM Level 3 Events spec](https://www.w3.org/TR/uievents-key/#keys-modifier). for a list of valid (case-sensitive) arguments to this method.
         */
         getModifierState(key: ModifierKey): boolean
      }


      interface TouchEvent<T = Element> extends Event<T>, NativeTouchEvent {
         changedTouches: TouchList;
         /**
          * See [DOM Level 3 Events spec](https://www.w3.org/TR/uievents-key/#keys-modifier). for a list of valid (case-sensitive) arguments to this method.
          */
         getModifierState(key: ModifierKey): boolean;
         targetTouches: TouchList;
         touches: TouchList;
      }

      interface UIEvent<T = Element> extends Event<T>, NativeUIEvent {

      }


      interface WheelEvent<T = Element> extends MouseEvent<T>, NativeWheelEvent {
      }


      interface AnimationEvent<T = Element> extends Event<T>, NativeAnimationEvent {
      }


      interface TransitionEvent<T = Element> extends Event<T>, NativeTransitionEvent {
      }


      type ModifierKey =
         | "Alt"
         | "AltGraph"
         | "CapsLock"
         | "Control"
         | "Fn"
         | "FnLock"
         | "Hyper"
         | "Meta"
         | "NumLock"
         | "ScrollLock"
         | "Shift"
         | "Super"
         | "Symbol"
         | "SymbolLock";


      interface AbstractView {
         document: Document;
      }


      interface Touch {
         identifier: number;
         target: EventTarget;
         screenX: number;
         screenY: number;
         clientX: number;
         clientY: number;
         pageX: number;
         pageY: number;
      }

      interface TouchList {
         [index: number]: Touch;
         length: number;
         item(index: number): Touch;
         identifiedTouch(identifier: number): Touch;
      }

      // #endregion


      // ----------------------------------------------------------------------
      // #region: Event Handlers
      // ----------------------------------------------------------------------

      // type EventHandler<E extends SyntheticEvent<unknown>> = { bivarianceHack(event: E): void }["bivarianceHack"];

      type EventHandler<E extends Event> = (event: E) => void
      type HandleEvent<T = Element> = (event: Event<T>) => void

      type HandleClipboardEvent<T = Element> = EventHandler<ClipboardEvent<T>>;
      type HandleCompositionEvent<T = Element> = EventHandler<CompositionEvent<T>>;
      type HandleDragEvent<T = Element> = EventHandler<DragEvent<T>>;
      type HandleFocusEvent<T = Element> = EventHandler<FocusEvent<T>>;
      type HandleFormEvent<T = Element> = EventHandler<FormEvent<T>>;
      type HandleChangeEvent<T = Element> = EventHandler<StateChangeEvent<T>>;
      type HandleKeyboardEvent<T = Element> = EventHandler<KeyboardEvent<T>>;
      type HandleMouseEvent<T = Element> = EventHandler<MouseEvent<T>>;
      type HandleTouchEvent<T = Element> = EventHandler<TouchEvent<T>>;
      type HandlePointerEvent<T = Element> = EventHandler<PointerEvent<T>>;
      type HandleUIEvent<T = Element> = EventHandler<UIEvent<T>>;
      type HandleWheelEvent<T = Element> = EventHandler<WheelEvent<T>>;
      type HandleAnimationEvent<T = Element> = EventHandler<AnimationEvent<T>>;
      type HandleTransitionEvent<T = Element> = EventHandler<TransitionEvent<T>>;




      interface Events<T> {
         // Clipboard Events
         'on:copy'?: HandleClipboardEvent<T>;
         'on:cut'?: HandleClipboardEvent<T>;
         'on:paste'?: HandleClipboardEvent<T>;

         // Composition Events
         'on:compositionend'?: HandleCompositionEvent<T>;
         'on:compositionstart'?: HandleCompositionEvent<T>;
         'on:compositionupdate'?: HandleCompositionEvent<T>;

         // Focus Events
         'on:focus'?: HandleFocusEvent<T>;
         'on:blur'?: HandleFocusEvent<T>;

         // Form Events
         'on:change'?: HandleFormEvent<T>;
         'on:beforeinput'?: HandleFormEvent<T>;
         'on:input'?: HandleFormEvent<T>;
         'on:reset'?: HandleFormEvent<T>;
         'on:submit'?: HandleFormEvent<T>;
         'on:invalid'?: HandleFormEvent<T>;

         // Image Events
         'on:load'?: HandleEvent<T> | undefined;
         'on:error'?: HandleEvent<T> | undefined; // also a Media Event

         // Keyboard Events
         'on:keydown'?: HandleKeyboardEvent<T>;
         'on:keyup'?: HandleKeyboardEvent<T>;

         // Media Events
         'on:abort'?: HandleEvent<T> | undefined;
         'on:canplay'?: HandleEvent<T> | undefined;
         'on:canplaythrough'?: HandleEvent<T> | undefined;
         'on:durationchange'?: HandleEvent<T> | undefined;
         'on:emptied'?: HandleEvent<T> | undefined;
         'on:encrypted'?: HandleEvent<T> | undefined;
         'on:ended'?: HandleEvent<T> | undefined;
         'on:loadeddata'?: HandleEvent<T> | undefined;
         'on:loadedmetadata'?: HandleEvent<T> | undefined;
         'on:loadstart'?: HandleEvent<T> | undefined;
         'on:pause'?: HandleEvent<T> | undefined;
         'on:play'?: HandleEvent<T> | undefined;
         'on:playing'?: HandleEvent<T> | undefined;
         'on:progress'?: HandleEvent<T> | undefined;
         'on:ratechange'?: HandleEvent<T> | undefined;
         'on:resize'?: HandleEvent<T> | undefined;
         'on:seeked'?: HandleEvent<T> | undefined;
         'on:seeking'?: HandleEvent<T> | undefined;
         'on:stalled'?: HandleEvent<T> | undefined;
         'on:suspend'?: HandleEvent<T> | undefined;
         'on:timeupdate'?: HandleEvent<T> | undefined;
         'on:volumechange'?: HandleEvent<T> | undefined;
         'on:waiting'?: HandleEvent<T> | undefined;

         // MouseEvents
         'on:auxclick'?: HandleMouseEvent<T>;
         'on:click'?: HandleMouseEvent<T>;
         'on:contextmenu'?: HandleMouseEvent<T>;
         'on:dblclick'?: HandleMouseEvent<T>;
         'on:drag'?: HandleDragEvent<T>;
         'on:dragend'?: HandleDragEvent<T>;
         'on:dragenter'?: HandleDragEvent<T>;
         'on:dragexit'?: HandleDragEvent<T>;
         'on:dragleave'?: HandleDragEvent<T>;
         'on:dragover'?: HandleDragEvent<T>;
         'on:dragstart'?: HandleDragEvent<T>;
         'on:drop'?: HandleDragEvent<T>;
         'on:mousedown'?: HandleMouseEvent<T>;
         'on:mouseenter'?: HandleMouseEvent<T>;
         'on:mouseleave'?: HandleMouseEvent<T>;
         'on:mousemove'?: HandleMouseEvent<T>;
         'on:mouseout'?: HandleMouseEvent<T>;
         'on:mouseover'?: HandleMouseEvent<T>;
         'on:mouseup'?: HandleMouseEvent<T>;

         // Selection Events
         'on:select'?: HandleEvent<T> | undefined;

         // Touch Events
         'on:touchcancel'?: HandleTouchEvent<T>;
         'on:touchend'?: HandleTouchEvent<T>;
         'on:touchmove'?: HandleTouchEvent<T>;
         'on:touchstart'?: HandleTouchEvent<T>;

         // Pointer Events
         'on:pointerdown'?: HandlePointerEvent<T>;
         'on:pointermove'?: HandlePointerEvent<T>;
         'on:pointerup'?: HandlePointerEvent<T>;
         'on:pointercancel'?: HandlePointerEvent<T>;
         'on:pointerenter'?: HandlePointerEvent<T>;
         'on:pointerleave'?: HandlePointerEvent<T>;
         'on:pointerover'?: HandlePointerEvent<T>;
         'on:pointerout'?: HandlePointerEvent<T>;
         'on:gotpointercapture'?: HandlePointerEvent<T>;
         'on:lostpointercapture'?: HandlePointerEvent<T>;

         // UI Events
         'on:scroll'?: HandleUIEvent<T>;
         'on:scrollend'?: HandleUIEvent<T>;

         // Wheel Events
         'on:wheel'?: HandleWheelEvent<T>;

         // Animation Events
         'on:animationstart'?: HandleAnimationEvent<T>;
         'on:animationend'?: HandleAnimationEvent<T>;
         'on:animationiteration'?: HandleAnimationEvent<T>;

         // Transition Events
         'on:transitionend'?: HandleTransitionEvent<T>;

         // Toggle Events
         'on:toggle'?: HandleEvent<T> | undefined;
         'on:beforetoggle'?: HandleEvent<T> | undefined;


         // ===================================================
         // With Capture
         // ===================================================

         // Clipboard Events
         'onV:copy'?: HandleClipboardEvent<T>;
         'onV:cut'?: HandleClipboardEvent<T>;
         'onV:paste'?: HandleClipboardEvent<T>;

         // Composition Events
         'onV:compositionend'?: HandleCompositionEvent<T>;
         'onV:compositionstart'?: HandleCompositionEvent<T>;
         'onV:compositionupdate'?: HandleCompositionEvent<T>;

         // Focus Events
         'onV:focus'?: HandleFocusEvent<T>;
         'onV:blur'?: HandleFocusEvent<T>;

         // Form Events
         'onV:change'?: HandleFormEvent<T>;
         'onV:beforeinput'?: HandleFormEvent<T>;
         'onV:input'?: HandleFormEvent<T>;
         'onV:reset'?: HandleFormEvent<T>;
         'onV:submit'?: HandleFormEvent<T>;
         'onV:invalid'?: HandleFormEvent<T>;

         // Image Events
         'onV:load'?: HandleEvent<T> | undefined;
         'onV:error'?: HandleEvent<T> | undefined; // also a Media Event

         // Keyboard Events
         'onV:keydown'?: HandleKeyboardEvent<T>;
         'onV:keyup'?: HandleKeyboardEvent<T>;

         // Media Events
         'onV:abort'?: HandleEvent<T> | undefined;
         'onV:canplay'?: HandleEvent<T> | undefined;
         'onV:canplaythrough'?: HandleEvent<T> | undefined;
         'onV:durationchange'?: HandleEvent<T> | undefined;
         'onV:emptied'?: HandleEvent<T> | undefined;
         'onV:encrypted'?: HandleEvent<T> | undefined;
         'onV:ended'?: HandleEvent<T> | undefined;
         'onV:loadeddata'?: HandleEvent<T> | undefined;
         'onV:loadedmetadata'?: HandleEvent<T> | undefined;
         'onV:loadstart'?: HandleEvent<T> | undefined;
         'onV:pause'?: HandleEvent<T> | undefined;
         'onV:play'?: HandleEvent<T> | undefined;
         'onV:playing'?: HandleEvent<T> | undefined;
         'onV:progress'?: HandleEvent<T> | undefined;
         'onV:ratechange'?: HandleEvent<T> | undefined;
         'onV:resize'?: HandleEvent<T> | undefined;
         'onV:seeked'?: HandleEvent<T> | undefined;
         'onV:seeking'?: HandleEvent<T> | undefined;
         'onV:stalled'?: HandleEvent<T> | undefined;
         'onV:suspend'?: HandleEvent<T> | undefined;
         'onV:timeupdate'?: HandleEvent<T> | undefined;
         'onV:volumechange'?: HandleEvent<T> | undefined;
         'onV:waiting'?: HandleEvent<T> | undefined;

         // MouseEvents
         'onV:auxclick'?: HandleMouseEvent<T>;
         'onV:click'?: HandleMouseEvent<T>;
         'onV:contextmenu'?: HandleMouseEvent<T>;
         'onV:doubleclick'?: HandleMouseEvent<T>;
         'onV:drag'?: HandleDragEvent<T>;
         'onV:dragend'?: HandleDragEvent<T>;
         'onV:dragenter'?: HandleDragEvent<T>;
         'onV:dragexit'?: HandleDragEvent<T>;
         'onV:dragleave'?: HandleDragEvent<T>;
         'onV:dragover'?: HandleDragEvent<T>;
         'onV:dragstart'?: HandleDragEvent<T>;
         'onV:drop'?: HandleDragEvent<T>;
         'onV:mousedown'?: HandleMouseEvent<T>;
         'onV:mouseenter'?: HandleMouseEvent<T>;
         'onV:mouseleave'?: HandleMouseEvent<T>;
         'onV:mousemove'?: HandleMouseEvent<T>;
         'onV:mouseout'?: HandleMouseEvent<T>;
         'onV:mouseover'?: HandleMouseEvent<T>;
         'onV:mouseup'?: HandleMouseEvent<T>;

         // Selection Events
         'onV:select'?: HandleEvent<T> | undefined;

         // Touch Events
         'onV:touchcancel'?: HandleTouchEvent<T>;
         'onV:touchend'?: HandleTouchEvent<T>;
         'onV:touchmove'?: HandleTouchEvent<T>;
         'onV:touchstart'?: HandleTouchEvent<T>;

         // Pointer Events
         'onV:pointerdown'?: HandlePointerEvent<T>;
         'onV:pointermove'?: HandlePointerEvent<T>;
         'onV:pointerup'?: HandlePointerEvent<T>;
         'onV:pointercancel'?: HandlePointerEvent<T>;
         'onV:pointerenter'?: HandlePointerEvent<T>;
         'onV:pointerleave'?: HandlePointerEvent<T>;
         'onV:pointerover'?: HandlePointerEvent<T>;
         'onV:pointerout'?: HandlePointerEvent<T>;
         'onV:gotpointercapture'?: HandlePointerEvent<T>;
         'onV:lostpointercapture'?: HandlePointerEvent<T>;

         // UI Events
         'onV:scroll'?: HandleUIEvent<T>;

         // Wheel Events
         'onV:wheel'?: HandleWheelEvent<T>;

         // Animation Events
         'onV:animationstart'?: HandleAnimationEvent<T>;
         'onV:animationend'?: HandleAnimationEvent<T>;
         'onV:animationiteration'?: HandleAnimationEvent<T>;

         // Transition Events
         'onV:transitionend'?: HandleTransitionEvent<T>;
      }

      export interface CSSProperties extends CSS.Properties<string | number> {
         /**
          * The index signature was removed to enable closed typing for style
          * using CSSType. You're able to use type assertion or module augmentation
          * to add properties or an index signature of your own.
          *
          * For examples and more information, visit:
          * https://github.com/frenic/csstype#what-should-i-do-when-i-get-type-errors
          */
      }

      // All the WAI-ARIA 1.1 attributes from https://www.w3.org/TR/wai-aria-1.1/
      interface AriaAttributes {
         /** Identifies the currently active element when DOM focus is on a composite widget, textbox, group, or application. */
         "aria-activedescendant"?: string | undefined;
         /** Indicates whether assistive technologies will present all, or only parts of, the changed region based on the change notifications defined by the aria-relevant attribute. */
         "aria-atomic"?: Booleanish | undefined;
         /**
          * Indicates whether inputting text could trigger display of one or more predictions of the user's intended value for an input and specifies how predictions would be
          * presented if they are made.
          */
         "aria-autocomplete"?: "none" | "inline" | "list" | "both" | undefined;
         /** Indicates an element is being modified and that assistive technologies MAY want to wait until the modifications are complete before exposing them to the user. */
         /**
          * Defines a string value that labels the current element, which is intended to be converted into Braille.
          * @see aria-label.
          */
         "aria-braillelabel"?: string | undefined;
         /**
          * Defines a human-readable, author-localized abbreviated description for the role of an element, which is intended to be converted into Braille.
          * @see aria-roledescription.
          */
         "aria-brailleroledescription"?: string | undefined;
         "aria-busy"?: Booleanish | undefined;
         /**
          * Indicates the current "checked" state of checkboxes, radio buttons, and other widgets.
          * @see aria-pressed @see aria-selected.
          */
         "aria-checked"?: boolean | "false" | "mixed" | "true" | undefined;
         /**
          * Defines the total number of columns in a table, grid, or treegrid.
          * @see aria-colindex.
          */
         "aria-colcount"?: number | undefined;
         /**
          * Defines an element's column index or position with respect to the total number of columns within a table, grid, or treegrid.
          * @see aria-colcount @see aria-colspan.
          */
         "aria-colindex"?: number | undefined;
         /**
          * Defines a human readable text alternative of aria-colindex.
          * @see aria-rowindextext.
          */
         "aria-colindextext"?: string | undefined;
         /**
          * Defines the number of columns spanned by a cell or gridcell within a table, grid, or treegrid.
          * @see aria-colindex @see aria-rowspan.
          */
         "aria-colspan"?: number | undefined;
         /**
          * Identifies the element (or elements) whose contents or presence are controlled by the current element.
          * @see aria-owns.
          */
         "aria-controls"?: string | undefined;
         /** Indicates the element that represents the current item within a container or set of related elements. */
         "aria-current"?: boolean | "false" | "true" | "page" | "step" | "location" | "date" | "time" | undefined;
         /**
          * Identifies the element (or elements) that describes the object.
          * @see aria-labelledby
          */
         "aria-describedby"?: string | undefined;
         /**
          * Defines a string value that describes or annotates the current element.
          * @see related aria-describedby.
          */
         "aria-description"?: string | undefined;
         /**
          * Identifies the element that provides a detailed, extended description for the object.
          * @see aria-describedby.
          */
         "aria-details"?: string | undefined;
         /**
          * Indicates that the element is perceivable but disabled, so it is not editable or otherwise operable.
          * @see aria-hidden @see aria-readonly.
          */
         "aria-disabled"?: Booleanish | undefined;
         /**
          * Indicates what functions can be performed when a dragged object is released on the drop target.
          * @deprecated in ARIA 1.1
          */
         "aria-dropeffect"?: "none" | "copy" | "execute" | "link" | "move" | "popup" | undefined;
         /**
          * Identifies the element that provides an error message for the object.
          * @see aria-invalid @see aria-describedby.
          */
         "aria-errormessage"?: string | undefined;
         /** Indicates whether the element, or another grouping element it controls, is currently expanded or collapsed. */
         "aria-expanded"?: Booleanish | undefined;
         /**
          * Identifies the next element (or elements) in an alternate reading order of content which, at the user's discretion,
          * allows assistive technology to override the general default of reading in document source order.
          */
         "aria-flowto"?: string | undefined;
         /**
          * Indicates an element's "grabbed" state in a drag-and-drop operation.
          * @deprecated in ARIA 1.1
          */
         "aria-grabbed"?: Booleanish | undefined;
         /** Indicates the availability and type of interactive popup element, such as menu or dialog, that can be triggered by an element. */
         "aria-haspopup"?: boolean | "false" | "true" | "menu" | "listbox" | "tree" | "grid" | "dialog" | undefined;
         /**
          * Indicates whether the element is exposed to an accessibility API.
          * @see aria-disabled.
          */
         "aria-hidden"?: Booleanish | undefined;
         /**
          * Indicates the entered value does not conform to the format expected by the application.
          * @see aria-errormessage.
          */
         "aria-invalid"?: boolean | "false" | "true" | "grammar" | "spelling" | undefined;
         /** Indicates keyboard shortcuts that an author has implemented to activate or give focus to an element. */
         "aria-keyshortcuts"?: string | undefined;
         /**
          * Defines a string value that labels the current element.
          * @see aria-labelledby.
          */
         "aria-label"?: string | undefined;
         /**
          * Identifies the element (or elements) that labels the current element.
          * @see aria-describedby.
          */
         "aria-labelledby"?: string | undefined;
         /** Defines the hierarchical level of an element within a structure. */
         "aria-level"?: number | undefined;
         /** Indicates that an element will be updated, and describes the types of updates the user agents, assistive technologies, and user can expect from the live region. */
         "aria-live"?: "off" | "assertive" | "polite" | undefined;
         /** Indicates whether an element is modal when displayed. */
         "aria-modal"?: Booleanish | undefined;
         /** Indicates whether a text box accepts multiple lines of input or only a single line. */
         "aria-multiline"?: Booleanish | undefined;
         /** Indicates that the user may select more than one item from the current selectable descendants. */
         "aria-multiselectable"?: Booleanish | undefined;
         /** Indicates whether the element's orientation is horizontal, vertical, or unknown/ambiguous. */
         "aria-orientation"?: "horizontal" | "vertical" | undefined;
         /**
          * Identifies an element (or elements) in order to define a visual, functional, or contextual parent/child relationship
          * between DOM elements where the DOM hierarchy cannot be used to represent the relationship.
          * @see aria-controls.
          */
         "aria-owns"?: string | undefined;
         /**
          * Defines a short hint (a word or short phrase) intended to aid the user with data entry when the control has no value.
          * A hint could be a sample value or a brief description of the expected format.
          */
         "aria-placeholder"?: string | undefined;
         /**
          * Defines an element's number or position in the current set of listitems or treeitems. Not required if all elements in the set are present in the DOM.
          * @see aria-setsize.
          */
         "aria-posinset"?: number | undefined;
         /**
          * Indicates the current "pressed" state of toggle buttons.
          * @see aria-checked @see aria-selected.
          */
         "aria-pressed"?: boolean | "false" | "mixed" | "true" | undefined;
         /**
          * Indicates that the element is not editable, but is otherwise operable.
          * @see aria-disabled.
          */
         "aria-readonly"?: Booleanish | undefined;
         /**
          * Indicates what notifications the user agent will trigger when the accessibility tree within a live region is modified.
          * @see aria-atomic.
          */
         "aria-relevant"?:
         | "additions"
         | "additions removals"
         | "additions text"
         | "all"
         | "removals"
         | "removals additions"
         | "removals text"
         | "text"
         | "text additions"
         | "text removals"
         | undefined;
         /** Indicates that user input is required on the element before a form may be submitted. */
         "aria-required"?: Booleanish | undefined;
         /** Defines a human-readable, author-localized description for the role of an element. */
         "aria-roledescription"?: string | undefined;
         /**
          * Defines the total number of rows in a table, grid, or treegrid.
          * @see aria-rowindex.
          */
         "aria-rowcount"?: number | undefined;
         /**
          * Defines an element's row index or position with respect to the total number of rows within a table, grid, or treegrid.
          * @see aria-rowcount @see aria-rowspan.
          */
         "aria-rowindex"?: number | undefined;
         /**
          * Defines a human readable text alternative of aria-rowindex.
          * @see aria-colindextext.
          */
         "aria-rowindextext"?: string | undefined;
         /**
          * Defines the number of rows spanned by a cell or gridcell within a table, grid, or treegrid.
          * @see aria-rowindex @see aria-colspan.
          */
         "aria-rowspan"?: number | undefined;
         /**
          * Indicates the current "selected" state of various widgets.
          * @see aria-checked @see aria-pressed.
          */
         "aria-selected"?: Booleanish | undefined;
         /**
          * Defines the number of items in the current set of listitems or treeitems. Not required if all elements in the set are present in the DOM.
          * @see aria-posinset.
          */
         "aria-setsize"?: number | undefined;
         /** Indicates if items in a table or grid are sorted in ascending or descending order. */
         "aria-sort"?: "none" | "ascending" | "descending" | "other" | undefined;
         /** Defines the maximum allowed value for a range widget. */
         "aria-valuemax"?: number | undefined;
         /** Defines the minimum allowed value for a range widget. */
         "aria-valuemin"?: number | undefined;
         /**
          * Defines the current value for a range widget.
          * @see aria-valuetext.
          */
         "aria-valuenow"?: number | undefined;
         /** Defines the human readable text alternative of aria-valuenow for a range widget. */
         "aria-valuetext"?: string | undefined;
      }

      // All the WAI-ARIA 1.1 role attribute values from https://www.w3.org/TR/wai-aria-1.1/#role_definitions
      type AriaRole =
         | "alert"
         | "alertdialog"
         | "application"
         | "article"
         | "banner"
         | "button"
         | "cell"
         | "checkbox"
         | "columnheader"
         | "combobox"
         | "complementary"
         | "contentinfo"
         | "definition"
         | "dialog"
         | "directory"
         | "document"
         | "feed"
         | "figure"
         | "form"
         | "grid"
         | "gridcell"
         | "group"
         | "heading"
         | "img"
         | "link"
         | "list"
         | "listbox"
         | "listitem"
         | "log"
         | "main"
         | "marquee"
         | "math"
         | "menu"
         | "menubar"
         | "menuitem"
         | "menuitemcheckbox"
         | "menuitemradio"
         | "navigation"
         | "none"
         | "note"
         | "option"
         | "presentation"
         | "progressbar"
         | "radio"
         | "radiogroup"
         | "region"
         | "row"
         | "rowgroup"
         | "rowheader"
         | "scrollbar"
         | "search"
         | "searchbox"
         | "separator"
         | "slider"
         | "spinbutton"
         | "status"
         | "switch"
         | "tab"
         | "table"
         | "tablist"
         | "tabpanel"
         | "term"
         | "textbox"
         | "timer"
         | "toolbar"
         | "tooltip"
         | "tree"
         | "treegrid"
         | "treeitem"
         | (string & {});



      // ===================================================================   
      // #region: HTML Attributes
      // ===================================================================  

      interface GlobalAttributes {
         class?: ClassInput | Lumo.MaybeIon<string | Falsey> | (Lumo.MaybeIon<string | Falsey> | ClassInput)[];
         style?: StyleInput | StyleInput[];

         autofocus?: Lumo.MaybeIon<Booleanish | undefined>; // Automatically focuses the element
         lang?: Lumo.MaybeIon<string | undefined>; // Specifies the language of the element's content
         id?: Lumo.MaybeIon<string | undefined>;
         tabindex?: Lumo.MaybeIon<number | undefined>; // Defines the tab order of the element

         // WAI-ARIA
         role?: Lumo.MaybeIon<AriaRole | undefined>;
      }

      interface GlobalURLAttributes {

      }


      interface HTMLAttributes<T> extends AriaAttributes, GlobalAttributes, DOMAttributes<T> {

         // Standard HTML Attributes
         contenteditable?: Lumo.MaybeIon<Booleanish | "inherit" | "plaintext-only" | undefined>;
         contextmenu?: Lumo.MaybeIon<string | undefined>;
         draggable?: Lumo.MaybeIon<Booleanish | undefined>;
         is?: Lumo.MaybeIon<string | undefined>;
         slot?: Lumo.MaybeIon<string | undefined>;
         spellcheck?: Lumo.MaybeIon<Booleanish | undefined>;
         translate?: Lumo.MaybeIon<"yes" | "no" | undefined>;
         nonce?: Lumo.MaybeIon<string | undefined>; // A cryptographic nonce for inline scripts
         part?: Lumo.MaybeIon<string | undefined>; // Specifies parts of the element for styling
         title?: Lumo.MaybeIon<string | undefined>; // Additional information displayed as a tooltip
         inert?: Lumo.MaybeIon<Booleanish | undefined>; // Prevents user interaction with the element
         itemid?: Lumo.MaybeIon<string | undefined>; // Defines the item's ID in microdata
         itemprop?: Lumo.MaybeIon<string | undefined>; // Specifies the item's property in microdata
         itemref?: Lumo.MaybeIon<string | undefined>; // References additional microdata items
         itemscope?: Lumo.MaybeIon<Booleanish | undefined>; // Declares the scope of an item
         itemtype?: Lumo.MaybeIon<string | undefined>; // Specifies the type of an item in microdata

         accesskey?: Lumo.MaybeIon<string | undefined>; // Defines a keyboard shortcut to activate/focus an element
         autocapitalize?: Lumo.MaybeIon<"off" | "none" | "on" | "sentences" | "words" | "characters" | undefined>; // Controls capitalization behavior
         dir?: Lumo.MaybeIon<"ltr" | "rtl" | "auto" | undefined>; // Specifies the text direction
         enterkeyhint?: Lumo.MaybeIon<
            "enter"
            | "done"
            | "go"
            | "next"
            | "previous"
            | "search"
            | "send"
            | undefined>; // Hint for virtual keyboards
         elementtiming?: Lumo.MaybeIon<string>;
         hidden?: Lumo.MaybeIon<Booleanish | "until-found" | undefined>; // Hides the element
         enterkeyhint?: Lumo.MaybeIon<"enter" | "done" | "go" | "next" | "previous" | "search" | "send" | undefined>;

         // RDFa Attributes
         about?: Lumo.MaybeIon<string | undefined>;
         content?: Lumo.MaybeIon<string | undefined>;
         datatype?: Lumo.MaybeIon<string | undefined>;
         inlist?: Lumo.MaybeIon<unknown>;
         prefix?: Lumo.MaybeIon<string | undefined>;
         property?: Lumo.MaybeIon<string | undefined>;
         rel?: Lumo.MaybeIon<string | undefined>;
         resource?: Lumo.MaybeIon<string | undefined>;
         rev?: Lumo.MaybeIon<string | undefined>;
         typeof?: Lumo.MaybeIon<string | undefined>;
         vocab?: Lumo.MaybeIon<string | undefined>;

         /**
          * Non-standard attribute
          */
         autocorrect?: Lumo.MaybeIon<string | undefined>;
         /**
          * Non-standard attribute
          */
         autosave?: Lumo.MaybeIon<string | undefined>;
         /**
          * Non-standard attribute
          */
         color?: Lumo.MaybeIon<string | undefined>;
         /**
          * Non-standard attribute
          */
         results?: Lumo.MaybeIon<number | undefined>;
         /**
          * Non-standard attribute
          */
         security?: Lumo.MaybeIon<string | undefined>;
         /**
          * Non-standard attribute
          */
         unselectable?: Lumo.MaybeIon<"on" | "off" | undefined>;
         /**
          * Non-standard attribute
          */
         anchor?: Lumo.MaybeIon<string>;




         // Living Standard
         /**
          * Hints at the type of data that might be entered by the user while editing the element or its contents
          * @see {@link https://html.spec.whatwg.org/multipage/interaction.html#input-modalities:-the-inputmode-attribute}
          */
         inputmode?: Lumo.MaybeIon<"none" | "text" | "tel" | "url" | "email" | "numeric" | "decimal" | "search" | undefined>;
         /**
          * Specify that a standard HTML element should behave like a defined custom built-in element
          * @see {@link https://html.spec.whatwg.org/multipage/custom-elements.html#attr-is}
          */

         exportparts?: Lumo.MaybeIon<string>;
         popover?: Lumo.MaybeIon<'auto' | 'hint' | 'manual' | true>;
         writingsuggestions?: Lumo.MaybeIon<Booleanish>;

         /**
          * Experimental
          */
         virtualkeyboardpolicyExperimental?: Lumo.MaybeIon<'auto' | 'manual'>;

         /**
          * DOM Property
          */
         scrollTop?: Lumo.MaybeIon<number | undefined>;

         /**
          * DOM Property
          */
         scrollLeft?: Lumo.MaybeIon<number | undefined>;

         /**
          * DOM Property
          */
         innerHTML?: Lumo.MaybeIon<string>;
      }


      // /**
      //  * For internal usage only.
      //  * Different release channels declare additional types of JSXNode this particular release channel accepts.
      //  * App or library types should never augment this interface.
      //  */

      // interface AllHTMLAttributes<T> extends HTMLAttributes<T> {
      //    // Standard HTML Attributes
      //    accept?: Lumo.MaybeIon<string | undefined>;
      //    acceptCharset?: Lumo.MaybeIon<string | undefined>;
      //    action?: Lumo.MaybeIon<string | undefined>;
      //    allowFullScreen?: Lumo.MaybeIon<Booleanish | undefined>;
      //    allowTransparency?: Lumo.MaybeIon<Booleanish | undefined>;
      //    alt?: Lumo.MaybeIon<string | undefined>;
      //    as?: Lumo.MaybeIon<string | undefined>;
      //    async?: Lumo.MaybeIon<Booleanish | undefined>;
      //    autoComplete?: Lumo.MaybeIon<string | undefined>;
      //    autoPlay?: Lumo.MaybeIon<Booleanish | undefined>;
      //    capture?: Lumo.MaybeIon<Booleanish | "user" | "environment" | undefined>;
      //    cellPadding?: Lumo.MaybeIon<number | string | undefined>;
      //    cellSpacing?: Lumo.MaybeIon<number | string | undefined>;
      //    charSet?: Lumo.MaybeIon<string | undefined>;
      //    challenge?: Lumo.MaybeIon<string | undefined>;
      //    checked?: Lumo.MaybeIon<Booleanish | undefined>;
      //    cite?: Lumo.MaybeIon<string | undefined>;
      //    classID?: Lumo.MaybeIon<string | undefined>;
      //    cols?: Lumo.MaybeIon<number | undefined>;
      //    colSpan?: Lumo.MaybeIon<number | undefined>;
      //    controls?: Lumo.MaybeIon<Booleanish | undefined>;
      //    coords?: Lumo.MaybeIon<string | undefined>;
      //    crossorigin?: Lumo.MaybeIon<CrossOrigin>;
      //    data?: Lumo.MaybeIon<string | undefined>;
      //    dateTime?: Lumo.MaybeIon<string | undefined>;
      //    default?: Lumo.MaybeIon<Booleanish | undefined>;
      //    defer?: Lumo.MaybeIon<Booleanish | undefined>;
      //    disabled?: Lumo.MaybeIon<Booleanish | undefined>;
      //    download?: Lumo.MaybeIon<unknown>;
      //    encType?: Lumo.MaybeIon<string | undefined>;
      //    form?: Lumo.MaybeIon<string | undefined>;
      //    formAction?: Lumo.MaybeIon<string | undefined>;
      //    formEncType?: Lumo.MaybeIon<string | undefined>;
      //    formMethod?: Lumo.MaybeIon<string | undefined>;
      //    formNoValidate?: Lumo.MaybeIon<Booleanish | undefined>;
      //    formTarget?: Lumo.MaybeIon<string | undefined>;
      //    frameBorder?: Lumo.MaybeIon<number | string | undefined>;
      //    headers?: Lumo.MaybeIon<string | undefined>;
      //    height?: Lumo.MaybeIon<number | string | undefined>;
      //    high?: Lumo.MaybeIon<number | undefined>;
      //    href?: Lumo.MaybeIon<string | undefined>;
      //    hrefLang?: Lumo.MaybeIon<string | undefined>;
      //    htmlFor?: Lumo.MaybeIon<string | undefined>;
      //    httpEquiv?: Lumo.MaybeIon<string | undefined>;
      //    integrity?: Lumo.MaybeIon<string | undefined>;
      //    keyParams?: Lumo.MaybeIon<string | undefined>;
      //    keyType?: Lumo.MaybeIon<string | undefined>;
      //    kind?: Lumo.MaybeIon<string | undefined>;
      //    label?: Lumo.MaybeIon<string | undefined>;
      //    list?: Lumo.MaybeIon<string | undefined>;
      //    loop?: Lumo.MaybeIon<Booleanish | undefined>;
      //    low?: Lumo.MaybeIon<number | undefined>;
      //    manifest?: Lumo.MaybeIon<string | undefined>;
      //    marginHeight?: Lumo.MaybeIon<number | undefined>;
      //    marginWidth?: Lumo.MaybeIon<number | undefined>;
      //    max?: Lumo.MaybeIon<number | string | undefined>;
      //    maxLength?: Lumo.MaybeIon<number | undefined>;
      //    media?: Lumo.MaybeIon<string | undefined>;
      //    mediaGroup?: Lumo.MaybeIon<string | undefined>;
      //    method?: Lumo.MaybeIon<string | undefined>;
      //    min?: Lumo.MaybeIon<number | string | undefined>;
      //    minLength?: Lumo.MaybeIon<number | undefined>;
      //    multiple?: Lumo.MaybeIon<Booleanish | undefined>;
      //    muted?: Lumo.MaybeIon<Booleanish | undefined>;
      //    name?: Lumo.MaybeIon<string | undefined>;
      //    noValidate?: Lumo.MaybeIon<Booleanish | undefined>;
      //    open?: Lumo.MaybeIon<Booleanish | undefined>;
      //    optimum?: Lumo.MaybeIon<number | undefined>;
      //    pattern?: Lumo.MaybeIon<string | undefined>;
      //    placeholder?: Lumo.MaybeIon<string | undefined>;
      //    playsInline?: Lumo.MaybeIon<Booleanish | undefined>;
      //    poster?: Lumo.MaybeIon<string | undefined>;
      //    preload?: Lumo.MaybeIon<string | undefined>;
      //    readOnly?: Lumo.MaybeIon<Booleanish | undefined>;
      //    required?: Lumo.MaybeIon<Booleanish | undefined>;
      //    reversed?: Lumo.MaybeIon<Booleanish | undefined>;
      //    rows?: Lumo.MaybeIon<number | undefined>;
      //    rowSpan?: Lumo.MaybeIon<number | undefined>;
      //    sandbox?: Lumo.MaybeIon<string | undefined>;
      //    scope?: Lumo.MaybeIon<string | undefined>;
      //    scoped?: Lumo.MaybeIon<Booleanish | undefined>;
      //    scrolling?: Lumo.MaybeIon<string | undefined>;
      //    seamless?: Lumo.MaybeIon<Booleanish | undefined>;
      //    selected?: Lumo.MaybeIon<Booleanish | undefined>;
      //    shape?: Lumo.MaybeIon<string | undefined>;
      //    size?: Lumo.MaybeIon<number | undefined>;
      //    sizes?: Lumo.MaybeIon<string | undefined>;
      //    span?: Lumo.MaybeIon<number | undefined>;
      //    src?: Lumo.MaybeIon<string | undefined>;
      //    srcDoc?: Lumo.MaybeIon<string | undefined>;
      //    srcLang?: Lumo.MaybeIon<string | undefined>;
      //    srcSet?: Lumo.MaybeIon<string | undefined>;
      //    start?: Lumo.MaybeIon<number | undefined>;
      //    step?: Lumo.MaybeIon<number | string | undefined>;
      //    summary?: Lumo.MaybeIon<string | undefined>;
      //    target?: Lumo.MaybeIon<string | undefined>;
      //    type?: Lumo.MaybeIon<string | undefined>;
      //    useMap?: Lumo.MaybeIon<string | undefined>;
      //    value?: Lumo.MaybeIon<string | readonly string[] | number | undefined>;
      //    width?: Lumo.MaybeIon<number | string | undefined>;
      //    wmode?: Lumo.MaybeIon<string | undefined>;
      //    wrap?: Lumo.MaybeIon<string | undefined>;
      // }

      type HTMLAttributeReferrerPolicy =
         | ""
         | "no-referrer"
         | "no-referrer-when-downgrade"
         | "origin"
         | "origin-when-cross-origin"
         | "same-origin"
         | "strict-origin"
         | "strict-origin-when-cross-origin"
         | "unsafe-url";

      type HTMLAttributeAnchorTarget =
         | "_self"
         | "_blank"
         | "_parent"
         | "_top"
         | (string & {});


      interface BaseHTMLAttributes<T> extends HTMLAttributes<T> {
         href?: Lumo.MaybeIon<string | undefined>;
         target?: Lumo.MaybeIon<string | undefined>;
      }

      interface AnchorHTMLAttributes<T> extends HTMLAttributes<T> {
         download?: Lumo.MaybeIon<unknown>;
         href?: Lumo.MaybeIon<string | undefined>;
         hreflang?: Lumo.MaybeIon<string | undefined>;
         media?: Lumo.MaybeIon<string | undefined>;
         ping?: Lumo.MaybeIon<string | undefined>;
         target?: Lumo.MaybeIon<HTMLAttributeAnchorTarget | undefined>;
         type?: Lumo.MaybeIon<string | undefined>;
         referrerpolicy?: Lumo.MaybeIon<HTMLAttributeReferrerPolicy | undefined>;
      }

      interface AudioHTMLAttributes<T> extends MediaHTMLAttributes<T> { }

      interface AreaHTMLAttributes<T> extends HTMLAttributes<T> {
         alt?: Lumo.MaybeIon<string | undefined>;
         coords?: Lumo.MaybeIon<string | undefined>;
         download?: Lumo.MaybeIon<unknown>;
         href?: Lumo.MaybeIon<string | undefined>;
         hreflang?: Lumo.MaybeIon<string | undefined>;
         media?: Lumo.MaybeIon<string | undefined>;
         referrerpolicy?: Lumo.MaybeIon<HTMLAttributeReferrerPolicy | undefined>;
         shape?: Lumo.MaybeIon<string | undefined>;
         target?: Lumo.MaybeIon<string | undefined>;
         ping?: Lumo.MaybeIon<string | undefined>;
         type?: Lumo.MaybeIon<string | undefined>;
      }

      interface BlockquoteHTMLAttributes<T> extends HTMLAttributes<T> {
         cite?: Lumo.MaybeIon<string | undefined>;
      }

      interface ButtonHTMLAttributes<T> extends HTMLAttributes<T> {
         disabled?: Lumo.MaybeIon<Booleanish | undefined>;
         form?: Lumo.MaybeIon<string | undefined>;
         formaction?: Lumo.MaybeIon<string | undefined>;
         formenctype?: Lumo.MaybeIon<string | undefined>;
         formmethod?: Lumo.MaybeIon<string | undefined>;
         formnovalidate?: Lumo.MaybeIon<Booleanish | undefined>;
         formtarget?: Lumo.MaybeIon<string | undefined>;
         name?: Lumo.MaybeIon<string | undefined>;
         popovertarget?: Lumo.MaybeIon<string>;
         popovertargetaction?: Lumo.MaybeIon<string>;
         type?: Lumo.MaybeIon<"submit" | "reset" | "button" | undefined>;
         value?: Lumo.MaybeIon<string | readonly string[] | number | undefined>;
      }

      interface CanvasHTMLAttributes<T> extends HTMLAttributes<T> {
         height?: Lumo.MaybeIon<number | string | undefined>;
         width?: Lumo.MaybeIon<number | string | undefined>;
      }

      interface ColHTMLAttributes<T> extends HTMLAttributes<T> {
         span?: Lumo.MaybeIon<number | undefined>;
         width?: Lumo.MaybeIon<number | string | undefined>;
      }

      interface ColgroupHTMLAttributes<T> extends HTMLAttributes<T> {
         span?: Lumo.MaybeIon<number | undefined>;
      }

      interface DataHTMLAttributes<T> extends HTMLAttributes<T> {
         value?: Lumo.MaybeIon<string | readonly string[] | number | undefined>;
      }

      interface DetailsHTMLAttributes<T> extends HTMLAttributes<T> {
         open?: Lumo.MaybeIon<Booleanish | undefined>;
         name?: Lumo.MaybeIon<string | undefined>;
      }

      interface DelHTMLAttributes<T> extends HTMLAttributes<T> {
         cite?: Lumo.MaybeIon<string | undefined>;
         datetime?: Lumo.MaybeIon<string | undefined>;
      }

      interface DialogHTMLAttributes<T> extends HTMLAttributes<T> {
         open?: Lumo.MaybeIon<Booleanish | undefined>;
         closedby?: Lumo.MaybeIon<'any' | 'closerequest' | 'none'>
         'on:cancel'?: HandleEvent<T> | undefined;
         'on:close'?: HandleEvent<T> | undefined;
      }

      interface EmbedHTMLAttributes<T> extends HTMLAttributes<T> {
         height?: Lumo.MaybeIon<number | string | undefined>;
         src?: Lumo.MaybeIon<string | undefined>;
         type?: Lumo.MaybeIon<string | undefined>;
         width?: Lumo.MaybeIon<number | string | undefined>;
      }

      interface FieldsetHTMLAttributes<T> extends HTMLAttributes<T> {
         disabled?: Lumo.MaybeIon<Booleanish | undefined>;
         form?: Lumo.MaybeIon<string | undefined>;
         name?: Lumo.MaybeIon<string | undefined>;
      }

      interface FormHTMLAttributes<T> extends HTMLAttributes<T> {
         /**
          * DOM Property
          */
         acceptCharset?: Lumo.MaybeIon<string | undefined>;
         action?: Lumo.MaybeIon<string | undefined>;
         autocomplete?: Lumo.MaybeIon<string | undefined>;
         enctype?: Lumo.MaybeIon<string | undefined>;
         method?: Lumo.MaybeIon<string | undefined>;
         name?: Lumo.MaybeIon<string | undefined>;
         novalidate?: Lumo.MaybeIon<Booleanish | undefined>;
         target?: Lumo.MaybeIon<string | undefined>;
      }

      interface HtmlHTMLAttributes<T> extends HTMLAttributes<T> {
         manifest?: Lumo.MaybeIon<string | undefined>;
      }

      interface IframeHTMLAttributes<T> extends HTMLAttributes<T> {
         allow?: Lumo.MaybeIon<string | undefined>;
         allowfullscreen?: Lumo.MaybeIon<Booleanish | undefined>;
         height?: Lumo.MaybeIon<number | string | undefined>;
         /**
          * DOM Property
          */
         loading?: Lumo.MaybeIon<"eager" | "lazy" | undefined>;
         name?: Lumo.MaybeIon<string | undefined>;
         referrerpolicy?: Lumo.MaybeIon<HTMLAttributeReferrerPolicy | undefined>;
         sandbox?: Lumo.MaybeIon<string | undefined>;
         seamless?: Lumo.MaybeIon<Booleanish | undefined>;
         src?: Lumo.MaybeIon<string | undefined>;
         srcdoc?: Lumo.MaybeIon<string | undefined>;
         width?: Lumo.MaybeIon<number | string | undefined>;
      }

      interface ImgHTMLAttributes<T> extends HTMLAttributes<T> {
         alt?: Lumo.MaybeIon<string | undefined>;
         crossorigin?: Lumo.MaybeIon<CrossOrigin>;
         ismap?: Lumo.MaybeIon<Booleanish>
         decoding?: Lumo.MaybeIon<"async" | "auto" | "sync" | undefined>;
         fetchpriority?: Lumo.MaybeIon<"high" | "low" | "auto">;
         height?: Lumo.MaybeIon<number | string | undefined>;
         loading?: Lumo.MaybeIon<"eager" | "lazy" | undefined>;
         referrerpolicy?: Lumo.MaybeIon<HTMLAttributeReferrerPolicy | undefined>;
         sizes?: Lumo.MaybeIon<string | undefined>;
         src?: Lumo.MaybeIon<string | undefined>;
         srcset?: Lumo.MaybeIon<string | undefined>;
         usemap?: Lumo.MaybeIon<string | undefined>;
         width?: Lumo.MaybeIon<number | string | undefined>;
      }

      interface InsHTMLAttributes<T> extends HTMLAttributes<T> {
         cite?: Lumo.MaybeIon<string | undefined>;
         datetime?: Lumo.MaybeIon<string | undefined>;
      }

      type HTMLInputTypeAttribute =
         | "button"
         | "checkbox"
         | "color"
         | "date"
         | "datetime-local"
         | "email"
         | "file"
         | "hidden"
         | "image"
         | "month"
         | "number"
         | "password"
         | "radio"
         | "range"
         | "reset"
         | "search"
         | "submit"
         | "tel"
         | "text"
         | "time"
         | "url"
         | "week"
         | (string & {});

      type AutoFillAddressKind = "billing" | "shipping";
      type AutoFillBase = "" | "off" | "on";
      type AutoFillContactField =
         | "email"
         | "tel"
         | "tel-area-code"
         | "tel-country-code"
         | "tel-extension"
         | "tel-local"
         | "tel-local-prefix"
         | "tel-local-suffix"
         | "tel-national";
      type AutoFillContactKind = "home" | "mobile" | "work";
      type AutoFillCredentialField = "webauthn";
      type AutoFillNormalField =
         | "additional-name"
         | "address-level1"
         | "address-level2"
         | "address-level3"
         | "address-level4"
         | "address-line1"
         | "address-line2"
         | "address-line3"
         | "bday-day"
         | "bday-month"
         | "bday-year"
         | "cc-csc"
         | "cc-exp"
         | "cc-exp-month"
         | "cc-exp-year"
         | "cc-family-name"
         | "cc-given-name"
         | "cc-name"
         | "cc-number"
         | "cc-type"
         | "country"
         | "country-name"
         | "current-password"
         | "family-name"
         | "given-name"
         | "honorific-prefix"
         | "honorific-suffix"
         | "name"
         | "new-password"
         | "one-time-code"
         | "organization"
         | "postal-code"
         | "street-address"
         | "transaction-amount"
         | "transaction-currency"
         | "username";
      type OptionalPrefixToken<T extends string> = `${T} ` | "";
      type OptionalPostfixToken<T extends string> = ` ${T}` | "";
      type AutoFillField = AutoFillNormalField | `${OptionalPrefixToken<AutoFillContactKind>}${AutoFillContactField}`;
      type AutoFillSection = `section-${string}`;
      type AutoFill =
         | AutoFillBase
         | `${OptionalPrefixToken<AutoFillSection>}${OptionalPrefixToken<
            AutoFillAddressKind
         >}${AutoFillField}${OptionalPostfixToken<AutoFillCredentialField>}`;
      type HTMLInputAutoCompleteAttribute = AutoFill | (string & {});

      interface InputHTMLAttributes<T> extends HTMLAttributes<T> {
         accept?: Lumo.MaybeIon<string | undefined>;
         alt?: Lumo.MaybeIon<string | undefined>;
         autocomplete?: Lumo.MaybeIon<HTMLInputAutoCompleteAttribute | undefined>;
         capture?: Lumo.MaybeIon<Booleanish | "user" | "environment" | undefined>; // https://www.w3.org/TR/html-media-capture/#the-capture-attribute
         checked?: Lumo.MaybeIon<Booleanish | undefined>;
         dirname?: Lumo.MaybeIon<string | undefined>;
         disabled?: Lumo.MaybeIon<Booleanish | undefined>;
         form?: Lumo.MaybeIon<string | undefined>;
         formaction?: Lumo.MaybeIon<string | undefined>;
         formenctype?: Lumo.MaybeIon<string | undefined>;
         formmethod?: Lumo.MaybeIon<string | undefined>;
         formnovalidate?: Lumo.MaybeIon<Booleanish | undefined>;
         formtarget?: Lumo.MaybeIon<string | undefined>;
         height?: Lumo.MaybeIon<number | string | undefined>;
         list?: Lumo.MaybeIon<string | undefined>;
         max?: Lumo.MaybeIon<number | string | undefined>;
         maxlength?: Lumo.MaybeIon<number | undefined>;
         min?: Lumo.MaybeIon<number | string | undefined>;
         minlength?: Lumo.MaybeIon<number | undefined>;
         multiple?: Lumo.MaybeIon<Booleanish | undefined>;
         name?: Lumo.MaybeIon<string | undefined>;
         pattern?: Lumo.MaybeIon<string | undefined>;
         placeholder?: Lumo.MaybeIon<string | undefined>;
         popovertarget?: Lumo.MaybeIon<string>;
         popovertargetaction?: Lumo.MaybeIon<string>;
         readonly?: Lumo.MaybeIon<Booleanish | undefined>;
         required?: Lumo.MaybeIon<Booleanish | undefined>;
         size?: Lumo.MaybeIon<number | undefined>;
         src?: Lumo.MaybeIon<string | undefined>;
         step?: Lumo.MaybeIon<number | string | undefined>;
         type?: Lumo.MaybeIon<HTMLInputTypeAttribute | undefined>;
         value?: Lumo.MaybeIon<string | readonly string[] | number | undefined>;
         width?: Lumo.MaybeIon<number | string | undefined>;

         'mu:value'?: Quarky.AtomicIon<unknown, { value: unknown; }> | Quarky.Ion<unknown, { set: (value: unknown) => unknown }>
         'mu:checked'?: Quarky.AtomicIon<Booleanny, { value: Booleanny; }> | Quarky.Ion<Booleanny, { set: (value: Booleanny) => unknown }>
      }


      /**
       * DEPRECATED
       */
      interface KeygenHTMLAttributes<T> extends HTMLAttributes<T> {
         challenge?: Lumo.MaybeIon<string | undefined>;
         disabled?: Lumo.MaybeIon<Booleanish | undefined>;
         form?: Lumo.MaybeIon<string | undefined>;
         keytype?: Lumo.MaybeIon<string | undefined>;
         keyparams?: Lumo.MaybeIon<string | undefined>;
         name?: Lumo.MaybeIon<string | undefined>;
      }

      interface LabelHTMLAttributes<T> extends HTMLAttributes<T> {
         form?: Lumo.MaybeIon<string | undefined>;
         for?: Lumo.MaybeIon<string | undefined>;
      }

      interface LiHTMLAttributes<T> extends HTMLAttributes<T> {
         value?: Lumo.MaybeIon<string | readonly string[] | number | undefined>;
      }

      interface LinkHTMLAttributes<T> extends HTMLAttributes<T> {
         as?: Lumo.MaybeIon<string | undefined>;
         blocking?: Lumo.MaybeIon<string | undefined>;
         crossorigin?: Lumo.MaybeIon<CrossOrigin>;
         fetchpriority?: Lumo.MaybeIon<"high" | "low" | "auto">;
         href?: Lumo.MaybeIon<string | undefined>;
         hreflang?: Lumo.MaybeIon<string | undefined>;
         integrity?: Lumo.MaybeIon<string | undefined>;
         media?: Lumo.MaybeIon<string | undefined>;
         imagesrcset?: Lumo.MaybeIon<string | undefined>;
         imagesizes?: Lumo.MaybeIon<string | undefined>;
         referrerpolicy?: Lumo.MaybeIon<HTMLAttributeReferrerPolicy | undefined>;
         sizes?: Lumo.MaybeIon<string | undefined>;
         type?: Lumo.MaybeIon<string | undefined>;
         charset?: Lumo.MaybeIon<string | undefined>;
      }

      interface MapHTMLAttributes<T> extends HTMLAttributes<T> {
         name?: Lumo.MaybeIon<string | undefined>;
      }

      interface MenuHTMLAttributes<T> extends HTMLAttributes<T> {
         type?: Lumo.MaybeIon<string | undefined>;
      }


      interface MediaHTMLAttributes<T> extends HTMLAttributes<T> {
         autoplay?: Lumo.MaybeIon<Booleanish | undefined>;
         controls?: Lumo.MaybeIon<Booleanish | undefined>;
         crossorigin?: Lumo.MaybeIon<CrossOrigin>;
         loop?: Lumo.MaybeIon<Booleanish | undefined>;
         mediagroup?: Lumo.MaybeIon<string | undefined>;
         muted?: Lumo.MaybeIon<Booleanish | undefined>;
         preload?: Lumo.MaybeIon<string | undefined>;
         src?: Lumo.MaybeIon<string | undefined>;
      }

      interface MetaHTMLAttributes<T> extends HTMLAttributes<T> {
         charset?: Lumo.MaybeIon<string | undefined>;
         content?: Lumo.MaybeIon<string | undefined>;
         'http-equiv'?: Lumo.MaybeIon<string | undefined>;
         media?: Lumo.MaybeIon<string | undefined>;
         name?: Lumo.MaybeIon<string | undefined>;
      }

      interface MeterHTMLAttributes<T> extends HTMLAttributes<T> {
         form?: Lumo.MaybeIon<string | undefined>;
         high?: Lumo.MaybeIon<number | undefined>;
         low?: Lumo.MaybeIon<number | undefined>;
         max?: Lumo.MaybeIon<number | string | undefined>;
         min?: Lumo.MaybeIon<number | string | undefined>;
         optimum?: Lumo.MaybeIon<number | undefined>;
         value?: Lumo.MaybeIon<string | readonly string[] | number | undefined>;
      }

      interface QuoteHTMLAttributes<T> extends HTMLAttributes<T> {
         cite?: Lumo.MaybeIon<string | undefined>;
      }

      interface ObjectHTMLAttributes<T> extends HTMLAttributes<T> {
         data?: Lumo.MaybeIon<string | undefined>;
         form?: Lumo.MaybeIon<string | undefined>;
         height?: Lumo.MaybeIon<number | string | undefined>;
         name?: Lumo.MaybeIon<string | undefined>;
         type?: Lumo.MaybeIon<string | undefined>;
         usemap?: Lumo.MaybeIon<string | undefined>;
         width?: Lumo.MaybeIon<number | string | undefined>;
      }

      interface OlHTMLAttributes<T> extends HTMLAttributes<T> {
         reversed?: Lumo.MaybeIon<Booleanish | undefined>;
         start?: Lumo.MaybeIon<number | undefined>;
         type?: Lumo.MaybeIon<"1" | "a" | "A" | "i" | "I" | undefined>;
      }

      interface OptgroupHTMLAttributes<T> extends HTMLAttributes<T> {
         disabled?: Lumo.MaybeIon<Booleanish | undefined>;
         label?: Lumo.MaybeIon<string | undefined>;
      }

      interface OptionHTMLAttributes<T> extends HTMLAttributes<T> {
         disabled?: Lumo.MaybeIon<Booleanish | undefined>;
         label?: Lumo.MaybeIon<string | undefined>;
         selected?: Lumo.MaybeIon<Booleanish | undefined>;
         value?: Lumo.MaybeIon<string | readonly string[] | number | undefined>;
      }

      interface OutputHTMLAttributes<T> extends HTMLAttributes<T> {
         form?: Lumo.MaybeIon<string | undefined>;
         for?: Lumo.MaybeIon<string | undefined>;
         name?: Lumo.MaybeIon<string | undefined>;
      }

      interface ParamHTMLAttributes<T> extends HTMLAttributes<T> {
         name?: Lumo.MaybeIon<string | undefined>;
         value?: Lumo.MaybeIon<string | readonly string[] | number | undefined>;
      }

      interface ProgressHTMLAttributes<T> extends HTMLAttributes<T> {
         max?: Lumo.MaybeIon<number | string | undefined>;
         value?: Lumo.MaybeIon<string | readonly string[] | number | undefined>;
      }

      interface SlotHTMLAttributes<T> extends HTMLAttributes<T> {
         name?: Lumo.MaybeIon<string | undefined>;
      }

      interface ScriptHTMLAttributes<T> extends HTMLAttributes<T> {
         async?: Lumo.MaybeIon<Booleanish | undefined>;
         crossorigin?: Lumo.MaybeIon<CrossOrigin>;
         defer?: Lumo.MaybeIon<Booleanish | undefined>;
         integrity?: Lumo.MaybeIon<string | undefined>;
         nomodule?: Lumo.MaybeIon<Booleanish | undefined>;
         referrerpolicy?: Lumo.MaybeIon<HTMLAttributeReferrerPolicy | undefined>;
         src?: Lumo.MaybeIon<string | undefined>;
         type?: Lumo.MaybeIon<string | undefined>;
      }

      interface SelectHTMLAttributes<T> extends HTMLAttributes<T> {
         autocomplete?: Lumo.MaybeIon<string | undefined>;
         disabled?: Lumo.MaybeIon<Booleanish | undefined>;
         form?: Lumo.MaybeIon<string | undefined>;
         multiple?: Lumo.MaybeIon<Booleanish | undefined>;
         name?: Lumo.MaybeIon<string | undefined>;
         required?: Lumo.MaybeIon<Booleanish | undefined>;
         size?: Lumo.MaybeIon<number | undefined>;
         value?: Lumo.MaybeIon<string | readonly string[] | number | undefined>;
         'on:change'?: HandleChangeEvent<T> | undefined;
         'mu:value'?: Quarky.AtomicIon<string, { state: string; }> | Quarky.Ion<string, { set: (value: string) => unknown }>
      }

      interface SourceHTMLAttributes<T> extends HTMLAttributes<T> {
         height?: Lumo.MaybeIon<number | string | undefined>;
         media?: Lumo.MaybeIon<string | undefined>;
         sizes?: Lumo.MaybeIon<string | undefined>;
         src?: Lumo.MaybeIon<string | undefined>;
         srcset?: Lumo.MaybeIon<string | undefined>;
         type?: Lumo.MaybeIon<string | undefined>;
         width?: Lumo.MaybeIon<number | string | undefined>;
      }

      interface StyleHTMLAttributes<T> extends HTMLAttributes<T> {
         media?: Lumo.MaybeIon<string | undefined>;
         scoped?: Lumo.MaybeIon<Booleanish | undefined>;
         type?: Lumo.MaybeIon<string | undefined>;
      }

      interface TableHTMLAttributes<T> extends HTMLAttributes<T> {
         // ALL DEPRECATED
         // align?: Lumo.MaybeIon<"left" | "center" | "right" | undefined>;
         // bgcolor?: Lumo.MaybeIon<string | undefined>;
         // border?: Lumo.MaybeIon<number | undefined>;
         // cellPadding?: Lumo.MaybeIon<number | string | undefined>;
         // cellSpacing?: Lumo.MaybeIon<number | string | undefined>;
         // frame?: Lumo.MaybeIon<Booleanish | undefined>;
         // rules?: Lumo.MaybeIon<"none" | "groups" | "rows" | "columns" | "all" | undefined>;
         // summary?: Lumo.MaybeIon<string | undefined>;
         // width?: Lumo.MaybeIon<number | string | undefined>;
      }

      interface TextareaHTMLAttributes<T> extends HTMLAttributes<T> {
         autocomplete?: Lumo.MaybeIon<string | undefined>;
         cols?: Lumo.MaybeIon<number | undefined>;
         dirname?: Lumo.MaybeIon<string | undefined>;
         disabled?: Lumo.MaybeIon<Booleanish | undefined>;
         form?: Lumo.MaybeIon<string | undefined>;
         maxlength?: Lumo.MaybeIon<number | undefined>;
         minlength?: Lumo.MaybeIon<number | undefined>;
         name?: Lumo.MaybeIon<string | undefined>;
         placeholder?: Lumo.MaybeIon<string | undefined>;
         readonly?: Lumo.MaybeIon<Booleanish | undefined>;
         required?: Lumo.MaybeIon<Booleanish | undefined>;
         rows?: Lumo.MaybeIon<number | undefined>;
         value?: Lumo.MaybeIon<string | readonly string[] | number | undefined>;
         wrap?: Lumo.MaybeIon<string | undefined>;

         'mu:value'?: Quarky.AtomicIon<string, { state: string; }> | Quarky.Ion<string, { set: (value: string) => unknown }>
         'on:change'?: HandleChangeEvent<T> | undefined;
      }

      interface TdHTMLAttributes<T> extends HTMLAttributes<T> {
         align?: Lumo.MaybeIon<"left" | "center" | "right" | "justify" | "char" | undefined>;
         colSpan?: Lumo.MaybeIon<number | undefined>;
         headers?: Lumo.MaybeIon<string | undefined>;
         rowSpan?: Lumo.MaybeIon<number | undefined>;
         scope?: Lumo.MaybeIon<string | undefined>;
         abbr?: Lumo.MaybeIon<string | undefined>;
         height?: Lumo.MaybeIon<number | string | undefined>;
         width?: Lumo.MaybeIon<number | string | undefined>;
         valign?: Lumo.MaybeIon<"top" | "middle" | "bottom" | "baseline" | undefined>;
      }

      interface ThHTMLAttributes<T> extends HTMLAttributes<T> {
         colspan?: Lumo.MaybeIon<number | undefined>;
         headers?: Lumo.MaybeIon<string | undefined>;
         rowspan?: Lumo.MaybeIon<number | undefined>;
         scope?: Lumo.MaybeIon<string | undefined>;
         abbr?: Lumo.MaybeIon<string | undefined>;
      }

      interface TimeHTMLAttributes<T> extends HTMLAttributes<T> {
         datetime?: Lumo.MaybeIon<string | undefined>;
      }

      interface TrackHTMLAttributes<T> extends HTMLAttributes<T> {
         default?: Lumo.MaybeIon<Booleanish | undefined>;
         kind?: Lumo.MaybeIon<string | undefined>;
         label?: Lumo.MaybeIon<string | undefined>;
         src?: Lumo.MaybeIon<string | undefined>;
         srclang?: Lumo.MaybeIon<string | undefined>;
      }

      interface VideoHTMLAttributes<T> extends MediaHTMLAttributes<T> {
         height?: Lumo.MaybeIon<number | string | undefined>;
         controlslist?: Lumo.MaybeIon<string | undefined>;
         playsinline?: Lumo.MaybeIon<Booleanish | undefined>;
         poster?: Lumo.MaybeIon<string | undefined>;
         width?: Lumo.MaybeIon<number | string | undefined>;
         disablepictureinpicture?: Lumo.MaybeIon<Booleanish | undefined>;
         disableremoteplayback?: Lumo.MaybeIon<Booleanish | undefined>;
      }


      interface SVGAttributes<T> extends AriaAttributes, GlobalAttributes, DOMAttributes<T> {
         // Attributes which also defined in HTMLAttributes
         href?: Lumo.MaybeIon<string | undefined>;
         hreflang?: Lumo.MaybeIon<string | undefined>;
         media?: Lumo.MaybeIon<string | undefined>;
         ping?: Lumo.MaybeIon<string | undefined>;
         target?: Lumo.MaybeIon<HTMLAttributeAnchorTarget | string | undefined>;
         type?: Lumo.MaybeIon<string | undefined>;
         referrerpolicy?: Lumo.MaybeIon<HTMLAttributeReferrerPolicy | undefined>;

         height?: Lumo.MaybeIon<number | string | undefined>;
         width?: Lumo.MaybeIon<number | string | undefined>;

         crossorigin?: Lumo.MaybeIon<CrossOrigin>;
         fetchpriority?: Lumo.MaybeIon<"high" | "low" | "auto">;

         // SVG Specific attributes
         accumulate?: Lumo.MaybeIon<"none" | "sum" | undefined>;
         additive?: Lumo.MaybeIon<"replace" | "sum" | undefined>;
         'alignment-baseline'?: Lumo.MaybeIon<
            | "auto"
            | "baseline"
            | "before-edge"
            | "text-before-edge"
            | "middle"
            | "central"
            | "after-edge"
            | "text-after-edge"
            | "ideographic"
            | "alphabetic"
            | "hanging"
            | "mathematical"
            | "inherit"
            | undefined>;
         allowReorder?: Lumo.MaybeIon<"no" | "yes" | undefined>;
         alphabetic?: Lumo.MaybeIon<number | string | undefined>;
         amplitude?: Lumo.MaybeIon<number | string | undefined>;
         'arabic-form'?: Lumo.MaybeIon<"initial" | "medial" | "terminal" | "isolated" | undefined>;
         attributeName?: Lumo.MaybeIon<string | undefined>;
         attributeType?: Lumo.MaybeIon<string | undefined>;
         autoReverse?: Lumo.MaybeIon<Booleanish | undefined>;
         azimuth?: Lumo.MaybeIon<number | string | undefined>;
         baseFrequency?: Lumo.MaybeIon<number | string | undefined>;
         'baseline-shift'?: Lumo.MaybeIon<number | string | undefined>;
         begin?: Lumo.MaybeIon<number | string | undefined>;
         bias?: Lumo.MaybeIon<number | string | undefined>;
         by?: Lumo.MaybeIon<number | string | undefined>;
         calcMode?: Lumo.MaybeIon<number | string | undefined>;
         clipPathUnits?: Lumo.MaybeIon<number | string | undefined>;
         'clip-path'?: Lumo.MaybeIon<string | undefined>;
         'clip-rule'?: Lumo.MaybeIon<number | string | undefined>;
         color?: Lumo.MaybeIon<string | undefined>;
         'color-interpolation'?: Lumo.MaybeIon<number | string | undefined>;
         'color-interpolation-filters'?: Lumo.MaybeIon<"auto" | "sRGB" | "linearRGB" | "inherit" | undefined>;
         'color-rendering'?: Lumo.MaybeIon<number | string | undefined>;
         cursor?: Lumo.MaybeIon<number | string | undefined>;
         cx?: Lumo.MaybeIon<number | string | undefined>;
         cy?: Lumo.MaybeIon<number | string | undefined>;
         d?: Lumo.MaybeIon<string | undefined>;
         decelerate?: Lumo.MaybeIon<number | string | undefined>;
         diffuseConstant?: Lumo.MaybeIon<number | string | undefined>;
         direction?: Lumo.MaybeIon<number | string | undefined>;
         display?: Lumo.MaybeIon<number | string | undefined>;
         divisor?: Lumo.MaybeIon<number | string | undefined>;
         'dominant-baseline'?: Lumo.MaybeIon<number | string | undefined>;
         dur?: Lumo.MaybeIon<number | string | undefined>;
         dx?: Lumo.MaybeIon<number | string | undefined>;
         dy?: Lumo.MaybeIon<number | string | undefined>;
         edgeMode?: Lumo.MaybeIon<number | string | undefined>;
         elevation?: Lumo.MaybeIon<number | string | undefined>;
         end?: Lumo.MaybeIon<number | string | undefined>;
         exponent?: Lumo.MaybeIon<number | string | undefined>;
         fill?: Lumo.MaybeIon<string | undefined>;
         'fill-opacity'?: Lumo.MaybeIon<number | string | undefined>;
         'fill-rule'?: Lumo.MaybeIon<"nonzero" | "evenodd" | "inherit" | undefined>;
         filter?: Lumo.MaybeIon<string | undefined>;
         filterUnits?: Lumo.MaybeIon<number | string | undefined>;
         'flood-color'?: Lumo.MaybeIon<number | string | undefined>;
         'flood-opacity'?: Lumo.MaybeIon<number | string | undefined>;
         focusable?: Lumo.MaybeIon<Booleanish | "auto" | undefined>;
         'font-family'?: Lumo.MaybeIon<string | undefined>;
         'font-size'?: Lumo.MaybeIon<number | string | undefined>;
         'font-size-adjust'?: Lumo.MaybeIon<number | string | undefined>;
         'font-style'?: Lumo.MaybeIon<number | string | undefined>;
         'font-variant'?: Lumo.MaybeIon<number | string | undefined>;
         'font-weight'?: Lumo.MaybeIon<number | string | undefined>;
         fr?: Lumo.MaybeIon<number | string | undefined>;
         from?: Lumo.MaybeIon<number | string | undefined>;
         fx?: Lumo.MaybeIon<number | string | undefined>;
         fy?: Lumo.MaybeIon<number | string | undefined>;
         gradientTransform?: Lumo.MaybeIon<string | undefined>;
         gradientUnits?: Lumo.MaybeIon<string | undefined>;
         'image-rendering'?: Lumo.MaybeIon<number | string | undefined>;
         in2?: Lumo.MaybeIon<number | string | undefined>;
         in?: Lumo.MaybeIon<string | undefined>;
         intercept?: Lumo.MaybeIon<number | string | undefined>;
         k1?: Lumo.MaybeIon<number | string | undefined>;
         k2?: Lumo.MaybeIon<number | string | undefined>;
         k3?: Lumo.MaybeIon<number | string | undefined>;
         k4?: Lumo.MaybeIon<number | string | undefined>;
         kernelMatrix?: Lumo.MaybeIon<number | string | undefined>;
         kernelUnitLength?: Lumo.MaybeIon<number | string | undefined>;
         keyPoints?: Lumo.MaybeIon<number | string | undefined>;
         keySplines?: Lumo.MaybeIon<number | string | undefined>;
         keyTimes?: Lumo.MaybeIon<number | string | undefined>;
         lengthAdjust?: Lumo.MaybeIon<number | string | undefined>;
         'letter-spacing'?: Lumo.MaybeIon<number | string | undefined>;
         'lighting-color'?: Lumo.MaybeIon<number | string | undefined>;
         limitingConeAngle?: Lumo.MaybeIon<number | string | undefined>;
         'marker-end'?: Lumo.MaybeIon<string | undefined>;
         'marker-mid'?: Lumo.MaybeIon<string | undefined>;
         'marker-start'?: Lumo.MaybeIon<string | undefined>;
         markerHeight?: Lumo.MaybeIon<number | string | undefined>;
         markerUnits?: Lumo.MaybeIon<number | string | undefined>;
         markerWidth?: Lumo.MaybeIon<number | string | undefined>;
         mask?: Lumo.MaybeIon<string | undefined>;
         maskContentUnits?: Lumo.MaybeIon<number | string | undefined>;
         maskUnits?: Lumo.MaybeIon<number | string | undefined>;
         max?: Lumo.MaybeIon<number | string | undefined>;
         min?: Lumo.MaybeIon<number | string | undefined>;

         /**
          * The method attribute indicates the method by which text should be rendered along the path of a <textPath> element.
          * 
          * default: 'align'
          * 
          * source: https://developer.mozilla.org/en-US/docs/Web/SVG/Reference/Attribute/method
          */
         method?: Lumo.MaybeIon<'align' | 'stretch'>;
         mode?: Lumo.MaybeIon<number | string | undefined>;
         name?: Lumo.MaybeIon<string | undefined>;
         numOctaves?: Lumo.MaybeIon<number | string | undefined>;
         offset?: Lumo.MaybeIon<number | string | undefined>;
         opacity?: Lumo.MaybeIon<number | string | undefined>;
         operator?: Lumo.MaybeIon<number | string | undefined>;
         order?: Lumo.MaybeIon<number | string | undefined>;
         orient?: Lumo.MaybeIon<number | string | undefined>;
         origin?: Lumo.MaybeIon<number | string | undefined>;
         overflow?: Lumo.MaybeIon<number | string | undefined>;
         'overline-position'?: Lumo.MaybeIon<number | string | undefined>;
         'overline-thickness'?: Lumo.MaybeIon<number | string | undefined>;
         'paint-order'?: Lumo.MaybeIon<number | string | undefined>;
         path?: Lumo.MaybeIon<string | undefined>;
         pathLength?: Lumo.MaybeIon<number | string | undefined>;
         patternContentUnits?: Lumo.MaybeIon<string | undefined>;
         patternTransform?: Lumo.MaybeIon<number | string | undefined>;
         patternUnits?: Lumo.MaybeIon<string | undefined>;
         'pointer-events'?: Lumo.MaybeIon<number | string | undefined>;
         points?: Lumo.MaybeIon<string | undefined>;
         pointsAtX?: Lumo.MaybeIon<number | string | undefined>;
         pointsAtY?: Lumo.MaybeIon<number | string | undefined>;
         pointsAtZ?: Lumo.MaybeIon<number | string | undefined>;
         preserveAlpha?: Lumo.MaybeIon<Booleanish | undefined>;
         preserveAspectRatio?: Lumo.MaybeIon<string | undefined>;
         primitiveUnits?: Lumo.MaybeIon<number | string | undefined>;
         r?: Lumo.MaybeIon<number | string | undefined>;
         radius?: Lumo.MaybeIon<number | string | undefined>;
         refX?: Lumo.MaybeIon<number | string | undefined>;
         refY?: Lumo.MaybeIon<number | string | undefined>;
         renderingIntent?: Lumo.MaybeIon<number | string | undefined>;
         repeatCount?: Lumo.MaybeIon<number | string | undefined>;
         repeatDur?: Lumo.MaybeIon<number | string | undefined>;
         requiredExtensions?: Lumo.MaybeIon<number | string | undefined>;
         restart?: Lumo.MaybeIon<number | string | undefined>;
         result?: Lumo.MaybeIon<string | undefined>;
         rotate?: Lumo.MaybeIon<number | string | undefined>;
         rx?: Lumo.MaybeIon<number | string | undefined>;
         ry?: Lumo.MaybeIon<number | string | undefined>;
         scale?: Lumo.MaybeIon<number | string | undefined>;
         seed?: Lumo.MaybeIon<number | string | undefined>;
         'shape-rendering'?: Lumo.MaybeIon<number | string | undefined>;
         /**
          * EXPERIMENTAL
          * 
          * default: 'left'
          * 
          * https://developer.mozilla.org/en-US/docs/Web/SVG/Reference/Attribute/side
          */
         side?: Lumo.MaybeIon<'left' | 'right'>;
         slope?: Lumo.MaybeIon<number | string | undefined>;
         spacing?: Lumo.MaybeIon<number | string | undefined>;
         specularConstant?: Lumo.MaybeIon<number | string | undefined>;
         specularExponent?: Lumo.MaybeIon<number | string | undefined>;
         spreadMethod?: Lumo.MaybeIon<string | undefined>;
         startOffset?: Lumo.MaybeIon<number | string | undefined>;
         stdDeviation?: Lumo.MaybeIon<number | string | undefined>;
         stitchTiles?: Lumo.MaybeIon<number | string | undefined>;
         'stop-color'?: Lumo.MaybeIon<string | undefined>;
         'stop-opacity'?: Lumo.MaybeIon<number | string | undefined>;
         'strikethrough-Position'?: Lumo.MaybeIon<number | string | undefined>;
         'strikethrough-Thickness'?: Lumo.MaybeIon<number | string | undefined>;
         stroke?: Lumo.MaybeIon<string | undefined>;
         'stroke-dasharray'?: Lumo.MaybeIon<string | number | undefined>;
         'stroke-dashoffset'?: Lumo.MaybeIon<string | number | undefined>;
         'stroke-linecap'?: Lumo.MaybeIon<"butt" | "round" | "square" | "inherit" | undefined>;
         'stroke-linejoin'?: Lumo.MaybeIon<"miter" | "round" | "bevel" | "inherit" | undefined>;
         'stroke-miterlimit'?: Lumo.MaybeIon<number | string | undefined>;
         'stroke-opacity'?: Lumo.MaybeIon<number | string | undefined>;
         'stroke-width'?: Lumo.MaybeIon<number | string | undefined>;
         surfaceScale?: Lumo.MaybeIon<number | string | undefined>;
         systemLanguage?: Lumo.MaybeIon<number | string | undefined>;
         tableValues?: Lumo.MaybeIon<number | string | undefined>;
         targetX?: Lumo.MaybeIon<number | string | undefined>;
         targetY?: Lumo.MaybeIon<number | string | undefined>;
         'text-anchor'?: Lumo.MaybeIon<string | undefined>;
         'text-decoration'?: Lumo.MaybeIon<number | string | undefined>;
         /**
          * *default*: 'clip'
          */
         'text-overflow'?: Lumo.MaybeIon<'clip' | 'ellipses'>;
         'text-rendering'?: Lumo.MaybeIon<number | string | undefined>;
         textLength?: Lumo.MaybeIon<number | string | undefined>;
         to?: Lumo.MaybeIon<number | string | undefined>;
         transform?: Lumo.MaybeIon<string | undefined>;
         'transform-origin'?: Lumo.MaybeIon<string | undefined>;
         'underline-position'?: Lumo.MaybeIon<number | string | undefined>;
         'underline-thickness'?: Lumo.MaybeIon<number | string | undefined>;
         'unicode-bidi'?: Lumo.MaybeIon<number | string | undefined>;
         values?: Lumo.MaybeIon<string | undefined>;
         'vector-effect'?: Lumo.MaybeIon<number | string | undefined>;
         viewBox?: Lumo.MaybeIon<string | undefined>;
         visibility?: Lumo.MaybeIon<number | string | undefined>;
         'white-space'?: Lumo.MaybeIon<'normal' | 'pre' | 'nowrap' | 'pre-wrap' | 'break-space' | 'pre-line'>;
         'word-spacing'?: Lumo.MaybeIon<number | string | undefined>;
         'writing-mode'?: Lumo.MaybeIon<number | string | undefined>;
         x1?: Lumo.MaybeIon<number | string | undefined>;
         x2?: Lumo.MaybeIon<number | string | undefined>;
         x?: Lumo.MaybeIon<number | string | undefined>;
         xChannelSelector?: Lumo.MaybeIon<string | undefined>;
         'xlink:actuate'?: Lumo.MaybeIon<string | undefined>;
         'xlink:role'?: Lumo.MaybeIon<string | undefined>;
         xmlns?: Lumo.MaybeIon<string | undefined>;
         'xmlns:xlink'?: Lumo.MaybeIon<string | undefined>;
         y1?: Lumo.MaybeIon<number | string | undefined>;
         y2?: Lumo.MaybeIon<number | string | undefined>;
         y?: Lumo.MaybeIon<number | string | undefined>;
         yChannelSelector?: Lumo.MaybeIon<string | undefined>;
         z?: Lumo.MaybeIon<number | string | undefined>;
         zoomAndPan?: Lumo.MaybeIon<string | undefined>;
      }

      interface WebViewHTMLAttributes<T> extends HTMLAttributes<T> {
         allowfullscreen?: Lumo.MaybeIon<Booleanish | undefined>;
         allowpopups?: Lumo.MaybeIon<Booleanish | undefined>;
         autosize?: Lumo.MaybeIon<Booleanish | undefined>;
         blinkfeatures?: Lumo.MaybeIon<string | undefined>;
         enableblinkfeatures?: Lumo.MaybeIon<string | undefined>;
         disableblinkfeatures?: Lumo.MaybeIon<string | undefined>;
         disableguestresize?: Lumo.MaybeIon<Booleanish | undefined>;
         disablewebsecurity?: Lumo.MaybeIon<Booleanish | undefined>;
         guestinstance?: Lumo.MaybeIon<string | undefined>;
         httpreferrer?: Lumo.MaybeIon<string | undefined>;
         nodeintegration?: Lumo.MaybeIon<Booleanish | undefined>;
         nodeintegrationinsubframes?: Lumo.MaybeIon<Booleanish | undefined>;
         partition?: Lumo.MaybeIon<string | undefined>;
         plugins?: Lumo.MaybeIon<Booleanish | undefined>;
         preload?: Lumo.MaybeIon<string | undefined>;
         src?: Lumo.MaybeIon<string | undefined>;
         useragent?: Lumo.MaybeIon<string | undefined>;
         webpreferences?: Lumo.MaybeIon<string | undefined>;
      }




      //
      // Error Interfaces
      // ----------------------------------------------------------------------
      interface ErrorInfo {
         /**
          * Captures which component contained the exception, and its ancestors.
          */
         componentStack?: string | null;
         digest?: string | null;
      }

      // DOM Attributes
      // ----------------------------------------------------------------------

      interface RefAttributes<T> {
         /**
          * Access the DOM element via NodeRef or node refs config object.
          * Once the view unmounts, the ref value will be set to `null`
          */
         ref?: () => T | undefined // TODO: add NodeRefsConfig
      }

      type DetailedHTMLProps<E extends HTMLAttributes<T>, T> = RefAttributes<T> & E & Lumo.LumoHooks<P> & LumoCommonAttributes

      interface SVGProps<T> extends SVGAttributes<T>, RefAttributes<T> {
      }

      interface SVGLineElementAttributes<T> extends SVGProps<T> { }
      interface SVGTextElementAttributes<T> extends SVGProps<T> { }


      type DOMAttributes<T> = {
         children?: Lumo.JSXNode | undefined | null;
      } & Events<T>
   }
}



// IMPORTANT Components and elements
// N = (props: P) => JSX.Element
type LumoAttributes<F, P> =
   P extends { '~attributes'?: infer A }
   ? A & Lumo.LumoHooks<Lumo.ComponentRef<F>> & LumoComponentAttributes<F> & LumoCommonAttributes & L.Events<Lumo.ComponentRef<F>>// Component Attributes
   : P // Element attributes must be added to DetailedHTMLProps

type LumoComponentAttributes<C> = {
   ref?: () => Lumo.ComponentRef<C> | undefined
   class?: ClassInput | Lumo.MaybeIon<string | Falsey> | (Lumo.MaybeIon<string | Falsey> | ClassInput)[];
   style?: StyleInput | StyleInput[];
}

type LumoCommonAttributes = {
   'on:event'?: { [key: string]: Function };
}



declare global {

   type Events<T> = L.Events<T>


   namespace JSX {

      // important for converting component input types to attribute types
      type LibraryManagedAttributes<C, P> = LumoAttributes<C, P>;

      type CSSProperties = L.CSSProperties

      type Falsey = undefined | null | false;

      type StyleInput = Lumo.MaybeIon<string | Falsey> | Lumo.MaybeIon<{ [K in keyof Partial<CSSProperties>]: Lumo.MaybeIon<CSSProperties[K]> }>

      type ClassInput = Lumo.MaybeIon<string> | Lumo.MaybeIon<{ [key: string]: Lumo.MaybeIon<Booleanny> }>

      type IntrinsicElements = JSX._IntrinsicElements & LumoElements


      interface LumoElements {
         '!--': {}; //comments
         'o--portal': PortalNodeInput & { children: Lumo.Slot }

         'o--link': L.DetailedHTMLProps<L.LinkHTMLAttributes<HTMLLinkElement>, HTMLLinkElement> & { 'portal-to'?: 'body' | 'head' }
         'o--head': L.DetailedHTMLProps<L.LinkHTMLAttributes<HTMLHeadElement>, HTMLHeadElement>
         'o--body': L.DetailedHTMLProps<L.LinkHTMLAttributes<HTMLBodyElement>, HTMLBodyElement>
         'show-view': { children: ConditionalRenderKit[] | ConditionalRenderKit }
         'create-view': { children: ConditionalRenderKit[] }
         'remount-view': { children: ConditionalRenderKit[]; discard?: Ion<Booleanish> }
         'render-view': { children: Lumo.RawJSXNode }
         // 'o--preserve': { children: ConditionalRenderKit[]; discard?: Ion<Booleanish> };
         // 'preserve-conditionals': { children: ConditionalRenderKit[]; 'can:discard'?: () => void };
         // 'Slot': {Slot: unknown}

         // 'o--suspense': SuspenseNodeInput & { children: Lumo.Slot };
         // 'o--try': TryNodeInput & { children: Lumo.Slot };

         // 'ooo-transit': L.DetailedHTMLProps<L.HTMLAttributes<HTMLDivElement> & TransitionNodeInput, HTMLDivElement>
         // 'ooo-transition': L.DetailedHTMLProps<L.HTMLAttributes<HTMLDivElement> & TransitionNodeInput & { morph?: true }, HTMLDivElement>
         'o--dock': L.DetailedHTMLProps<L.HTMLAttributes<HTMLDivElement> & TransitionNodeInput, HTMLDivElement>
      }



      interface _IntrinsicElements {
         // HTML
         a: L.DetailedHTMLProps<L.AnchorHTMLAttributes<HTMLAnchorElement>, HTMLAnchorElement>;
         abbr: L.DetailedHTMLProps<L.HTMLAttributes<HTMLElement>, HTMLElement>;
         address: L.DetailedHTMLProps<L.HTMLAttributes<HTMLElement>, HTMLElement>;
         area: L.DetailedHTMLProps<L.AreaHTMLAttributes<HTMLAreaElement>, HTMLAreaElement>;
         article: L.DetailedHTMLProps<L.HTMLAttributes<HTMLElement>, HTMLElement>;
         aside: L.DetailedHTMLProps<L.HTMLAttributes<HTMLElement>, HTMLElement>;
         audio: L.DetailedHTMLProps<L.AudioHTMLAttributes<HTMLAudioElement>, HTMLAudioElement>;
         b: L.DetailedHTMLProps<L.HTMLAttributes<HTMLElement>, HTMLElement>;
         base: L.DetailedHTMLProps<L.BaseHTMLAttributes<HTMLBaseElement>, HTMLBaseElement>;
         bdi: L.DetailedHTMLProps<L.HTMLAttributes<HTMLElement>, HTMLElement>;
         bdo: L.DetailedHTMLProps<L.HTMLAttributes<HTMLElement>, HTMLElement>;
         big: L.DetailedHTMLProps<L.HTMLAttributes<HTMLElement>, HTMLElement>;
         blockquote: L.DetailedHTMLProps<L.BlockquoteHTMLAttributes<HTMLQuoteElement>, HTMLQuoteElement>;
         body: L.DetailedHTMLProps<L.HTMLAttributes<HTMLBodyElement>, HTMLBodyElement>;
         br: L.DetailedHTMLProps<L.HTMLAttributes<HTMLBRElement>, HTMLBRElement>;
         button: L.DetailedHTMLProps<L.ButtonHTMLAttributes<HTMLButtonElement>, HTMLButtonElement>;
         canvas: L.DetailedHTMLProps<L.CanvasHTMLAttributes<HTMLCanvasElement>, HTMLCanvasElement>;
         caption: L.DetailedHTMLProps<L.HTMLAttributes<HTMLElement>, HTMLElement>;
         center: L.DetailedHTMLProps<L.HTMLAttributes<HTMLElement>, HTMLElement>;
         cite: L.DetailedHTMLProps<L.HTMLAttributes<HTMLElement>, HTMLElement>;
         code: L.DetailedHTMLProps<L.HTMLAttributes<HTMLElement>, HTMLElement>;
         col: L.DetailedHTMLProps<L.ColHTMLAttributes<HTMLTableColElement>, HTMLTableColElement>;
         colgroup: L.DetailedHTMLProps<L.ColgroupHTMLAttributes<HTMLTableColElement>, HTMLTableColElement>;
         data: L.DetailedHTMLProps<L.DataHTMLAttributes<HTMLDataElement>, HTMLDataElement>;
         datalist: L.DetailedHTMLProps<L.HTMLAttributes<HTMLDataListElement>, HTMLDataListElement>;
         dd: L.DetailedHTMLProps<L.HTMLAttributes<HTMLElement>, HTMLElement>;
         del: L.DetailedHTMLProps<L.DelHTMLAttributes<HTMLModElement>, HTMLModElement>;
         details: L.DetailedHTMLProps<L.DetailsHTMLAttributes<HTMLDetailsElement>, HTMLDetailsElement>;
         dfn: L.DetailedHTMLProps<L.HTMLAttributes<HTMLElement>, HTMLElement>;
         dialog: L.DetailedHTMLProps<L.DialogHTMLAttributes<HTMLDialogElement>, HTMLDialogElement>;
         div: L.DetailedHTMLProps<L.HTMLAttributes<HTMLDivElement>, HTMLDivElement>;
         dl: L.DetailedHTMLProps<L.HTMLAttributes<HTMLDListElement>, HTMLDListElement>;
         dt: L.DetailedHTMLProps<L.HTMLAttributes<HTMLElement>, HTMLElement>;
         em: L.DetailedHTMLProps<L.HTMLAttributes<HTMLElement>, HTMLElement>;
         embed: L.DetailedHTMLProps<L.EmbedHTMLAttributes<HTMLEmbedElement>, HTMLEmbedElement>;
         fieldset: L.DetailedHTMLProps<L.FieldsetHTMLAttributes<HTMLFieldSetElement>, HTMLFieldSetElement>;
         figcaption: L.DetailedHTMLProps<L.HTMLAttributes<HTMLElement>, HTMLElement>;
         figure: L.DetailedHTMLProps<L.HTMLAttributes<HTMLElement>, HTMLElement>;
         footer: L.DetailedHTMLProps<L.HTMLAttributes<HTMLElement>, HTMLElement>;
         form: L.DetailedHTMLProps<L.FormHTMLAttributes<HTMLFormElement>, HTMLFormElement>;
         h1: L.DetailedHTMLProps<L.HTMLAttributes<HTMLHeadingElement>, HTMLHeadingElement>;
         h2: L.DetailedHTMLProps<L.HTMLAttributes<HTMLHeadingElement>, HTMLHeadingElement>;
         h3: L.DetailedHTMLProps<L.HTMLAttributes<HTMLHeadingElement>, HTMLHeadingElement>;
         h4: L.DetailedHTMLProps<L.HTMLAttributes<HTMLHeadingElement>, HTMLHeadingElement>;
         h5: L.DetailedHTMLProps<L.HTMLAttributes<HTMLHeadingElement>, HTMLHeadingElement>;
         h6: L.DetailedHTMLProps<L.HTMLAttributes<HTMLHeadingElement>, HTMLHeadingElement>;
         head: L.DetailedHTMLProps<L.HTMLAttributes<HTMLHeadElement>, HTMLHeadElement>;
         header: L.DetailedHTMLProps<L.HTMLAttributes<HTMLElement>, HTMLElement>;
         hgroup: L.DetailedHTMLProps<L.HTMLAttributes<HTMLElement>, HTMLElement>;
         hr: L.DetailedHTMLProps<L.HTMLAttributes<HTMLHRElement>, HTMLHRElement>;
         html: L.DetailedHTMLProps<L.HtmlHTMLAttributes<HTMLHtmlElement>, HTMLHtmlElement>;
         i: L.DetailedHTMLProps<L.HTMLAttributes<HTMLElement>, HTMLElement>;
         iframe: L.DetailedHTMLProps<L.IframeHTMLAttributes<HTMLIFrameElement>, HTMLIFrameElement>;
         img: L.DetailedHTMLProps<L.ImgHTMLAttributes<HTMLImageElement>, HTMLImageElement>;
         input: L.DetailedHTMLProps<L.InputHTMLAttributes<HTMLInputElement>, HTMLInputElement>;
         ins: L.DetailedHTMLProps<L.InsHTMLAttributes<HTMLModElement>, HTMLModElement>;
         kbd: L.DetailedHTMLProps<L.HTMLAttributes<HTMLElement>, HTMLElement>;
         keygen: L.DetailedHTMLProps<L.KeygenHTMLAttributes<HTMLElement>, HTMLElement>;
         label: L.DetailedHTMLProps<L.LabelHTMLAttributes<HTMLLabelElement>, HTMLLabelElement>;
         legend: L.DetailedHTMLProps<L.HTMLAttributes<HTMLLegendElement>, HTMLLegendElement>;
         li: L.DetailedHTMLProps<L.LiHTMLAttributes<HTMLLIElement>, HTMLLIElement>;
         link: L.DetailedHTMLProps<L.LinkHTMLAttributes<HTMLLinkElement>, HTMLLinkElement>;
         main: L.DetailedHTMLProps<L.HTMLAttributes<HTMLElement>, HTMLElement>;
         map: L.DetailedHTMLProps<L.MapHTMLAttributes<HTMLMapElement>, HTMLMapElement>;
         mark: L.DetailedHTMLProps<L.HTMLAttributes<HTMLElement>, HTMLElement>;
         menu: L.DetailedHTMLProps<L.MenuHTMLAttributes<HTMLElement>, HTMLElement>;
         menuitem: L.DetailedHTMLProps<L.HTMLAttributes<HTMLElement>, HTMLElement>;
         meta: L.DetailedHTMLProps<L.MetaHTMLAttributes<HTMLMetaElement>, HTMLMetaElement>;
         meter: L.DetailedHTMLProps<L.MeterHTMLAttributes<HTMLMeterElement>, HTMLMeterElement>;
         nav: L.DetailedHTMLProps<L.HTMLAttributes<HTMLElement>, HTMLElement>;
         noindex: L.DetailedHTMLProps<L.HTMLAttributes<HTMLElement>, HTMLElement>;
         noscript: L.DetailedHTMLProps<L.HTMLAttributes<HTMLElement>, HTMLElement>;
         object: L.DetailedHTMLProps<L.ObjectHTMLAttributes<HTMLObjectElement>, HTMLObjectElement>;
         ol: L.DetailedHTMLProps<L.OlHTMLAttributes<HTMLOListElement>, HTMLOListElement>;
         optgroup: L.DetailedHTMLProps<L.OptgroupHTMLAttributes<HTMLOptGroupElement>, HTMLOptGroupElement>;
         option: L.DetailedHTMLProps<L.OptionHTMLAttributes<HTMLOptionElement>, HTMLOptionElement>;
         output: L.DetailedHTMLProps<L.OutputHTMLAttributes<HTMLOutputElement>, HTMLOutputElement>;
         p: L.DetailedHTMLProps<L.HTMLAttributes<HTMLParagraphElement>, HTMLParagraphElement>;
         param: L.DetailedHTMLProps<L.ParamHTMLAttributes<HTMLParamElement>, HTMLParamElement>;
         picture: L.DetailedHTMLProps<L.HTMLAttributes<HTMLElement>, HTMLElement>;
         pre: L.DetailedHTMLProps<L.HTMLAttributes<HTMLPreElement>, HTMLPreElement>;
         progress: L.DetailedHTMLProps<L.ProgressHTMLAttributes<HTMLProgressElement>, HTMLProgressElement>;
         q: L.DetailedHTMLProps<L.QuoteHTMLAttributes<HTMLQuoteElement>, HTMLQuoteElement>;
         rp: L.DetailedHTMLProps<L.HTMLAttributes<HTMLElement>, HTMLElement>;
         rt: L.DetailedHTMLProps<L.HTMLAttributes<HTMLElement>, HTMLElement>;
         ruby: L.DetailedHTMLProps<L.HTMLAttributes<HTMLElement>, HTMLElement>;
         s: L.DetailedHTMLProps<L.HTMLAttributes<HTMLElement>, HTMLElement>;
         samp: L.DetailedHTMLProps<L.HTMLAttributes<HTMLElement>, HTMLElement>;
         search: L.DetailedHTMLProps<L.HTMLAttributes<HTMLElement>, HTMLElement>;
         slot: L.DetailedHTMLProps<L.SlotHTMLAttributes<HTMLSlotElement>, HTMLSlotElement>;
         script: L.DetailedHTMLProps<L.ScriptHTMLAttributes<HTMLScriptElement>, HTMLScriptElement>;
         section: L.DetailedHTMLProps<L.HTMLAttributes<HTMLElement>, HTMLElement>;
         select: L.DetailedHTMLProps<L.SelectHTMLAttributes<HTMLSelectElement>, HTMLSelectElement>;
         small: L.DetailedHTMLProps<L.HTMLAttributes<HTMLElement>, HTMLElement>;
         source: L.DetailedHTMLProps<L.SourceHTMLAttributes<HTMLSourceElement>, HTMLSourceElement>;
         span: L.DetailedHTMLProps<L.HTMLAttributes<HTMLSpanElement>, HTMLSpanElement>;
         strong: L.DetailedHTMLProps<L.HTMLAttributes<HTMLElement>, HTMLElement>;
         style: L.DetailedHTMLProps<L.StyleHTMLAttributes<HTMLStyleElement>, HTMLStyleElement>;
         sub: L.DetailedHTMLProps<L.HTMLAttributes<HTMLElement>, HTMLElement>;
         summary: L.DetailedHTMLProps<L.HTMLAttributes<HTMLElement>, HTMLElement>;
         sup: L.DetailedHTMLProps<L.HTMLAttributes<HTMLElement>, HTMLElement>;
         table: L.DetailedHTMLProps<L.TableHTMLAttributes<HTMLTableElement>, HTMLTableElement>;
         template: L.DetailedHTMLProps<L.HTMLAttributes<HTMLTemplateElement>, HTMLTemplateElement>;
         tbody: L.DetailedHTMLProps<L.HTMLAttributes<HTMLTableSectionElement>, HTMLTableSectionElement>;
         td: L.DetailedHTMLProps<L.TdHTMLAttributes<HTMLTableDataCellElement>, HTMLTableDataCellElement>;
         textarea: L.DetailedHTMLProps<L.TextareaHTMLAttributes<HTMLTextAreaElement>, HTMLTextAreaElement>;
         tfoot: L.DetailedHTMLProps<L.HTMLAttributes<HTMLTableSectionElement>, HTMLTableSectionElement>;
         th: L.DetailedHTMLProps<L.ThHTMLAttributes<HTMLTableHeaderCellElement>, HTMLTableHeaderCellElement>;
         thead: L.DetailedHTMLProps<L.HTMLAttributes<HTMLTableSectionElement>, HTMLTableSectionElement>;
         time: L.DetailedHTMLProps<L.TimeHTMLAttributes<HTMLTimeElement>, HTMLTimeElement>;
         title: L.DetailedHTMLProps<L.HTMLAttributes<HTMLTitleElement>, HTMLTitleElement>;
         tr: L.DetailedHTMLProps<L.HTMLAttributes<HTMLTableRowElement>, HTMLTableRowElement>;
         track: L.DetailedHTMLProps<L.TrackHTMLAttributes<HTMLTrackElement>, HTMLTrackElement>;
         u: L.DetailedHTMLProps<L.HTMLAttributes<HTMLElement>, HTMLElement>;
         ul: L.DetailedHTMLProps<L.HTMLAttributes<HTMLUListElement>, HTMLUListElement>;
         "var": L.DetailedHTMLProps<L.HTMLAttributes<HTMLElement>, HTMLElement>;
         video: L.DetailedHTMLProps<L.VideoHTMLAttributes<HTMLVideoElement>, HTMLVideoElement>;
         wbr: L.DetailedHTMLProps<L.HTMLAttributes<HTMLElement>, HTMLElement>;
         webview: L.DetailedHTMLProps<L.WebViewHTMLAttributes<HTMLWebViewElement>, HTMLWebViewElement>;

         // SVG
         svg: L.SVGProps<SVGSVGElement>;

         animate: L.SVGProps<SVGElement>; // TODO: It is SVGAnimateElement but is not in TypeScript's lib.dom.d.ts for now.
         animateMotion: L.SVGProps<SVGElement>;
         animateTransform: L.SVGProps<SVGElement>; // TODO: It is SVGAnimateTransformElement but is not in TypeScript's lib.dom.d.ts for now.
         circle: L.SVGProps<SVGCircleElement>;
         clipPath: L.SVGProps<SVGClipPathElement>;
         defs: L.SVGProps<SVGDefsElement>;
         desc: L.SVGProps<SVGDescElement>;
         ellipse: L.SVGProps<SVGEllipseElement>;
         feBlend: L.SVGProps<SVGFEBlendElement>;
         feColorMatrix: L.SVGProps<SVGFEColorMatrixElement>;
         feComponentTransfer: L.SVGProps<SVGFEComponentTransferElement>;
         feComposite: L.SVGProps<SVGFECompositeElement>;
         feConvolveMatrix: L.SVGProps<SVGFEConvolveMatrixElement>;
         feDiffuseLighting: L.SVGProps<SVGFEDiffuseLightingElement>;
         feDisplacementMap: L.SVGProps<SVGFEDisplacementMapElement>;
         feDistantLight: L.SVGProps<SVGFEDistantLightElement>;
         feDropShadow: L.SVGProps<SVGFEDropShadowElement>;
         feFlood: L.SVGProps<SVGFEFloodElement>;
         feFuncA: L.SVGProps<SVGFEFuncAElement>;
         feFuncB: L.SVGProps<SVGFEFuncBElement>;
         feFuncG: L.SVGProps<SVGFEFuncGElement>;
         feFuncR: L.SVGProps<SVGFEFuncRElement>;
         feGaussianBlur: L.SVGProps<SVGFEGaussianBlurElement>;
         feImage: L.SVGProps<SVGFEImageElement>;
         feMerge: L.SVGProps<SVGFEMergeElement>;
         feMergeNode: L.SVGProps<SVGFEMergeNodeElement>;
         feMorphology: L.SVGProps<SVGFEMorphologyElement>;
         feOffset: L.SVGProps<SVGFEOffsetElement>;
         fePointLight: L.SVGProps<SVGFEPointLightElement>;
         feSpecularLighting: L.SVGProps<SVGFESpecularLightingElement>;
         feSpotLight: L.SVGProps<SVGFESpotLightElement>;
         feTile: L.SVGProps<SVGFETileElement>;
         feTurbulence: L.SVGProps<SVGFETurbulenceElement>;
         filter: L.SVGProps<SVGFilterElement>;
         foreignObject: L.SVGProps<SVGForeignObjectElement>;
         g: L.SVGProps<SVGGElement>;
         image: L.SVGProps<SVGImageElement>;
         line: L.SVGLineElementAttributes<SVGLineElement>;
         linearGradient: L.SVGProps<SVGLinearGradientElement>;
         marker: L.SVGProps<SVGMarkerElement>;
         mask: L.SVGProps<SVGMaskElement>;
         metadata: L.SVGProps<SVGMetadataElement>;
         mpath: L.SVGProps<SVGElement>;
         path: L.SVGProps<SVGPathElement>;
         pattern: L.SVGProps<SVGPatternElement>;
         polygon: L.SVGProps<SVGPolygonElement>;
         polyline: L.SVGProps<SVGPolylineElement>;
         radialGradient: L.SVGProps<SVGRadialGradientElement>;
         rect: L.SVGProps<SVGRectElement>;
         set: L.SVGProps<SVGSetElement>;
         stop: L.SVGProps<SVGStopElement>;
         switch: L.SVGProps<SVGSwitchElement>;
         symbol: L.SVGProps<SVGSymbolElement>;
         text: L.SVGTextElementAttributes<SVGTextElement>;
         textPath: L.SVGProps<SVGTextPathElement>;
         tspan: L.SVGProps<SVGTSpanElement>;
         use: L.SVGProps<SVGUseElement>;
         view: L.SVGProps<SVGViewElement>;
      }
   }
}

