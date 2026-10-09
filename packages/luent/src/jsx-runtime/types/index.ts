import "./global";

import * as CSS from "csstype";
import * as Quarky from "@luently/quarky";
import { AnyObject, Booleanny } from "@luently/types";
import { PortalNodeInput } from "../../boundaries/Portal";
import { TransitionBindings, TransitionConfigs } from "../../transitions/transitions";
import { matchEventTarget } from "../../events/target";
import { IonOr, RenderTag } from "../../component/bindings-types";
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

type StyleInput = IonOr<string | Falsey> | IonOr<{ [K in keyof Partial<JSX.CSSProperties>]: IonOr<JSX.CSSProperties[K]> }>
type ClassInput = IonOr<string> | IonOr<{ [key: string]: IonOr<Booleanny> }>


export namespace JSX {

  // ----------------------------------------------------------------------
  // #region: Event Objects
  // ----------------------------------------------------------------------

  export interface Event<T> extends NativeEvent {
    /**
    * The **`currentTarget`** read-only property of the Event interface identifies the element to which the event handler has been attached.
    *
    * [MDN Reference](https://developer.mozilla.org/docs/Web/API/Event/currentTarget)
    */
    currentTarget: EventTarget & T | null

    from: typeof matchEventTarget
  }


  export interface ClipboardEvent extends NativeClipboardEvent {
    clipboardData: DataTransfer;
  }


  export interface FocusEvent<T = Element, RelatedTarget = Element> extends NativeFocusEvent {
    relatedTarget: (EventTarget & RelatedTarget) | null;
    target: EventTarget & T;
  }


  export interface FormEvent<T = Element> {
    target: EventTarget & T;
  }


  export interface InvalidEvent<T = Element> {
    target: EventTarget & T;
  }


  export interface StateChangeEvent<T = Element> {
    target: EventTarget & T;
  }


  export interface KeyboardEvent<T> extends NativeKeyboardEvent {
    target: EventTarget & T;
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


  export interface MouseEvent extends NativeMouseEvent {

    /**
    * The **`MouseEvent.getModifierState()`** method returns the current state of the specified modifier key: `true` if the modifier is active (i.e., the modifier key is pressed or locked), otherwise, `false`.
    *
    * [MDN Reference](https://developer.mozilla.org/docs/Web/API/MouseEvent/getModifierState)
    * 
    * See [DOM Level 3 Events spec](https://www.w3.org/TR/uievents-key/#keys-modifier). for a list of valid (case-sensitive) arguments to this method.
    */
    getModifierState(key: ModifierKey): boolean
  }




  export type ModifierKey =
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
  type HandleFocusEvent<T = Element> = EventHandler<FocusEvent<T>, T>;
  type HandleFormEvent<T = Element> = EventHandler<FormEvent<T>, T>;
  type HandleChangeEvent<T = Element> = EventHandler<StateChangeEvent<T>, T>;
  type HandleKeyboardEvent<T = Element> = EventHandler<KeyboardEvent<T>, T>;
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

  export interface CSSProperties extends CSS.PropertiesHyphenFallback<string | number> {
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
    microclass?: ClassInput | IonOr<string | Falsey> | (IonOr<string | Falsey> | ClassInput)[];
    class?: ClassInput | IonOr<string | Falsey> | (IonOr<string | Falsey> | ClassInput)[];
    style?: StyleInput | StyleInput[];

    autofocus?: IonOr<Booleanish | undefined>; // Automatically focuses the element
    lang?: IonOr<string | undefined>; // Specifies the language of the element's content
    id?: IonOr<string | undefined>;
    tabindex?: IonOr<number | undefined>; // Defines the tab order of the element

    // WAI-ARIA
    role?: IonOr<AriaRole | undefined>;
  }

  interface GlobalURLAttributes {

  }


  interface HTMLAttributes<T> extends AriaAttributes, GlobalAttributes, DOMAttributes<T> {
    // Standard HTML Attributes
    contenteditable?: IonOr<Booleanish | "inherit" | "plaintext-only" | undefined>;
    contextmenu?: IonOr<string | undefined>;
    draggable?: IonOr<Booleanish | undefined>;
    is?: IonOr<string | undefined>;
    slot?: IonOr<string | undefined>;
    spellcheck?: IonOr<Booleanish | undefined>;
    translate?: IonOr<"yes" | "no" | undefined>;
    nonce?: IonOr<string | undefined>; // A cryptographic nonce for inline scripts
    part?: IonOr<string | undefined>; // Specifies parts of the element for styling
    title?: IonOr<string | undefined>; // Additional information displayed as a tooltip
    inert?: IonOr<Booleanish | undefined>; // Prevents user interaction with the element
    itemid?: IonOr<string | undefined>; // Defines the item's ID in microdata
    itemprop?: IonOr<string | undefined>; // Specifies the item's property in microdata
    itemref?: IonOr<string | undefined>; // References additional microdata items
    itemscope?: IonOr<Booleanish | undefined>; // Declares the scope of an item
    itemtype?: IonOr<string | undefined>; // Specifies the type of an item in microdata

    accesskey?: IonOr<string | undefined>; // Defines a keyboard shortcut to activate/focus an element
    autocapitalize?: IonOr<"off" | "none" | "on" | "sentences" | "words" | "characters" | undefined>; // Controls capitalization behavior
    dir?: IonOr<"ltr" | "rtl" | "auto" | undefined>; // Specifies the text direction
    enterkeyhint?: IonOr<
      "enter"
      | "done"
      | "go"
      | "next"
      | "previous"
      | "search"
      | "send"
      | undefined>; // Hint for virtual keyboards
    elementtiming?: IonOr<string>;
    hidden?: IonOr<Booleanish | "until-found" | undefined>; // Hides the element

    // RDFa Attributes
    about?: IonOr<string | undefined>;
    content?: IonOr<string | undefined>;
    datatype?: IonOr<string | undefined>;
    inlist?: IonOr<unknown>;
    prefix?: IonOr<string | undefined>;
    property?: IonOr<string | undefined>;
    rel?: IonOr<string | undefined>;
    resource?: IonOr<string | undefined>;
    rev?: IonOr<string | undefined>;
    typeof?: IonOr<string | undefined>;
    vocab?: IonOr<string | undefined>;

    /**
     * Non-standard attribute
     */
    autocorrect?: IonOr<string | undefined>;
    /**
     * Non-standard attribute
     */
    autosave?: IonOr<string | undefined>;
    /**
     * Non-standard attribute
     */
    color?: IonOr<string | undefined>;
    /**
     * Non-standard attribute
     */
    results?: IonOr<number | undefined>;
    /**
     * Non-standard attribute
     */
    security?: IonOr<string | undefined>;
    /**
     * Non-standard attribute
     */
    unselectable?: IonOr<"on" | "off" | undefined>;
    /**
     * Non-standard attribute
     */
    anchor?: IonOr<string>;




    // Living Standard
    /**
     * Hints at the type of data that might be entered by the user while editing the element or its contents
     * @see {@link https://html.spec.whatwg.org/multipage/interaction.html#input-modalities:-the-inputmode-attribute}
     */
    inputmode?: IonOr<"none" | "text" | "tel" | "url" | "email" | "numeric" | "decimal" | "search" | undefined>;
    /**
     * Specify that a standard HTML element should behave like a defined custom built-in element
     * @see {@link https://html.spec.whatwg.org/multipage/custom-elements.html#attr-is}
     */

    exportparts?: IonOr<string>;
    popover?: IonOr<'auto' | 'hint' | 'manual' | true>;
    writingsuggestions?: IonOr<Booleanish>;

