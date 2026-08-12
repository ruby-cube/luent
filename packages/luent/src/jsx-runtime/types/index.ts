import "./global";

import * as CSS from "csstype";
import * as Quarky from "@luent/quarky";
import { AnyObject, Booleanny } from "@luent/types";
import { PortalNodeInput } from "../../boundaries/Portal";
import { TransitionBindings, TransitionConfigs } from "../../transitions/transitions";
import { matchEventTarget } from "../../events/target";
import { MaybeIon } from "../../component/bindings-types";
import { LuentHooks } from "../../flask/template-hooks";
import { ComponentRef } from "../../node/NodeRef";
import { Provided } from "../../context/Context";
import { SetupBindings } from "../../component/bindings";

/*
Modified from React type definitions in DefinitelyTyped:
https://github.com/DefinitelyTyped/DefinitelyTyped/blob/master/types/react/v18/index.d.ts
*/

type NativeClipboardEvent = ClipboardEvent;
type NativeFocusEvent = FocusEvent;
type NativeKeyboardEvent = KeyboardEvent;
type NativeMouseEvent = MouseEvent;
type NativeEvent = Event;


/**
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/HTML/Attributes/crossorigin MDN}
*/
type CrossOrigin = "anonymous" | "use-credentials" | "" | undefined;


/**
 * Used to represent DOM API's where users can either pass
 * true or false as a boolean or as its equivalent strings.
 */
type Booleanish = boolean | "true" | "false";
type Falsey = undefined | null | false;

type StyleInput = MaybeIon<string | Falsey> | MaybeIon<{ [K in keyof Partial<JSX.CSSProperties>]: MaybeIon<JSX.CSSProperties[K]> }>
type ClassInput = MaybeIon<string> | MaybeIon<{ [key: string]: MaybeIon<Booleanny> }>


export namespace JSX {

  // ----------------------------------------------------------------------
  // #region: Event Objects
  // ----------------------------------------------------------------------

  //   interface EventHandler<T, E extends Event> {
  //   (
  //     e: E & {
  //       currentTarget: T;
  //       target: DOMElement;
  //     }
  //   ): void;
  // }


  interface Event<T> extends NativeEvent {
    /**
    * The **`currentTarget`** read-only property of the Event interface identifies the element to which the event handler has been attached.
    *
    * [MDN Reference](https://developer.mozilla.org/docs/Web/API/Event/currentTarget)
    */
    currentTarget: EventTarget & T | null

    from: typeof matchEventTarget
  }


  interface ClipboardEvent extends NativeClipboardEvent {
    clipboardData: DataTransfer;
  }


  interface FocusEvent<T = Element, RelatedTarget = Element> extends NativeFocusEvent {
    relatedTarget: (EventTarget & RelatedTarget) | null;
    target: EventTarget & T;
  }


  interface FormEvent<T = Element> {
    target: EventTarget & T;
  }


  interface InvalidEvent<T = Element>  {
    target: EventTarget & T;
  }


  interface StateChangeEvent<T = Element> {
    target: EventTarget & T;
  }


  interface KeyboardEvent extends NativeKeyboardEvent {
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


  interface MouseEvent extends NativeMouseEvent {

    /**
    * The **`MouseEvent.getModifierState()`** method returns the current state of the specified modifier key: `true` if the modifier is active (i.e., the modifier key is pressed or locked), otherwise, `false`.
    *
    * [MDN Reference](https://developer.mozilla.org/docs/Web/API/MouseEvent/getModifierState)
    * 
    * See [DOM Level 3 Events spec](https://www.w3.org/TR/uievents-key/#keys-modifier). for a list of valid (case-sensitive) arguments to this method.
    */
    getModifierState(key: ModifierKey): boolean
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

  type EventHandler<E, T> = (event: E & Event<T>) => void
  type HandleEvent<T = Element> = (event: Event<T>) => void

  type HandleClipboardEvent<T = Element> = EventHandler<ClipboardEvent, T>;
  type HandleCompositionEvent<T = Element> = EventHandler<CompositionEvent, T>;
  type HandleDragEvent<T = Element> = EventHandler<DragEvent, T>;
  type HandleFocusEvent<T = Element> = EventHandler<FocusEvent, T>;
  type HandleFormEvent<T = Element> = EventHandler<FormEvent, T>;
  type HandleChangeEvent<T = Element> = EventHandler<StateChangeEvent, T>;
  type HandleKeyboardEvent<T = Element> = EventHandler<KeyboardEvent, T>;
  type HandleMouseEvent<T = Element> = EventHandler<MouseEvent, T>;
  type HandleTouchEvent<T = Element> = EventHandler<TouchEvent, T>;
  type HandlePointerEvent<T = Element> = EventHandler<PointerEvent, T>;
  type HandleUIEvent<T = Element> = EventHandler<UIEvent, T>;
  type HandleWheelEvent<T = Element> = EventHandler<WheelEvent, T>;
  type HandleAnimationEvent<T = Element> = EventHandler<AnimationEvent, T>;
  type HandleTransitionEvent<T = Element> = EventHandler<TransitionEvent, T>;




  export interface Events<T> {
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
    'onv:copy'?: HandleClipboardEvent<T>;
    'onv:cut'?: HandleClipboardEvent<T>;
    'onv:paste'?: HandleClipboardEvent<T>;

    // Composition Events
    'onv:compositionend'?: HandleCompositionEvent<T>;
    'onv:compositionstart'?: HandleCompositionEvent<T>;
    'onv:compositionupdate'?: HandleCompositionEvent<T>;

    // Focus Events
    'onv:focus'?: HandleFocusEvent<T>;
    'onv:blur'?: HandleFocusEvent<T>;

    // Form Events
    'onv:change'?: HandleFormEvent<T>;
    'onv:beforeinput'?: HandleFormEvent<T>;
    'onv:input'?: HandleFormEvent<T>;
    'onv:reset'?: HandleFormEvent<T>;
    'onv:submit'?: HandleFormEvent<T>;
    'onv:invalid'?: HandleFormEvent<T>;

    // Image Events
    'onv:load'?: HandleEvent<T> | undefined;
    'onv:error'?: HandleEvent<T> | undefined; // also a Media Event

    // Keyboard Events
    'onv:keydown'?: HandleKeyboardEvent<T>;
    'onv:keyup'?: HandleKeyboardEvent<T>;

    // Media Events
    'onv:abort'?: HandleEvent<T> | undefined;
    'onv:canplay'?: HandleEvent<T> | undefined;
    'onv:canplaythrough'?: HandleEvent<T> | undefined;
    'onv:durationchange'?: HandleEvent<T> | undefined;
    'onv:emptied'?: HandleEvent<T> | undefined;
    'onv:encrypted'?: HandleEvent<T> | undefined;
    'onv:ended'?: HandleEvent<T> | undefined;
    'onv:loadeddata'?: HandleEvent<T> | undefined;
    'onv:loadedmetadata'?: HandleEvent<T> | undefined;
    'onv:loadstart'?: HandleEvent<T> | undefined;
    'onv:pause'?: HandleEvent<T> | undefined;
    'onv:play'?: HandleEvent<T> | undefined;
    'onv:playing'?: HandleEvent<T> | undefined;
    'onv:progress'?: HandleEvent<T> | undefined;
    'onv:ratechange'?: HandleEvent<T> | undefined;
    'onv:resize'?: HandleEvent<T> | undefined;
    'onv:seeked'?: HandleEvent<T> | undefined;
    'onv:seeking'?: HandleEvent<T> | undefined;
    'onv:stalled'?: HandleEvent<T> | undefined;
    'onv:suspend'?: HandleEvent<T> | undefined;
    'onv:timeupdate'?: HandleEvent<T> | undefined;
    'onv:volumechange'?: HandleEvent<T> | undefined;
    'onv:waiting'?: HandleEvent<T> | undefined;

    // MouseEvents
    'onv:auxclick'?: HandleMouseEvent<T>;
    'onv:click'?: HandleMouseEvent<T>;
    'onv:contextmenu'?: HandleMouseEvent<T>;
    'onv:doubleclick'?: HandleMouseEvent<T>;
    'onv:drag'?: HandleDragEvent<T>;
    'onv:dragend'?: HandleDragEvent<T>;
    'onv:dragenter'?: HandleDragEvent<T>;
    'onv:dragexit'?: HandleDragEvent<T>;
    'onv:dragleave'?: HandleDragEvent<T>;
    'onv:dragover'?: HandleDragEvent<T>;
    'onv:dragstart'?: HandleDragEvent<T>;
    'onv:drop'?: HandleDragEvent<T>;
    'onv:mousedown'?: HandleMouseEvent<T>;
    'onv:mouseenter'?: HandleMouseEvent<T>;
    'onv:mouseleave'?: HandleMouseEvent<T>;
    'onv:mousemove'?: HandleMouseEvent<T>;
    'onv:mouseout'?: HandleMouseEvent<T>;
    'onv:mouseover'?: HandleMouseEvent<T>;
    'onv:mouseup'?: HandleMouseEvent<T>;

    // Selection Events
    'onv:select'?: HandleEvent<T> | undefined;

    // Touch Events
    'onv:touchcancel'?: HandleTouchEvent<T>;
    'onv:touchend'?: HandleTouchEvent<T>;
    'onv:touchmove'?: HandleTouchEvent<T>;
    'onv:touchstart'?: HandleTouchEvent<T>;

