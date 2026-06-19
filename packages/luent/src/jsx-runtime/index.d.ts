/// <reference path="global.d.ts" />

import * as CSS from "csstype";
import * as Luent from "@rue/luent";
import * as Quarky from "@rue/quarky";
import { NodeRef } from "../src/node/NodeRef";
import { NodeRefsConfig } from "../src/node/NodeRefs";
import { COMPONENT_ATTRIBUTES, ContextKeyMap, _ContextInputType, Component, SuspenseNodeInput, TryNodeInput, TransitionNodeInput } from "@rue/luent";
import { AnyObject, Booleanny } from "@rue/types";
import { PortalNodeInput } from "../src/boundaries/Portal";

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

      from: typeof Luent.matchEventTarget
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
      microclass?: ClassInput | Luent.MaybeIon<string | Falsey> | (Luent.MaybeIon<string | Falsey> | ClassInput)[];
      class?: ClassInput | Luent.MaybeIon<string | Falsey> | (Luent.MaybeIon<string | Falsey> | ClassInput)[];
      style?: StyleInput | StyleInput[];

      autofocus?: Luent.MaybeIon<Booleanish | undefined>; // Automatically focuses the element
      lang?: Luent.MaybeIon<string | undefined>; // Specifies the language of the element's content
      id?: Luent.MaybeIon<string | undefined>;
      tabindex?: Luent.MaybeIon<number | undefined>; // Defines the tab order of the element

      // WAI-ARIA
      role?: Luent.MaybeIon<AriaRole | undefined>;
    }

    interface GlobalURLAttributes {

    }


    interface HTMLAttributes<T> extends AriaAttributes, GlobalAttributes, DOMAttributes<T> {

      // Standard HTML Attributes
      contenteditable?: Luent.MaybeIon<Booleanish | "inherit" | "plaintext-only" | undefined>;
      contextmenu?: Luent.MaybeIon<string | undefined>;
      draggable?: Luent.MaybeIon<Booleanish | undefined>;
      is?: Luent.MaybeIon<string | undefined>;
      slot?: Luent.MaybeIon<string | undefined>;
      spellcheck?: Luent.MaybeIon<Booleanish | undefined>;
      translate?: Luent.MaybeIon<"yes" | "no" | undefined>;
      nonce?: Luent.MaybeIon<string | undefined>; // A cryptographic nonce for inline scripts
      part?: Luent.MaybeIon<string | undefined>; // Specifies parts of the element for styling
      title?: Luent.MaybeIon<string | undefined>; // Additional information displayed as a tooltip
      inert?: Luent.MaybeIon<Booleanish | undefined>; // Prevents user interaction with the element
      itemid?: Luent.MaybeIon<string | undefined>; // Defines the item's ID in microdata
      itemprop?: Luent.MaybeIon<string | undefined>; // Specifies the item's property in microdata
      itemref?: Luent.MaybeIon<string | undefined>; // References additional microdata items
      itemscope?: Luent.MaybeIon<Booleanish | undefined>; // Declares the scope of an item
      itemtype?: Luent.MaybeIon<string | undefined>; // Specifies the type of an item in microdata

      accesskey?: Luent.MaybeIon<string | undefined>; // Defines a keyboard shortcut to activate/focus an element
      autocapitalize?: Luent.MaybeIon<"off" | "none" | "on" | "sentences" | "words" | "characters" | undefined>; // Controls capitalization behavior
      dir?: Luent.MaybeIon<"ltr" | "rtl" | "auto" | undefined>; // Specifies the text direction
      enterkeyhint?: Luent.MaybeIon<
        "enter"
        | "done"
        | "go"
        | "next"
        | "previous"
        | "search"
        | "send"
        | undefined>; // Hint for virtual keyboards
      elementtiming?: Luent.MaybeIon<string>;
      hidden?: Luent.MaybeIon<Booleanish | "until-found" | undefined>; // Hides the element
      enterkeyhint?: Luent.MaybeIon<"enter" | "done" | "go" | "next" | "previous" | "search" | "send" | undefined>;

      // RDFa Attributes
      about?: Luent.MaybeIon<string | undefined>;
      content?: Luent.MaybeIon<string | undefined>;
      datatype?: Luent.MaybeIon<string | undefined>;
      inlist?: Luent.MaybeIon<unknown>;
      prefix?: Luent.MaybeIon<string | undefined>;
      property?: Luent.MaybeIon<string | undefined>;
      rel?: Luent.MaybeIon<string | undefined>;
      resource?: Luent.MaybeIon<string | undefined>;
      rev?: Luent.MaybeIon<string | undefined>;
      typeof?: Luent.MaybeIon<string | undefined>;
      vocab?: Luent.MaybeIon<string | undefined>;

      /**
       * Non-standard attribute
       */
      autocorrect?: Luent.MaybeIon<string | undefined>;
      /**
       * Non-standard attribute
       */
      autosave?: Luent.MaybeIon<string | undefined>;
      /**
       * Non-standard attribute
       */
      color?: Luent.MaybeIon<string | undefined>;
      /**
       * Non-standard attribute
       */
      results?: Luent.MaybeIon<number | undefined>;
      /**
       * Non-standard attribute
       */
      security?: Luent.MaybeIon<string | undefined>;
      /**
       * Non-standard attribute
       */
      unselectable?: Luent.MaybeIon<"on" | "off" | undefined>;
      /**
       * Non-standard attribute
       */
      anchor?: Luent.MaybeIon<string>;




      // Living Standard
      /**
       * Hints at the type of data that might be entered by the user while editing the element or its contents
       * @see {@link https://html.spec.whatwg.org/multipage/interaction.html#input-modalities:-the-inputmode-attribute}
       */
      inputmode?: Luent.MaybeIon<"none" | "text" | "tel" | "url" | "email" | "numeric" | "decimal" | "search" | undefined>;
      /**
       * Specify that a standard HTML element should behave like a defined custom built-in element
       * @see {@link https://html.spec.whatwg.org/multipage/custom-elements.html#attr-is}
       */

      exportparts?: Luent.MaybeIon<string>;
      popover?: Luent.MaybeIon<'auto' | 'hint' | 'manual' | true>;
      writingsuggestions?: Luent.MaybeIon<Booleanish>;

      /**
       * Experimental
       */
      virtualkeyboardpolicyExperimental?: Luent.MaybeIon<'auto' | 'manual'>;

      //  /**
      //   * DOM Property
      //   */
      //  scrollTop?: Luent.MaybeIon<number | undefined>;

      //  /**
      //   * DOM Property
      //   */
      //  scrollLeft?: Luent.MaybeIon<number | undefined>;
    }


    // /**
    //  * For internal usage only.
    //  * Different release channels declare additional types of JSXNode this particular release channel accepts.
    //  * App or library types should never augment this interface.
    //  */

    // interface AllHTMLAttributes<T> extends HTMLAttributes<T> {
    //    // Standard HTML Attributes
    //    accept?: Luent.MaybeIon<string | undefined>;
    //    acceptCharset?: Luent.MaybeIon<string | undefined>;
    //    action?: Luent.MaybeIon<string | undefined>;
    //    allowFullScreen?: Luent.MaybeIon<Booleanish | undefined>;
    //    allowTransparency?: Luent.MaybeIon<Booleanish | undefined>;
    //    alt?: Luent.MaybeIon<string | undefined>;
    //    as?: Luent.MaybeIon<string | undefined>;
    //    async?: Luent.MaybeIon<Booleanish | undefined>;
    //    autoComplete?: Luent.MaybeIon<string | undefined>;
    //    autoPlay?: Luent.MaybeIon<Booleanish | undefined>;
    //    capture?: Luent.MaybeIon<Booleanish | "user" | "environment" | undefined>;
    //    cellPadding?: Luent.MaybeIon<number | string | undefined>;
    //    cellSpacing?: Luent.MaybeIon<number | string | undefined>;
    //    charSet?: Luent.MaybeIon<string | undefined>;
    //    challenge?: Luent.MaybeIon<string | undefined>;
    //    checked?: Luent.MaybeIon<Booleanish | undefined>;
    //    cite?: Luent.MaybeIon<string | undefined>;
    //    classID?: Luent.MaybeIon<string | undefined>;
    //    cols?: Luent.MaybeIon<number | undefined>;
    //    colSpan?: Luent.MaybeIon<number | undefined>;
    //    controls?: Luent.MaybeIon<Booleanish | undefined>;
    //    coords?: Luent.MaybeIon<string | undefined>;
    //    crossorigin?: Luent.MaybeIon<CrossOrigin>;
    //    data?: Luent.MaybeIon<string | undefined>;
    //    dateTime?: Luent.MaybeIon<string | undefined>;
    //    default?: Luent.MaybeIon<Booleanish | undefined>;
    //    defer?: Luent.MaybeIon<Booleanish | undefined>;
    //    disabled?: Luent.MaybeIon<Booleanish | undefined>;
    //    download?: Luent.MaybeIon<unknown>;
    //    encType?: Luent.MaybeIon<string | undefined>;
    //    form?: Luent.MaybeIon<string | undefined>;
    //    formAction?: Luent.MaybeIon<string | undefined>;
    //    formEncType?: Luent.MaybeIon<string | undefined>;
    //    formMethod?: Luent.MaybeIon<string | undefined>;
    //    formNoValidate?: Luent.MaybeIon<Booleanish | undefined>;
    //    formTarget?: Luent.MaybeIon<string | undefined>;
    //    frameBorder?: Luent.MaybeIon<number | string | undefined>;
    //    headers?: Luent.MaybeIon<string | undefined>;
    //    height?: Luent.MaybeIon<number | string | undefined>;
    //    high?: Luent.MaybeIon<number | undefined>;
    //    href?: Luent.MaybeIon<string | undefined>;
    //    hrefLang?: Luent.MaybeIon<string | undefined>;
    //    htmlFor?: Luent.MaybeIon<string | undefined>;
    //    httpEquiv?: Luent.MaybeIon<string | undefined>;
    //    integrity?: Luent.MaybeIon<string | undefined>;
    //    keyParams?: Luent.MaybeIon<string | undefined>;
    //    keyType?: Luent.MaybeIon<string | undefined>;
    //    kind?: Luent.MaybeIon<string | undefined>;
    //    label?: Luent.MaybeIon<string | undefined>;
    //    list?: Luent.MaybeIon<string | undefined>;
    //    loop?: Luent.MaybeIon<Booleanish | undefined>;
    //    low?: Luent.MaybeIon<number | undefined>;
    //    manifest?: Luent.MaybeIon<string | undefined>;
    //    marginHeight?: Luent.MaybeIon<number | undefined>;
    //    marginWidth?: Luent.MaybeIon<number | undefined>;
    //    max?: Luent.MaybeIon<number | string | undefined>;
    //    maxLength?: Luent.MaybeIon<number | undefined>;
    //    media?: Luent.MaybeIon<string | undefined>;
    //    mediaGroup?: Luent.MaybeIon<string | undefined>;
    //    method?: Luent.MaybeIon<string | undefined>;
    //    min?: Luent.MaybeIon<number | string | undefined>;
    //    minLength?: Luent.MaybeIon<number | undefined>;
    //    multiple?: Luent.MaybeIon<Booleanish | undefined>;
    //    muted?: Luent.MaybeIon<Booleanish | undefined>;
    //    name?: Luent.MaybeIon<string | undefined>;
    //    noValidate?: Luent.MaybeIon<Booleanish | undefined>;
    //    open?: Luent.MaybeIon<Booleanish | undefined>;
    //    optimum?: Luent.MaybeIon<number | undefined>;
    //    pattern?: Luent.MaybeIon<string | undefined>;
    //    placeholder?: Luent.MaybeIon<string | undefined>;
    //    playsInline?: Luent.MaybeIon<Booleanish | undefined>;
    //    poster?: Luent.MaybeIon<string | undefined>;
    //    preload?: Luent.MaybeIon<string | undefined>;
    //    readOnly?: Luent.MaybeIon<Booleanish | undefined>;
    //    required?: Luent.MaybeIon<Booleanish | undefined>;
    //    reversed?: Luent.MaybeIon<Booleanish | undefined>;
    //    rows?: Luent.MaybeIon<number | undefined>;
    //    rowSpan?: Luent.MaybeIon<number | undefined>;
    //    sandbox?: Luent.MaybeIon<string | undefined>;
    //    scope?: Luent.MaybeIon<string | undefined>;
    //    scoped?: Luent.MaybeIon<Booleanish | undefined>;
    //    scrolling?: Luent.MaybeIon<string | undefined>;
    //    seamless?: Luent.MaybeIon<Booleanish | undefined>;
    //    selected?: Luent.MaybeIon<Booleanish | undefined>;
    //    shape?: Luent.MaybeIon<string | undefined>;
    //    size?: Luent.MaybeIon<number | undefined>;
    //    sizes?: Luent.MaybeIon<string | undefined>;
    //    span?: Luent.MaybeIon<number | undefined>;
    //    src?: Luent.MaybeIon<string | undefined>;
    //    srcDoc?: Luent.MaybeIon<string | undefined>;
    //    srcLang?: Luent.MaybeIon<string | undefined>;
    //    srcSet?: Luent.MaybeIon<string | undefined>;
    //    start?: Luent.MaybeIon<number | undefined>;
    //    step?: Luent.MaybeIon<number | string | undefined>;
    //    summary?: Luent.MaybeIon<string | undefined>;
    //    target?: Luent.MaybeIon<string | undefined>;
    //    type?: Luent.MaybeIon<string | undefined>;
    //    useMap?: Luent.MaybeIon<string | undefined>;
    //    value?: Luent.MaybeIon<string | readonly string[] | number | undefined>;
    //    width?: Luent.MaybeIon<number | string | undefined>;
    //    wmode?: Luent.MaybeIon<string | undefined>;
    //    wrap?: Luent.MaybeIon<string | undefined>;
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
      href?: Luent.MaybeIon<string | undefined>;
      target?: Luent.MaybeIon<string | undefined>;
    }

    interface AnchorHTMLAttributes<T> extends HTMLAttributes<T> {
      download?: Luent.MaybeIon<unknown>;
      href?: Luent.MaybeIon<string | undefined>;
      hreflang?: Luent.MaybeIon<string | undefined>;
      media?: Luent.MaybeIon<string | undefined>;
      ping?: Luent.MaybeIon<string | undefined>;
      target?: Luent.MaybeIon<HTMLAttributeAnchorTarget | undefined>;
      type?: Luent.MaybeIon<string | undefined>;
      referrerpolicy?: Luent.MaybeIon<HTMLAttributeReferrerPolicy | undefined>;
    }

    interface AudioHTMLAttributes<T> extends MediaHTMLAttributes<T> { }

    interface AreaHTMLAttributes<T> extends HTMLAttributes<T> {
      alt?: Luent.MaybeIon<string | undefined>;
      coords?: Luent.MaybeIon<string | undefined>;
      download?: Luent.MaybeIon<unknown>;
      href?: Luent.MaybeIon<string | undefined>;
      hreflang?: Luent.MaybeIon<string | undefined>;
      media?: Luent.MaybeIon<string | undefined>;
      referrerpolicy?: Luent.MaybeIon<HTMLAttributeReferrerPolicy | undefined>;
      shape?: Luent.MaybeIon<string | undefined>;
      target?: Luent.MaybeIon<string | undefined>;
      ping?: Luent.MaybeIon<string | undefined>;
      type?: Luent.MaybeIon<string | undefined>;
    }

    interface BlockquoteHTMLAttributes<T> extends HTMLAttributes<T> {
      cite?: Luent.MaybeIon<string | undefined>;
    }

    interface ButtonHTMLAttributes<T> extends HTMLAttributes<T> {
      disabled?: Luent.MaybeIon<Booleanish | undefined>;
      form?: Luent.MaybeIon<string | undefined>;
      formaction?: Luent.MaybeIon<string | undefined>;
      formenctype?: Luent.MaybeIon<string | undefined>;
      formmethod?: Luent.MaybeIon<string | undefined>;
      formnovalidate?: Luent.MaybeIon<Booleanish | undefined>;
      formtarget?: Luent.MaybeIon<string | undefined>;
      name?: Luent.MaybeIon<string | undefined>;
      popovertarget?: Luent.MaybeIon<string>;
      popovertargetaction?: Luent.MaybeIon<string>;
      type?: Luent.MaybeIon<"submit" | "reset" | "button" | undefined>;
      value?: Luent.MaybeIon<string | readonly string[] | number | undefined>;
    }

    interface CanvasHTMLAttributes<T> extends HTMLAttributes<T> {
      height?: Luent.MaybeIon<number | string | undefined>;
      width?: Luent.MaybeIon<number | string | undefined>;
    }

    interface ColHTMLAttributes<T> extends HTMLAttributes<T> {
      span?: Luent.MaybeIon<number | undefined>;
      width?: Luent.MaybeIon<number | string | undefined>;
    }

    interface ColgroupHTMLAttributes<T> extends HTMLAttributes<T> {
      span?: Luent.MaybeIon<number | undefined>;
    }

    interface DataHTMLAttributes<T> extends HTMLAttributes<T> {
      value?: Luent.MaybeIon<string | readonly string[] | number | undefined>;
    }

    interface DetailsHTMLAttributes<T> extends HTMLAttributes<T> {
      open?: Luent.MaybeIon<Booleanish | undefined>;
      name?: Luent.MaybeIon<string | undefined>;
    }

    interface DelHTMLAttributes<T> extends HTMLAttributes<T> {
      cite?: Luent.MaybeIon<string | undefined>;
      datetime?: Luent.MaybeIon<string | undefined>;
    }

    interface DialogHTMLAttributes<T> extends HTMLAttributes<T> {
      open?: Luent.MaybeIon<Booleanish | undefined>;
      closedby?: Luent.MaybeIon<'any' | 'closerequest' | 'none'>
      'on:cancel'?: HandleEvent<T> | undefined;
      'on:close'?: HandleEvent<T> | undefined;
    }

    interface EmbedHTMLAttributes<T> extends HTMLAttributes<T> {
      height?: Luent.MaybeIon<number | string | undefined>;
      src?: Luent.MaybeIon<string | undefined>;
      type?: Luent.MaybeIon<string | undefined>;
      width?: Luent.MaybeIon<number | string | undefined>;
    }

    interface FieldsetHTMLAttributes<T> extends HTMLAttributes<T> {
      disabled?: Luent.MaybeIon<Booleanish | undefined>;
      form?: Luent.MaybeIon<string | undefined>;
      name?: Luent.MaybeIon<string | undefined>;
    }

    interface FormHTMLAttributes<T> extends HTMLAttributes<T> {
      'accept-charset'?: Luent.MaybeIon<string | undefined>;
      /**
       * DOM Property
       */
      action?: Luent.MaybeIon<string | undefined>;
      autocomplete?: Luent.MaybeIon<string | undefined>;
      enctype?: Luent.MaybeIon<string | undefined>;
      method?: Luent.MaybeIon<string | undefined>;
      name?: Luent.MaybeIon<string | undefined>;
      novalidate?: Luent.MaybeIon<Booleanish | undefined>;
      target?: Luent.MaybeIon<string | undefined>;
    }

    interface HtmlHTMLAttributes<T> extends HTMLAttributes<T> {
      manifest?: Luent.MaybeIon<string | undefined>;
    }

    interface IframeHTMLAttributes<T> extends HTMLAttributes<T> {
      allow?: Luent.MaybeIon<string | undefined>;
      allowfullscreen?: Luent.MaybeIon<Booleanish | undefined>;
      height?: Luent.MaybeIon<number | string | undefined>;
      /**
       * DOM Property
       */
      loading?: Luent.MaybeIon<"eager" | "lazy" | undefined>;
      name?: Luent.MaybeIon<string | undefined>;
      referrerpolicy?: Luent.MaybeIon<HTMLAttributeReferrerPolicy | undefined>;
      sandbox?: Luent.MaybeIon<string | undefined>;
      seamless?: Luent.MaybeIon<Booleanish | undefined>;
      src?: Luent.MaybeIon<string | undefined>;
      srcdoc?: Luent.MaybeIon<string | undefined>;
      width?: Luent.MaybeIon<number | string | undefined>;
    }

    interface ImgHTMLAttributes<T> extends HTMLAttributes<T> {
      alt?: Luent.MaybeIon<string | undefined>;
      crossorigin?: Luent.MaybeIon<CrossOrigin>;
      ismap?: Luent.MaybeIon<Booleanish>
      decoding?: Luent.MaybeIon<"async" | "auto" | "sync" | undefined>;
      fetchpriority?: Luent.MaybeIon<"high" | "low" | "auto">;
      height?: Luent.MaybeIon<number | string | undefined>;
      loading?: Luent.MaybeIon<"eager" | "lazy" | undefined>;
      referrerpolicy?: Luent.MaybeIon<HTMLAttributeReferrerPolicy | undefined>;
      sizes?: Luent.MaybeIon<string | undefined>;
      src?: Luent.MaybeIon<string | undefined>;
      srcset?: Luent.MaybeIon<string | undefined>;
      usemap?: Luent.MaybeIon<string | undefined>;
      width?: Luent.MaybeIon<number | string | undefined>;
    }

    interface InsHTMLAttributes<T> extends HTMLAttributes<T> {
      cite?: Luent.MaybeIon<string | undefined>;
      datetime?: Luent.MaybeIon<string | undefined>;
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
      accept?: Luent.MaybeIon<string | undefined>;
      alt?: Luent.MaybeIon<string | undefined>;
      autocomplete?: Luent.MaybeIon<HTMLInputAutoCompleteAttribute | undefined>;
      capture?: Luent.MaybeIon<Booleanish | "user" | "environment" | undefined>; // https://www.w3.org/TR/html-media-capture/#the-capture-attribute
      checked?: Luent.MaybeIon<Booleanish | undefined>;
      dirname?: Luent.MaybeIon<string | undefined>;
      disabled?: Luent.MaybeIon<Booleanish | undefined>;
      form?: Luent.MaybeIon<string | undefined>;
      formaction?: Luent.MaybeIon<string | undefined>;
      formenctype?: Luent.MaybeIon<string | undefined>;
      formmethod?: Luent.MaybeIon<string | undefined>;
      formnovalidate?: Luent.MaybeIon<Booleanish | undefined>;
      formtarget?: Luent.MaybeIon<string | undefined>;
      height?: Luent.MaybeIon<number | string | undefined>;
      list?: Luent.MaybeIon<string | undefined>;
      max?: Luent.MaybeIon<number | string | undefined>;
      maxlength?: Luent.MaybeIon<number | undefined>;
      min?: Luent.MaybeIon<number | string | undefined>;
      minlength?: Luent.MaybeIon<number | undefined>;
      multiple?: Luent.MaybeIon<Booleanish | undefined>;
      name?: Luent.MaybeIon<string | undefined>;
      pattern?: Luent.MaybeIon<string | undefined>;
      placeholder?: Luent.MaybeIon<string | undefined>;
      popovertarget?: Luent.MaybeIon<string>;
      popovertargetaction?: Luent.MaybeIon<string>;
      readonly?: Luent.MaybeIon<Booleanish | undefined>;
      required?: Luent.MaybeIon<Booleanish | undefined>;
      size?: Luent.MaybeIon<number | undefined>;
      src?: Luent.MaybeIon<string | undefined>;
      step?: Luent.MaybeIon<number | string | undefined>;
      type?: Luent.MaybeIon<HTMLInputTypeAttribute | undefined>;
      value?: Luent.MaybeIon<string | readonly string[] | number | undefined>;
      width?: Luent.MaybeIon<number | string | undefined>;

      'mu:value'?: Quarky.AtomicIon<unknown, { value: unknown; }> | Quarky.Ion<unknown, { set: (value: unknown) => unknown }>
      'mu:checked'?: Quarky.AtomicIon<Booleanny, { value: Booleanny; }> | Quarky.Ion<Booleanny, { set: (value: Booleanny) => unknown }>
    }


    /**
     * DEPRECATED
     */
    interface KeygenHTMLAttributes<T> extends HTMLAttributes<T> {
      challenge?: Luent.MaybeIon<string | undefined>;
      disabled?: Luent.MaybeIon<Booleanish | undefined>;
      form?: Luent.MaybeIon<string | undefined>;
      keytype?: Luent.MaybeIon<string | undefined>;
      keyparams?: Luent.MaybeIon<string | undefined>;
      name?: Luent.MaybeIon<string | undefined>;
    }

    interface LabelHTMLAttributes<T> extends HTMLAttributes<T> {
      form?: Luent.MaybeIon<string | undefined>;
      for?: Luent.MaybeIon<string | undefined>;
    }

    interface LiHTMLAttributes<T> extends HTMLAttributes<T> {
      value?: Luent.MaybeIon<string | readonly string[] | number | undefined>;
    }

    interface LinkHTMLAttributes<T> extends HTMLAttributes<T> {
      as?: Luent.MaybeIon<string | undefined>;
      blocking?: Luent.MaybeIon<string | undefined>;
      crossorigin?: Luent.MaybeIon<CrossOrigin>;
      fetchpriority?: Luent.MaybeIon<"high" | "low" | "auto">;
      href?: Luent.MaybeIon<string | undefined>;
      hreflang?: Luent.MaybeIon<string | undefined>;
      integrity?: Luent.MaybeIon<string | undefined>;
      media?: Luent.MaybeIon<string | undefined>;
      imagesrcset?: Luent.MaybeIon<string | undefined>;
      imagesizes?: Luent.MaybeIon<string | undefined>;
      referrerpolicy?: Luent.MaybeIon<HTMLAttributeReferrerPolicy | undefined>;
      sizes?: Luent.MaybeIon<string | undefined>;
      type?: Luent.MaybeIon<string | undefined>;
      charset?: Luent.MaybeIon<string | undefined>;
    }

    interface MapHTMLAttributes<T> extends HTMLAttributes<T> {
      name?: Luent.MaybeIon<string | undefined>;
    }

    interface MenuHTMLAttributes<T> extends HTMLAttributes<T> {
      type?: Luent.MaybeIon<string | undefined>;
    }


    interface MediaHTMLAttributes<T> extends HTMLAttributes<T> {
      autoplay?: Luent.MaybeIon<Booleanish | undefined>;
      controls?: Luent.MaybeIon<Booleanish | undefined>;
      crossorigin?: Luent.MaybeIon<CrossOrigin>;
      loop?: Luent.MaybeIon<Booleanish | undefined>;
      mediagroup?: Luent.MaybeIon<string | undefined>;
      muted?: Luent.MaybeIon<Booleanish | undefined>;
      preload?: Luent.MaybeIon<string | undefined>;
      src?: Luent.MaybeIon<string | undefined>;
    }

    interface MetaHTMLAttributes<T> extends HTMLAttributes<T> {
      charset?: Luent.MaybeIon<string | undefined>;
      content?: Luent.MaybeIon<string | undefined>;
      'http-equiv'?: Luent.MaybeIon<string | undefined>;
      media?: Luent.MaybeIon<string | undefined>;
      name?: Luent.MaybeIon<string | undefined>;
    }

    interface MeterHTMLAttributes<T> extends HTMLAttributes<T> {
      form?: Luent.MaybeIon<string | undefined>;
      high?: Luent.MaybeIon<number | undefined>;
      low?: Luent.MaybeIon<number | undefined>;
      max?: Luent.MaybeIon<number | string | undefined>;
      min?: Luent.MaybeIon<number | string | undefined>;
      optimum?: Luent.MaybeIon<number | undefined>;
      value?: Luent.MaybeIon<string | readonly string[] | number | undefined>;
    }

    interface QuoteHTMLAttributes<T> extends HTMLAttributes<T> {
      cite?: Luent.MaybeIon<string | undefined>;
    }

    interface ObjectHTMLAttributes<T> extends HTMLAttributes<T> {
      data?: Luent.MaybeIon<string | undefined>;
      form?: Luent.MaybeIon<string | undefined>;
      height?: Luent.MaybeIon<number | string | undefined>;
      name?: Luent.MaybeIon<string | undefined>;
      type?: Luent.MaybeIon<string | undefined>;
      usemap?: Luent.MaybeIon<string | undefined>;
      width?: Luent.MaybeIon<number | string | undefined>;
    }

    interface OlHTMLAttributes<T> extends HTMLAttributes<T> {
      reversed?: Luent.MaybeIon<Booleanish | undefined>;
      start?: Luent.MaybeIon<number | undefined>;
      type?: Luent.MaybeIon<"1" | "a" | "A" | "i" | "I" | undefined>;
    }

    interface OptgroupHTMLAttributes<T> extends HTMLAttributes<T> {
      disabled?: Luent.MaybeIon<Booleanish | undefined>;
      label?: Luent.MaybeIon<string | undefined>;
    }

    interface OptionHTMLAttributes<T> extends HTMLAttributes<T> {
      disabled?: Luent.MaybeIon<Booleanish | undefined>;
      label?: Luent.MaybeIon<string | undefined>;
      selected?: Luent.MaybeIon<Booleanish | undefined>;
      value?: Luent.MaybeIon<string | readonly string[] | number | undefined>;
    }

    interface OutputHTMLAttributes<T> extends HTMLAttributes<T> {
      form?: Luent.MaybeIon<string | undefined>;
      for?: Luent.MaybeIon<string | undefined>;
      name?: Luent.MaybeIon<string | undefined>;
    }

    interface ParamHTMLAttributes<T> extends HTMLAttributes<T> {
      name?: Luent.MaybeIon<string | undefined>;
      value?: Luent.MaybeIon<string | readonly string[] | number | undefined>;
    }

    interface ProgressHTMLAttributes<T> extends HTMLAttributes<T> {
      max?: Luent.MaybeIon<number | string | undefined>;
      value?: Luent.MaybeIon<string | readonly string[] | number | undefined>;
    }

    interface SlotHTMLAttributes<T> extends HTMLAttributes<T> {
      name?: Luent.MaybeIon<string | undefined>;
    }

    interface ScriptHTMLAttributes<T> extends HTMLAttributes<T> {
      async?: Luent.MaybeIon<Booleanish | undefined>;
      crossorigin?: Luent.MaybeIon<CrossOrigin>;
      defer?: Luent.MaybeIon<Booleanish | undefined>;
      integrity?: Luent.MaybeIon<string | undefined>;
      nomodule?: Luent.MaybeIon<Booleanish | undefined>;
      referrerpolicy?: Luent.MaybeIon<HTMLAttributeReferrerPolicy | undefined>;
      src?: Luent.MaybeIon<string | undefined>;
      type?: Luent.MaybeIon<string | undefined>;
    }

    interface SelectHTMLAttributes<T> extends HTMLAttributes<T> {
      autocomplete?: Luent.MaybeIon<string | undefined>;
      disabled?: Luent.MaybeIon<Booleanish | undefined>;
      form?: Luent.MaybeIon<string | undefined>;
      multiple?: Luent.MaybeIon<Booleanish | undefined>;
      name?: Luent.MaybeIon<string | undefined>;
      required?: Luent.MaybeIon<Booleanish | undefined>;
      size?: Luent.MaybeIon<number | undefined>;
      value?: Luent.MaybeIon<string | readonly string[] | number | undefined>;
      'on:change'?: HandleChangeEvent<T> | undefined;
      'mu:value'?: Quarky.AtomicIon<string, { state: string; }> | Quarky.Ion<string, { set: (value: string) => unknown }>
    }

    interface SourceHTMLAttributes<T> extends HTMLAttributes<T> {
      height?: Luent.MaybeIon<number | string | undefined>;
      media?: Luent.MaybeIon<string | undefined>;
      sizes?: Luent.MaybeIon<string | undefined>;
      src?: Luent.MaybeIon<string | undefined>;
      srcset?: Luent.MaybeIon<string | undefined>;
      type?: Luent.MaybeIon<string | undefined>;
      width?: Luent.MaybeIon<number | string | undefined>;
    }

    interface StyleHTMLAttributes<T> extends HTMLAttributes<T> {
      media?: Luent.MaybeIon<string | undefined>;
      scoped?: Luent.MaybeIon<Booleanish | undefined>;
      type?: Luent.MaybeIon<string | undefined>;
    }

    interface TableHTMLAttributes<T> extends HTMLAttributes<T> {
      // ALL DEPRECATED
      // align?: Luent.MaybeIon<"left" | "center" | "right" | undefined>;
      // bgcolor?: Luent.MaybeIon<string | undefined>;
      // border?: Luent.MaybeIon<number | undefined>;
      // cellPadding?: Luent.MaybeIon<number | string | undefined>;
      // cellSpacing?: Luent.MaybeIon<number | string | undefined>;
      // frame?: Luent.MaybeIon<Booleanish | undefined>;
      // rules?: Luent.MaybeIon<"none" | "groups" | "rows" | "columns" | "all" | undefined>;
      // summary?: Luent.MaybeIon<string | undefined>;
      // width?: Luent.MaybeIon<number | string | undefined>;
    }

    interface TextareaHTMLAttributes<T> extends HTMLAttributes<T> {
      autocomplete?: Luent.MaybeIon<string | undefined>;
      cols?: Luent.MaybeIon<number | undefined>;
      dirname?: Luent.MaybeIon<string | undefined>;
      disabled?: Luent.MaybeIon<Booleanish | undefined>;
      form?: Luent.MaybeIon<string | undefined>;
      maxlength?: Luent.MaybeIon<number | undefined>;
      minlength?: Luent.MaybeIon<number | undefined>;
      name?: Luent.MaybeIon<string | undefined>;
      placeholder?: Luent.MaybeIon<string | undefined>;
      readonly?: Luent.MaybeIon<Booleanish | undefined>;
      required?: Luent.MaybeIon<Booleanish | undefined>;
      rows?: Luent.MaybeIon<number | undefined>;
      value?: Luent.MaybeIon<string | readonly string[] | number | undefined>;
      wrap?: Luent.MaybeIon<string | undefined>;

      'mu:value'?: Quarky.AtomicIon<string, { state: string; }> | Quarky.Ion<string, { set: (value: string) => unknown }>
      'on:change'?: HandleChangeEvent<T> | undefined;
    }

    interface TdHTMLAttributes<T> extends HTMLAttributes<T> {
      align?: Luent.MaybeIon<"left" | "center" | "right" | "justify" | "char" | undefined>;
      colSpan?: Luent.MaybeIon<number | undefined>;
      headers?: Luent.MaybeIon<string | undefined>;
      rowSpan?: Luent.MaybeIon<number | undefined>;
      scope?: Luent.MaybeIon<string | undefined>;
      abbr?: Luent.MaybeIon<string | undefined>;
      height?: Luent.MaybeIon<number | string | undefined>;
      width?: Luent.MaybeIon<number | string | undefined>;
      valign?: Luent.MaybeIon<"top" | "middle" | "bottom" | "baseline" | undefined>;
    }

    interface ThHTMLAttributes<T> extends HTMLAttributes<T> {
      colspan?: Luent.MaybeIon<number | undefined>;
      headers?: Luent.MaybeIon<string | undefined>;
      rowspan?: Luent.MaybeIon<number | undefined>;
      scope?: Luent.MaybeIon<string | undefined>;
      abbr?: Luent.MaybeIon<string | undefined>;
    }

    interface TimeHTMLAttributes<T> extends HTMLAttributes<T> {
      datetime?: Luent.MaybeIon<string | undefined>;
    }

    interface TrackHTMLAttributes<T> extends HTMLAttributes<T> {
      default?: Luent.MaybeIon<Booleanish | undefined>;
      kind?: Luent.MaybeIon<string | undefined>;
      label?: Luent.MaybeIon<string | undefined>;
      src?: Luent.MaybeIon<string | undefined>;
      srclang?: Luent.MaybeIon<string | undefined>;
    }

    interface VideoHTMLAttributes<T> extends MediaHTMLAttributes<T> {
      height?: Luent.MaybeIon<number | string | undefined>;
      controlslist?: Luent.MaybeIon<string | undefined>;
      playsinline?: Luent.MaybeIon<Booleanish | undefined>;
      poster?: Luent.MaybeIon<string | undefined>;
      width?: Luent.MaybeIon<number | string | undefined>;
      disablepictureinpicture?: Luent.MaybeIon<Booleanish | undefined>;
      disableremoteplayback?: Luent.MaybeIon<Booleanish | undefined>;
    }


    interface SVGAttributes<T> extends AriaAttributes, GlobalAttributes, DOMAttributes<T> {
      // Attributes which also defined in HTMLAttributes
      href?: Luent.MaybeIon<string | undefined>;
      hreflang?: Luent.MaybeIon<string | undefined>;
      media?: Luent.MaybeIon<string | undefined>;
      ping?: Luent.MaybeIon<string | undefined>;
      target?: Luent.MaybeIon<HTMLAttributeAnchorTarget | string | undefined>;
      type?: Luent.MaybeIon<string | undefined>;
      referrerpolicy?: Luent.MaybeIon<HTMLAttributeReferrerPolicy | undefined>;

      height?: Luent.MaybeIon<number | string | undefined>;
      width?: Luent.MaybeIon<number | string | undefined>;

      crossorigin?: Luent.MaybeIon<CrossOrigin>;
      fetchpriority?: Luent.MaybeIon<"high" | "low" | "auto">;

      // SVG Specific attributes
      accumulate?: Luent.MaybeIon<"none" | "sum" | undefined>;
      additive?: Luent.MaybeIon<"replace" | "sum" | undefined>;
      'alignment-baseline'?: Luent.MaybeIon<
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
      allowReorder?: Luent.MaybeIon<"no" | "yes" | undefined>;
      alphabetic?: Luent.MaybeIon<number | string | undefined>;
      amplitude?: Luent.MaybeIon<number | string | undefined>;
      'arabic-form'?: Luent.MaybeIon<"initial" | "medial" | "terminal" | "isolated" | undefined>;
      attributeName?: Luent.MaybeIon<string | undefined>;
      attributeType?: Luent.MaybeIon<string | undefined>;
      autoReverse?: Luent.MaybeIon<Booleanish | undefined>;
      azimuth?: Luent.MaybeIon<number | string | undefined>;
      baseFrequency?: Luent.MaybeIon<number | string | undefined>;
      'baseline-shift'?: Luent.MaybeIon<number | string | undefined>;
      begin?: Luent.MaybeIon<number | string | undefined>;
      bias?: Luent.MaybeIon<number | string | undefined>;
      by?: Luent.MaybeIon<number | string | undefined>;
      calcMode?: Luent.MaybeIon<number | string | undefined>;
      clipPathUnits?: Luent.MaybeIon<number | string | undefined>;
      'clip-path'?: Luent.MaybeIon<string | undefined>;
      'clip-rule'?: Luent.MaybeIon<number | string | undefined>;
      color?: Luent.MaybeIon<string | undefined>;
      'color-interpolation'?: Luent.MaybeIon<number | string | undefined>;
      'color-interpolation-filters'?: Luent.MaybeIon<"auto" | "sRGB" | "linearRGB" | "inherit" | undefined>;
      'color-rendering'?: Luent.MaybeIon<number | string | undefined>;
      cursor?: Luent.MaybeIon<number | string | undefined>;
      cx?: Luent.MaybeIon<number | string | undefined>;
      cy?: Luent.MaybeIon<number | string | undefined>;
      d?: Luent.MaybeIon<string | undefined>;
      decelerate?: Luent.MaybeIon<number | string | undefined>;
      diffuseConstant?: Luent.MaybeIon<number | string | undefined>;
      direction?: Luent.MaybeIon<number | string | undefined>;
      display?: Luent.MaybeIon<number | string | undefined>;
      divisor?: Luent.MaybeIon<number | string | undefined>;
      'dominant-baseline'?: Luent.MaybeIon<number | string | undefined>;
      dur?: Luent.MaybeIon<number | string | undefined>;
      dx?: Luent.MaybeIon<number | string | undefined>;
      dy?: Luent.MaybeIon<number | string | undefined>;
      edgeMode?: Luent.MaybeIon<number | string | undefined>;
      elevation?: Luent.MaybeIon<number | string | undefined>;
      end?: Luent.MaybeIon<number | string | undefined>;
      exponent?: Luent.MaybeIon<number | string | undefined>;
      fill?: Luent.MaybeIon<string | undefined>;
      'fill-opacity'?: Luent.MaybeIon<number | string | undefined>;
      'fill-rule'?: Luent.MaybeIon<"nonzero" | "evenodd" | "inherit" | undefined>;
      filter?: Luent.MaybeIon<string | undefined>;
      filterUnits?: Luent.MaybeIon<number | string | undefined>;
      'flood-color'?: Luent.MaybeIon<number | string | undefined>;
      'flood-opacity'?: Luent.MaybeIon<number | string | undefined>;
      focusable?: Luent.MaybeIon<Booleanish | "auto" | undefined>;
      'font-family'?: Luent.MaybeIon<string | undefined>;
      'font-size'?: Luent.MaybeIon<number | string | undefined>;
      'font-size-adjust'?: Luent.MaybeIon<number | string | undefined>;
      'font-style'?: Luent.MaybeIon<number | string | undefined>;
      'font-variant'?: Luent.MaybeIon<number | string | undefined>;
      'font-weight'?: Luent.MaybeIon<number | string | undefined>;
      fr?: Luent.MaybeIon<number | string | undefined>;
      from?: Luent.MaybeIon<number | string | undefined>;
      fx?: Luent.MaybeIon<number | string | undefined>;
      fy?: Luent.MaybeIon<number | string | undefined>;
      gradientTransform?: Luent.MaybeIon<string | undefined>;
      gradientUnits?: Luent.MaybeIon<string | undefined>;
      'image-rendering'?: Luent.MaybeIon<number | string | undefined>;
      in2?: Luent.MaybeIon<number | string | undefined>;
      in?: Luent.MaybeIon<string | undefined>;
      intercept?: Luent.MaybeIon<number | string | undefined>;
      k1?: Luent.MaybeIon<number | string | undefined>;
      k2?: Luent.MaybeIon<number | string | undefined>;
      k3?: Luent.MaybeIon<number | string | undefined>;
      k4?: Luent.MaybeIon<number | string | undefined>;
      kernelMatrix?: Luent.MaybeIon<number | string | undefined>;
      kernelUnitLength?: Luent.MaybeIon<number | string | undefined>;
      keyPoints?: Luent.MaybeIon<number | string | undefined>;
      keySplines?: Luent.MaybeIon<number | string | undefined>;
      keyTimes?: Luent.MaybeIon<number | string | undefined>;
      lengthAdjust?: Luent.MaybeIon<number | string | undefined>;
      'letter-spacing'?: Luent.MaybeIon<number | string | undefined>;
      'lighting-color'?: Luent.MaybeIon<number | string | undefined>;
      limitingConeAngle?: Luent.MaybeIon<number | string | undefined>;
      'marker-end'?: Luent.MaybeIon<string | undefined>;
      'marker-mid'?: Luent.MaybeIon<string | undefined>;
      'marker-start'?: Luent.MaybeIon<string | undefined>;
      markerHeight?: Luent.MaybeIon<number | string | undefined>;
      markerUnits?: Luent.MaybeIon<number | string | undefined>;
      markerWidth?: Luent.MaybeIon<number | string | undefined>;
      mask?: Luent.MaybeIon<string | undefined>;
      maskContentUnits?: Luent.MaybeIon<number | string | undefined>;
      maskUnits?: Luent.MaybeIon<number | string | undefined>;
      max?: Luent.MaybeIon<number | string | undefined>;
      min?: Luent.MaybeIon<number | string | undefined>;

      /**
       * The method attribute indicates the method by which text should be rendered along the path of a <textPath> element.
       * 
       * default: 'align'
       * 
       * source: https://developer.mozilla.org/en-US/docs/Web/SVG/Reference/Attribute/method
       */
      method?: Luent.MaybeIon<'align' | 'stretch'>;
      mode?: Luent.MaybeIon<number | string | undefined>;
      name?: Luent.MaybeIon<string | undefined>;
      numOctaves?: Luent.MaybeIon<number | string | undefined>;
      offset?: Luent.MaybeIon<number | string | undefined>;
      opacity?: Luent.MaybeIon<number | string | undefined>;
      operator?: Luent.MaybeIon<number | string | undefined>;
      order?: Luent.MaybeIon<number | string | undefined>;
      orient?: Luent.MaybeIon<number | string | undefined>;
      origin?: Luent.MaybeIon<number | string | undefined>;
      overflow?: Luent.MaybeIon<number | string | undefined>;
      'overline-position'?: Luent.MaybeIon<number | string | undefined>;
      'overline-thickness'?: Luent.MaybeIon<number | string | undefined>;
      'paint-order'?: Luent.MaybeIon<number | string | undefined>;
      path?: Luent.MaybeIon<string | undefined>;
      pathLength?: Luent.MaybeIon<number | string | undefined>;
      patternContentUnits?: Luent.MaybeIon<string | undefined>;
      patternTransform?: Luent.MaybeIon<number | string | undefined>;
      patternUnits?: Luent.MaybeIon<string | undefined>;
      'pointer-events'?: Luent.MaybeIon<number | string | undefined>;
      points?: Luent.MaybeIon<string | undefined>;
      pointsAtX?: Luent.MaybeIon<number | string | undefined>;
      pointsAtY?: Luent.MaybeIon<number | string | undefined>;
      pointsAtZ?: Luent.MaybeIon<number | string | undefined>;
      preserveAlpha?: Luent.MaybeIon<Booleanish | undefined>;
      preserveAspectRatio?: Luent.MaybeIon<string | undefined>;
      primitiveUnits?: Luent.MaybeIon<number | string | undefined>;
      r?: Luent.MaybeIon<number | string | undefined>;
      radius?: Luent.MaybeIon<number | string | undefined>;
      refX?: Luent.MaybeIon<number | string | undefined>;
      refY?: Luent.MaybeIon<number | string | undefined>;
      renderingIntent?: Luent.MaybeIon<number | string | undefined>;
      repeatCount?: Luent.MaybeIon<number | string | undefined>;
      repeatDur?: Luent.MaybeIon<number | string | undefined>;
      requiredExtensions?: Luent.MaybeIon<number | string | undefined>;
      restart?: Luent.MaybeIon<number | string | undefined>;
      result?: Luent.MaybeIon<string | undefined>;
      rotate?: Luent.MaybeIon<number | string | undefined>;
      rx?: Luent.MaybeIon<number | string | undefined>;
      ry?: Luent.MaybeIon<number | string | undefined>;
      scale?: Luent.MaybeIon<number | string | undefined>;
      seed?: Luent.MaybeIon<number | string | undefined>;
      'shape-rendering'?: Luent.MaybeIon<number | string | undefined>;
      /**
       * EXPERIMENTAL
       * 
       * default: 'left'
       * 
       * https://developer.mozilla.org/en-US/docs/Web/SVG/Reference/Attribute/side
       */
      side?: Luent.MaybeIon<'left' | 'right'>;
      slope?: Luent.MaybeIon<number | string | undefined>;
      spacing?: Luent.MaybeIon<number | string | undefined>;
      specularConstant?: Luent.MaybeIon<number | string | undefined>;
      specularExponent?: Luent.MaybeIon<number | string | undefined>;
      spreadMethod?: Luent.MaybeIon<string | undefined>;
      startOffset?: Luent.MaybeIon<number | string | undefined>;
      stdDeviation?: Luent.MaybeIon<number | string | undefined>;
      stitchTiles?: Luent.MaybeIon<number | string | undefined>;
      'stop-color'?: Luent.MaybeIon<string | undefined>;
      'stop-opacity'?: Luent.MaybeIon<number | string | undefined>;
      'strikethrough-Position'?: Luent.MaybeIon<number | string | undefined>;
      'strikethrough-Thickness'?: Luent.MaybeIon<number | string | undefined>;
      stroke?: Luent.MaybeIon<string | undefined>;
      'stroke-dasharray'?: Luent.MaybeIon<string | number | undefined>;
      'stroke-dashoffset'?: Luent.MaybeIon<string | number | undefined>;
      'stroke-linecap'?: Luent.MaybeIon<"butt" | "round" | "square" | "inherit" | undefined>;
      'stroke-linejoin'?: Luent.MaybeIon<"miter" | "round" | "bevel" | "inherit" | undefined>;
      'stroke-miterlimit'?: Luent.MaybeIon<number | string | undefined>;
      'stroke-opacity'?: Luent.MaybeIon<number | string | undefined>;
      'stroke-width'?: Luent.MaybeIon<number | string | undefined>;
      surfaceScale?: Luent.MaybeIon<number | string | undefined>;
      systemLanguage?: Luent.MaybeIon<number | string | undefined>;
      tableValues?: Luent.MaybeIon<number | string | undefined>;
      targetX?: Luent.MaybeIon<number | string | undefined>;
      targetY?: Luent.MaybeIon<number | string | undefined>;
      'text-anchor'?: Luent.MaybeIon<string | undefined>;
      'text-decoration'?: Luent.MaybeIon<number | string | undefined>;
      /**
       * *default*: 'clip'
       */
      'text-overflow'?: Luent.MaybeIon<'clip' | 'ellipses'>;
      'text-rendering'?: Luent.MaybeIon<number | string | undefined>;
      textLength?: Luent.MaybeIon<number | string | undefined>;
      to?: Luent.MaybeIon<number | string | undefined>;
      transform?: Luent.MaybeIon<string | undefined>;
      'transform-origin'?: Luent.MaybeIon<string | undefined>;
      'underline-position'?: Luent.MaybeIon<number | string | undefined>;
      'underline-thickness'?: Luent.MaybeIon<number | string | undefined>;
      'unicode-bidi'?: Luent.MaybeIon<number | string | undefined>;
      values?: Luent.MaybeIon<string | undefined>;
      'vector-effect'?: Luent.MaybeIon<number | string | undefined>;
      viewBox?: Luent.MaybeIon<string | undefined>;
      visibility?: Luent.MaybeIon<number | string | undefined>;
      'white-space'?: Luent.MaybeIon<'normal' | 'pre' | 'nowrap' | 'pre-wrap' | 'break-space' | 'pre-line'>;
      'word-spacing'?: Luent.MaybeIon<number | string | undefined>;
      'writing-mode'?: Luent.MaybeIon<number | string | undefined>;
      x1?: Luent.MaybeIon<number | string | undefined>;
      x2?: Luent.MaybeIon<number | string | undefined>;
      x?: Luent.MaybeIon<number | string | undefined>;
      xChannelSelector?: Luent.MaybeIon<string | undefined>;
      'xlink:actuate'?: Luent.MaybeIon<string | undefined>;
      'xlink:role'?: Luent.MaybeIon<string | undefined>;
      xmlns?: Luent.MaybeIon<string | undefined>;
      'xmlns:xlink'?: Luent.MaybeIon<string | undefined>;
      y1?: Luent.MaybeIon<number | string | undefined>;
      y2?: Luent.MaybeIon<number | string | undefined>;
      y?: Luent.MaybeIon<number | string | undefined>;
      yChannelSelector?: Luent.MaybeIon<string | undefined>;
      z?: Luent.MaybeIon<number | string | undefined>;
      zoomAndPan?: Luent.MaybeIon<string | undefined>;
    }

    interface WebViewHTMLAttributes<T> extends HTMLAttributes<T> {
      allowfullscreen?: Luent.MaybeIon<Booleanish | undefined>;
      allowpopups?: Luent.MaybeIon<Booleanish | undefined>;
      autosize?: Luent.MaybeIon<Booleanish | undefined>;
      blinkfeatures?: Luent.MaybeIon<string | undefined>;
      enableblinkfeatures?: Luent.MaybeIon<string | undefined>;
      disableblinkfeatures?: Luent.MaybeIon<string | undefined>;
      disableguestresize?: Luent.MaybeIon<Booleanish | undefined>;
      disablewebsecurity?: Luent.MaybeIon<Booleanish | undefined>;
      guestinstance?: Luent.MaybeIon<string | undefined>;
      httpreferrer?: Luent.MaybeIon<string | undefined>;
      nodeintegration?: Luent.MaybeIon<Booleanish | undefined>;
      nodeintegrationinsubframes?: Luent.MaybeIon<Booleanish | undefined>;
      partition?: Luent.MaybeIon<string | undefined>;
      plugins?: Luent.MaybeIon<Booleanish | undefined>;
      preload?: Luent.MaybeIon<string | undefined>;
      src?: Luent.MaybeIon<string | undefined>;
      useragent?: Luent.MaybeIon<string | undefined>;
      webpreferences?: Luent.MaybeIon<string | undefined>;
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

    type Index = Ion<number> | number

    interface RefAttributes<T> {
      /**
       * Access the DOM element via NodeRef or node refs config object.
       * Once the view unmounts, the ref value will be set to `null`
       */
      ref?: (() => T | undefined) | [T[], Index] | [T[][], [Index, Index]]
    }

    type DetailedHTMLProps<E extends HTMLAttributes<T>, T> = RefAttributes<T> & E & Luent.LuentHooks<P> & LuentCommonAttributes

    interface SVGProps<T> extends SVGAttributes<T>, RefAttributes<T> {
    }

    interface SVGLineElementAttributes<T> extends SVGProps<T> { }
    interface SVGTextElementAttributes<T> extends SVGProps<T> { }


    type DOMAttributes<T> = {
      children?: Luent.JSXNode | undefined | null;
    } & Events<T>



  }
}