    /**
     * Experimental
     */
    virtualkeyboardpolicyExperimental?: IonOr<'auto' | 'manual'>;

    //  /**
    //   * DOM Property
    //   */
    //  scrollTop?: IonOr<number | undefined>;

    //  /**
    //   * DOM Property
    //   */
    //  scrollLeft?: IonOr<number | undefined>;
  }


  // /**
  //  * For internal usage only.
  //  * Different release channels declare additional types of JSXNode this particular release channel accepts.
  //  * App or library types should never augment this interface.
  //  */

  // interface AllHTMLAttributes<T> extends HTMLAttributes<T> {
  //    // Standard HTML Attributes
  //    accept?: IonOr<string | undefined>;
  //    acceptCharset?: IonOr<string | undefined>;
  //    action?: IonOr<string | undefined>;
  //    allowFullScreen?: IonOr<Booleanish | undefined>;
  //    allowTransparency?: IonOr<Booleanish | undefined>;
  //    alt?: IonOr<string | undefined>;
  //    as?: IonOr<string | undefined>;
  //    async?: IonOr<Booleanish | undefined>;
  //    autoComplete?: IonOr<string | undefined>;
  //    autoPlay?: IonOr<Booleanish | undefined>;
  //    capture?: IonOr<Booleanish | "user" | "environment" | undefined>;
  //    cellPadding?: IonOr<number | string | undefined>;
  //    cellSpacing?: IonOr<number | string | undefined>;
  //    charSet?: IonOr<string | undefined>;
  //    challenge?: IonOr<string | undefined>;
  //    checked?: IonOr<Booleanish | undefined>;
  //    cite?: IonOr<string | undefined>;
  //    classID?: IonOr<string | undefined>;
  //    cols?: IonOr<number | undefined>;
  //    colSpan?: IonOr<number | undefined>;
  //    controls?: IonOr<Booleanish | undefined>;
  //    coords?: IonOr<string | undefined>;
  //    crossorigin?: IonOr<CrossOrigin>;
  //    data?: IonOr<string | undefined>;
  //    dateTime?: IonOr<string | undefined>;
  //    default?: IonOr<Booleanish | undefined>;
  //    defer?: IonOr<Booleanish | undefined>;
  //    disabled?: IonOr<Booleanish | undefined>;
  //    download?: IonOr<unknown>;
  //    encType?: IonOr<string | undefined>;
  //    form?: IonOr<string | undefined>;
  //    formAction?: IonOr<string | undefined>;
  //    formEncType?: IonOr<string | undefined>;
  //    formMethod?: IonOr<string | undefined>;
  //    formNoValidate?: IonOr<Booleanish | undefined>;
  //    formTarget?: IonOr<string | undefined>;
  //    frameBorder?: IonOr<number | string | undefined>;
  //    headers?: IonOr<string | undefined>;
  //    height?: IonOr<number | string | undefined>;
  //    high?: IonOr<number | undefined>;
  //    href?: IonOr<string | undefined>;
  //    hrefLang?: IonOr<string | undefined>;
  //    htmlFor?: IonOr<string | undefined>;
  //    httpEquiv?: IonOr<string | undefined>;
  //    integrity?: IonOr<string | undefined>;
  //    keyParams?: IonOr<string | undefined>;
  //    keyType?: IonOr<string | undefined>;
  //    kind?: IonOr<string | undefined>;
  //    label?: IonOr<string | undefined>;
  //    list?: IonOr<string | undefined>;
  //    loop?: IonOr<Booleanish | undefined>;
  //    low?: IonOr<number | undefined>;
  //    manifest?: IonOr<string | undefined>;
  //    marginHeight?: IonOr<number | undefined>;
  //    marginWidth?: IonOr<number | undefined>;
  //    max?: IonOr<number | string | undefined>;
  //    maxLength?: IonOr<number | undefined>;
  //    media?: IonOr<string | undefined>;
  //    mediaGroup?: IonOr<string | undefined>;
  //    method?: IonOr<string | undefined>;
  //    min?: IonOr<number | string | undefined>;
  //    minLength?: IonOr<number | undefined>;
  //    multiple?: IonOr<Booleanish | undefined>;
  //    muted?: IonOr<Booleanish | undefined>;
  //    name?: IonOr<string | undefined>;
  //    noValidate?: IonOr<Booleanish | undefined>;
  //    open?: IonOr<Booleanish | undefined>;
  //    optimum?: IonOr<number | undefined>;
  //    pattern?: IonOr<string | undefined>;
  //    placeholder?: IonOr<string | undefined>;
  //    playsInline?: IonOr<Booleanish | undefined>;
  //    poster?: IonOr<string | undefined>;
  //    preload?: IonOr<string | undefined>;
  //    readOnly?: IonOr<Booleanish | undefined>;
  //    required?: IonOr<Booleanish | undefined>;
  //    reversed?: IonOr<Booleanish | undefined>;
  //    rows?: IonOr<number | undefined>;
  //    rowSpan?: IonOr<number | undefined>;
  //    sandbox?: IonOr<string | undefined>;
  //    scope?: IonOr<string | undefined>;
  //    scoped?: IonOr<Booleanish | undefined>;
  //    scrolling?: IonOr<string | undefined>;
  //    seamless?: IonOr<Booleanish | undefined>;
  //    selected?: IonOr<Booleanish | undefined>;
  //    shape?: IonOr<string | undefined>;
  //    size?: IonOr<number | undefined>;
  //    sizes?: IonOr<string | undefined>;
  //    span?: IonOr<number | undefined>;
  //    src?: IonOr<string | undefined>;
  //    srcDoc?: IonOr<string | undefined>;
  //    srcLang?: IonOr<string | undefined>;
  //    srcSet?: IonOr<string | undefined>;
  //    start?: IonOr<number | undefined>;
  //    step?: IonOr<number | string | undefined>;
  //    summary?: IonOr<string | undefined>;
  //    target?: IonOr<string | undefined>;
  //    type?: IonOr<string | undefined>;
  //    useMap?: IonOr<string | undefined>;
  //    value?: IonOr<string | readonly string[] | number | undefined>;
  //    width?: IonOr<number | string | undefined>;
  //    wmode?: IonOr<string | undefined>;
  //    wrap?: IonOr<string | undefined>;
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
    href?: IonOr<string | undefined>;
    target?: IonOr<string | undefined>;
  }

  interface AnchorHTMLAttributes<T> extends HTMLAttributes<T> {
    download?: IonOr<unknown>;
    href?: IonOr<string | undefined>;
    hreflang?: IonOr<string | undefined>;
    media?: IonOr<string | undefined>;
    ping?: IonOr<string | undefined>;
    target?: IonOr<HTMLAttributeAnchorTarget | undefined>;
    type?: IonOr<string | undefined>;
    referrerpolicy?: IonOr<HTMLAttributeReferrerPolicy | undefined>;
  }

  interface AudioHTMLAttributes<T> extends MediaHTMLAttributes<T> { }

  interface AreaHTMLAttributes<T> extends HTMLAttributes<T> {
    alt?: IonOr<string | undefined>;
    coords?: IonOr<string | undefined>;
    download?: IonOr<unknown>;
    href?: IonOr<string | undefined>;
    hreflang?: IonOr<string | undefined>;
    media?: IonOr<string | undefined>;
    referrerpolicy?: IonOr<HTMLAttributeReferrerPolicy | undefined>;
    shape?: IonOr<string | undefined>;
    target?: IonOr<string | undefined>;
    ping?: IonOr<string | undefined>;
    type?: IonOr<string | undefined>;
  }