    // Pointer Events
    'onv:pointerdown'?: HandlePointerEvent<T>;
    'onv:pointermove'?: HandlePointerEvent<T>;
    'onv:pointerup'?: HandlePointerEvent<T>;
    'onv:pointercancel'?: HandlePointerEvent<T>;
    'onv:pointerenter'?: HandlePointerEvent<T>;
    'onv:pointerleave'?: HandlePointerEvent<T>;
    'onv:pointerover'?: HandlePointerEvent<T>;
    'onv:pointerout'?: HandlePointerEvent<T>;
    'onv:gotpointercapture'?: HandlePointerEvent<T>;
    'onv:lostpointercapture'?: HandlePointerEvent<T>;

    // UI Events
    'onv:scroll'?: HandleUIEvent<T>;

    // Wheel Events
    'onv:wheel'?: HandleWheelEvent<T>;

    // Animation Events
    'onv:animationstart'?: HandleAnimationEvent<T>;
    'onv:animationend'?: HandleAnimationEvent<T>;
    'onv:animationiteration'?: HandleAnimationEvent<T>;

    // Transition Events
    'onv:transitionend'?: HandleTransitionEvent<T>;
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

  export interface GlobalAttributes {
    microclass?: ClassInput | MaybeIon<string | Falsey> | (MaybeIon<string | Falsey> | ClassInput)[];
    class?: ClassInput | MaybeIon<string | Falsey> | (MaybeIon<string | Falsey> | ClassInput)[];
    style?: StyleInput | StyleInput[];

    autofocus?: MaybeIon<Booleanish | undefined>; // Automatically focuses the element
    lang?: MaybeIon<string | undefined>; // Specifies the language of the element's content
    id?: MaybeIon<string | undefined>;
    tabindex?: MaybeIon<number | undefined>; // Defines the tab order of the element

    // WAI-ARIA
    role?: MaybeIon<AriaRole | undefined>;
  }

  interface GlobalURLAttributes {

  }


  interface HTMLAttributes<T> extends AriaAttributes, GlobalAttributes, DOMAttributes<T> {
    // Standard HTML Attributes
    contenteditable?: MaybeIon<Booleanish | "inherit" | "plaintext-only" | undefined>;
    contextmenu?: MaybeIon<string | undefined>;
    draggable?: MaybeIon<Booleanish | undefined>;
    is?: MaybeIon<string | undefined>;
    slot?: MaybeIon<string | undefined>;
    spellcheck?: MaybeIon<Booleanish | undefined>;
    translate?: MaybeIon<"yes" | "no" | undefined>;
    nonce?: MaybeIon<string | undefined>; // A cryptographic nonce for inline scripts
    part?: MaybeIon<string | undefined>; // Specifies parts of the element for styling
    title?: MaybeIon<string | undefined>; // Additional information displayed as a tooltip
    inert?: MaybeIon<Booleanish | undefined>; // Prevents user interaction with the element
    itemid?: MaybeIon<string | undefined>; // Defines the item's ID in microdata
    itemprop?: MaybeIon<string | undefined>; // Specifies the item's property in microdata
    itemref?: MaybeIon<string | undefined>; // References additional microdata items
    itemscope?: MaybeIon<Booleanish | undefined>; // Declares the scope of an item
    itemtype?: MaybeIon<string | undefined>; // Specifies the type of an item in microdata

    accesskey?: MaybeIon<string | undefined>; // Defines a keyboard shortcut to activate/focus an element
    autocapitalize?: MaybeIon<"off" | "none" | "on" | "sentences" | "words" | "characters" | undefined>; // Controls capitalization behavior
    dir?: MaybeIon<"ltr" | "rtl" | "auto" | undefined>; // Specifies the text direction
    enterkeyhint?: MaybeIon<
      "enter"
      | "done"
      | "go"
      | "next"
      | "previous"
      | "search"
      | "send"
      | undefined>; // Hint for virtual keyboards
    elementtiming?: MaybeIon<string>;
    hidden?: MaybeIon<Booleanish | "until-found" | undefined>; // Hides the element

    // RDFa Attributes
    about?: MaybeIon<string | undefined>;
    content?: MaybeIon<string | undefined>;
    datatype?: MaybeIon<string | undefined>;
    inlist?: MaybeIon<unknown>;
    prefix?: MaybeIon<string | undefined>;
    property?: MaybeIon<string | undefined>;
    rel?: MaybeIon<string | undefined>;
    resource?: MaybeIon<string | undefined>;
    rev?: MaybeIon<string | undefined>;
    typeof?: MaybeIon<string | undefined>;
    vocab?: MaybeIon<string | undefined>;

    /**
     * Non-standard attribute
     */
    autocorrect?: MaybeIon<string | undefined>;
    /**
     * Non-standard attribute
     */
    autosave?: MaybeIon<string | undefined>;
    /**
     * Non-standard attribute
     */
    color?: MaybeIon<string | undefined>;
    /**
     * Non-standard attribute
     */
    results?: MaybeIon<number | undefined>;
    /**
     * Non-standard attribute
     */
    security?: MaybeIon<string | undefined>;
    /**
     * Non-standard attribute
     */
    unselectable?: MaybeIon<"on" | "off" | undefined>;
    /**
     * Non-standard attribute
     */
    anchor?: MaybeIon<string>;




    // Living Standard
    /**
     * Hints at the type of data that might be entered by the user while editing the element or its contents
     * @see {@link https://html.spec.whatwg.org/multipage/interaction.html#input-modalities:-the-inputmode-attribute}
     */
    inputmode?: MaybeIon<"none" | "text" | "tel" | "url" | "email" | "numeric" | "decimal" | "search" | undefined>;
    /**
     * Specify that a standard HTML element should behave like a defined custom built-in element
     * @see {@link https://html.spec.whatwg.org/multipage/custom-elements.html#attr-is}
     */

    exportparts?: MaybeIon<string>;
    popover?: MaybeIon<'auto' | 'hint' | 'manual' | true>;
    writingsuggestions?: MaybeIon<Booleanish>;

    /**
     * Experimental
     */
    virtualkeyboardpolicyExperimental?: MaybeIon<'auto' | 'manual'>;

    //  /**
    //   * DOM Property
    //   */
    //  scrollTop?: MaybeIon<number | undefined>;

    //  /**
    //   * DOM Property
    //   */
    //  scrollLeft?: MaybeIon<number | undefined>;
  }


  // /**
  //  * For internal usage only.
  //  * Different release channels declare additional types of JSXNode this particular release channel accepts.
  //  * App or library types should never augment this interface.
  //  */

  // interface AllHTMLAttributes<T> extends HTMLAttributes<T> {
  //    // Standard HTML Attributes
  //    accept?: MaybeIon<string | undefined>;
  //    acceptCharset?: MaybeIon<string | undefined>;
  //    action?: MaybeIon<string | undefined>;
  //    allowFullScreen?: MaybeIon<Booleanish | undefined>;
  //    allowTransparency?: MaybeIon<Booleanish | undefined>;
  //    alt?: MaybeIon<string | undefined>;
  //    as?: MaybeIon<string | undefined>;
  //    async?: MaybeIon<Booleanish | undefined>;
  //    autoComplete?: MaybeIon<string | undefined>;
  //    autoPlay?: MaybeIon<Booleanish | undefined>;
  //    capture?: MaybeIon<Booleanish | "user" | "environment" | undefined>;
  //    cellPadding?: MaybeIon<number | string | undefined>;
  //    cellSpacing?: MaybeIon<number | string | undefined>;
  //    charSet?: MaybeIon<string | undefined>;
  //    challenge?: MaybeIon<string | undefined>;
  //    checked?: MaybeIon<Booleanish | undefined>;
  //    cite?: MaybeIon<string | undefined>;
  //    classID?: MaybeIon<string | undefined>;
  //    cols?: MaybeIon<number | undefined>;
  //    colSpan?: MaybeIon<number | undefined>;
  //    controls?: MaybeIon<Booleanish | undefined>;
  //    coords?: MaybeIon<string | undefined>;
  //    crossorigin?: MaybeIon<CrossOrigin>;
  //    data?: MaybeIon<string | undefined>;
  //    dateTime?: MaybeIon<string | undefined>;
  //    default?: MaybeIon<Booleanish | undefined>;
  //    defer?: MaybeIon<Booleanish | undefined>;
  //    disabled?: MaybeIon<Booleanish | undefined>;
  //    download?: MaybeIon<unknown>;
  //    encType?: MaybeIon<string | undefined>;
  //    form?: MaybeIon<string | undefined>;
  //    formAction?: MaybeIon<string | undefined>;
  //    formEncType?: MaybeIon<string | undefined>;
  //    formMethod?: MaybeIon<string | undefined>;
  //    formNoValidate?: MaybeIon<Booleanish | undefined>;
  //    formTarget?: MaybeIon<string | undefined>;
  //    frameBorder?: MaybeIon<number | string | undefined>;
  //    headers?: MaybeIon<string | undefined>;
  //    height?: MaybeIon<number | string | undefined>;
  //    high?: MaybeIon<number | undefined>;
  //    href?: MaybeIon<string | undefined>;
  //    hrefLang?: MaybeIon<string | undefined>;
  //    htmlFor?: MaybeIon<string | undefined>;
  //    httpEquiv?: MaybeIon<string | undefined>;
  //    integrity?: MaybeIon<string | undefined>;
  //    keyParams?: MaybeIon<string | undefined>;
  //    keyType?: MaybeIon<string | undefined>;
  //    kind?: MaybeIon<string | undefined>;
  //    label?: MaybeIon<string | undefined>;
  //    list?: MaybeIon<string | undefined>;
  //    loop?: MaybeIon<Booleanish | undefined>;
  //    low?: MaybeIon<number | undefined>;
  //    manifest?: MaybeIon<string | undefined>;
  //    marginHeight?: MaybeIon<number | undefined>;
  //    marginWidth?: MaybeIon<number | undefined>;
  //    max?: MaybeIon<number | string | undefined>;
  //    maxLength?: MaybeIon<number | undefined>;
  //    media?: MaybeIon<string | undefined>;
  //    mediaGroup?: MaybeIon<string | undefined>;
  //    method?: MaybeIon<string | undefined>;
  //    min?: MaybeIon<number | string | undefined>;
  //    minLength?: MaybeIon<number | undefined>;
  //    multiple?: MaybeIon<Booleanish | undefined>;
  //    muted?: MaybeIon<Booleanish | undefined>;
  //    name?: MaybeIon<string | undefined>;
  //    noValidate?: MaybeIon<Booleanish | undefined>;
  //    open?: MaybeIon<Booleanish | undefined>;
  //    optimum?: MaybeIon<number | undefined>;
  //    pattern?: MaybeIon<string | undefined>;
  //    placeholder?: MaybeIon<string | undefined>;
  //    playsInline?: MaybeIon<Booleanish | undefined>;
  //    poster?: MaybeIon<string | undefined>;
  //    preload?: MaybeIon<string | undefined>;
  //    readOnly?: MaybeIon<Booleanish | undefined>;
  //    required?: MaybeIon<Booleanish | undefined>;
  //    reversed?: MaybeIon<Booleanish | undefined>;
  //    rows?: MaybeIon<number | undefined>;
  //    rowSpan?: MaybeIon<number | undefined>;
  //    sandbox?: MaybeIon<string | undefined>;
  //    scope?: MaybeIon<string | undefined>;
  //    scoped?: MaybeIon<Booleanish | undefined>;
  //    scrolling?: MaybeIon<string | undefined>;
  //    seamless?: MaybeIon<Booleanish | undefined>;
  //    selected?: MaybeIon<Booleanish | undefined>;
  //    shape?: MaybeIon<string | undefined>;
  //    size?: MaybeIon<number | undefined>;
  //    sizes?: MaybeIon<string | undefined>;
  //    span?: MaybeIon<number | undefined>;
  //    src?: MaybeIon<string | undefined>;
  //    srcDoc?: MaybeIon<string | undefined>;
  //    srcLang?: MaybeIon<string | undefined>;
  //    srcSet?: MaybeIon<string | undefined>;
  //    start?: MaybeIon<number | undefined>;
  //    step?: MaybeIon<number | string | undefined>;
  //    summary?: MaybeIon<string | undefined>;
  //    target?: MaybeIon<string | undefined>;
  //    type?: MaybeIon<string | undefined>;
  //    useMap?: MaybeIon<string | undefined>;
  //    value?: MaybeIon<string | readonly string[] | number | undefined>;
  //    width?: MaybeIon<number | string | undefined>;
  //    wmode?: MaybeIon<string | undefined>;
  //    wrap?: MaybeIon<string | undefined>;
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
    href?: MaybeIon<string | undefined>;
    target?: MaybeIon<string | undefined>;
  }