// IMPORTANT Components and elements
// N = (props: P) => JSX.Element
type LuentAttributes<F, P> =
  //  P extends { '~attributes'?: infer A }
  //  ? A & Luent.LuentHooks<Luent.ComponentRef<F>> & LuentComponentAttributes<F> & LuentCommonAttributes & L.Events<Luent.ComponentRef<F>>// Component Attributes
  //  : P // Element attributes must be added to DetailedHTMLProps
  Luent.TagAttributes<P> & Luent.LuentHooks<Luent.ComponentRef<F>> & LuentComponentAttributes<F> & LuentCommonAttributes & L.Events<Luent.ComponentRef<F>>

type LuentComponentAttributes<C> = {
  ref?: () => Luent.ComponentRef<C> | undefined
  // class?: ClassInput | Luent.MaybeIon<string | Falsey> | (Luent.MaybeIon<string | Falsey> | ClassInput)[];
  // style?: StyleInput | StyleInput[];
}

type LuentCommonAttributes = {
  'on:event'?: { [key: string]: Function };
  'auto-bind'?: SetupBindings
}



declare global {

  type Events<T> = L.Events<T>


  namespace JSX {
    interface Element { }

    // important for converting component input types to attribute types
    type LibraryManagedAttributes<C, P> = LuentAttributes<C, P>;

    type CSSProperties = L.CSSProperties

    type Falsey = undefined | null | false;

    type StyleInput = Luent.MaybeIon<string | Falsey> | Luent.MaybeIon<{ [K in keyof Partial<CSSProperties>]: Luent.MaybeIon<CSSProperties[K]> }>

    type ClassInput = Luent.MaybeIon<string> | Luent.MaybeIon<{ [key: string]: Luent.MaybeIon<Booleanny> }>

    type IntrinsicElements = JSX._IntrinsicElements & LuentElements & CustomElements

    interface CustomElements { }

    interface LuentElements {
      '!--': {}; //comments
      'shadow-root': { children: any, mode: 'open' | 'closed' }
      'o--portal': PortalNodeInput & { children: Luent.Slot }

      'o--style': L.DetailedHTMLProps<L.StyleHTMLAttributes<HTMLStyleElement>, HTMLStyleElement> & { 'portal-to'?: 'body' | 'head', text: string }
      'o-link': L.DetailedHTMLProps<L.LinkHTMLAttributes<HTMLLinkElement>, HTMLLinkElement> & { 'portal-to'?: 'body' | 'head' }
      'o--head': L.DetailedHTMLProps<L.HTMLAttributes<HTMLHeadElement>, HTMLHeadElement>
      'o--body': L.DetailedHTMLProps<L.HTMLAttributes<HTMLBodyElement>, HTMLBodyElement>
      //  'show-view': { children: ConditionalRenderKit[] | ConditionalRenderKit }
      //  'create-view': { children: ConditionalRenderKit[] | ConditionalRenderKit }
      'v-preserve': { children: ConditionalRenderKit[] | ConditionalRenderKit; discard?: Ion<Booleanish> }
      'v-context': { children: ConditionalRenderKit[] | ConditionalRenderKit; provide: Luent.Provided }
      //  'render-view': { children: Luent.RawJSXNode }
      // 'o--preserve': { children: ConditionalRenderKit[]; discard?: Ion<Booleanish> };
      // 'preserve-conditionals': { children: ConditionalRenderKit[]; 'can:discard'?: () => void };
      // 'Slot': {Slot: unknown}

      // 'o--suspense': SuspenseNodeInput & { children: Luent.Slot };
      // 'o--try': TryNodeInput & { children: Luent.Slot };

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

//$$$
// React.JSX needs to point to global.JSX to keep global module augmentations intact.
// But we can't access global.JSX so we need to create these aliases instead.
// Once the global JSX namespace will be removed we replace React.JSX with the contents of global.JSX
type GlobalJSXElementType = JSX.ElementType;
interface GlobalJSXElement extends JSX.Element { }
// interface GlobalJSXElementClass extends JSX.ElementClass { }
// interface GlobalJSXElementAttributesProperty extends JSX.ElementAttributesProperty { }
// interface GlobalJSXElementChildrenAttribute extends JSX.ElementChildrenAttribute { }

// type GlobalJSXLibraryManagedAttributes<C, P> = JSX.LibraryManagedAttributes<C, P>;

// interface GlobalJSXIntrinsicAttributes extends JSX.IntrinsicAttributes { }
// interface GlobalJSXIntrinsicClassAttributes<T> extends JSX.IntrinsicClassAttributes<T> { }

// interface GlobalJSXIntrinsicElements extends JSX.IntrinsicElements { }