  interface BlockquoteHTMLAttributes<T> extends HTMLAttributes<T> {
    cite?: IonOr<string | undefined>;
  }

  interface ButtonHTMLAttributes<T> extends HTMLAttributes<T> {
    disabled?: IonOr<Booleanish | undefined>;
    form?: IonOr<string | undefined>;
    formaction?: IonOr<string | undefined>;
    formenctype?: IonOr<string | undefined>;
    formmethod?: IonOr<string | undefined>;
    formnovalidate?: IonOr<Booleanish | undefined>;
    formtarget?: IonOr<string | undefined>;
    name?: IonOr<string | undefined>;
    popovertarget?: IonOr<string>;
    popovertargetaction?: IonOr<string>;
    type?: IonOr<"submit" | "reset" | "button" | undefined | string>;
    value?: IonOr<string | readonly string[] | number | undefined>;
  }

  interface CanvasHTMLAttributes<T> extends HTMLAttributes<T> {
    height?: IonOr<number | string | undefined>;
    width?: IonOr<number | string | undefined>;
  }

  interface ColHTMLAttributes<T> extends HTMLAttributes<T> {
    span?: IonOr<number | undefined>;
    width?: IonOr<number | string | undefined>;
  }

  interface ColgroupHTMLAttributes<T> extends HTMLAttributes<T> {
    span?: IonOr<number | undefined>;
  }

  interface DataHTMLAttributes<T> extends HTMLAttributes<T> {
    value?: IonOr<string | readonly string[] | number | undefined>;
  }

  interface DetailsHTMLAttributes<T> extends HTMLAttributes<T> {
    open?: IonOr<Booleanish | undefined>;
    name?: IonOr<string | undefined>;
  }

  interface DelHTMLAttributes<T> extends HTMLAttributes<T> {
    cite?: IonOr<string | undefined>;
    datetime?: IonOr<string | undefined>;
  }

  interface DialogHTMLAttributes<T> extends HTMLAttributes<T> {
    open?: IonOr<Booleanish | undefined>;
    closedby?: IonOr<'any' | 'closerequest' | 'none'>
    'on:cancel'?: HandleEvent<T> | undefined;
    'on:close'?: HandleEvent<T> | undefined;
  }

  interface EmbedHTMLAttributes<T> extends HTMLAttributes<T> {
    height?: IonOr<number | string | undefined>;
    src?: IonOr<string | undefined>;
    type?: IonOr<string | undefined>;
    width?: IonOr<number | string | undefined>;
  }

  interface FieldsetHTMLAttributes<T> extends HTMLAttributes<T> {
    disabled?: IonOr<Booleanish | undefined>;
    form?: IonOr<string | undefined>;
    name?: IonOr<string | undefined>;
  }

  interface FormHTMLAttributes<T> extends HTMLAttributes<T> {
    'accept-charset'?: IonOr<string | undefined>;
    /**
     * DOM Property
     */
    action?: IonOr<string | undefined>;
    autocomplete?: IonOr<string | undefined>;
    enctype?: IonOr<string | undefined>;
    method?: IonOr<string | undefined>;
    name?: IonOr<string | undefined>;
    novalidate?: IonOr<Booleanish | undefined>;
    target?: IonOr<string | undefined>;
  }

  interface HtmlHTMLAttributes<T> extends HTMLAttributes<T> {
    manifest?: IonOr<string | undefined>;
  }

  interface IframeHTMLAttributes<T> extends HTMLAttributes<T> {
    allow?: IonOr<string | undefined>;
    allowfullscreen?: IonOr<Booleanish | undefined>;
    height?: IonOr<number | string | undefined>;
    /**
     * DOM Property
     */
    loading?: IonOr<"eager" | "lazy" | undefined>;
    name?: IonOr<string | undefined>;
    referrerpolicy?: IonOr<HTMLAttributeReferrerPolicy | undefined>;
    sandbox?: IonOr<string | undefined>;
    seamless?: IonOr<Booleanish | undefined>;
    src?: IonOr<string | undefined>;
    srcdoc?: IonOr<string | undefined>;
    width?: IonOr<number | string | undefined>;
  }

  interface ImgHTMLAttributes<T> extends HTMLAttributes<T> {
    alt?: IonOr<string | undefined>;
    crossorigin?: IonOr<CrossOrigin>;
    ismap?: IonOr<Booleanish>
    decoding?: IonOr<"async" | "auto" | "sync" | undefined>;
    fetchpriority?: IonOr<"high" | "low" | "auto">;
    height?: IonOr<number | string | undefined>;
    loading?: IonOr<"eager" | "lazy" | undefined>;
    referrerpolicy?: IonOr<HTMLAttributeReferrerPolicy | undefined>;
    sizes?: IonOr<string | undefined>;
    src?: IonOr<string | undefined>;
    srcset?: IonOr<string | undefined>;
    usemap?: IonOr<string | undefined>;
    width?: IonOr<number | string | undefined>;
  }

  interface InsHTMLAttributes<T> extends HTMLAttributes<T> {
    cite?: IonOr<string | undefined>;
    datetime?: IonOr<string | undefined>;
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
    accept?: IonOr<string | undefined>;
    alt?: IonOr<string | undefined>;
    autocomplete?: IonOr<HTMLInputAutoCompleteAttribute | undefined>;
    capture?: IonOr<Booleanish | "user" | "environment" | undefined>; // https://www.w3.org/TR/html-media-capture/#the-capture-attribute
    checked?: IonOr<Booleanish | undefined>;
    dirname?: IonOr<string | undefined>;
    disabled?: IonOr<Booleanish | undefined>;
    form?: IonOr<string | undefined>;
    formaction?: IonOr<string | undefined>;
    formenctype?: IonOr<string | undefined>;
    formmethod?: IonOr<string | undefined>;
    formnovalidate?: IonOr<Booleanish | undefined>;
    formtarget?: IonOr<string | undefined>;
    height?: IonOr<number | string | undefined>;
    list?: IonOr<string | undefined>;
    max?: IonOr<number | string | undefined>;
    maxlength?: IonOr<number | undefined>;
    min?: IonOr<number | string | undefined>;
    minlength?: IonOr<number | undefined>;
    multiple?: IonOr<Booleanish | undefined>;
    name?: IonOr<string | undefined>;
    pattern?: IonOr<string | undefined>;
    placeholder?: IonOr<string | undefined>;
    popovertarget?: IonOr<string>;
    popovertargetaction?: IonOr<string>;
    readonly?: IonOr<Booleanish | undefined>;
    required?: IonOr<Booleanish | undefined>;
    size?: IonOr<number | undefined>;
    src?: IonOr<string | undefined>;
    step?: IonOr<number | string | undefined>;
    type?: IonOr<HTMLInputTypeAttribute | undefined>;
    value?: IonOr<string | readonly string[] | number | undefined>;
    width?: IonOr<number | string | undefined>;

    'mu:value'?: Quarky.MutableIon<unknown>
    'mu:checked'?: Quarky.MutableIon<Booleanny>
  }


  /**
   * DEPRECATED
   */
  interface KeygenHTMLAttributes<T> extends HTMLAttributes<T> {
    challenge?: IonOr<string | undefined>;
    disabled?: IonOr<Booleanish | undefined>;
    form?: IonOr<string | undefined>;
    keytype?: IonOr<string | undefined>;
    keyparams?: IonOr<string | undefined>;
    name?: IonOr<string | undefined>;
  }