  interface AnchorHTMLAttributes<T> extends HTMLAttributes<T> {
    download?: MaybeIon<unknown>;
    href?: MaybeIon<string | undefined>;
    hreflang?: MaybeIon<string | undefined>;
    media?: MaybeIon<string | undefined>;
    ping?: MaybeIon<string | undefined>;
    target?: MaybeIon<HTMLAttributeAnchorTarget | undefined>;
    type?: MaybeIon<string | undefined>;
    referrerpolicy?: MaybeIon<HTMLAttributeReferrerPolicy | undefined>;
  }

  interface AudioHTMLAttributes<T> extends MediaHTMLAttributes<T> { }

  interface AreaHTMLAttributes<T> extends HTMLAttributes<T> {
    alt?: MaybeIon<string | undefined>;
    coords?: MaybeIon<string | undefined>;
    download?: MaybeIon<unknown>;
    href?: MaybeIon<string | undefined>;
    hreflang?: MaybeIon<string | undefined>;
    media?: MaybeIon<string | undefined>;
    referrerpolicy?: MaybeIon<HTMLAttributeReferrerPolicy | undefined>;
    shape?: MaybeIon<string | undefined>;
    target?: MaybeIon<string | undefined>;
    ping?: MaybeIon<string | undefined>;
    type?: MaybeIon<string | undefined>;
  }

  interface BlockquoteHTMLAttributes<T> extends HTMLAttributes<T> {
    cite?: MaybeIon<string | undefined>;
  }

  interface ButtonHTMLAttributes<T> extends HTMLAttributes<T> {
    disabled?: MaybeIon<Booleanish | undefined>;
    form?: MaybeIon<string | undefined>;
    formaction?: MaybeIon<string | undefined>;
    formenctype?: MaybeIon<string | undefined>;
    formmethod?: MaybeIon<string | undefined>;
    formnovalidate?: MaybeIon<Booleanish | undefined>;
    formtarget?: MaybeIon<string | undefined>;
    name?: MaybeIon<string | undefined>;
    popovertarget?: MaybeIon<string>;
    popovertargetaction?: MaybeIon<string>;
    type?: MaybeIon<"submit" | "reset" | "button" | undefined | string>;
    value?: MaybeIon<string | readonly string[] | number | undefined>;
  }

  interface CanvasHTMLAttributes<T> extends HTMLAttributes<T> {
    height?: MaybeIon<number | string | undefined>;
    width?: MaybeIon<number | string | undefined>;
  }

  interface ColHTMLAttributes<T> extends HTMLAttributes<T> {
    span?: MaybeIon<number | undefined>;
    width?: MaybeIon<number | string | undefined>;
  }

  interface ColgroupHTMLAttributes<T> extends HTMLAttributes<T> {
    span?: MaybeIon<number | undefined>;
  }

  interface DataHTMLAttributes<T> extends HTMLAttributes<T> {
    value?: MaybeIon<string | readonly string[] | number | undefined>;
  }

  interface DetailsHTMLAttributes<T> extends HTMLAttributes<T> {
    open?: MaybeIon<Booleanish | undefined>;
    name?: MaybeIon<string | undefined>;
  }

  interface DelHTMLAttributes<T> extends HTMLAttributes<T> {
    cite?: MaybeIon<string | undefined>;
    datetime?: MaybeIon<string | undefined>;
  }

  interface DialogHTMLAttributes<T> extends HTMLAttributes<T> {
    open?: MaybeIon<Booleanish | undefined>;
    closedby?: MaybeIon<'any' | 'closerequest' | 'none'>
    'on:cancel'?: HandleEvent<T> | undefined;
    'on:close'?: HandleEvent<T> | undefined;
  }

  interface EmbedHTMLAttributes<T> extends HTMLAttributes<T> {
    height?: MaybeIon<number | string | undefined>;
    src?: MaybeIon<string | undefined>;
    type?: MaybeIon<string | undefined>;
    width?: MaybeIon<number | string | undefined>;
  }

  interface FieldsetHTMLAttributes<T> extends HTMLAttributes<T> {
    disabled?: MaybeIon<Booleanish | undefined>;
    form?: MaybeIon<string | undefined>;
    name?: MaybeIon<string | undefined>;
  }

  interface FormHTMLAttributes<T> extends HTMLAttributes<T> {
    'accept-charset'?: MaybeIon<string | undefined>;
    /**
     * DOM Property
     */
    action?: MaybeIon<string | undefined>;
    autocomplete?: MaybeIon<string | undefined>;
    enctype?: MaybeIon<string | undefined>;
    method?: MaybeIon<string | undefined>;
    name?: MaybeIon<string | undefined>;
    novalidate?: MaybeIon<Booleanish | undefined>;
    target?: MaybeIon<string | undefined>;
  }

  interface HtmlHTMLAttributes<T> extends HTMLAttributes<T> {
    manifest?: MaybeIon<string | undefined>;
  }

  interface IframeHTMLAttributes<T> extends HTMLAttributes<T> {
    allow?: MaybeIon<string | undefined>;
    allowfullscreen?: MaybeIon<Booleanish | undefined>;
    height?: MaybeIon<number | string | undefined>;
    /**
     * DOM Property
     */
    loading?: MaybeIon<"eager" | "lazy" | undefined>;
    name?: MaybeIon<string | undefined>;
    referrerpolicy?: MaybeIon<HTMLAttributeReferrerPolicy | undefined>;
    sandbox?: MaybeIon<string | undefined>;
    seamless?: MaybeIon<Booleanish | undefined>;
    src?: MaybeIon<string | undefined>;
    srcdoc?: MaybeIon<string | undefined>;
    width?: MaybeIon<number | string | undefined>;
  }

  interface ImgHTMLAttributes<T> extends HTMLAttributes<T> {
    alt?: MaybeIon<string | undefined>;
    crossorigin?: MaybeIon<CrossOrigin>;
    ismap?: MaybeIon<Booleanish>
    decoding?: MaybeIon<"async" | "auto" | "sync" | undefined>;
    fetchpriority?: MaybeIon<"high" | "low" | "auto">;
    height?: MaybeIon<number | string | undefined>;
    loading?: MaybeIon<"eager" | "lazy" | undefined>;
    referrerpolicy?: MaybeIon<HTMLAttributeReferrerPolicy | undefined>;
    sizes?: MaybeIon<string | undefined>;
    src?: MaybeIon<string | undefined>;
    srcset?: MaybeIon<string | undefined>;
    usemap?: MaybeIon<string | undefined>;
    width?: MaybeIon<number | string | undefined>;
  }

  interface InsHTMLAttributes<T> extends HTMLAttributes<T> {
    cite?: MaybeIon<string | undefined>;
    datetime?: MaybeIon<string | undefined>;
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
    accept?: MaybeIon<string | undefined>;
    alt?: MaybeIon<string | undefined>;
    autocomplete?: MaybeIon<HTMLInputAutoCompleteAttribute | undefined>;
    capture?: MaybeIon<Booleanish | "user" | "environment" | undefined>; // https://www.w3.org/TR/html-media-capture/#the-capture-attribute
    checked?: MaybeIon<Booleanish | undefined>;
    dirname?: MaybeIon<string | undefined>;
    disabled?: MaybeIon<Booleanish | undefined>;
    form?: MaybeIon<string | undefined>;
    formaction?: MaybeIon<string | undefined>;
    formenctype?: MaybeIon<string | undefined>;
    formmethod?: MaybeIon<string | undefined>;
    formnovalidate?: MaybeIon<Booleanish | undefined>;
    formtarget?: MaybeIon<string | undefined>;
    height?: MaybeIon<number | string | undefined>;
    list?: MaybeIon<string | undefined>;
    max?: MaybeIon<number | string | undefined>;
    maxlength?: MaybeIon<number | undefined>;
    min?: MaybeIon<number | string | undefined>;
    minlength?: MaybeIon<number | undefined>;
    multiple?: MaybeIon<Booleanish | undefined>;
    name?: MaybeIon<string | undefined>;
    pattern?: MaybeIon<string | undefined>;
    placeholder?: MaybeIon<string | undefined>;
    popovertarget?: MaybeIon<string>;
    popovertargetaction?: MaybeIon<string>;
    readonly?: MaybeIon<Booleanish | undefined>;
    required?: MaybeIon<Booleanish | undefined>;
    size?: MaybeIon<number | undefined>;
    src?: MaybeIon<string | undefined>;
    step?: MaybeIon<number | string | undefined>;
    type?: MaybeIon<HTMLInputTypeAttribute | undefined>;
    value?: MaybeIon<string | readonly string[] | number | undefined>;
    width?: MaybeIon<number | string | undefined>;

    'mu:value'?: Quarky.MutableIon<unknown>
    'mu:checked'?: Quarky.MutableIon<Booleanny>
  }


  /**
   * DEPRECATED
   */
  interface KeygenHTMLAttributes<T> extends HTMLAttributes<T> {
    challenge?: MaybeIon<string | undefined>;
    disabled?: MaybeIon<Booleanish | undefined>;
    form?: MaybeIon<string | undefined>;
    keytype?: MaybeIon<string | undefined>;
    keyparams?: MaybeIon<string | undefined>;
    name?: MaybeIon<string | undefined>;
  }

  interface LabelHTMLAttributes<T> extends HTMLAttributes<T> {
    form?: MaybeIon<string | undefined>;
    for?: MaybeIon<string | undefined>;
  }

  interface LiHTMLAttributes<T> extends HTMLAttributes<T> {
    value?: MaybeIon<string | readonly string[] | number | undefined>;
  }

  interface LinkHTMLAttributes<T> extends HTMLAttributes<T> {
    as?: MaybeIon<string | undefined>;
    blocking?: MaybeIon<string | undefined>;
    crossorigin?: MaybeIon<CrossOrigin>;
    fetchpriority?: MaybeIon<"high" | "low" | "auto">;
    href?: MaybeIon<string | undefined>;
    hreflang?: MaybeIon<string | undefined>;
    integrity?: MaybeIon<string | undefined>;
    media?: MaybeIon<string | undefined>;
    imagesrcset?: MaybeIon<string | undefined>;
    imagesizes?: MaybeIon<string | undefined>;
    referrerpolicy?: MaybeIon<HTMLAttributeReferrerPolicy | undefined>;
    sizes?: MaybeIon<string | undefined>;
    type?: MaybeIon<string | undefined>;
    charset?: MaybeIon<string | undefined>;
  }

  interface MapHTMLAttributes<T> extends HTMLAttributes<T> {
    name?: MaybeIon<string | undefined>;
  }

  interface MenuHTMLAttributes<T> extends HTMLAttributes<T> {
    type?: MaybeIon<string | undefined>;
  }


  interface MediaHTMLAttributes<T> extends HTMLAttributes<T> {
    autoplay?: MaybeIon<Booleanish | undefined>;
    controls?: MaybeIon<Booleanish | undefined>;
    crossorigin?: MaybeIon<CrossOrigin>;
    loop?: MaybeIon<Booleanish | undefined>;
    mediagroup?: MaybeIon<string | undefined>;
    muted?: MaybeIon<Booleanish | undefined>;
    preload?: MaybeIon<string | undefined>;
    src?: MaybeIon<string | undefined>;
  }

  interface MetaHTMLAttributes<T> extends HTMLAttributes<T> {
    charset?: MaybeIon<string | undefined>;
    content?: MaybeIon<string | undefined>;
    'http-equiv'?: MaybeIon<string | undefined>;
    media?: MaybeIon<string | undefined>;
    name?: MaybeIon<string | undefined>;
  }

  interface MeterHTMLAttributes<T> extends HTMLAttributes<T> {
    form?: MaybeIon<string | undefined>;
    high?: MaybeIon<number | undefined>;
    low?: MaybeIon<number | undefined>;
    max?: MaybeIon<number | string | undefined>;
    min?: MaybeIon<number | string | undefined>;
    optimum?: MaybeIon<number | undefined>;
    value?: MaybeIon<string | readonly string[] | number | undefined>;
  }

  interface QuoteHTMLAttributes<T> extends HTMLAttributes<T> {
    cite?: MaybeIon<string | undefined>;
  }

  interface ObjectHTMLAttributes<T> extends HTMLAttributes<T> {
    data?: MaybeIon<string | undefined>;
    form?: MaybeIon<string | undefined>;
    height?: MaybeIon<number | string | undefined>;
    name?: MaybeIon<string | undefined>;
    type?: MaybeIon<string | undefined>;
    usemap?: MaybeIon<string | undefined>;
    width?: MaybeIon<number | string | undefined>;
  }

  interface OlHTMLAttributes<T> extends HTMLAttributes<T> {
    reversed?: MaybeIon<Booleanish | undefined>;
    start?: MaybeIon<number | undefined>;
    type?: MaybeIon<"1" | "a" | "A" | "i" | "I" | undefined>;
  }

  interface OptgroupHTMLAttributes<T> extends HTMLAttributes<T> {
    disabled?: MaybeIon<Booleanish | undefined>;
    label?: MaybeIon<string | undefined>;
  }

  interface OptionHTMLAttributes<T> extends HTMLAttributes<T> {
    disabled?: MaybeIon<Booleanish | undefined>;
    label?: MaybeIon<string | undefined>;
    selected?: MaybeIon<Booleanish | undefined>;
    value?: MaybeIon<string | readonly string[] | number | undefined>;
  }

  interface OutputHTMLAttributes<T> extends HTMLAttributes<T> {
    form?: MaybeIon<string | undefined>;
    for?: MaybeIon<string | undefined>;
    name?: MaybeIon<string | undefined>;
  }

  interface ParamHTMLAttributes<T> extends HTMLAttributes<T> {
    name?: MaybeIon<string | undefined>;
    value?: MaybeIon<string | readonly string[] | number | undefined>;
  }

  interface ProgressHTMLAttributes<T> extends HTMLAttributes<T> {
    max?: MaybeIon<number | string | undefined>;
    value?: MaybeIon<string | readonly string[] | number | undefined>;
  }

  interface SlotHTMLAttributes<T> extends HTMLAttributes<T> {
    name?: MaybeIon<string | undefined>;
  }

  interface ScriptHTMLAttributes<T> extends HTMLAttributes<T> {
    async?: MaybeIon<Booleanish | undefined>;
    crossorigin?: MaybeIon<CrossOrigin>;
    defer?: MaybeIon<Booleanish | undefined>;
    integrity?: MaybeIon<string | undefined>;
    nomodule?: MaybeIon<Booleanish | undefined>;
    referrerpolicy?: MaybeIon<HTMLAttributeReferrerPolicy | undefined>;
    src?: MaybeIon<string | undefined>;
    type?: MaybeIon<string | undefined>;
  }

  interface SelectHTMLAttributes<T> extends HTMLAttributes<T> {
    autocomplete?: MaybeIon<string | undefined>;
    disabled?: MaybeIon<Booleanish | undefined>;
    form?: MaybeIon<string | undefined>;
    multiple?: MaybeIon<Booleanish | undefined>;
    name?: MaybeIon<string | undefined>;
    required?: MaybeIon<Booleanish | undefined>;
    size?: MaybeIon<number | undefined>;
    value?: MaybeIon<string | readonly string[] | number | undefined>;
    'on:change'?: HandleChangeEvent<T> | undefined;
    'mu:value'?: Quarky.MutableIon<string> | undefined
  }

  interface SourceHTMLAttributes<T> extends HTMLAttributes<T> {
    height?: MaybeIon<number | string | undefined>;
    media?: MaybeIon<string | undefined>;
    sizes?: MaybeIon<string | undefined>;
    src?: MaybeIon<string | undefined>;
    srcset?: MaybeIon<string | undefined>;
    type?: MaybeIon<string | undefined>;
    width?: MaybeIon<number | string | undefined>;
  }

  interface StyleHTMLAttributes<T> extends HTMLAttributes<T> {
    media?: MaybeIon<string | undefined>;
    scoped?: MaybeIon<Booleanish | undefined>;
    type?: MaybeIon<string | undefined>;
  }