  interface LabelHTMLAttributes<T> extends HTMLAttributes<T> {
    form?: IonOr<string | undefined>;
    for?: IonOr<string | undefined>;
  }

  interface LiHTMLAttributes<T> extends HTMLAttributes<T> {
    value?: IonOr<string | readonly string[] | number | undefined>;
  }

  interface LinkHTMLAttributes<T> extends HTMLAttributes<T> {
    as?: IonOr<string | undefined>;
    blocking?: IonOr<string | undefined>;
    crossorigin?: IonOr<CrossOrigin>;
    fetchpriority?: IonOr<"high" | "low" | "auto">;
    href?: IonOr<string | undefined>;
    hreflang?: IonOr<string | undefined>;
    integrity?: IonOr<string | undefined>;
    media?: IonOr<string | undefined>;
    imagesrcset?: IonOr<string | undefined>;
    imagesizes?: IonOr<string | undefined>;
    referrerpolicy?: IonOr<HTMLAttributeReferrerPolicy | undefined>;
    sizes?: IonOr<string | undefined>;
    type?: IonOr<string | undefined>;
    charset?: IonOr<string | undefined>;
  }

  interface MapHTMLAttributes<T> extends HTMLAttributes<T> {
    name?: IonOr<string | undefined>;
  }

  interface MenuHTMLAttributes<T> extends HTMLAttributes<T> {
    type?: IonOr<string | undefined>;
  }


  interface MediaHTMLAttributes<T> extends HTMLAttributes<T> {
    autoplay?: IonOr<Booleanish | undefined>;
    controls?: IonOr<Booleanish | undefined>;
    crossorigin?: IonOr<CrossOrigin>;
    loop?: IonOr<Booleanish | undefined>;
    mediagroup?: IonOr<string | undefined>;
    muted?: IonOr<Booleanish | undefined>;
    preload?: IonOr<string | undefined>;
    src?: IonOr<string | undefined>;
  }

  interface MetaHTMLAttributes<T> extends HTMLAttributes<T> {
    charset?: IonOr<string | undefined>;
    content?: IonOr<string | undefined>;
    'http-equiv'?: IonOr<string | undefined>;
    media?: IonOr<string | undefined>;
    name?: IonOr<string | undefined>;
  }

  interface MeterHTMLAttributes<T> extends HTMLAttributes<T> {
    form?: IonOr<string | undefined>;
    high?: IonOr<number | undefined>;
    low?: IonOr<number | undefined>;
    max?: IonOr<number | string | undefined>;
    min?: IonOr<number | string | undefined>;
    optimum?: IonOr<number | undefined>;
    value?: IonOr<string | readonly string[] | number | undefined>;
  }

  interface QuoteHTMLAttributes<T> extends HTMLAttributes<T> {
    cite?: IonOr<string | undefined>;
  }

  interface ObjectHTMLAttributes<T> extends HTMLAttributes<T> {
    data?: IonOr<string | undefined>;
    form?: IonOr<string | undefined>;
    height?: IonOr<number | string | undefined>;
    name?: IonOr<string | undefined>;
    type?: IonOr<string | undefined>;
    usemap?: IonOr<string | undefined>;
    width?: IonOr<number | string | undefined>;
  }

  interface OlHTMLAttributes<T> extends HTMLAttributes<T> {
    reversed?: IonOr<Booleanish | undefined>;
    start?: IonOr<number | undefined>;
    type?: IonOr<"1" | "a" | "A" | "i" | "I" | undefined>;
  }

  interface OptgroupHTMLAttributes<T> extends HTMLAttributes<T> {
    disabled?: IonOr<Booleanish | undefined>;
    label?: IonOr<string | undefined>;
  }

  interface OptionHTMLAttributes<T> extends HTMLAttributes<T> {
    disabled?: IonOr<Booleanish | undefined>;
    label?: IonOr<string | undefined>;
    selected?: IonOr<Booleanish | undefined>;
    value?: IonOr<string | readonly string[] | number | undefined>;
  }

  interface OutputHTMLAttributes<T> extends HTMLAttributes<T> {
    form?: IonOr<string | undefined>;
    for?: IonOr<string | undefined>;
    name?: IonOr<string | undefined>;
  }

  interface ParamHTMLAttributes<T> extends HTMLAttributes<T> {
    name?: IonOr<string | undefined>;
    value?: IonOr<string | readonly string[] | number | undefined>;
  }

  interface ProgressHTMLAttributes<T> extends HTMLAttributes<T> {
    max?: IonOr<number | string | undefined>;
    value?: IonOr<string | readonly string[] | number | undefined>;
  }

  interface SlotHTMLAttributes<T> extends HTMLAttributes<T> {
    name?: IonOr<string | undefined>;
  }

  interface ScriptHTMLAttributes<T> extends HTMLAttributes<T> {
    async?: IonOr<Booleanish | undefined>;
    crossorigin?: IonOr<CrossOrigin>;
    defer?: IonOr<Booleanish | undefined>;
    integrity?: IonOr<string | undefined>;
    nomodule?: IonOr<Booleanish | undefined>;
    referrerpolicy?: IonOr<HTMLAttributeReferrerPolicy | undefined>;
    src?: IonOr<string | undefined>;
    type?: IonOr<string | undefined>;
  }

  interface SelectHTMLAttributes<T> extends HTMLAttributes<T> {
    autocomplete?: IonOr<string | undefined>;
    disabled?: IonOr<Booleanish | undefined>;
    form?: IonOr<string | undefined>;
    multiple?: IonOr<Booleanish | undefined>;
    name?: IonOr<string | undefined>;
    required?: IonOr<Booleanish | undefined>;
    size?: IonOr<number | undefined>;
    value?: IonOr<string | readonly string[] | number | undefined>;
    'on:change'?: HandleChangeEvent<T> | undefined;
    'mu:value'?: Quarky.MutableIon<string> | undefined
  }

  interface SourceHTMLAttributes<T> extends HTMLAttributes<T> {
    height?: IonOr<number | string | undefined>;
    media?: IonOr<string | undefined>;
    sizes?: IonOr<string | undefined>;
    src?: IonOr<string | undefined>;
    srcset?: IonOr<string | undefined>;
    type?: IonOr<string | undefined>;
    width?: IonOr<number | string | undefined>;
  }

  interface StyleHTMLAttributes<T> extends HTMLAttributes<T> {
    media?: IonOr<string | undefined>;
    scoped?: IonOr<Booleanish | undefined>;
    type?: IonOr<string | undefined>;
  }

  interface TableHTMLAttributes<T> extends HTMLAttributes<T> {
    // ALL DEPRECATED
    // align?: IonOr<"left" | "center" | "right" | undefined>;
    // bgcolor?: IonOr<string | undefined>;
    // border?: IonOr<number | undefined>;
    // cellPadding?: IonOr<number | string | undefined>;
    // cellSpacing?: IonOr<number | string | undefined>;
    // frame?: IonOr<Booleanish | undefined>;
    // rules?: IonOr<"none" | "groups" | "rows" | "columns" | "all" | undefined>;
    // summary?: IonOr<string | undefined>;
    // width?: IonOr<number | string | undefined>;
  }

  interface TextareaHTMLAttributes<T> extends HTMLAttributes<T> {
    autocomplete?: IonOr<string | undefined>;
    cols?: IonOr<number | undefined>;
    dirname?: IonOr<string | undefined>;
    disabled?: IonOr<Booleanish | undefined>;
    form?: IonOr<string | undefined>;
    maxlength?: IonOr<number | undefined>;
    minlength?: IonOr<number | undefined>;
    name?: IonOr<string | undefined>;
    placeholder?: IonOr<string | undefined>;
    readonly?: IonOr<Booleanish | undefined>;
    required?: IonOr<Booleanish | undefined>;
    rows?: IonOr<number | undefined>;
    value?: IonOr<string | readonly string[] | number | undefined>;
    wrap?: IonOr<string | undefined>;