  interface TableHTMLAttributes<T> extends HTMLAttributes<T> {
    // ALL DEPRECATED
    // align?: MaybeIon<"left" | "center" | "right" | undefined>;
    // bgcolor?: MaybeIon<string | undefined>;
    // border?: MaybeIon<number | undefined>;
    // cellPadding?: MaybeIon<number | string | undefined>;
    // cellSpacing?: MaybeIon<number | string | undefined>;
    // frame?: MaybeIon<Booleanish | undefined>;
    // rules?: MaybeIon<"none" | "groups" | "rows" | "columns" | "all" | undefined>;
    // summary?: MaybeIon<string | undefined>;
    // width?: MaybeIon<number | string | undefined>;
  }

  interface TextareaHTMLAttributes<T> extends HTMLAttributes<T> {
    autocomplete?: MaybeIon<string | undefined>;
    cols?: MaybeIon<number | undefined>;
    dirname?: MaybeIon<string | undefined>;
    disabled?: MaybeIon<Booleanish | undefined>;
    form?: MaybeIon<string | undefined>;
    maxlength?: MaybeIon<number | undefined>;
    minlength?: MaybeIon<number | undefined>;
    name?: MaybeIon<string | undefined>;
    placeholder?: MaybeIon<string | undefined>;
    readonly?: MaybeIon<Booleanish | undefined>;
    required?: MaybeIon<Booleanish | undefined>;
    rows?: MaybeIon<number | undefined>;
    value?: MaybeIon<string | readonly string[] | number | undefined>;
    wrap?: MaybeIon<string | undefined>;

    'mu:value'?: Quarky.MutableIon<string>
    'on:change'?: HandleChangeEvent<T> | undefined;
  }

  interface TdHTMLAttributes<T> extends HTMLAttributes<T> {
    align?: MaybeIon<"left" | "center" | "right" | "justify" | "char" | undefined>;
    colSpan?: MaybeIon<number | undefined>;
    headers?: MaybeIon<string | undefined>;
    rowSpan?: MaybeIon<number | undefined>;
    scope?: MaybeIon<string | undefined>;
    abbr?: MaybeIon<string | undefined>;
    height?: MaybeIon<number | string | undefined>;
    width?: MaybeIon<number | string | undefined>;
    valign?: MaybeIon<"top" | "middle" | "bottom" | "baseline" | undefined>;
  }

  interface ThHTMLAttributes<T> extends HTMLAttributes<T> {
    colspan?: MaybeIon<number | undefined>;
    headers?: MaybeIon<string | undefined>;
    rowspan?: MaybeIon<number | undefined>;
    scope?: MaybeIon<string | undefined>;
    abbr?: MaybeIon<string | undefined>;
  }

  interface TimeHTMLAttributes<T> extends HTMLAttributes<T> {
    datetime?: MaybeIon<string | undefined>;
  }

  interface TrackHTMLAttributes<T> extends HTMLAttributes<T> {
    default?: MaybeIon<Booleanish | undefined>;
    kind?: MaybeIon<string | undefined>;
    label?: MaybeIon<string | undefined>;
    src?: MaybeIon<string | undefined>;
    srclang?: MaybeIon<string | undefined>;
  }

  interface VideoHTMLAttributes<T> extends MediaHTMLAttributes<T> {
    height?: MaybeIon<number | string | undefined>;
    controlslist?: MaybeIon<string | undefined>;
    playsinline?: MaybeIon<Booleanish | undefined>;
    poster?: MaybeIon<string | undefined>;
    width?: MaybeIon<number | string | undefined>;
    disablepictureinpicture?: MaybeIon<Booleanish | undefined>;
    disableremoteplayback?: MaybeIon<Booleanish | undefined>;
  }


  interface SVGAttributes<T> extends AriaAttributes, GlobalAttributes, DOMAttributes<T> {
    // Attributes which also defined in HTMLAttributes
    href?: MaybeIon<string | undefined>;
    hreflang?: MaybeIon<string | undefined>;
    media?: MaybeIon<string | undefined>;
    ping?: MaybeIon<string | undefined>;
    target?: MaybeIon<HTMLAttributeAnchorTarget | string | undefined>;
    type?: MaybeIon<string | undefined>;
    referrerpolicy?: MaybeIon<HTMLAttributeReferrerPolicy | undefined>;

    height?: MaybeIon<number | string | undefined>;
    width?: MaybeIon<number | string | undefined>;

    crossorigin?: MaybeIon<CrossOrigin>;
    fetchpriority?: MaybeIon<"high" | "low" | "auto">;

    // SVG Specific attributes
    accumulate?: MaybeIon<"none" | "sum" | undefined>;
    additive?: MaybeIon<"replace" | "sum" | undefined>;
    'alignment-baseline'?: MaybeIon<
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
    allowReorder?: MaybeIon<"no" | "yes" | undefined>;
    alphabetic?: MaybeIon<number | string | undefined>;
    amplitude?: MaybeIon<number | string | undefined>;
    'arabic-form'?: MaybeIon<"initial" | "medial" | "terminal" | "isolated" | undefined>;
    attributeName?: MaybeIon<string | undefined>;
    attributeType?: MaybeIon<string | undefined>;
    autoReverse?: MaybeIon<Booleanish | undefined>;
    azimuth?: MaybeIon<number | string | undefined>;
    baseFrequency?: MaybeIon<number | string | undefined>;
    'baseline-shift'?: MaybeIon<number | string | undefined>;
    begin?: MaybeIon<number | string | undefined>;
    bias?: MaybeIon<number | string | undefined>;
    by?: MaybeIon<number | string | undefined>;
    calcMode?: MaybeIon<number | string | undefined>;
    clipPathUnits?: MaybeIon<number | string | undefined>;
    'clip-path'?: MaybeIon<string | undefined>;
    'clip-rule'?: MaybeIon<number | string | undefined>;
    color?: MaybeIon<string | undefined>;
    'color-interpolation'?: MaybeIon<number | string | undefined>;
    'color-interpolation-filters'?: MaybeIon<"auto" | "sRGB" | "linearRGB" | "inherit" | undefined>;
    'color-rendering'?: MaybeIon<number | string | undefined>;
    cursor?: MaybeIon<number | string | undefined>;
    cx?: MaybeIon<number | string | undefined>;
    cy?: MaybeIon<number | string | undefined>;
    d?: MaybeIon<string | undefined>;
    decelerate?: MaybeIon<number | string | undefined>;
    diffuseConstant?: MaybeIon<number | string | undefined>;
    direction?: MaybeIon<number | string | undefined>;
    display?: MaybeIon<number | string | undefined>;
    divisor?: MaybeIon<number | string | undefined>;
    'dominant-baseline'?: MaybeIon<number | string | undefined>;
    dur?: MaybeIon<number | string | undefined>;
    dx?: MaybeIon<number | string | undefined>;
    dy?: MaybeIon<number | string | undefined>;
    edgeMode?: MaybeIon<number | string | undefined>;
    elevation?: MaybeIon<number | string | undefined>;
    end?: MaybeIon<number | string | undefined>;
    exponent?: MaybeIon<number | string | undefined>;
    fill?: MaybeIon<string | undefined>;
    'fill-opacity'?: MaybeIon<number | string | undefined>;
    'fill-rule'?: MaybeIon<"nonzero" | "evenodd" | "inherit" | undefined>;
    filter?: MaybeIon<string | undefined>;
    filterUnits?: MaybeIon<number | string | undefined>;
    'flood-color'?: MaybeIon<number | string | undefined>;
    'flood-opacity'?: MaybeIon<number | string | undefined>;
    focusable?: MaybeIon<Booleanish | "auto" | undefined>;
    'font-family'?: MaybeIon<string | undefined>;
    'font-size'?: MaybeIon<number | string | undefined>;
    'font-size-adjust'?: MaybeIon<number | string | undefined>;
    'font-style'?: MaybeIon<number | string | undefined>;
    'font-variant'?: MaybeIon<number | string | undefined>;
    'font-weight'?: MaybeIon<number | string | undefined>;
    fr?: MaybeIon<number | string | undefined>;
    from?: MaybeIon<number | string | undefined>;
    fx?: MaybeIon<number | string | undefined>;
    fy?: MaybeIon<number | string | undefined>;
    gradientTransform?: MaybeIon<string | undefined>;
    gradientUnits?: MaybeIon<string | undefined>;
    'image-rendering'?: MaybeIon<number | string | undefined>;
    in2?: MaybeIon<number | string | undefined>;
    in?: MaybeIon<string | undefined>;
    intercept?: MaybeIon<number | string | undefined>;
    k1?: MaybeIon<number | string | undefined>;
    k2?: MaybeIon<number | string | undefined>;
    k3?: MaybeIon<number | string | undefined>;
    k4?: MaybeIon<number | string | undefined>;
    kernelMatrix?: MaybeIon<number | string | undefined>;
    kernelUnitLength?: MaybeIon<number | string | undefined>;
    keyPoints?: MaybeIon<number | string | undefined>;
    keySplines?: MaybeIon<number | string | undefined>;
    keyTimes?: MaybeIon<number | string | undefined>;
    lengthAdjust?: MaybeIon<number | string | undefined>;
    'letter-spacing'?: MaybeIon<number | string | undefined>;
    'lighting-color'?: MaybeIon<number | string | undefined>;
    limitingConeAngle?: MaybeIon<number | string | undefined>;
    'marker-end'?: MaybeIon<string | undefined>;
    'marker-mid'?: MaybeIon<string | undefined>;
    'marker-start'?: MaybeIon<string | undefined>;
    markerHeight?: MaybeIon<number | string | undefined>;
    markerUnits?: MaybeIon<number | string | undefined>;
    markerWidth?: MaybeIon<number | string | undefined>;
    mask?: MaybeIon<string | undefined>;
    maskContentUnits?: MaybeIon<number | string | undefined>;
    maskUnits?: MaybeIon<number | string | undefined>;
    max?: MaybeIon<number | string | undefined>;
    min?: MaybeIon<number | string | undefined>;

    /**
     * The method attribute indicates the method by which text should be rendered along the path of a <textPath> element.
     * 
     * default: 'align'
     * 
     * source: https://developer.mozilla.org/en-US/docs/Web/SVG/Reference/Attribute/method
     */
    method?: MaybeIon<'align' | 'stretch'>;
    mode?: MaybeIon<number | string | undefined>;
    name?: MaybeIon<string | undefined>;
    numOctaves?: MaybeIon<number | string | undefined>;
    offset?: MaybeIon<number | string | undefined>;
    opacity?: MaybeIon<number | string | undefined>;
    operator?: MaybeIon<number | string | undefined>;
    order?: MaybeIon<number | string | undefined>;
    orient?: MaybeIon<number | string | undefined>;
    origin?: MaybeIon<number | string | undefined>;
    overflow?: MaybeIon<number | string | undefined>;
    'overline-position'?: MaybeIon<number | string | undefined>;
    'overline-thickness'?: MaybeIon<number | string | undefined>;
    'paint-order'?: MaybeIon<number | string | undefined>;
    path?: MaybeIon<string | undefined>;
    pathLength?: MaybeIon<number | string | undefined>;
    patternContentUnits?: MaybeIon<string | undefined>;
    patternTransform?: MaybeIon<number | string | undefined>;
    patternUnits?: MaybeIon<string | undefined>;
    'pointer-events'?: MaybeIon<number | string | undefined>;
    points?: MaybeIon<string | undefined>;
    pointsAtX?: MaybeIon<number | string | undefined>;
    pointsAtY?: MaybeIon<number | string | undefined>;
    pointsAtZ?: MaybeIon<number | string | undefined>;
    preserveAlpha?: MaybeIon<Booleanish | undefined>;
    preserveAspectRatio?: MaybeIon<string | undefined>;
    primitiveUnits?: MaybeIon<number | string | undefined>;
    r?: MaybeIon<number | string | undefined>;
    radius?: MaybeIon<number | string | undefined>;
    refX?: MaybeIon<number | string | undefined>;
    refY?: MaybeIon<number | string | undefined>;
    renderingIntent?: MaybeIon<number | string | undefined>;
    repeatCount?: MaybeIon<number | string | undefined>;
    repeatDur?: MaybeIon<number | string | undefined>;
    requiredExtensions?: MaybeIon<number | string | undefined>;
    restart?: MaybeIon<number | string | undefined>;
    result?: MaybeIon<string | undefined>;
    rotate?: MaybeIon<number | string | undefined>;
    rx?: MaybeIon<number | string | undefined>;
    ry?: MaybeIon<number | string | undefined>;
    scale?: MaybeIon<number | string | undefined>;
    seed?: MaybeIon<number | string | undefined>;
    'shape-rendering'?: MaybeIon<number | string | undefined>;
    /**
     * EXPERIMENTAL
     * 
     * default: 'left'
     * 
     * https://developer.mozilla.org/en-US/docs/Web/SVG/Reference/Attribute/side
     */
    side?: MaybeIon<'left' | 'right'>;
    slope?: MaybeIon<number | string | undefined>;
    spacing?: MaybeIon<number | string | undefined>;
    specularConstant?: MaybeIon<number | string | undefined>;
    specularExponent?: MaybeIon<number | string | undefined>;
    spreadMethod?: MaybeIon<string | undefined>;
    startOffset?: MaybeIon<number | string | undefined>;
    stdDeviation?: MaybeIon<number | string | undefined>;
    stitchTiles?: MaybeIon<number | string | undefined>;
    'stop-color'?: MaybeIon<string | undefined>;
    'stop-opacity'?: MaybeIon<number | string | undefined>;
    'strikethrough-Position'?: MaybeIon<number | string | undefined>;
    'strikethrough-Thickness'?: MaybeIon<number | string | undefined>;
    stroke?: MaybeIon<string | undefined>;
    'stroke-dasharray'?: MaybeIon<string | number | undefined>;
    'stroke-dashoffset'?: MaybeIon<string | number | undefined>;
    'stroke-linecap'?: MaybeIon<"butt" | "round" | "square" | "inherit" | undefined>;
    'stroke-linejoin'?: MaybeIon<"miter" | "round" | "bevel" | "inherit" | undefined>;
    'stroke-miterlimit'?: MaybeIon<number | string | undefined>;
    'stroke-opacity'?: MaybeIon<number | string | undefined>;
    'stroke-width'?: MaybeIon<number | string | undefined>;
    surfaceScale?: MaybeIon<number | string | undefined>;
    systemLanguage?: MaybeIon<number | string | undefined>;
    tableValues?: MaybeIon<number | string | undefined>;
    targetX?: MaybeIon<number | string | undefined>;
    targetY?: MaybeIon<number | string | undefined>;
    'text-anchor'?: MaybeIon<string | undefined>;
    'text-decoration'?: MaybeIon<number | string | undefined>;
    /**
     * *default*: 'clip'
     */
    'text-overflow'?: MaybeIon<'clip' | 'ellipses'>;
    'text-rendering'?: MaybeIon<number | string | undefined>;
    textLength?: MaybeIon<number | string | undefined>;
    to?: MaybeIon<number | string | undefined>;
    transform?: MaybeIon<string | undefined>;
    'transform-origin'?: MaybeIon<string | undefined>;
    'underline-position'?: MaybeIon<number | string | undefined>;
    'underline-thickness'?: MaybeIon<number | string | undefined>;
    'unicode-bidi'?: MaybeIon<number | string | undefined>;
    values?: MaybeIon<string | undefined>;
    'vector-effect'?: MaybeIon<number | string | undefined>;
    viewBox?: MaybeIon<string | undefined>;
    visibility?: MaybeIon<number | string | undefined>;
    'white-space'?: MaybeIon<'normal' | 'pre' | 'nowrap' | 'pre-wrap' | 'break-space' | 'pre-line'>;
    'word-spacing'?: MaybeIon<number | string | undefined>;
    'writing-mode'?: MaybeIon<number | string | undefined>;
    x1?: MaybeIon<number | string | undefined>;
    x2?: MaybeIon<number | string | undefined>;
    x?: MaybeIon<number | string | undefined>;
    xChannelSelector?: MaybeIon<string | undefined>;
    'xlink:actuate'?: MaybeIon<string | undefined>;
    'xlink:role'?: MaybeIon<string | undefined>;
    xmlns?: MaybeIon<string | undefined>;
    'xmlns:xlink'?: MaybeIon<string | undefined>;
    y1?: MaybeIon<number | string | undefined>;
    y2?: MaybeIon<number | string | undefined>;
    y?: MaybeIon<number | string | undefined>;
    yChannelSelector?: MaybeIon<string | undefined>;
    z?: MaybeIon<number | string | undefined>;
    zoomAndPan?: MaybeIon<string | undefined>;
  }

  interface WebViewHTMLAttributes<T> extends HTMLAttributes<T> {
    allowfullscreen?: MaybeIon<Booleanish | undefined>;
    allowpopups?: MaybeIon<Booleanish | undefined>;
    autosize?: MaybeIon<Booleanish | undefined>;
    blinkfeatures?: MaybeIon<string | undefined>;
    enableblinkfeatures?: MaybeIon<string | undefined>;
    disableblinkfeatures?: MaybeIon<string | undefined>;
    disableguestresize?: MaybeIon<Booleanish | undefined>;
    disablewebsecurity?: MaybeIon<Booleanish | undefined>;
    guestinstance?: MaybeIon<string | undefined>;
    httpreferrer?: MaybeIon<string | undefined>;
    nodeintegration?: MaybeIon<Booleanish | undefined>;
    nodeintegrationinsubframes?: MaybeIon<Booleanish | undefined>;
    partition?: MaybeIon<string | undefined>;
    plugins?: MaybeIon<Booleanish | undefined>;
    preload?: MaybeIon<string | undefined>;
    src?: MaybeIon<string | undefined>;
    useragent?: MaybeIon<string | undefined>;
    webpreferences?: MaybeIon<string | undefined>;
  }



  // DOM Attributes
  // ----------------------------------------------------------------------

  type Index = Quarky.Ion<number> | number

  interface RefAttributes<T> {
    /**
     * Access the DOM element via NodeRef or node refs config object.
     * Once the view unmounts, the ref value will be set to `null`
     */
    ref?: (() => T | undefined) | [T[], Index] | [T[][], [Index, Index]]
  }

  interface SVGProps<T> extends SVGAttributes<T>, RefAttributes<T> {
  }

  interface SVGLineElementAttributes<T> extends SVGProps<T> { }
  interface SVGTextElementAttributes<T> extends SVGProps<T> { }


  type DOMAttributes<T> = {
    children?: any;
  } & Events<T>

  interface FrameworkAttributes<T> extends RefAttributes<T>, LuentHooks<T>, LuentCommonAttributes { }

  type LuentComponentAttributes<C> = {
    ref?: () => ComponentRef<C> | undefined
  }