    'mu:value'?: Quarky.MutableIon<string>
    'on:change'?: HandleChangeEvent<T> | undefined;
  }

  interface TdHTMLAttributes<T> extends HTMLAttributes<T> {
    align?: IonOr<"left" | "center" | "right" | "justify" | "char" | undefined>;
    colSpan?: IonOr<number | undefined>;
    headers?: IonOr<string | undefined>;
    rowSpan?: IonOr<number | undefined>;
    scope?: IonOr<string | undefined>;
    abbr?: IonOr<string | undefined>;
    height?: IonOr<number | string | undefined>;
    width?: IonOr<number | string | undefined>;
    valign?: IonOr<"top" | "middle" | "bottom" | "baseline" | undefined>;
  }

  interface ThHTMLAttributes<T> extends HTMLAttributes<T> {
    colspan?: IonOr<number | undefined>;
    headers?: IonOr<string | undefined>;
    rowspan?: IonOr<number | undefined>;
    scope?: IonOr<string | undefined>;
    abbr?: IonOr<string | undefined>;
  }

  interface TimeHTMLAttributes<T> extends HTMLAttributes<T> {
    datetime?: IonOr<string | undefined>;
  }

  interface TrackHTMLAttributes<T> extends HTMLAttributes<T> {
    default?: IonOr<Booleanish | undefined>;
    kind?: IonOr<string | undefined>;
    label?: IonOr<string | undefined>;
    src?: IonOr<string | undefined>;
    srclang?: IonOr<string | undefined>;
  }

  interface VideoHTMLAttributes<T> extends MediaHTMLAttributes<T> {
    height?: IonOr<number | string | undefined>;
    controlslist?: IonOr<string | undefined>;
    playsinline?: IonOr<Booleanish | undefined>;
    poster?: IonOr<string | undefined>;
    width?: IonOr<number | string | undefined>;
    disablepictureinpicture?: IonOr<Booleanish | undefined>;
    disableremoteplayback?: IonOr<Booleanish | undefined>;
  }


  interface SVGAttributes<T> extends AriaAttributes, GlobalAttributes, DOMAttributes<T> {
    // Attributes which also defined in HTMLAttributes
    href?: IonOr<string | undefined>;
    hreflang?: IonOr<string | undefined>;
    media?: IonOr<string | undefined>;
    ping?: IonOr<string | undefined>;
    target?: IonOr<HTMLAttributeAnchorTarget | string | undefined>;
    type?: IonOr<string | undefined>;
    referrerpolicy?: IonOr<HTMLAttributeReferrerPolicy | undefined>;

    height?: IonOr<number | string | undefined>;
    width?: IonOr<number | string | undefined>;

    crossorigin?: IonOr<CrossOrigin>;
    fetchpriority?: IonOr<"high" | "low" | "auto">;

    // SVG Specific attributes
    accumulate?: IonOr<"none" | "sum" | undefined>;
    additive?: IonOr<"replace" | "sum" | undefined>;
    'alignment-baseline'?: IonOr<
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
    allowReorder?: IonOr<"no" | "yes" | undefined>;
    alphabetic?: IonOr<number | string | undefined>;
    amplitude?: IonOr<number | string | undefined>;
    'arabic-form'?: IonOr<"initial" | "medial" | "terminal" | "isolated" | undefined>;
    attributeName?: IonOr<string | undefined>;
    attributeType?: IonOr<string | undefined>;
    autoReverse?: IonOr<Booleanish | undefined>;
    azimuth?: IonOr<number | string | undefined>;
    baseFrequency?: IonOr<number | string | undefined>;
    'baseline-shift'?: IonOr<number | string | undefined>;
    begin?: IonOr<number | string | undefined>;
    bias?: IonOr<number | string | undefined>;
    by?: IonOr<number | string | undefined>;
    calcMode?: IonOr<number | string | undefined>;
    clipPathUnits?: IonOr<number | string | undefined>;
    'clip-path'?: IonOr<string | undefined>;
    'clip-rule'?: IonOr<number | string | undefined>;
    color?: IonOr<string | undefined>;
    'color-interpolation'?: IonOr<number | string | undefined>;
    'color-interpolation-filters'?: IonOr<"auto" | "sRGB" | "linearRGB" | "inherit" | undefined>;
    'color-rendering'?: IonOr<number | string | undefined>;
    cursor?: IonOr<number | string | undefined>;
    cx?: IonOr<number | string | undefined>;
    cy?: IonOr<number | string | undefined>;
    d?: IonOr<string | undefined>;
    decelerate?: IonOr<number | string | undefined>;
    diffuseConstant?: IonOr<number | string | undefined>;
    direction?: IonOr<number | string | undefined>;
    display?: IonOr<number | string | undefined>;
    divisor?: IonOr<number | string | undefined>;
    'dominant-baseline'?: IonOr<number | string | undefined>;
    dur?: IonOr<number | string | undefined>;
    dx?: IonOr<number | string | undefined>;
    dy?: IonOr<number | string | undefined>;
    edgeMode?: IonOr<number | string | undefined>;
    elevation?: IonOr<number | string | undefined>;
    end?: IonOr<number | string | undefined>;
    exponent?: IonOr<number | string | undefined>;
    fill?: IonOr<string | undefined>;
    'fill-opacity'?: IonOr<number | string | undefined>;
    'fill-rule'?: IonOr<"nonzero" | "evenodd" | "inherit" | undefined>;
    filter?: IonOr<string | undefined>;
    filterUnits?: IonOr<number | string | undefined>;
    'flood-color'?: IonOr<number | string | undefined>;
    'flood-opacity'?: IonOr<number | string | undefined>;
    focusable?: IonOr<Booleanish | "auto" | undefined>;
    'font-family'?: IonOr<string | undefined>;
    'font-size'?: IonOr<number | string | undefined>;
    'font-size-adjust'?: IonOr<number | string | undefined>;
    'font-style'?: IonOr<number | string | undefined>;
    'font-variant'?: IonOr<number | string | undefined>;
    'font-weight'?: IonOr<number | string | undefined>;
    fr?: IonOr<number | string | undefined>;
    from?: IonOr<number | string | undefined>;
    fx?: IonOr<number | string | undefined>;
    fy?: IonOr<number | string | undefined>;
    gradientTransform?: IonOr<string | undefined>;
    gradientUnits?: IonOr<string | undefined>;
    'image-rendering'?: IonOr<number | string | undefined>;
    in2?: IonOr<number | string | undefined>;
    in?: IonOr<string | undefined>;
    intercept?: IonOr<number | string | undefined>;
    k1?: IonOr<number | string | undefined>;
    k2?: IonOr<number | string | undefined>;
    k3?: IonOr<number | string | undefined>;
    k4?: IonOr<number | string | undefined>;
    kernelMatrix?: IonOr<number | string | undefined>;
    kernelUnitLength?: IonOr<number | string | undefined>;
    keyPoints?: IonOr<number | string | undefined>;
    keySplines?: IonOr<number | string | undefined>;
    keyTimes?: IonOr<number | string | undefined>;
    lengthAdjust?: IonOr<number | string | undefined>;
    'letter-spacing'?: IonOr<number | string | undefined>;
    'lighting-color'?: IonOr<number | string | undefined>;
    limitingConeAngle?: IonOr<number | string | undefined>;
    'marker-end'?: IonOr<string | undefined>;
    'marker-mid'?: IonOr<string | undefined>;
    'marker-start'?: IonOr<string | undefined>;
    markerHeight?: IonOr<number | string | undefined>;
    markerUnits?: IonOr<number | string | undefined>;
    markerWidth?: IonOr<number | string | undefined>;
    mask?: IonOr<string | undefined>;
    maskContentUnits?: IonOr<number | string | undefined>;
    maskUnits?: IonOr<number | string | undefined>;
    max?: IonOr<number | string | undefined>;
    min?: IonOr<number | string | undefined>;

    /**
     * The method attribute indicates the method by which text should be rendered along the path of a <textPath> element.
     * 
     * default: 'align'
     * 
     * source: https://developer.mozilla.org/en-US/docs/Web/SVG/Reference/Attribute/method
     */
    method?: IonOr<'align' | 'stretch'>;
    mode?: IonOr<number | string | undefined>;
    name?: IonOr<string | undefined>;
    numOctaves?: IonOr<number | string | undefined>;
    offset?: IonOr<number | string | undefined>;
    opacity?: IonOr<number | string | undefined>;
    operator?: IonOr<number | string | undefined>;
    order?: IonOr<number | string | undefined>;
    orient?: IonOr<number | string | undefined>;
    origin?: IonOr<number | string | undefined>;
    overflow?: IonOr<number | string | undefined>;
    'overline-position'?: IonOr<number | string | undefined>;
    'overline-thickness'?: IonOr<number | string | undefined>;
    'paint-order'?: IonOr<number | string | undefined>;
    path?: IonOr<string | undefined>;
    pathLength?: IonOr<number | string | undefined>;
    patternContentUnits?: IonOr<string | undefined>;
    patternTransform?: IonOr<number | string | undefined>;
    patternUnits?: IonOr<string | undefined>;
    'pointer-events'?: IonOr<number | string | undefined>;
    points?: IonOr<string | undefined>;
    pointsAtX?: IonOr<number | string | undefined>;
    pointsAtY?: IonOr<number | string | undefined>;
    pointsAtZ?: IonOr<number | string | undefined>;
    preserveAlpha?: IonOr<Booleanish | undefined>;
    preserveAspectRatio?: IonOr<string | undefined>;
    primitiveUnits?: IonOr<number | string | undefined>;
    r?: IonOr<number | string | undefined>;
    radius?: IonOr<number | string | undefined>;
    refX?: IonOr<number | string | undefined>;
    refY?: IonOr<number | string | undefined>;
    renderingIntent?: IonOr<number | string | undefined>;
    repeatCount?: IonOr<number | string | undefined>;
    repeatDur?: IonOr<number | string | undefined>;
    requiredExtensions?: IonOr<number | string | undefined>;
    restart?: IonOr<number | string | undefined>;
    result?: IonOr<string | undefined>;
    rotate?: IonOr<number | string | undefined>;
    rx?: IonOr<number | string | undefined>;
    ry?: IonOr<number | string | undefined>;
    scale?: IonOr<number | string | undefined>;
    seed?: IonOr<number | string | undefined>;
    'shape-rendering'?: IonOr<number | string | undefined>;
    /**
     * EXPERIMENTAL
     * 
     * default: 'left'
     * 
     * https://developer.mozilla.org/en-US/docs/Web/SVG/Reference/Attribute/side
     */
    side?: IonOr<'left' | 'right'>;
    slope?: IonOr<number | string | undefined>;
    spacing?: IonOr<number | string | undefined>;
    specularConstant?: IonOr<number | string | undefined>;
    specularExponent?: IonOr<number | string | undefined>;
    spreadMethod?: IonOr<string | undefined>;
    startOffset?: IonOr<number | string | undefined>;
    stdDeviation?: IonOr<number | string | undefined>;
    stitchTiles?: IonOr<number | string | undefined>;
    'stop-color'?: IonOr<string | undefined>;
    'stop-opacity'?: IonOr<number | string | undefined>;
    'strikethrough-Position'?: IonOr<number | string | undefined>;
    'strikethrough-Thickness'?: IonOr<number | string | undefined>;
    stroke?: IonOr<string | undefined>;
    'stroke-dasharray'?: IonOr<string | number | undefined>;
    'stroke-dashoffset'?: IonOr<string | number | undefined>;
    'stroke-linecap'?: IonOr<"butt" | "round" | "square" | "inherit" | undefined>;
    'stroke-linejoin'?: IonOr<"miter" | "round" | "bevel" | "inherit" | undefined>;
    'stroke-miterlimit'?: IonOr<number | string | undefined>;
    'stroke-opacity'?: IonOr<number | string | undefined>;
    'stroke-width'?: IonOr<number | string | undefined>;
    surfaceScale?: IonOr<number | string | undefined>;
    systemLanguage?: IonOr<number | string | undefined>;
    tableValues?: IonOr<number | string | undefined>;
    targetX?: IonOr<number | string | undefined>;
    targetY?: IonOr<number | string | undefined>;
    'text-anchor'?: IonOr<string | undefined>;
    'text-decoration'?: IonOr<number | string | undefined>;
    /**
     * *default*: 'clip'
     */
    'text-overflow'?: IonOr<'clip' | 'ellipses'>;
    'text-rendering'?: IonOr<number | string | undefined>;
    textLength?: IonOr<number | string | undefined>;
    to?: IonOr<number | string | undefined>;
    transform?: IonOr<string | undefined>;
    'transform-origin'?: IonOr<string | undefined>;
    'underline-position'?: IonOr<number | string | undefined>;
    'underline-thickness'?: IonOr<number | string | undefined>;
    'unicode-bidi'?: IonOr<number | string | undefined>;
    values?: IonOr<string | undefined>;
    'vector-effect'?: IonOr<number | string | undefined>;
    viewBox?: IonOr<string | undefined>;
    visibility?: IonOr<number | string | undefined>;
    'white-space'?: IonOr<'normal' | 'pre' | 'nowrap' | 'pre-wrap' | 'break-space' | 'pre-line'>;
    'word-spacing'?: IonOr<number | string | undefined>;
    'writing-mode'?: IonOr<number | string | undefined>;
    x1?: IonOr<number | string | undefined>;
    x2?: IonOr<number | string | undefined>;
    x?: IonOr<number | string | undefined>;
    xChannelSelector?: IonOr<string | undefined>;
    'xlink:actuate'?: IonOr<string | undefined>;
    'xlink:role'?: IonOr<string | undefined>;
    xmlns?: IonOr<string | undefined>;
    'xmlns:xlink'?: IonOr<string | undefined>;
    y1?: IonOr<number | string | undefined>;
    y2?: IonOr<number | string | undefined>;
    y?: IonOr<number | string | undefined>;
    yChannelSelector?: IonOr<string | undefined>;
    z?: IonOr<number | string | undefined>;
    zoomAndPan?: IonOr<string | undefined>;
  }