  type LuentCommonAttributes = {
    'on:event'?: { [key: string]: Function };
    'auto-bind'?: SetupBindings
  }

  
  export type LibraryManagedAttributes<T, P> =
  T extends (...args: infer Params) => any ?
  Params extends never[] ? {}
  : Params extends [infer B] ?
  B extends { '~bindings'?: infer A } ?
  GlobalAttributes & A & LuentHooks<ComponentRef<T>> & LuentComponentAttributes<T> & LuentCommonAttributes & Events<ComponentRef<T>>
  : P extends GlobalAttributes
  ? P
  : { TypeError: `Function cannot be called as a JSX tag. Setup object must type FromTag<T>` }
  : P
  : P

  export interface Element { }


  // Element maps
  // ----------------------------------------------------------------------


  interface LuentElements {
    '!--': {}; //comments
    'shadow-root': { children: any, mode: 'open' | 'closed' }
    'o--portal': PortalNodeInput & { children: any }

    'o-style': StyleHTMLAttributes<HTMLStyleElement> & FrameworkAttributes<HTMLStyleElement> & { 'portal-to'?: 'body' | 'head', text: string }
    'o-link': LinkHTMLAttributes<HTMLLinkElement> & FrameworkAttributes<HTMLLinkElement> & { 'portal-to'?: 'body' | 'head' }
    'o--head': HTMLAttributes<HTMLHeadElement> & FrameworkAttributes<HTMLHeadElement>
    'o--body': HTMLAttributes<HTMLBodyElement> & FrameworkAttributes<HTMLBodyElement>
    'o--window': HTMLAttributes<Window> & FrameworkAttributes<Window>
    'o--host': HTMLAttributes<Window> & FrameworkAttributes<Window>
    'o:preserve': { children: any[] | any; discard?: Quarky.Ion<Booleanish> }
    'o:context': { children: any[] | any; provide: Provided }
    'o:transition': { children: any[] | any; } & TransitionBindings

    'o--dock': HTMLAttributes<HTMLDivElement> & TransitionConfigs & FrameworkAttributes<HTMLDivElement>
  }

  interface HTMLElements {
    // HTML
    a: AnchorHTMLAttributes<HTMLAnchorElement> & FrameworkAttributes<HTMLAnchorElement>;
    abbr: HTMLAttributes<HTMLElement> & FrameworkAttributes<HTMLElement>;
    address: HTMLAttributes<HTMLElement> & FrameworkAttributes<HTMLElement>;
    area: AreaHTMLAttributes<HTMLAreaElement> & FrameworkAttributes<HTMLAreaElement>;
    article: HTMLAttributes<HTMLElement> & FrameworkAttributes<HTMLElement>;
    aside: HTMLAttributes<HTMLElement> & FrameworkAttributes<HTMLElement>;
    audio: AudioHTMLAttributes<HTMLAudioElement> & FrameworkAttributes<HTMLAudioElement>;
    b: HTMLAttributes<HTMLElement> & FrameworkAttributes<HTMLElement>;
    base: BaseHTMLAttributes<HTMLBaseElement> & FrameworkAttributes<HTMLBaseElement>;
    bdi: HTMLAttributes<HTMLElement> & FrameworkAttributes<HTMLElement>;
    bdo: HTMLAttributes<HTMLElement> & FrameworkAttributes<HTMLElement>;
    big: HTMLAttributes<HTMLElement> & FrameworkAttributes<HTMLElement>;
    blockquote: BlockquoteHTMLAttributes<HTMLQuoteElement> & FrameworkAttributes<HTMLQuoteElement>;
    body: HTMLAttributes<HTMLBodyElement> & FrameworkAttributes<HTMLBodyElement>;
    br: HTMLAttributes<HTMLBRElement> & FrameworkAttributes<HTMLBRElement>;
    button: ButtonHTMLAttributes<HTMLButtonElement> & FrameworkAttributes<HTMLButtonElement>;
    canvas: CanvasHTMLAttributes<HTMLCanvasElement> & FrameworkAttributes<HTMLCanvasElement>;
    caption: HTMLAttributes<HTMLElement> & FrameworkAttributes<HTMLElement>;
    center: HTMLAttributes<HTMLElement> & FrameworkAttributes<HTMLElement>;
    cite: HTMLAttributes<HTMLElement> & FrameworkAttributes<HTMLElement>;
    code: HTMLAttributes<HTMLElement> & FrameworkAttributes<HTMLElement>;
    col: ColHTMLAttributes<HTMLTableColElement> & FrameworkAttributes<HTMLTableColElement>;
    colgroup: ColgroupHTMLAttributes<HTMLTableColElement> & FrameworkAttributes<HTMLTableColElement>;
    data: DataHTMLAttributes<HTMLDataElement> & FrameworkAttributes<HTMLDataElement>;
    datalist: HTMLAttributes<HTMLDataListElement> & FrameworkAttributes<HTMLDataListElement>;
    dd: HTMLAttributes<HTMLElement> & FrameworkAttributes<HTMLElement>;
    del: DelHTMLAttributes<HTMLModElement> & FrameworkAttributes<HTMLModElement>;
    details: DetailsHTMLAttributes<HTMLDetailsElement> & FrameworkAttributes<HTMLDetailsElement>;
    dfn: HTMLAttributes<HTMLElement> & FrameworkAttributes<HTMLElement>;
    dialog: DialogHTMLAttributes<HTMLDialogElement> & FrameworkAttributes<HTMLDialogElement>;
    div: HTMLAttributes<HTMLDivElement> & FrameworkAttributes<HTMLDivElement>;
    dl: HTMLAttributes<HTMLDListElement> & FrameworkAttributes<HTMLDListElement>;
    dt: HTMLAttributes<HTMLElement> & FrameworkAttributes<HTMLElement>;
    em: HTMLAttributes<HTMLElement> & FrameworkAttributes<HTMLElement>;
    embed: EmbedHTMLAttributes<HTMLEmbedElement> & FrameworkAttributes<HTMLEmbedElement>;
    fieldset: FieldsetHTMLAttributes<HTMLFieldSetElement> & FrameworkAttributes<HTMLFieldSetElement>;
    figcaption: HTMLAttributes<HTMLElement> & FrameworkAttributes<HTMLElement>;
    figure: HTMLAttributes<HTMLElement> & FrameworkAttributes<HTMLElement>;
    footer: HTMLAttributes<HTMLElement> & FrameworkAttributes<HTMLElement>;
    form: FormHTMLAttributes<HTMLFormElement> & FrameworkAttributes<HTMLFormElement>;
    h1: HTMLAttributes<HTMLHeadingElement> & FrameworkAttributes<HTMLHeadingElement>;
    h2: HTMLAttributes<HTMLHeadingElement> & FrameworkAttributes<HTMLHeadingElement>;
    h3: HTMLAttributes<HTMLHeadingElement> & FrameworkAttributes<HTMLHeadingElement>;
    h4: HTMLAttributes<HTMLHeadingElement> & FrameworkAttributes<HTMLHeadingElement>;
    h5: HTMLAttributes<HTMLHeadingElement> & FrameworkAttributes<HTMLHeadingElement>;
    h6: HTMLAttributes<HTMLHeadingElement> & FrameworkAttributes<HTMLHeadingElement>;
    head: HTMLAttributes<HTMLHeadElement> & FrameworkAttributes<HTMLHeadElement>;
    header: HTMLAttributes<HTMLElement> & FrameworkAttributes<HTMLElement>;
    hgroup: HTMLAttributes<HTMLElement> & FrameworkAttributes<HTMLElement>;
    hr: HTMLAttributes<HTMLHRElement> & FrameworkAttributes<HTMLHRElement>;
    html: HtmlHTMLAttributes<HTMLHtmlElement> & FrameworkAttributes<HTMLHtmlElement>;
    i: HTMLAttributes<HTMLElement> & FrameworkAttributes<HTMLElement>;
    iframe: IframeHTMLAttributes<HTMLIFrameElement> & FrameworkAttributes<HTMLIFrameElement>;
    img: ImgHTMLAttributes<HTMLImageElement> & FrameworkAttributes<HTMLImageElement>;
    input: InputHTMLAttributes<HTMLInputElement> & FrameworkAttributes<HTMLInputElement>;
    ins: InsHTMLAttributes<HTMLModElement> & FrameworkAttributes<HTMLModElement>;
    kbd: HTMLAttributes<HTMLElement> & FrameworkAttributes<HTMLElement>;
    keygen: KeygenHTMLAttributes<HTMLElement> & FrameworkAttributes<HTMLElement>;
    label: LabelHTMLAttributes<HTMLLabelElement> & FrameworkAttributes<HTMLLabelElement>;
    legend: HTMLAttributes<HTMLLegendElement> & FrameworkAttributes<HTMLLegendElement>;
    li: LiHTMLAttributes<HTMLLIElement> & FrameworkAttributes<HTMLLIElement>;
    link: LinkHTMLAttributes<HTMLLinkElement> & FrameworkAttributes<HTMLLinkElement>;
    main: HTMLAttributes<HTMLElement> & FrameworkAttributes<HTMLElement>;
    map: MapHTMLAttributes<HTMLMapElement> & FrameworkAttributes<HTMLMapElement>;
    mark: HTMLAttributes<HTMLElement> & FrameworkAttributes<HTMLElement>;
    menu: MenuHTMLAttributes<HTMLElement> & FrameworkAttributes<HTMLElement>;
    menuitem: HTMLAttributes<HTMLElement> & FrameworkAttributes<HTMLElement>;
    meta: MetaHTMLAttributes<HTMLMetaElement> & FrameworkAttributes<HTMLMetaElement>;
    meter: MeterHTMLAttributes<HTMLMeterElement> & FrameworkAttributes<HTMLMeterElement>;
    nav: HTMLAttributes<HTMLElement> & FrameworkAttributes<HTMLElement>;
    noindex: HTMLAttributes<HTMLElement> & FrameworkAttributes<HTMLElement>;
    noscript: HTMLAttributes<HTMLElement> & FrameworkAttributes<HTMLElement>;
    object: ObjectHTMLAttributes<HTMLObjectElement> & FrameworkAttributes<HTMLObjectElement>;
    ol: OlHTMLAttributes<HTMLOListElement> & FrameworkAttributes<HTMLOListElement>;
    optgroup: OptgroupHTMLAttributes<HTMLOptGroupElement> & FrameworkAttributes<HTMLOptGroupElement>;
    option: OptionHTMLAttributes<HTMLOptionElement> & FrameworkAttributes<HTMLOptionElement>;
    output: OutputHTMLAttributes<HTMLOutputElement> & FrameworkAttributes<HTMLOutputElement>;
    p: HTMLAttributes<HTMLParagraphElement> & FrameworkAttributes<HTMLParagraphElement>;
    param: ParamHTMLAttributes<HTMLParamElement> & FrameworkAttributes<HTMLParamElement>;
    picture: HTMLAttributes<HTMLElement> & FrameworkAttributes<HTMLElement>;
    pre: HTMLAttributes<HTMLPreElement> & FrameworkAttributes<HTMLPreElement>;
    progress: ProgressHTMLAttributes<HTMLProgressElement> & FrameworkAttributes<HTMLProgressElement>;
    q: QuoteHTMLAttributes<HTMLQuoteElement> & FrameworkAttributes<HTMLQuoteElement>;
    rp: HTMLAttributes<HTMLElement> & FrameworkAttributes<HTMLElement>;
    rt: HTMLAttributes<HTMLElement> & FrameworkAttributes<HTMLElement>;
    ruby: HTMLAttributes<HTMLElement> & FrameworkAttributes<HTMLElement>;
    s: HTMLAttributes<HTMLElement> & FrameworkAttributes<HTMLElement>;
    samp: HTMLAttributes<HTMLElement> & FrameworkAttributes<HTMLElement>;
    search: HTMLAttributes<HTMLElement> & FrameworkAttributes<HTMLElement>;
    slot: SlotHTMLAttributes<HTMLSlotElement> & FrameworkAttributes<HTMLSlotElement>;
    script: ScriptHTMLAttributes<HTMLScriptElement> & FrameworkAttributes<HTMLScriptElement>;
    section: HTMLAttributes<HTMLElement> & FrameworkAttributes<HTMLElement>;
    select: SelectHTMLAttributes<HTMLSelectElement> & FrameworkAttributes<HTMLSelectElement>;
    small: HTMLAttributes<HTMLElement> & FrameworkAttributes<HTMLElement>;
    source: SourceHTMLAttributes<HTMLSourceElement> & FrameworkAttributes<HTMLSourceElement>;
    span: HTMLAttributes<HTMLSpanElement> & FrameworkAttributes<HTMLSpanElement>;
    strong: HTMLAttributes<HTMLElement> & FrameworkAttributes<HTMLElement>;
    style: StyleHTMLAttributes<HTMLStyleElement> & FrameworkAttributes<HTMLStyleElement>;
    sub: HTMLAttributes<HTMLElement> & FrameworkAttributes<HTMLElement>;
    summary: HTMLAttributes<HTMLElement> & FrameworkAttributes<HTMLElement>;
    sup: HTMLAttributes<HTMLElement> & FrameworkAttributes<HTMLElement>;
    table: TableHTMLAttributes<HTMLTableElement> & FrameworkAttributes<HTMLTableElement>;
    template: HTMLAttributes<HTMLTemplateElement> & FrameworkAttributes<HTMLTemplateElement>;
    tbody: HTMLAttributes<HTMLTableSectionElement> & FrameworkAttributes<HTMLTableSectionElement>;
    td: TdHTMLAttributes<HTMLTableCellElement> & FrameworkAttributes<HTMLTableCellElement>;
    textarea: TextareaHTMLAttributes<HTMLTextAreaElement> & FrameworkAttributes<HTMLTextAreaElement>;
    tfoot: HTMLAttributes<HTMLTableSectionElement> & FrameworkAttributes<HTMLTableSectionElement>;
    th: ThHTMLAttributes<HTMLTableCellElement> & FrameworkAttributes<HTMLTableCellElement>;
    thead: HTMLAttributes<HTMLTableSectionElement> & FrameworkAttributes<HTMLTableSectionElement>;
    time: TimeHTMLAttributes<HTMLTimeElement> & FrameworkAttributes<HTMLTimeElement>;
    title: HTMLAttributes<HTMLTitleElement> & FrameworkAttributes<HTMLTitleElement>;
    tr: HTMLAttributes<HTMLTableRowElement> & FrameworkAttributes<HTMLTableRowElement>;
    track: TrackHTMLAttributes<HTMLTrackElement> & FrameworkAttributes<HTMLTrackElement>;
    u: HTMLAttributes<HTMLElement> & FrameworkAttributes<HTMLElement>;
    ul: HTMLAttributes<HTMLUListElement> & FrameworkAttributes<HTMLUListElement>;
    "var": HTMLAttributes<HTMLElement> & FrameworkAttributes<HTMLElement>;
    video: VideoHTMLAttributes<HTMLVideoElement> & FrameworkAttributes<HTMLVideoElement>;
    wbr: HTMLAttributes<HTMLElement> & FrameworkAttributes<HTMLElement>;
    webview: WebViewHTMLAttributes<HTMLWebViewElement> & FrameworkAttributes<HTMLWebViewElement>;