  interface WebViewHTMLAttributes<T> extends HTMLAttributes<T> {
    allowfullscreen?: IonOr<Booleanish | undefined>;
    allowpopups?: IonOr<Booleanish | undefined>;
    autosize?: IonOr<Booleanish | undefined>;
    blinkfeatures?: IonOr<string | undefined>;
    enableblinkfeatures?: IonOr<string | undefined>;
    disableblinkfeatures?: IonOr<string | undefined>;
    disableguestresize?: IonOr<Booleanish | undefined>;
    disablewebsecurity?: IonOr<Booleanish | undefined>;
    guestinstance?: IonOr<string | undefined>;
    httpreferrer?: IonOr<string | undefined>;
    nodeintegration?: IonOr<Booleanish | undefined>;
    nodeintegrationinsubframes?: IonOr<Booleanish | undefined>;
    partition?: IonOr<string | undefined>;
    plugins?: IonOr<Booleanish | undefined>;
    preload?: IonOr<string | undefined>;
    src?: IonOr<string | undefined>;
    useragent?: IonOr<string | undefined>;
    webpreferences?: IonOr<string | undefined>;
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

  interface LuentAttributes<T> extends RefAttributes<T>, LuentHooks<T> {
    'on:event'?: { [key: string]: Function };
    'auto-bind'?: SetupBindings
  }


  export type LibraryManagedAttributes<T, P> =
    T extends (...args: infer Params) => any ?
    Params extends never[] ? {}
    : Params extends [infer B] ?
    B extends { '~bindings'?: infer A } ?
    GlobalAttributes & A & LuentAttributes<ComponentRef<T>> & Events<ComponentRef<T>>
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

    'o-style': StyleHTMLAttributes<HTMLStyleElement> & LuentAttributes<HTMLStyleElement> & { 'portal-to'?: 'body' | 'head', 'scope'?: RenderTag }
    'o-link': LinkHTMLAttributes<HTMLLinkElement> & LuentAttributes<HTMLLinkElement> & { 'portal-to'?: 'body' | 'head' }
    'o--head': HTMLAttributes<HTMLHeadElement> & LuentAttributes<HTMLHeadElement>
    'o--body': HTMLAttributes<HTMLBodyElement> & LuentAttributes<HTMLBodyElement>
    'o--window': HTMLAttributes<Window> & LuentAttributes<Window>
    'o--host': HTMLAttributes<Window> & LuentAttributes<Window>
    'o:preserve': { children: any[] | any; discard?: Quarky.Ion<Booleanish> }
    'o:context': { children: any[] | any; map: Provided }
    'o:transition': { children: any[] | any; } & TransitionBindings

    'o--dock': HTMLAttributes<HTMLDivElement> & TransitionConfigs & LuentAttributes<HTMLDivElement>
  }

  interface HTMLElements {
    // HTML
    a: AnchorHTMLAttributes<HTMLAnchorElement> & LuentAttributes<HTMLAnchorElement>;
    abbr: HTMLAttributes<HTMLElement> & LuentAttributes<HTMLElement>;
    address: HTMLAttributes<HTMLElement> & LuentAttributes<HTMLElement>;
    area: AreaHTMLAttributes<HTMLAreaElement> & LuentAttributes<HTMLAreaElement>;
    article: HTMLAttributes<HTMLElement> & LuentAttributes<HTMLElement>;
    aside: HTMLAttributes<HTMLElement> & LuentAttributes<HTMLElement>;
    audio: AudioHTMLAttributes<HTMLAudioElement> & LuentAttributes<HTMLAudioElement>;
    b: HTMLAttributes<HTMLElement> & LuentAttributes<HTMLElement>;
    base: BaseHTMLAttributes<HTMLBaseElement> & LuentAttributes<HTMLBaseElement>;
    bdi: HTMLAttributes<HTMLElement> & LuentAttributes<HTMLElement>;
    bdo: HTMLAttributes<HTMLElement> & LuentAttributes<HTMLElement>;
    big: HTMLAttributes<HTMLElement> & LuentAttributes<HTMLElement>;
    blockquote: BlockquoteHTMLAttributes<HTMLQuoteElement> & LuentAttributes<HTMLQuoteElement>;
    body: HTMLAttributes<HTMLBodyElement> & LuentAttributes<HTMLBodyElement>;
    br: HTMLAttributes<HTMLBRElement> & LuentAttributes<HTMLBRElement>;
    button: ButtonHTMLAttributes<HTMLButtonElement> & LuentAttributes<HTMLButtonElement>;
    canvas: CanvasHTMLAttributes<HTMLCanvasElement> & LuentAttributes<HTMLCanvasElement>;
    caption: HTMLAttributes<HTMLElement> & LuentAttributes<HTMLElement>;
    center: HTMLAttributes<HTMLElement> & LuentAttributes<HTMLElement>;
    cite: HTMLAttributes<HTMLElement> & LuentAttributes<HTMLElement>;
    code: HTMLAttributes<HTMLElement> & LuentAttributes<HTMLElement>;
    col: ColHTMLAttributes<HTMLTableColElement> & LuentAttributes<HTMLTableColElement>;
    colgroup: ColgroupHTMLAttributes<HTMLTableColElement> & LuentAttributes<HTMLTableColElement>;
    data: DataHTMLAttributes<HTMLDataElement> & LuentAttributes<HTMLDataElement>;
    datalist: HTMLAttributes<HTMLDataListElement> & LuentAttributes<HTMLDataListElement>;
    dd: HTMLAttributes<HTMLElement> & LuentAttributes<HTMLElement>;
    del: DelHTMLAttributes<HTMLModElement> & LuentAttributes<HTMLModElement>;
    details: DetailsHTMLAttributes<HTMLDetailsElement> & LuentAttributes<HTMLDetailsElement>;
    dfn: HTMLAttributes<HTMLElement> & LuentAttributes<HTMLElement>;
    dialog: DialogHTMLAttributes<HTMLDialogElement> & LuentAttributes<HTMLDialogElement>;
    div: HTMLAttributes<HTMLDivElement> & LuentAttributes<HTMLDivElement>;
    dl: HTMLAttributes<HTMLDListElement> & LuentAttributes<HTMLDListElement>;
    dt: HTMLAttributes<HTMLElement> & LuentAttributes<HTMLElement>;
    em: HTMLAttributes<HTMLElement> & LuentAttributes<HTMLElement>;
    embed: EmbedHTMLAttributes<HTMLEmbedElement> & LuentAttributes<HTMLEmbedElement>;
    fieldset: FieldsetHTMLAttributes<HTMLFieldSetElement> & LuentAttributes<HTMLFieldSetElement>;
    figcaption: HTMLAttributes<HTMLElement> & LuentAttributes<HTMLElement>;
    figure: HTMLAttributes<HTMLElement> & LuentAttributes<HTMLElement>;
    footer: HTMLAttributes<HTMLElement> & LuentAttributes<HTMLElement>;
    form: FormHTMLAttributes<HTMLFormElement> & LuentAttributes<HTMLFormElement>;
    h1: HTMLAttributes<HTMLHeadingElement> & LuentAttributes<HTMLHeadingElement>;
    h2: HTMLAttributes<HTMLHeadingElement> & LuentAttributes<HTMLHeadingElement>;
    h3: HTMLAttributes<HTMLHeadingElement> & LuentAttributes<HTMLHeadingElement>;
    h4: HTMLAttributes<HTMLHeadingElement> & LuentAttributes<HTMLHeadingElement>;
    h5: HTMLAttributes<HTMLHeadingElement> & LuentAttributes<HTMLHeadingElement>;
    h6: HTMLAttributes<HTMLHeadingElement> & LuentAttributes<HTMLHeadingElement>;
    head: HTMLAttributes<HTMLHeadElement> & LuentAttributes<HTMLHeadElement>;
    header: HTMLAttributes<HTMLElement> & LuentAttributes<HTMLElement>;
    hgroup: HTMLAttributes<HTMLElement> & LuentAttributes<HTMLElement>;
    hr: HTMLAttributes<HTMLHRElement> & LuentAttributes<HTMLHRElement>;
    html: HtmlHTMLAttributes<HTMLHtmlElement> & LuentAttributes<HTMLHtmlElement>;
    i: HTMLAttributes<HTMLElement> & LuentAttributes<HTMLElement>;
    iframe: IframeHTMLAttributes<HTMLIFrameElement> & LuentAttributes<HTMLIFrameElement>;
    img: ImgHTMLAttributes<HTMLImageElement> & LuentAttributes<HTMLImageElement>;
    input: InputHTMLAttributes<HTMLInputElement> & LuentAttributes<HTMLInputElement>;
    ins: InsHTMLAttributes<HTMLModElement> & LuentAttributes<HTMLModElement>;
    kbd: HTMLAttributes<HTMLElement> & LuentAttributes<HTMLElement>;
    keygen: KeygenHTMLAttributes<HTMLElement> & LuentAttributes<HTMLElement>;
    label: LabelHTMLAttributes<HTMLLabelElement> & LuentAttributes<HTMLLabelElement>;
    legend: HTMLAttributes<HTMLLegendElement> & LuentAttributes<HTMLLegendElement>;
    li: LiHTMLAttributes<HTMLLIElement> & LuentAttributes<HTMLLIElement>;
    link: LinkHTMLAttributes<HTMLLinkElement> & LuentAttributes<HTMLLinkElement>;
    main: HTMLAttributes<HTMLElement> & LuentAttributes<HTMLElement>;
    map: MapHTMLAttributes<HTMLMapElement> & LuentAttributes<HTMLMapElement>;
    mark: HTMLAttributes<HTMLElement> & LuentAttributes<HTMLElement>;
    menu: MenuHTMLAttributes<HTMLElement> & LuentAttributes<HTMLElement>;
    menuitem: HTMLAttributes<HTMLElement> & LuentAttributes<HTMLElement>;
    meta: MetaHTMLAttributes<HTMLMetaElement> & LuentAttributes<HTMLMetaElement>;
    meter: MeterHTMLAttributes<HTMLMeterElement> & LuentAttributes<HTMLMeterElement>;
    nav: HTMLAttributes<HTMLElement> & LuentAttributes<HTMLElement>;
    noindex: HTMLAttributes<HTMLElement> & LuentAttributes<HTMLElement>;
    noscript: HTMLAttributes<HTMLElement> & LuentAttributes<HTMLElement>;
    object: ObjectHTMLAttributes<HTMLObjectElement> & LuentAttributes<HTMLObjectElement>;
    ol: OlHTMLAttributes<HTMLOListElement> & LuentAttributes<HTMLOListElement>;
    optgroup: OptgroupHTMLAttributes<HTMLOptGroupElement> & LuentAttributes<HTMLOptGroupElement>;
    option: OptionHTMLAttributes<HTMLOptionElement> & LuentAttributes<HTMLOptionElement>;
    output: OutputHTMLAttributes<HTMLOutputElement> & LuentAttributes<HTMLOutputElement>;
    p: HTMLAttributes<HTMLParagraphElement> & LuentAttributes<HTMLParagraphElement>;
    param: ParamHTMLAttributes<HTMLParamElement> & LuentAttributes<HTMLParamElement>;
    picture: HTMLAttributes<HTMLElement> & LuentAttributes<HTMLElement>;
    pre: HTMLAttributes<HTMLPreElement> & LuentAttributes<HTMLPreElement>;
    progress: ProgressHTMLAttributes<HTMLProgressElement> & LuentAttributes<HTMLProgressElement>;
    q: QuoteHTMLAttributes<HTMLQuoteElement> & LuentAttributes<HTMLQuoteElement>;
    rp: HTMLAttributes<HTMLElement> & LuentAttributes<HTMLElement>;
    rt: HTMLAttributes<HTMLElement> & LuentAttributes<HTMLElement>;
    ruby: HTMLAttributes<HTMLElement> & LuentAttributes<HTMLElement>;
    s: HTMLAttributes<HTMLElement> & LuentAttributes<HTMLElement>;
    samp: HTMLAttributes<HTMLElement> & LuentAttributes<HTMLElement>;
    search: HTMLAttributes<HTMLElement> & LuentAttributes<HTMLElement>;
    slot: SlotHTMLAttributes<HTMLSlotElement> & LuentAttributes<HTMLSlotElement>;
    script: ScriptHTMLAttributes<HTMLScriptElement> & LuentAttributes<HTMLScriptElement>;
    section: HTMLAttributes<HTMLElement> & LuentAttributes<HTMLElement>;
    select: SelectHTMLAttributes<HTMLSelectElement> & LuentAttributes<HTMLSelectElement>;
    small: HTMLAttributes<HTMLElement> & LuentAttributes<HTMLElement>;
    source: SourceHTMLAttributes<HTMLSourceElement> & LuentAttributes<HTMLSourceElement>;
    span: HTMLAttributes<HTMLSpanElement> & LuentAttributes<HTMLSpanElement>;
    strong: HTMLAttributes<HTMLElement> & LuentAttributes<HTMLElement>;
    style: StyleHTMLAttributes<HTMLStyleElement> & LuentAttributes<HTMLStyleElement>;
    sub: HTMLAttributes<HTMLElement> & LuentAttributes<HTMLElement>;
    summary: HTMLAttributes<HTMLElement> & LuentAttributes<HTMLElement>;
    sup: HTMLAttributes<HTMLElement> & LuentAttributes<HTMLElement>;
    table: TableHTMLAttributes<HTMLTableElement> & LuentAttributes<HTMLTableElement>;
    template: HTMLAttributes<HTMLTemplateElement> & LuentAttributes<HTMLTemplateElement>;
    tbody: HTMLAttributes<HTMLTableSectionElement> & LuentAttributes<HTMLTableSectionElement>;
    td: TdHTMLAttributes<HTMLTableCellElement> & LuentAttributes<HTMLTableCellElement>;
    textarea: TextareaHTMLAttributes<HTMLTextAreaElement> & LuentAttributes<HTMLTextAreaElement>;
    tfoot: HTMLAttributes<HTMLTableSectionElement> & LuentAttributes<HTMLTableSectionElement>;
    th: ThHTMLAttributes<HTMLTableCellElement> & LuentAttributes<HTMLTableCellElement>;
    thead: HTMLAttributes<HTMLTableSectionElement> & LuentAttributes<HTMLTableSectionElement>;
    time: TimeHTMLAttributes<HTMLTimeElement> & LuentAttributes<HTMLTimeElement>;
    title: HTMLAttributes<HTMLTitleElement> & LuentAttributes<HTMLTitleElement>;
    tr: HTMLAttributes<HTMLTableRowElement> & LuentAttributes<HTMLTableRowElement>;
    track: TrackHTMLAttributes<HTMLTrackElement> & LuentAttributes<HTMLTrackElement>;
    u: HTMLAttributes<HTMLElement> & LuentAttributes<HTMLElement>;
    ul: HTMLAttributes<HTMLUListElement> & LuentAttributes<HTMLUListElement>;
    "var": HTMLAttributes<HTMLElement> & LuentAttributes<HTMLElement>;
    video: VideoHTMLAttributes<HTMLVideoElement> & LuentAttributes<HTMLVideoElement>;
    wbr: HTMLAttributes<HTMLElement> & LuentAttributes<HTMLElement>;
    webview: WebViewHTMLAttributes<HTMLWebViewElement> & LuentAttributes<HTMLWebViewElement>;

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