    // SVG
    svg: SVGProps<SVGSVGElement>;

    animate: SVGProps<SVGElement>; // TODO: It is SVGAnimateElement but is not in TypeScript's lib.dom.d.ts for now.
    animateMotion: SVGProps<SVGElement>;
    animateTransform: SVGProps<SVGElement>; // TODO: It is SVGAnimateTransformElement but is not in TypeScript's lib.dom.d.ts for now.
    circle: SVGProps<SVGCircleElement>;
    clipPath: SVGProps<SVGClipPathElement>;
    defs: SVGProps<SVGDefsElement>;
    desc: SVGProps<SVGDescElement>;
    ellipse: SVGProps<SVGEllipseElement>;
    feBlend: SVGProps<SVGFEBlendElement>;
    feColorMatrix: SVGProps<SVGFEColorMatrixElement>;
    feComponentTransfer: SVGProps<SVGFEComponentTransferElement>;
    feComposite: SVGProps<SVGFECompositeElement>;
    feConvolveMatrix: SVGProps<SVGFEConvolveMatrixElement>;
    feDiffuseLighting: SVGProps<SVGFEDiffuseLightingElement>;
    feDisplacementMap: SVGProps<SVGFEDisplacementMapElement>;
    feDistantLight: SVGProps<SVGFEDistantLightElement>;
    feDropShadow: SVGProps<SVGFEDropShadowElement>;
    feFlood: SVGProps<SVGFEFloodElement>;
    feFuncA: SVGProps<SVGFEFuncAElement>;
    feFuncB: SVGProps<SVGFEFuncBElement>;
    feFuncG: SVGProps<SVGFEFuncGElement>;
    feFuncR: SVGProps<SVGFEFuncRElement>;
    feGaussianBlur: SVGProps<SVGFEGaussianBlurElement>;
    feImage: SVGProps<SVGFEImageElement>;
    feMerge: SVGProps<SVGFEMergeElement>;
    feMergeNode: SVGProps<SVGFEMergeNodeElement>;
    feMorphology: SVGProps<SVGFEMorphologyElement>;
    feOffset: SVGProps<SVGFEOffsetElement>;
    fePointLight: SVGProps<SVGFEPointLightElement>;
    feSpecularLighting: SVGProps<SVGFESpecularLightingElement>;
    feSpotLight: SVGProps<SVGFESpotLightElement>;
    feTile: SVGProps<SVGFETileElement>;
    feTurbulence: SVGProps<SVGFETurbulenceElement>;
    filter: SVGProps<SVGFilterElement>;
    foreignObject: SVGProps<SVGForeignObjectElement>;
    g: SVGProps<SVGGElement>;
    image: SVGProps<SVGImageElement>;
    line: SVGLineElementAttributes<SVGLineElement>;
    linearGradient: SVGProps<SVGLinearGradientElement>;
    marker: SVGProps<SVGMarkerElement>;
    mask: SVGProps<SVGMaskElement>;
    metadata: SVGProps<SVGMetadataElement>;
    mpath: SVGProps<SVGElement>;
    path: SVGProps<SVGPathElement>;
    pattern: SVGProps<SVGPatternElement>;
    polygon: SVGProps<SVGPolygonElement>;
    polyline: SVGProps<SVGPolylineElement>;
    radialGradient: SVGProps<SVGRadialGradientElement>;
    rect: SVGProps<SVGRectElement>;
    set: SVGProps<SVGSetElement>;
    stop: SVGProps<SVGStopElement>;
    switch: SVGProps<SVGSwitchElement>;
    symbol: SVGProps<SVGSymbolElement>;
    text: SVGTextElementAttributes<SVGTextElement>;
    textPath: SVGProps<SVGTextPathElement>;
    tspan: SVGProps<SVGTSpanElement>;
    use: SVGProps<SVGUseElement>;
    view: SVGProps<SVGViewElement>;
  }

  export interface IntrinsicElements extends HTMLElements, LuentElements { }
}