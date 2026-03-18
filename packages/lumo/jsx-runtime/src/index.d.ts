/// <reference path="global.d.ts" />

import * as CSS from "csstype";
import * as Lumo from "@rue/lumo";
import * as Quarky from "@rue/quarky";
import { NodeRef } from "../../src/node/NodeRef";
import { NodeRefsConfig } from "../../src/node/NodeRefs";
import { COMPONENT_ATTRIBUTES, ContextKeyMap, _ContextInputType, Component, SuspenseNodeInput, TryNodeInput, TransitionNodeInput } from "@rue/lumo";
import { AnyObject, Booleanny } from "@rue/types";
import { PortalNodeInput } from "../../src/boundaries/Portal";

//$$$
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
type NativeUIEvent = UIEvent;
type NativeWheelEvent = WheelEvent;

//$$$
/**
 * Used to represent DOM API's where users can either pass
 * true or false as a boolean or as its equivalent strings.
 */
type Booleanish = boolean | "true" | "false";

/**
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/HTML/Attributes/crossorigin MDN}
 */
type CrossOrigin = "anonymous" | "use-credentials" | "" | undefined;



declare namespace Luent {
   //
   // Event System
   // ----------------------------------------------------------------------
   interface BaseSyntheticEvent<E = object, C = unknown, T = unknown> {
      nativeEvent: E;
      currentTarget: C;
      target: T;
      bubbles: boolean;
      cancelable: boolean;
      defaultPrevented: boolean;
      eventPhase: number;
      isTrusted: boolean;
      preventDefault(): void;
      isDefaultPrevented(): boolean;
      stopPropagation(): void;
      isPropagationStopped(): boolean;
      persist(): void;
      timeStamp: number;
      type: string;
      targets(...args: (string | NodeRef)[]): boolean // Lumo edit
   }

   /**
    * currentTarget - a reference to the element on which the event listener is registered.
    *
    * target - a reference to the element from which the event was originally dispatched.
    * This might be a child element to the element on which the event listener is registered.
    * If you thought this should be `EventTarget & T`, see https://github.com/DefinitelyTyped/DefinitelyTyped/issues/11508#issuecomment-256045682
    */
   interface SyntheticEvent<T = Element, E = Event> extends BaseSyntheticEvent<E, EventTarget & T, EventTarget> { }

   interface ClipboardEvent<T = Element> extends SyntheticEvent<T, NativeClipboardEvent> {
      clipboardData: DataTransfer;
   }

   interface CompositionEvent<T = Element> extends SyntheticEvent<T, NativeCompositionEvent> {
      data: string;
   }

   interface DragEvent<T = Element> extends MouseEvent<T, NativeDragEvent> {
      dataTransfer: DataTransfer;
   }

   interface PointerEvent<T = Element> extends MouseEvent<T, NativePointerEvent> {
      pointerId: number;
      pressure: number;
      tangentialPressure: number;
      tiltX: number;
      tiltY: number;
      twist: number;
      width: number;
      height: number;
      pointerType: "mouse" | "pen" | "touch";
      isPrimary: boolean;
   }

   interface FocusEvent<Target = Element, RelatedTarget = Element> extends SyntheticEvent<Target, NativeFocusEvent> {
      relatedTarget: (EventTarget & RelatedTarget) | null;
      target: EventTarget & Target;
   }

   interface FormEvent<T = Element> extends SyntheticEvent<T> {
      target: EventTarget & T;
   }

   interface InvalidEvent<T = Element> extends SyntheticEvent<T> {
      target: EventTarget & T;
   }

   interface StateChangeEvent<T = Element> extends SyntheticEvent<T> {
      target: EventTarget & T;
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

   interface KeyboardEvent<T = Element> extends UIEvent<T, NativeKeyboardEvent> {
      altKey: boolean;
      /** @deprecated */
      charCode: number;
      ctrlKey: boolean;
      code: string;
      /**
       * See [DOM Level 3 Events spec](https://www.w3.org/TR/uievents-key/#keys-modifier). for a list of valid (case-sensitive) arguments to this method.
       */
      getModifierState(key: ModifierKey): boolean;
      /**
       * See the [DOM Level 3 Events spec](https://www.w3.org/TR/uievents-key/#named-key-attribute-values). for possible values
       */
      key: string;
      /** @deprecated */
      keyCode: number;
      locale: string;
      location: number;
      metaKey: boolean;
      repeat: boolean;
      shiftKey: boolean;
      /** @deprecated */
      which: number;
   }

   interface MouseEvent<T = Element, E = NativeMouseEvent> extends UIEvent<T, E> {
      altKey: boolean;
      button: number;
      buttons: number;
      clientX: number;
      clientY: number;
      ctrlKey: boolean;
      /**
       * See [DOM Level 3 Events spec](https://www.w3.org/TR/uievents-key/#keys-modifier). for a list of valid (case-sensitive) arguments to this method.
       */
      getModifierState(key: ModifierKey): boolean;
      metaKey: boolean;
      movementX: number;
      movementY: number;
      pageX: number;
      pageY: number;
      relatedTarget: EventTarget | null;
      screenX: number;
      screenY: number;
      shiftKey: boolean;
   }

   interface TouchEvent<T = Element> extends UIEvent<T, NativeTouchEvent> {
      altKey: boolean;
      changedTouches: TouchList;
      ctrlKey: boolean;
      /**
       * See [DOM Level 3 Events spec](https://www.w3.org/TR/uievents-key/#keys-modifier). for a list of valid (case-sensitive) arguments to this method.
       */
      getModifierState(key: ModifierKey): boolean;
      metaKey: boolean;
      shiftKey: boolean;
      targetTouches: TouchList;
      touches: TouchList;
   }

   interface UIEvent<T = Element, E = NativeUIEvent> extends SyntheticEvent<T, E> {
      detail: number;
      view: AbstractView;
   }

   interface WheelEvent<T = Element> extends MouseEvent<T, NativeWheelEvent> {
      deltaMode: number;
      deltaX: number;
      deltaY: number;
      deltaZ: number;
   }

   interface AnimationEvent<T = Element> extends SyntheticEvent<T, NativeAnimationEvent> {
      animationName: string;
      elapsedTime: number;
      pseudoElement: string;
   }

   interface TransitionEvent<T = Element> extends SyntheticEvent<T, NativeTransitionEvent> {
      elapsedTime: number;
      propertyName: string;
      pseudoElement: string;
   }

   //
   // $$$ Event Handler Types
   // ----------------------------------------------------------------------

   type EventHandler<E extends SyntheticEvent<unknown>> = { bivarianceHack(event: E): void }["bivarianceHack"];

   type ReactEventHandler<T = Element> = EventHandler<SyntheticEvent<T>>;

   type ClipboardEventHandler<T = Element> = EventHandler<ClipboardEvent<T>>;
   type CompositionEventHandler<T = Element> = EventHandler<CompositionEvent<T>>;
   type DragEventHandler<T = Element> = EventHandler<DragEvent<T>>;
   type FocusEventHandler<T = Element> = EventHandler<FocusEvent<T>>;
   type FormEventHandler<T = Element> = EventHandler<FormEvent<T>>;
   type ChangeEventHandler<T = Element> = EventHandler<StateChangeEvent<T>>;
   type KeyboardEventHandler<T = Element> = EventHandler<KeyboardEvent<T>>;
   type MouseEventHandler<T = Element> = EventHandler<MouseEvent<T>>;
   type TouchEventHandler<T = Element> = EventHandler<TouchEvent<T>>;
   type PointerEventHandler<T = Element> = EventHandler<PointerEvent<T>>;
   type UIEventHandler<T = Element> = EventHandler<UIEvent<T>>;
   type WheelEventHandler<T = Element> = EventHandler<WheelEvent<T>>;
   type AnimationEventHandler<T = Element> = EventHandler<AnimationEvent<T>>;
   type TransitionEventHandler<T = Element> = EventHandler<TransitionEvent<T>>;




   //$$$
   interface DOMEvents<T> {// Clipboard Events
      'on:copy'?: ClipboardEventHandler<T>;
      'on:cut'?: ClipboardEventHandler<T>;
      'on:paste'?: ClipboardEventHandler<T>;

      // Composition Events
      'on:compositionend'?: CompositionEventHandler<T>;
      'on:compositionstart'?: CompositionEventHandler<T>;
      'on:compositionupdate'?: CompositionEventHandler<T>;

      // Focus Events
      'on:focus'?: FocusEventHandler<T>;
      'on:blur'?: FocusEventHandler<T>;

      // Form Events
      'on:change'?: FormEventHandler<T>;
      'on:beforeinput'?: FormEventHandler<T>;
      'on:input'?: FormEventHandler<T>;
      'on:reset'?: FormEventHandler<T>;
      'on:submit'?: FormEventHandler<T>;
      'on:invalid'?: FormEventHandler<T>;

      // Image Events
      'on:load'?: ReactEventHandler<T> | undefined;
      'on:error'?: ReactEventHandler<T> | undefined; // also a Media Event

      // Keyboard Events
      'on:keydown'?: KeyboardEventHandler<T>;
      'on:keyup'?: KeyboardEventHandler<T>;

      // Media Events
      'on:abort'?: ReactEventHandler<T> | undefined;
      'on:canplay'?: ReactEventHandler<T> | undefined;
      'on:canplaythrough'?: ReactEventHandler<T> | undefined;
      'on:durationchange'?: ReactEventHandler<T> | undefined;
      'on:emptied'?: ReactEventHandler<T> | undefined;
      'on:encrypted'?: ReactEventHandler<T> | undefined;
      'on:ended'?: ReactEventHandler<T> | undefined;
      'on:loadeddata'?: ReactEventHandler<T> | undefined;
      'on:loadedmetadata'?: ReactEventHandler<T> | undefined;
      'on:loadstart'?: ReactEventHandler<T> | undefined;
      'on:pause'?: ReactEventHandler<T> | undefined;
      'on:play'?: ReactEventHandler<T> | undefined;
      'on:playing'?: ReactEventHandler<T> | undefined;
      'on:progress'?: ReactEventHandler<T> | undefined;
      'on:ratechange'?: ReactEventHandler<T> | undefined;
      'on:resize'?: ReactEventHandler<T> | undefined;
      'on:seeked'?: ReactEventHandler<T> | undefined;
      'on:seeking'?: ReactEventHandler<T> | undefined;
      'on:stalled'?: ReactEventHandler<T> | undefined;
      'on:suspend'?: ReactEventHandler<T> | undefined;
      'on:timeupdate'?: ReactEventHandler<T> | undefined;
      'on:volumechange'?: ReactEventHandler<T> | undefined;
      'on:waiting'?: ReactEventHandler<T> | undefined;

      // MouseEvents
      'on:auxclick'?: MouseEventHandler<T>;
      'on:click'?: MouseEventHandler<T>;
      'on:contextmenu'?: MouseEventHandler<T>;
      'on:dblclick'?: MouseEventHandler<T>;
      'on:drag'?: DragEventHandler<T>;
      'on:dragend'?: DragEventHandler<T>;
      'on:dragenter'?: DragEventHandler<T>;
      'on:dragexit'?: DragEventHandler<T>;
      'on:dragleave'?: DragEventHandler<T>;
      'on:dragover'?: DragEventHandler<T>;
      'on:dragstart'?: DragEventHandler<T>;
      'on:drop'?: DragEventHandler<T>;
      'on:mousedown'?: MouseEventHandler<T>;
      'on:mouseenter'?: MouseEventHandler<T>;
      'on:mouseleave'?: MouseEventHandler<T>;
      'on:mousemove'?: MouseEventHandler<T>;
      'on:mouseout'?: MouseEventHandler<T>;
      'on:mouseover'?: MouseEventHandler<T>;
      'on:mouseup'?: MouseEventHandler<T>;

      // Selection Events
      'on:select'?: ReactEventHandler<T> | undefined;

      // Touch Events
      'on:touchcancel'?: TouchEventHandler<T>;
      'on:touchend'?: TouchEventHandler<T>;
      'on:touchmove'?: TouchEventHandler<T>;
      'on:touchstart'?: TouchEventHandler<T>;

      // Pointer Events
      'on:pointerdown'?: PointerEventHandler<T>;
      'on:pointermove'?: PointerEventHandler<T>;
      'on:pointerup'?: PointerEventHandler<T>;
      'on:pointercancel'?: PointerEventHandler<T>;
      'on:pointerenter'?: PointerEventHandler<T>;
      'on:pointerleave'?: PointerEventHandler<T>;
      'on:pointerover'?: PointerEventHandler<T>;
      'on:pointerout'?: PointerEventHandler<T>;
      'on:gotpointercapture'?: PointerEventHandler<T>;
      'on:lostpointercapture'?: PointerEventHandler<T>;

      // UI Events
      'on:scroll'?: UIEventHandler<T>;
      'on:scrollend'?: UIEventHandler<T>;

      // Wheel Events
      'on:wheel'?: WheelEventHandler<T>;

      // Animation Events
      'on:animationstart'?: AnimationEventHandler<T>;
      'on:animationend'?: AnimationEventHandler<T>;
      'on:animationiteration'?: AnimationEventHandler<T>;

      // Transition Events
      'on:transitionend'?: TransitionEventHandler<T>;



      // with capture
      'onV:copy'?: ClipboardEventHandler<T>;
      'onV:cut'?: ClipboardEventHandler<T>;
      'onV:paste'?: ClipboardEventHandler<T>;

      // Composition Events
      'onV:compositionend'?: CompositionEventHandler<T>;
      'onV:compositionstart'?: CompositionEventHandler<T>;
      'onV:compositionupdate'?: CompositionEventHandler<T>;

      // Focus Events
      'onV:focus'?: FocusEventHandler<T>;
      'onV:blur'?: FocusEventHandler<T>;

      // Form Events
      'onV:change'?: FormEventHandler<T>;
      'onV:beforeinput'?: FormEventHandler<T>;
      'onV:input'?: FormEventHandler<T>;
      'onV:reset'?: FormEventHandler<T>;
      'onV:submit'?: FormEventHandler<T>;
      'onV:invalid'?: FormEventHandler<T>;

      // Image Events
      'onV:load'?: ReactEventHandler<T> | undefined;
      'onV:error'?: ReactEventHandler<T> | undefined; // also a Media Event

      // Keyboard Events
      'onV:keydown'?: KeyboardEventHandler<T>;
      'onV:keyup'?: KeyboardEventHandler<T>;

      // Media Events
      'onV:abort'?: ReactEventHandler<T> | undefined;
      'onV:canplay'?: ReactEventHandler<T> | undefined;
      'onV:canplaythrough'?: ReactEventHandler<T> | undefined;
      'onV:durationchange'?: ReactEventHandler<T> | undefined;
      'onV:emptied'?: ReactEventHandler<T> | undefined;
      'onV:encrypted'?: ReactEventHandler<T> | undefined;
      'onV:ended'?: ReactEventHandler<T> | undefined;
      'onV:loadeddata'?: ReactEventHandler<T> | undefined;
      'onV:loadedmetadata'?: ReactEventHandler<T> | undefined;
      'onV:loadstart'?: ReactEventHandler<T> | undefined;
      'onV:pause'?: ReactEventHandler<T> | undefined;
      'onV:play'?: ReactEventHandler<T> | undefined;
      'onV:playing'?: ReactEventHandler<T> | undefined;
      'onV:progress'?: ReactEventHandler<T> | undefined;
      'onV:ratechange'?: ReactEventHandler<T> | undefined;
      'onV:resize'?: ReactEventHandler<T> | undefined;
      'onV:seeked'?: ReactEventHandler<T> | undefined;
      'onV:seeking'?: ReactEventHandler<T> | undefined;
      'onV:stalled'?: ReactEventHandler<T> | undefined;
      'onV:suspend'?: ReactEventHandler<T> | undefined;
      'onV:timeupdate'?: ReactEventHandler<T> | undefined;
      'onV:volumechange'?: ReactEventHandler<T> | undefined;
      'onV:waiting'?: ReactEventHandler<T> | undefined;

      // MouseEvents
      'onV:auxclick'?: MouseEventHandler<T>;
      'onV:click'?: MouseEventHandler<T>;
      'onV:contextmenu'?: MouseEventHandler<T>;
      'onV:doubleclick'?: MouseEventHandler<T>;
      'onV:drag'?: DragEventHandler<T>;
      'onV:dragend'?: DragEventHandler<T>;
      'onV:dragenter'?: DragEventHandler<T>;
      'onV:dragexit'?: DragEventHandler<T>;
      'onV:dragleave'?: DragEventHandler<T>;
      'onV:dragover'?: DragEventHandler<T>;
      'onV:dragstart'?: DragEventHandler<T>;
      'onV:drop'?: DragEventHandler<T>;
      'onV:mousedown'?: MouseEventHandler<T>;
      'onV:mouseenter'?: MouseEventHandler<T>;
      'onV:mouseleave'?: MouseEventHandler<T>;
      'onV:mousemove'?: MouseEventHandler<T>;
      'onV:mouseout'?: MouseEventHandler<T>;
      'onV:mouseover'?: MouseEventHandler<T>;
      'onV:mouseup'?: MouseEventHandler<T>;

      // Selection Events
      'onV:select'?: ReactEventHandler<T> | undefined;

      // Touch Events
      'onV:touchcancel'?: TouchEventHandler<T>;
      'onV:touchend'?: TouchEventHandler<T>;
      'onV:touchmove'?: TouchEventHandler<T>;
      'onV:touchstart'?: TouchEventHandler<T>;

      // Pointer Events
      'onV:pointerdown'?: PointerEventHandler<T>;
      'onV:pointermove'?: PointerEventHandler<T>;
      'onV:pointerup'?: PointerEventHandler<T>;
      'onV:pointercancel'?: PointerEventHandler<T>;
      'onV:pointerenter'?: PointerEventHandler<T>;
      'onV:pointerleave'?: PointerEventHandler<T>;
      'onV:pointerover'?: PointerEventHandler<T>;
      'onV:pointerout'?: PointerEventHandler<T>;
      'onV:gotpointercapture'?: PointerEventHandler<T>;
      'onV:lostpointercapture'?: PointerEventHandler<T>;

      // UI Events
      'onV:scroll'?: UIEventHandler<T>;

      // Wheel Events
      'onV:wheel'?: WheelEventHandler<T>;

      // Animation Events
      'onV:animationstart'?: AnimationEventHandler<T>;
      'onV:animationend'?: AnimationEventHandler<T>;
      'onV:animationiteration'?: AnimationEventHandler<T>;

      // Transition Events
      'onV:transitionend'?: TransitionEventHandler<T>;
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

   //$$$
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

   //$$$
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

   //$$$
   interface HTMLAttributes<T> extends AriaAttributes, DOMAttributes<T> {
      class?: ClassInput | Lumo.MaybeIon<string | Falsey> | (Lumo.MaybeIon<string | Falsey> | ClassInput)[];
      style?: StyleInput | StyleInput[];

      // React-specific Attributes
      defaultChecked?: Lumo.MaybeIon<boolean | undefined>;
      defaultValue?: Lumo.MaybeIon<string | number | readonly string[] | undefined>;
      // suppressContentEditableWarning?: Lumo.MaybeIon<boolean | undefined>;
      // suppressHydrationWarning?: Lumo.MaybeIon<boolean | undefined>;

      // Standard HTML Attributes
      contenteditable?: Lumo.MaybeIon<Booleanish | "inherit" | "plaintext-only" | undefined>;
      contextmenu?: Lumo.MaybeIon<string | undefined>;
      draggable?: Lumo.MaybeIon<Booleanish | undefined>;
      id?: Lumo.MaybeIon<string | undefined>;
      is?: Lumo.MaybeIon<string | undefined>;
      slot?: Lumo.MaybeIon<string | undefined>;
      spellcheck?: Lumo.MaybeIon<Booleanish | undefined>;
      translate?: Lumo.MaybeIon<"yes" | "no" | undefined>;
      lang?: Lumo.MaybeIon<string | undefined>; // Specifies the language of the element's content
      nonce?: Lumo.MaybeIon<string | undefined>; // A cryptographic nonce for inline scripts
      part?: Lumo.MaybeIon<string | undefined>; // Specifies parts of the element for styling
      tabindex?: Lumo.MaybeIon<number | undefined>; // Defines the tab order of the element
      title?: Lumo.MaybeIon<string | undefined>; // Additional information displayed as a tooltip
      inert?: Lumo.MaybeIon<boolean | undefined>; // Prevents user interaction with the element
      itemid?: Lumo.MaybeIon<string | undefined>; // Defines the item's ID in microdata
      itemprop?: Lumo.MaybeIon<string | undefined>; // Specifies the item's property in microdata
      itemref?: Lumo.MaybeIon<string | undefined>; // References additional microdata items
      itemscope?: Lumo.MaybeIon<boolean | undefined>; // Declares the scope of an item
      itemtype?: Lumo.MaybeIon<string | undefined>; // Specifies the type of an item in microdata

      accesskey?: Lumo.MaybeIon<string | undefined>; // Defines a keyboard shortcut to activate/focus an element
      autocapitalize?: Lumo.MaybeIon<"off" | "none" | "on" | "sentences" | "words" | "characters" | undefined>; // Controls capitalization behavior
      autofocus?: Lumo.MaybeIon<boolean | undefined>; // Automatically focuses the element
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
      hidden?: Lumo.MaybeIon<boolean | "until-found" | undefined>; // Hides the element

      // Unknown
      // radiogroup?: Lumo.MaybeIon<string | undefined>; // <command>, <menuitem>

      // WAI-ARIA
      role?: Lumo.MaybeIon<AriaRole | undefined>;

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

      // Non-standard Attributes
      autocorrect?: Lumo.MaybeIon<string | undefined>;
      autosave?: Lumo.MaybeIon<string | undefined>;
      color?: Lumo.MaybeIon<string | undefined>;
      results?: Lumo.MaybeIon<number | undefined>;
      security?: Lumo.MaybeIon<string | undefined>;
      unselectable?: Lumo.MaybeIon<"on" | "off" | undefined>;

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

      // added
      scrolltop?: Lumo.MaybeIon<number | undefined>;
      scrollleft?: Lumo.MaybeIon<number | undefined>;

      innerHTML?: Lumo.MaybeIon<string>;
   }

   /**
    * For internal usage only.
    * Different release channels declare additional types of JSXNode this particular release channel accepts.
    * App or library types should never augment this interface.
    */

   interface AllHTMLAttributes<T> extends HTMLAttributes<T> {
      // Standard HTML Attributes
      accept?: Lumo.MaybeIon<string | undefined>;
      acceptCharset?: Lumo.MaybeIon<string | undefined>;
      action?: Lumo.MaybeIon<string | undefined>;
      allowFullScreen?: Lumo.MaybeIon<boolean | undefined>;
      allowTransparency?: Lumo.MaybeIon<boolean | undefined>;
      alt?: Lumo.MaybeIon<string | undefined>;
      as?: Lumo.MaybeIon<string | undefined>;
      async?: Lumo.MaybeIon<boolean | undefined>;
      autoComplete?: Lumo.MaybeIon<string | undefined>;
      autoPlay?: Lumo.MaybeIon<boolean | undefined>;
      capture?: Lumo.MaybeIon<boolean | "user" | "environment" | undefined>;
      cellPadding?: Lumo.MaybeIon<number | string | undefined>;
      cellSpacing?: Lumo.MaybeIon<number | string | undefined>;
      charSet?: Lumo.MaybeIon<string | undefined>;
      challenge?: Lumo.MaybeIon<string | undefined>;
      checked?: Lumo.MaybeIon<boolean | undefined>;
      cite?: Lumo.MaybeIon<string | undefined>;
      classID?: Lumo.MaybeIon<string | undefined>;
      cols?: Lumo.MaybeIon<number | undefined>;
      colSpan?: Lumo.MaybeIon<number | undefined>;
      controls?: Lumo.MaybeIon<boolean | undefined>;
      coords?: Lumo.MaybeIon<string | undefined>;
      crossOrigin?: Lumo.MaybeIon<CrossOrigin>;
      data?: Lumo.MaybeIon<string | undefined>;
      dateTime?: Lumo.MaybeIon<string | undefined>;
      default?: Lumo.MaybeIon<boolean | undefined>;
      defer?: Lumo.MaybeIon<boolean | undefined>;
      disabled?: Lumo.MaybeIon<boolean | undefined>;
      download?: Lumo.MaybeIon<unknown>;
      encType?: Lumo.MaybeIon<string | undefined>;
      form?: Lumo.MaybeIon<string | undefined>;
      formAction?: Lumo.MaybeIon<string | undefined>;
      formEncType?: Lumo.MaybeIon<string | undefined>;
      formMethod?: Lumo.MaybeIon<string | undefined>;
      formNoValidate?: Lumo.MaybeIon<boolean | undefined>;
      formTarget?: Lumo.MaybeIon<string | undefined>;
      frameBorder?: Lumo.MaybeIon<number | string | undefined>;
      headers?: Lumo.MaybeIon<string | undefined>;
      height?: Lumo.MaybeIon<number | string | undefined>;
      high?: Lumo.MaybeIon<number | undefined>;
      href?: Lumo.MaybeIon<string | undefined>;
      hrefLang?: Lumo.MaybeIon<string | undefined>;
      htmlFor?: Lumo.MaybeIon<string | undefined>;
      httpEquiv?: Lumo.MaybeIon<string | undefined>;
      integrity?: Lumo.MaybeIon<string | undefined>;
      keyParams?: Lumo.MaybeIon<string | undefined>;
      keyType?: Lumo.MaybeIon<string | undefined>;
      kind?: Lumo.MaybeIon<string | undefined>;
      label?: Lumo.MaybeIon<string | undefined>;
      list?: Lumo.MaybeIon<string | undefined>;
      loop?: Lumo.MaybeIon<boolean | undefined>;
      low?: Lumo.MaybeIon<number | undefined>;
      manifest?: Lumo.MaybeIon<string | undefined>;
      marginHeight?: Lumo.MaybeIon<number | undefined>;
      marginWidth?: Lumo.MaybeIon<number | undefined>;
      max?: Lumo.MaybeIon<number | string | undefined>;
      maxLength?: Lumo.MaybeIon<number | undefined>;
      media?: Lumo.MaybeIon<string | undefined>;
      mediaGroup?: Lumo.MaybeIon<string | undefined>;
      method?: Lumo.MaybeIon<string | undefined>;
      min?: Lumo.MaybeIon<number | string | undefined>;
      minLength?: Lumo.MaybeIon<number | undefined>;
      multiple?: Lumo.MaybeIon<boolean | undefined>;
      muted?: Lumo.MaybeIon<boolean | undefined>;
      name?: Lumo.MaybeIon<string | undefined>;
      noValidate?: Lumo.MaybeIon<boolean | undefined>;
      open?: Lumo.MaybeIon<boolean | undefined>;
      optimum?: Lumo.MaybeIon<number | undefined>;
      pattern?: Lumo.MaybeIon<string | undefined>;
      placeholder?: Lumo.MaybeIon<string | undefined>;
      playsInline?: Lumo.MaybeIon<boolean | undefined>;
      poster?: Lumo.MaybeIon<string | undefined>;
      preload?: Lumo.MaybeIon<string | undefined>;
      readOnly?: Lumo.MaybeIon<boolean | undefined>;
      required?: Lumo.MaybeIon<boolean | undefined>;
      reversed?: Lumo.MaybeIon<boolean | undefined>;
      rows?: Lumo.MaybeIon<number | undefined>;
      rowSpan?: Lumo.MaybeIon<number | undefined>;
      sandbox?: Lumo.MaybeIon<string | undefined>;
      scope?: Lumo.MaybeIon<string | undefined>;
      scoped?: Lumo.MaybeIon<boolean | undefined>;
      scrolling?: Lumo.MaybeIon<string | undefined>;
      seamless?: Lumo.MaybeIon<boolean | undefined>;
      selected?: Lumo.MaybeIon<boolean | undefined>;
      shape?: Lumo.MaybeIon<string | undefined>;
      size?: Lumo.MaybeIon<number | undefined>;
      sizes?: Lumo.MaybeIon<string | undefined>;
      span?: Lumo.MaybeIon<number | undefined>;
      src?: Lumo.MaybeIon<string | undefined>;
      srcDoc?: Lumo.MaybeIon<string | undefined>;
      srcLang?: Lumo.MaybeIon<string | undefined>;
      srcSet?: Lumo.MaybeIon<string | undefined>;
      start?: Lumo.MaybeIon<number | undefined>;
      step?: Lumo.MaybeIon<number | string | undefined>;
      summary?: Lumo.MaybeIon<string | undefined>;
      target?: Lumo.MaybeIon<string | undefined>;
      type?: Lumo.MaybeIon<string | undefined>;
      useMap?: Lumo.MaybeIon<string | undefined>;
      value?: Lumo.MaybeIon<string | readonly string[] | number | undefined>;
      width?: Lumo.MaybeIon<number | string | undefined>;
      wmode?: Lumo.MaybeIon<string | undefined>;
      wrap?: Lumo.MaybeIon<string | undefined>;
   }

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

   interface AnchorHTMLAttributes<T> extends HTMLAttributes<T> {
      download?: Lumo.MaybeIon<unknown>;
      href?: Lumo.MaybeIon<string | undefined>;
      hrefLang?: Lumo.MaybeIon<string | undefined>;
      media?: Lumo.MaybeIon<string | undefined>;
      ping?: Lumo.MaybeIon<string | undefined>;
      target?: Lumo.MaybeIon<HTMLAttributeAnchorTarget | undefined>;
      type?: Lumo.MaybeIon<string | undefined>;
      referrerPolicy?: Lumo.MaybeIon<HTMLAttributeReferrerPolicy | undefined>;
   }

   interface AudioHTMLAttributes<T> extends MediaHTMLAttributes<T> { }

   interface AreaHTMLAttributes<T> extends HTMLAttributes<T> {
      alt?: Lumo.MaybeIon<string | undefined>;
      coords?: Lumo.MaybeIon<string | undefined>;
      download?: Lumo.MaybeIon<unknown>;
      href?: Lumo.MaybeIon<string | undefined>;
      hrefLang?: Lumo.MaybeIon<string | undefined>;
      media?: Lumo.MaybeIon<string | undefined>;
      referrerPolicy?: Lumo.MaybeIon<HTMLAttributeReferrerPolicy | undefined>;
      shape?: Lumo.MaybeIon<string | undefined>;
      target?: Lumo.MaybeIon<string | undefined>;
   }

   interface BaseHTMLAttributes<T> extends HTMLAttributes<T> {
      href?: Lumo.MaybeIon<string | undefined>;
      target?: Lumo.MaybeIon<string | undefined>;
   }

   interface BlockquoteHTMLAttributes<T> extends HTMLAttributes<T> {
      cite?: Lumo.MaybeIon<string | undefined>;
   }

   interface ButtonHTMLAttributes<T> extends HTMLAttributes<T> {
      disabled?: Lumo.MaybeIon<boolean | undefined>;
      form?: Lumo.MaybeIon<string | undefined>;
      formAction?: Lumo.MaybeIon<string | undefined>;
      formEncType?: Lumo.MaybeIon<string | undefined>;
      formMethod?: Lumo.MaybeIon<string | undefined>;
      formNoValidate?: Lumo.MaybeIon<boolean | undefined>;
      formTarget?: Lumo.MaybeIon<string | undefined>;
      name?: Lumo.MaybeIon<string | undefined>;
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
      open?: Lumo.MaybeIon<boolean | undefined>;
      onToggle?: ReactEventHandler<T> | undefined;
      name?: Lumo.MaybeIon<string | undefined>;
   }

   interface DelHTMLAttributes<T> extends HTMLAttributes<T> {
      cite?: Lumo.MaybeIon<string | undefined>;
      dateTime?: Lumo.MaybeIon<string | undefined>;
   }

   interface DialogHTMLAttributes<T> extends HTMLAttributes<T> {
      onCancel?: ReactEventHandler<T> | undefined;
      onClose?: ReactEventHandler<T> | undefined;
      open?: Lumo.MaybeIon<boolean | undefined>;
   }

   interface EmbedHTMLAttributes<T> extends HTMLAttributes<T> {
      height?: Lumo.MaybeIon<number | string | undefined>;
      src?: Lumo.MaybeIon<string | undefined>;
      type?: Lumo.MaybeIon<string | undefined>;
      width?: Lumo.MaybeIon<number | string | undefined>;
   }

   interface FieldsetHTMLAttributes<T> extends HTMLAttributes<T> {
      disabled?: Lumo.MaybeIon<boolean | undefined>;
      form?: Lumo.MaybeIon<string | undefined>;
      name?: Lumo.MaybeIon<string | undefined>;
   }

   interface FormHTMLAttributes<T> extends HTMLAttributes<T> {
      acceptCharset?: Lumo.MaybeIon<string | undefined>;
      action?: Lumo.MaybeIon<string | undefined>;
      autoComplete?: Lumo.MaybeIon<string | undefined>;
      encType?: Lumo.MaybeIon<string | undefined>;
      method?: Lumo.MaybeIon<string | undefined>;
      name?: Lumo.MaybeIon<string | undefined>;
      noValidate?: Lumo.MaybeIon<boolean | undefined>;
      target?: Lumo.MaybeIon<string | undefined>;
   }

   interface HtmlHTMLAttributes<T> extends HTMLAttributes<T> {
      manifest?: Lumo.MaybeIon<string | undefined>;
   }

   interface IframeHTMLAttributes<T> extends HTMLAttributes<T> {
      allow?: Lumo.MaybeIon<string | undefined>;
      allowFullScreen?: Lumo.MaybeIon<boolean | undefined>;
      allowTransparency?: Lumo.MaybeIon<boolean | undefined>;
      /** @deprecated */
      frameBorder?: Lumo.MaybeIon<number | string | undefined>;
      height?: Lumo.MaybeIon<number | string | undefined>;
      loading?: Lumo.MaybeIon<"eager" | "lazy" | undefined>;
      /** @deprecated */
      marginHeight?: Lumo.MaybeIon<number | undefined>;
      /** @deprecated */
      marginWidth?: Lumo.MaybeIon<number | undefined>;
      name?: Lumo.MaybeIon<string | undefined>;
      referrerPolicy?: Lumo.MaybeIon<HTMLAttributeReferrerPolicy | undefined>;
      sandbox?: Lumo.MaybeIon<string | undefined>;
      /** @deprecated */
      scrolling?: Lumo.MaybeIon<string | undefined>;
      seamless?: Lumo.MaybeIon<boolean | undefined>;
      src?: Lumo.MaybeIon<string | undefined>;
      srcDoc?: Lumo.MaybeIon<string | undefined>;
      width?: Lumo.MaybeIon<number | string | undefined>;
   }

   interface ImgHTMLAttributes<T> extends HTMLAttributes<T> {
      alt?: Lumo.MaybeIon<string | undefined>;
      crossOrigin?: Lumo.MaybeIon<CrossOrigin>;
      decoding?: Lumo.MaybeIon<"async" | "auto" | "sync" | undefined>;
      fetchPriority?: Lumo.MaybeIon<"high" | "low" | "auto">;
      height?: Lumo.MaybeIon<number | string | undefined>;
      loading?: Lumo.MaybeIon<"eager" | "lazy" | undefined>;
      referrerPolicy?: Lumo.MaybeIon<HTMLAttributeReferrerPolicy | undefined>;
      sizes?: Lumo.MaybeIon<string | undefined>;
      src?: Lumo.MaybeIon<string | undefined>;
      srcSet?: Lumo.MaybeIon<string | undefined>;
      useMap?: Lumo.MaybeIon<string | undefined>;
      width?: Lumo.MaybeIon<number | string | undefined>;
   }

   interface InsHTMLAttributes<T> extends HTMLAttributes<T> {
      cite?: Lumo.MaybeIon<string | undefined>;
      dateTime?: Lumo.MaybeIon<string | undefined>;
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
      autoComplete?: Lumo.MaybeIon<HTMLInputAutoCompleteAttribute | undefined>;
      capture?: Lumo.MaybeIon<boolean | "user" | "environment" | undefined>; // https://www.w3.org/TR/html-media-capture/#the-capture-attribute
      checked?: Lumo.MaybeIon<boolean | undefined>;
      disabled?: Lumo.MaybeIon<boolean | undefined>;
      enterKeyHint?: Lumo.MaybeIon<"enter" | "done" | "go" | "next" | "previous" | "search" | "send" | undefined>;
      form?: Lumo.MaybeIon<string | undefined>;
      formAction?: Lumo.MaybeIon<string | undefined>;
      formEncType?: Lumo.MaybeIon<string | undefined>;
      formMethod?: Lumo.MaybeIon<string | undefined>;
      formNoValidate?: Lumo.MaybeIon<boolean | undefined>;
      formTarget?: Lumo.MaybeIon<string | undefined>;
      height?: Lumo.MaybeIon<number | string | undefined>;
      list?: Lumo.MaybeIon<string | undefined>;
      max?: Lumo.MaybeIon<number | string | undefined>;
      maxLength?: Lumo.MaybeIon<number | undefined>;
      min?: Lumo.MaybeIon<number | string | undefined>;
      minLength?: Lumo.MaybeIon<number | undefined>;
      multiple?: Lumo.MaybeIon<boolean | undefined>;
      name?: Lumo.MaybeIon<string | undefined>;
      pattern?: Lumo.MaybeIon<string | undefined>;
      placeholder?: Lumo.MaybeIon<string | undefined>;
      readOnly?: Lumo.MaybeIon<boolean | undefined>;
      required?: Lumo.MaybeIon<boolean | undefined>;
      size?: Lumo.MaybeIon<number | undefined>;
      src?: Lumo.MaybeIon<string | undefined>;
      step?: Lumo.MaybeIon<number | string | undefined>;
      type?: Lumo.MaybeIon<HTMLInputTypeAttribute | undefined>;
      value?: Lumo.MaybeIon<string | readonly string[] | number | undefined>;
      width?: Lumo.MaybeIon<number | string | undefined>;

      'mu:value'?: Quarky.AtomicIon<unknown, { value: unknown; }> | Quarky.Ion<unknown, { set: (value: unknown) => unknown }>
      'mu:checked'?: Quarky.AtomicIon<Booleanny, { value: Booleanny; }> | Quarky.Ion<Booleanny, { set: (value: Booleanny) => unknown }>
   }


   interface KeygenHTMLAttributes<T> extends HTMLAttributes<T> {
      challenge?: Lumo.MaybeIon<string | undefined>;
      disabled?: Lumo.MaybeIon<boolean | undefined>;
      form?: Lumo.MaybeIon<string | undefined>;
      keyType?: Lumo.MaybeIon<string | undefined>;
      keyParams?: Lumo.MaybeIon<string | undefined>;
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
      crossOrigin?: Lumo.MaybeIon<CrossOrigin>;
      fetchPriority?: Lumo.MaybeIon<"high" | "low" | "auto">;
      href?: Lumo.MaybeIon<string | undefined>;
      hrefLang?: Lumo.MaybeIon<string | undefined>;
      integrity?: Lumo.MaybeIon<string | undefined>;
      media?: Lumo.MaybeIon<string | undefined>;
      imageSrcSet?: Lumo.MaybeIon<string | undefined>;
      imageSizes?: Lumo.MaybeIon<string | undefined>;
      referrerPolicy?: Lumo.MaybeIon<HTMLAttributeReferrerPolicy | undefined>;
      sizes?: Lumo.MaybeIon<string | undefined>;
      type?: Lumo.MaybeIon<string | undefined>;
      charSet?: Lumo.MaybeIon<string | undefined>;
   }

   interface MapHTMLAttributes<T> extends HTMLAttributes<T> {
      name?: Lumo.MaybeIon<string | undefined>;
   }

   interface MenuHTMLAttributes<T> extends HTMLAttributes<T> {
      type?: Lumo.MaybeIon<string | undefined>;
   }

   interface MediaHTMLAttributes<T> extends HTMLAttributes<T> {
      autoPlay?: Lumo.MaybeIon<boolean | undefined>;
      controls?: Lumo.MaybeIon<boolean | undefined>;
      controlsList?: Lumo.MaybeIon<string | undefined>;
      crossOrigin?: Lumo.MaybeIon<CrossOrigin>;
      loop?: Lumo.MaybeIon<boolean | undefined>;
      mediaGroup?: Lumo.MaybeIon<string | undefined>;
      muted?: Lumo.MaybeIon<boolean | undefined>;
      playsInline?: Lumo.MaybeIon<boolean | undefined>;
      preload?: Lumo.MaybeIon<string | undefined>;
      src?: Lumo.MaybeIon<string | undefined>;
   }

   interface MetaHTMLAttributes<T> extends HTMLAttributes<T> {
      charSet?: Lumo.MaybeIon<string | undefined>;
      content?: Lumo.MaybeIon<string | undefined>;
      httpEquiv?: Lumo.MaybeIon<string | undefined>;
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
      classID?: Lumo.MaybeIon<string | undefined>;
      data?: Lumo.MaybeIon<string | undefined>;
      form?: Lumo.MaybeIon<string | undefined>;
      height?: Lumo.MaybeIon<number | string | undefined>;
      name?: Lumo.MaybeIon<string | undefined>;
      type?: Lumo.MaybeIon<string | undefined>;
      useMap?: Lumo.MaybeIon<string | undefined>;
      width?: Lumo.MaybeIon<number | string | undefined>;
      wmode?: Lumo.MaybeIon<string | undefined>;
   }

   interface OlHTMLAttributes<T> extends HTMLAttributes<T> {
      reversed?: Lumo.MaybeIon<boolean | undefined>;
      start?: Lumo.MaybeIon<number | undefined>;
      type?: Lumo.MaybeIon<"1" | "a" | "A" | "i" | "I" | undefined>;
   }

   interface OptgroupHTMLAttributes<T> extends HTMLAttributes<T> {
      disabled?: Lumo.MaybeIon<boolean | undefined>;
      label?: Lumo.MaybeIon<string | undefined>;
   }

   interface OptionHTMLAttributes<T> extends HTMLAttributes<T> {
      disabled?: Lumo.MaybeIon<boolean | undefined>;
      label?: Lumo.MaybeIon<string | undefined>;
      selected?: Lumo.MaybeIon<boolean | undefined>;
      value?: Lumo.MaybeIon<string | readonly string[] | number | undefined>;
   }

   interface OutputHTMLAttributes<T> extends HTMLAttributes<T> {
      form?: Lumo.MaybeIon<string | undefined>;
      htmlFor?: Lumo.MaybeIon<string | undefined>;
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
      async?: Lumo.MaybeIon<boolean | undefined>;
      /** @deprecated */
      charSet?: Lumo.MaybeIon<string | undefined>;
      crossOrigin?: Lumo.MaybeIon<CrossOrigin>;
      defer?: Lumo.MaybeIon<boolean | undefined>;
      integrity?: Lumo.MaybeIon<string | undefined>;
      noModule?: Lumo.MaybeIon<boolean | undefined>;
      referrerPolicy?: Lumo.MaybeIon<HTMLAttributeReferrerPolicy | undefined>;
      src?: Lumo.MaybeIon<string | undefined>;
      type?: Lumo.MaybeIon<string | undefined>;
   }

   interface SelectHTMLAttributes<T> extends HTMLAttributes<T> {
      autoComplete?: Lumo.MaybeIon<string | undefined>;
      disabled?: Lumo.MaybeIon<boolean | undefined>;
      form?: Lumo.MaybeIon<string | undefined>;
      multiple?: Lumo.MaybeIon<boolean | undefined>;
      name?: Lumo.MaybeIon<string | undefined>;
      required?: Lumo.MaybeIon<boolean | undefined>;
      size?: Lumo.MaybeIon<number | undefined>;
      value?: Lumo.MaybeIon<string | readonly string[] | number | undefined>;
      'on:change'?: ChangeEventHandler<T> | undefined;
      'mu:value'?: Quarky.AtomicIon<string, { state: string; }> | Quarky.Ion<string, { set: (value: string) => unknown }>
   }

   interface SourceHTMLAttributes<T> extends HTMLAttributes<T> {
      height?: Lumo.MaybeIon<number | string | undefined>;
      media?: Lumo.MaybeIon<string | undefined>;
      sizes?: Lumo.MaybeIon<string | undefined>;
      src?: Lumo.MaybeIon<string | undefined>;
      srcSet?: Lumo.MaybeIon<string | undefined>;
      type?: Lumo.MaybeIon<string | undefined>;
      width?: Lumo.MaybeIon<number | string | undefined>;
   }

   interface StyleHTMLAttributes<T> extends HTMLAttributes<T> {
      media?: Lumo.MaybeIon<string | undefined>;
      scoped?: Lumo.MaybeIon<boolean | undefined>;
      type?: Lumo.MaybeIon<string | undefined>;
   }

   interface TableHTMLAttributes<T> extends HTMLAttributes<T> {
      align?: Lumo.MaybeIon<"left" | "center" | "right" | undefined>;
      bgcolor?: Lumo.MaybeIon<string | undefined>;
      border?: Lumo.MaybeIon<number | undefined>;
      cellPadding?: Lumo.MaybeIon<number | string | undefined>;
      cellSpacing?: Lumo.MaybeIon<number | string | undefined>;
      frame?: Lumo.MaybeIon<boolean | undefined>;
      rules?: Lumo.MaybeIon<"none" | "groups" | "rows" | "columns" | "all" | undefined>;
      summary?: Lumo.MaybeIon<string | undefined>;
      width?: Lumo.MaybeIon<number | string | undefined>;
   }

   interface TextareaHTMLAttributes<T> extends HTMLAttributes<T> {
      autoComplete?: Lumo.MaybeIon<string | undefined>;
      cols?: Lumo.MaybeIon<number | undefined>;
      dirName?: Lumo.MaybeIon<string | undefined>;
      disabled?: Lumo.MaybeIon<boolean | undefined>;
      form?: Lumo.MaybeIon<string | undefined>;
      maxLength?: Lumo.MaybeIon<number | undefined>;
      minLength?: Lumo.MaybeIon<number | undefined>;
      name?: Lumo.MaybeIon<string | undefined>;
      placeholder?: Lumo.MaybeIon<string | undefined>;
      readOnly?: Lumo.MaybeIon<boolean | undefined>;
      required?: Lumo.MaybeIon<boolean | undefined>;
      rows?: Lumo.MaybeIon<number | undefined>;
      value?: Lumo.MaybeIon<string | readonly string[] | number | undefined>;
      wrap?: Lumo.MaybeIon<string | undefined>;

      'mu:value'?: Quarky.AtomicIon<string, { state: string; }> | Quarky.Ion<string, { set: (value: string) => unknown }>
      'on:change'?: ChangeEventHandler<T> | undefined;
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
      align?: Lumo.MaybeIon<"left" | "center" | "right" | "justify" | "char" | undefined>;
      colSpan?: Lumo.MaybeIon<number | undefined>;
      headers?: Lumo.MaybeIon<string | undefined>;
      rowSpan?: Lumo.MaybeIon<number | undefined>;
      scope?: Lumo.MaybeIon<string | undefined>;
      abbr?: Lumo.MaybeIon<string | undefined>;
   }

   interface TimeHTMLAttributes<T> extends HTMLAttributes<T> {
      dateTime?: Lumo.MaybeIon<string | undefined>;
   }

   interface TrackHTMLAttributes<T> extends HTMLAttributes<T> {
      default?: Lumo.MaybeIon<boolean | undefined>;
      kind?: Lumo.MaybeIon<string | undefined>;
      label?: Lumo.MaybeIon<string | undefined>;
      src?: Lumo.MaybeIon<string | undefined>;
      srcLang?: Lumo.MaybeIon<string | undefined>;
   }

   interface VideoHTMLAttributes<T> extends MediaHTMLAttributes<T> {
      height?: Lumo.MaybeIon<number | string | undefined>;
      playsInline?: Lumo.MaybeIon<boolean | undefined>;
      poster?: Lumo.MaybeIon<string | undefined>;
      width?: Lumo.MaybeIon<number | string | undefined>;
      disablePictureInPicture?: Lumo.MaybeIon<boolean | undefined>;
      disableRemotePlayback?: Lumo.MaybeIon<boolean | undefined>;
   }

   // this list is "complete" in that it contains every SVG attribute
   // that React supports, but the types can be improved.
   // Full list here: https://facebook.github.io/react/docs/dom-elements.html
   //
   // The three broad type categories are (in order of restrictiveness):
   //   - "number | string"
   //   - "string"
   //   - union of string literals
   interface SVGAttributes<T> extends AriaAttributes, DOMAttributes<T> {
      // React-specific Attributes
      suppressHydrationWarning?: Lumo.MaybeIon<boolean | undefined>;

      // Attributes which also defined in HTMLAttributes
      // See comment in SVGDOMPropertyConfig.js
      className?: Lumo.MaybeIon<string | undefined>;
      color?: Lumo.MaybeIon<string | undefined>;
      height?: Lumo.MaybeIon<number | string | undefined>;
      id?: Lumo.MaybeIon<string | undefined>;
      lang?: Lumo.MaybeIon<string | undefined>;
      max?: Lumo.MaybeIon<number | string | undefined>;
      media?: Lumo.MaybeIon<string | undefined>;
      method?: Lumo.MaybeIon<string | undefined>;
      min?: Lumo.MaybeIon<number | string | undefined>;
      name?: Lumo.MaybeIon<string | undefined>;
      style?: Lumo.MaybeIon<CSSProperties | undefined>;
      target?: Lumo.MaybeIon<string | undefined>;
      type?: Lumo.MaybeIon<string | undefined>;
      width?: Lumo.MaybeIon<number | string | undefined>;

      // Other HTML properties supported by SVG elements in browsers
      role?: Lumo.MaybeIon<AriaRole | undefined>;
      tabIndex?: Lumo.MaybeIon<number | undefined>;
      crossOrigin?: Lumo.MaybeIon<CrossOrigin>;

      // SVG Specific attributes
      accentHeight?: Lumo.MaybeIon<number | string | undefined>;
      accumulate?: Lumo.MaybeIon<"none" | "sum" | undefined>;
      additive?: Lumo.MaybeIon<"replace" | "sum" | undefined>;
      alignmentBaseline?: Lumo.MaybeIon<
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
      arabicForm?: Lumo.MaybeIon<"initial" | "medial" | "terminal" | "isolated" | undefined>;
      ascent?: Lumo.MaybeIon<number | string | undefined>;
      attributeName?: Lumo.MaybeIon<string | undefined>;
      attributeType?: Lumo.MaybeIon<string | undefined>;
      autoReverse?: Lumo.MaybeIon<Booleanish | undefined>;
      azimuth?: Lumo.MaybeIon<number | string | undefined>;
      baseFrequency?: Lumo.MaybeIon<number | string | undefined>;
      baselineShift?: Lumo.MaybeIon<number | string | undefined>;
      baseProfile?: Lumo.MaybeIon<number | string | undefined>;
      bbox?: Lumo.MaybeIon<number | string | undefined>;
      begin?: Lumo.MaybeIon<number | string | undefined>;
      bias?: Lumo.MaybeIon<number | string | undefined>;
      by?: Lumo.MaybeIon<number | string | undefined>;
      calcMode?: Lumo.MaybeIon<number | string | undefined>;
      capHeight?: Lumo.MaybeIon<number | string | undefined>;
      clip?: Lumo.MaybeIon<number | string | undefined>;
      clipPath?: Lumo.MaybeIon<string | undefined>;
      clipPathUnits?: Lumo.MaybeIon<number | string | undefined>;
      clipRule?: Lumo.MaybeIon<number | string | undefined>;
      colorInterpolation?: Lumo.MaybeIon<number | string | undefined>;
      colorInterpolationFilters?: Lumo.MaybeIon<"auto" | "sRGB" | "linearRGB" | "inherit" | undefined>;
      colorProfile?: Lumo.MaybeIon<number | string | undefined>;
      colorRendering?: Lumo.MaybeIon<number | string | undefined>;
      contentScriptType?: Lumo.MaybeIon<number | string | undefined>;
      contentStyleType?: Lumo.MaybeIon<number | string | undefined>;
      cursor?: Lumo.MaybeIon<number | string | undefined>;
      cx?: Lumo.MaybeIon<number | string | undefined>;
      cy?: Lumo.MaybeIon<number | string | undefined>;
      d?: Lumo.MaybeIon<string | undefined>;
      decelerate?: Lumo.MaybeIon<number | string | undefined>;
      descent?: Lumo.MaybeIon<number | string | undefined>;
      diffuseConstant?: Lumo.MaybeIon<number | string | undefined>;
      direction?: Lumo.MaybeIon<number | string | undefined>;
      display?: Lumo.MaybeIon<number | string | undefined>;
      divisor?: Lumo.MaybeIon<number | string | undefined>;
      dominantBaseline?: Lumo.MaybeIon<number | string | undefined>;
      dur?: Lumo.MaybeIon<number | string | undefined>;
      dx?: Lumo.MaybeIon<number | string | undefined>;
      dy?: Lumo.MaybeIon<number | string | undefined>;
      edgeMode?: Lumo.MaybeIon<number | string | undefined>;
      elevation?: Lumo.MaybeIon<number | string | undefined>;
      enableBackground?: Lumo.MaybeIon<number | string | undefined>;
      end?: Lumo.MaybeIon<number | string | undefined>;
      exponent?: Lumo.MaybeIon<number | string | undefined>;
      externalResourcesRequired?: Lumo.MaybeIon<Booleanish | undefined>;
      fill?: Lumo.MaybeIon<string | undefined>;
      fillOpacity?: Lumo.MaybeIon<number | string | undefined>;
      fillRule?: Lumo.MaybeIon<"nonzero" | "evenodd" | "inherit" | undefined>;
      filter?: Lumo.MaybeIon<string | undefined>;
      filterRes?: Lumo.MaybeIon<number | string | undefined>;
      filterUnits?: Lumo.MaybeIon<number | string | undefined>;
      floodColor?: Lumo.MaybeIon<number | string | undefined>;
      floodOpacity?: Lumo.MaybeIon<number | string | undefined>;
      focusable?: Lumo.MaybeIon<Booleanish | "auto" | undefined>;
      fontFamily?: Lumo.MaybeIon<string | undefined>;
      fontSize?: Lumo.MaybeIon<number | string | undefined>;
      fontSizeAdjust?: Lumo.MaybeIon<number | string | undefined>;
      fontStretch?: Lumo.MaybeIon<number | string | undefined>;
      fontStyle?: Lumo.MaybeIon<number | string | undefined>;
      fontVariant?: Lumo.MaybeIon<number | string | undefined>;
      fontWeight?: Lumo.MaybeIon<number | string | undefined>;
      format?: Lumo.MaybeIon<number | string | undefined>;
      fr?: Lumo.MaybeIon<number | string | undefined>;
      from?: Lumo.MaybeIon<number | string | undefined>;
      fx?: Lumo.MaybeIon<number | string | undefined>;
      fy?: Lumo.MaybeIon<number | string | undefined>;
      g1?: Lumo.MaybeIon<number | string | undefined>;
      g2?: Lumo.MaybeIon<number | string | undefined>;
      glyphName?: Lumo.MaybeIon<number | string | undefined>;
      glyphOrientationHorizontal?: Lumo.MaybeIon<number | string | undefined>;
      glyphOrientationVertical?: Lumo.MaybeIon<number | string | undefined>;
      glyphRef?: Lumo.MaybeIon<number | string | undefined>;
      gradientTransform?: Lumo.MaybeIon<string | undefined>;
      gradientUnits?: Lumo.MaybeIon<string | undefined>;
      hanging?: Lumo.MaybeIon<number | string | undefined>;
      horizAdvX?: Lumo.MaybeIon<number | string | undefined>;
      horizOriginX?: Lumo.MaybeIon<number | string | undefined>;
      href?: Lumo.MaybeIon<string | undefined>;
      ideographic?: Lumo.MaybeIon<number | string | undefined>;
      imageRendering?: Lumo.MaybeIon<number | string | undefined>;
      in2?: Lumo.MaybeIon<number | string | undefined>;
      in?: Lumo.MaybeIon<string | undefined>;
      intercept?: Lumo.MaybeIon<number | string | undefined>;
      k1?: Lumo.MaybeIon<number | string | undefined>;
      k2?: Lumo.MaybeIon<number | string | undefined>;
      k3?: Lumo.MaybeIon<number | string | undefined>;
      k4?: Lumo.MaybeIon<number | string | undefined>;
      k?: Lumo.MaybeIon<number | string | undefined>;
      kernelMatrix?: Lumo.MaybeIon<number | string | undefined>;
      kernelUnitLength?: Lumo.MaybeIon<number | string | undefined>;
      kerning?: Lumo.MaybeIon<number | string | undefined>;
      keyPoints?: Lumo.MaybeIon<number | string | undefined>;
      keySplines?: Lumo.MaybeIon<number | string | undefined>;
      keyTimes?: Lumo.MaybeIon<number | string | undefined>;
      lengthAdjust?: Lumo.MaybeIon<number | string | undefined>;
      letterSpacing?: Lumo.MaybeIon<number | string | undefined>;
      lightingColor?: Lumo.MaybeIon<number | string | undefined>;
      limitingConeAngle?: Lumo.MaybeIon<number | string | undefined>;
      local?: Lumo.MaybeIon<number | string | undefined>;
      markerEnd?: Lumo.MaybeIon<string | undefined>;
      markerHeight?: Lumo.MaybeIon<number | string | undefined>;
      markerMid?: Lumo.MaybeIon<string | undefined>;
      markerStart?: Lumo.MaybeIon<string | undefined>;
      markerUnits?: Lumo.MaybeIon<number | string | undefined>;
      markerWidth?: Lumo.MaybeIon<number | string | undefined>;
      mask?: Lumo.MaybeIon<string | undefined>;
      maskContentUnits?: Lumo.MaybeIon<number | string | undefined>;
      maskUnits?: Lumo.MaybeIon<number | string | undefined>;
      mathematical?: Lumo.MaybeIon<number | string | undefined>;
      mode?: Lumo.MaybeIon<number | string | undefined>;
      numOctaves?: Lumo.MaybeIon<number | string | undefined>;
      offset?: Lumo.MaybeIon<number | string | undefined>;
      opacity?: Lumo.MaybeIon<number | string | undefined>;
      operator?: Lumo.MaybeIon<number | string | undefined>;
      order?: Lumo.MaybeIon<number | string | undefined>;
      orient?: Lumo.MaybeIon<number | string | undefined>;
      orientation?: Lumo.MaybeIon<number | string | undefined>;
      origin?: Lumo.MaybeIon<number | string | undefined>;
      overflow?: Lumo.MaybeIon<number | string | undefined>;
      overlinePosition?: Lumo.MaybeIon<number | string | undefined>;
      overlineThickness?: Lumo.MaybeIon<number | string | undefined>;
      paintOrder?: Lumo.MaybeIon<number | string | undefined>;
      panose1?: Lumo.MaybeIon<number | string | undefined>;
      path?: Lumo.MaybeIon<string | undefined>;
      pathLength?: Lumo.MaybeIon<number | string | undefined>;
      patternContentUnits?: Lumo.MaybeIon<string | undefined>;
      patternTransform?: Lumo.MaybeIon<number | string | undefined>;
      patternUnits?: Lumo.MaybeIon<string | undefined>;
      pointerEvents?: Lumo.MaybeIon<number | string | undefined>;
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
      requiredFeatures?: Lumo.MaybeIon<number | string | undefined>;
      restart?: Lumo.MaybeIon<number | string | undefined>;
      result?: Lumo.MaybeIon<string | undefined>;
      rotate?: Lumo.MaybeIon<number | string | undefined>;
      rx?: Lumo.MaybeIon<number | string | undefined>;
      ry?: Lumo.MaybeIon<number | string | undefined>;
      scale?: Lumo.MaybeIon<number | string | undefined>;
      seed?: Lumo.MaybeIon<number | string | undefined>;
      shapeRendering?: Lumo.MaybeIon<number | string | undefined>;
      slope?: Lumo.MaybeIon<number | string | undefined>;
      spacing?: Lumo.MaybeIon<number | string | undefined>;
      specularConstant?: Lumo.MaybeIon<number | string | undefined>;
      specularExponent?: Lumo.MaybeIon<number | string | undefined>;
      speed?: Lumo.MaybeIon<number | string | undefined>;
      spreadMethod?: Lumo.MaybeIon<string | undefined>;
      startOffset?: Lumo.MaybeIon<number | string | undefined>;
      stdDeviation?: Lumo.MaybeIon<number | string | undefined>;
      stemh?: Lumo.MaybeIon<number | string | undefined>;
      stemv?: Lumo.MaybeIon<number | string | undefined>;
      stitchTiles?: Lumo.MaybeIon<number | string | undefined>;
      stopColor?: Lumo.MaybeIon<string | undefined>;
      stopOpacity?: Lumo.MaybeIon<number | string | undefined>;
      strikethroughPosition?: Lumo.MaybeIon<number | string | undefined>;
      strikethroughThickness?: Lumo.MaybeIon<number | string | undefined>;
      string?: Lumo.MaybeIon<number | string | undefined>;
      stroke?: Lumo.MaybeIon<string | undefined>;
      strokeDasharray?: Lumo.MaybeIon<string | number | undefined>;
      strokeDashoffset?: Lumo.MaybeIon<string | number | undefined>;
      strokeLinecap?: Lumo.MaybeIon<"butt" | "round" | "square" | "inherit" | undefined>;
      strokeLinejoin?: Lumo.MaybeIon<"miter" | "round" | "bevel" | "inherit" | undefined>;
      strokeMiterlimit?: Lumo.MaybeIon<number | string | undefined>;
      strokeOpacity?: Lumo.MaybeIon<number | string | undefined>;
      strokeWidth?: Lumo.MaybeIon<number | string | undefined>;
      surfaceScale?: Lumo.MaybeIon<number | string | undefined>;
      systemLanguage?: Lumo.MaybeIon<number | string | undefined>;
      tableValues?: Lumo.MaybeIon<number | string | undefined>;
      targetX?: Lumo.MaybeIon<number | string | undefined>;
      targetY?: Lumo.MaybeIon<number | string | undefined>;
      textAnchor?: Lumo.MaybeIon<string | undefined>;
      textDecoration?: Lumo.MaybeIon<number | string | undefined>;
      textLength?: Lumo.MaybeIon<number | string | undefined>;
      textRendering?: Lumo.MaybeIon<number | string | undefined>;
      to?: Lumo.MaybeIon<number | string | undefined>;
      transform?: Lumo.MaybeIon<string | undefined>;
      u1?: Lumo.MaybeIon<number | string | undefined>;
      u2?: Lumo.MaybeIon<number | string | undefined>;
      underlinePosition?: Lumo.MaybeIon<number | string | undefined>;
      underlineThickness?: Lumo.MaybeIon<number | string | undefined>;
      unicode?: Lumo.MaybeIon<number | string | undefined>;
      unicodeBidi?: Lumo.MaybeIon<number | string | undefined>;
      unicodeRange?: Lumo.MaybeIon<number | string | undefined>;
      unitsPerEm?: Lumo.MaybeIon<number | string | undefined>;
      vAlphabetic?: Lumo.MaybeIon<number | string | undefined>;
      values?: Lumo.MaybeIon<string | undefined>;
      vectorEffect?: Lumo.MaybeIon<number | string | undefined>;
      version?: Lumo.MaybeIon<string | undefined>;
      vertAdvY?: Lumo.MaybeIon<number | string | undefined>;
      vertOriginX?: Lumo.MaybeIon<number | string | undefined>;
      vertOriginY?: Lumo.MaybeIon<number | string | undefined>;
      vHanging?: Lumo.MaybeIon<number | string | undefined>;
      vIdeographic?: Lumo.MaybeIon<number | string | undefined>;
      viewBox?: Lumo.MaybeIon<string | undefined>;
      viewTarget?: Lumo.MaybeIon<number | string | undefined>;
      visibility?: Lumo.MaybeIon<number | string | undefined>;
      vMathematical?: Lumo.MaybeIon<number | string | undefined>;
      widths?: Lumo.MaybeIon<number | string | undefined>;
      wordSpacing?: Lumo.MaybeIon<number | string | undefined>;
      writingMode?: Lumo.MaybeIon<number | string | undefined>;
      x1?: Lumo.MaybeIon<number | string | undefined>;
      x2?: Lumo.MaybeIon<number | string | undefined>;
      x?: Lumo.MaybeIon<number | string | undefined>;
      xChannelSelector?: Lumo.MaybeIon<string | undefined>;
      xHeight?: Lumo.MaybeIon<number | string | undefined>;
      xlinkActuate?: Lumo.MaybeIon<string | undefined>;
      xlinkArcrole?: Lumo.MaybeIon<string | undefined>;
      xlinkHref?: Lumo.MaybeIon<string | undefined>;
      xlinkRole?: Lumo.MaybeIon<string | undefined>;
      xlinkShow?: Lumo.MaybeIon<string | undefined>;
      xlinkTitle?: Lumo.MaybeIon<string | undefined>;
      xlinkType?: Lumo.MaybeIon<string | undefined>;
      xmlBase?: Lumo.MaybeIon<string | undefined>;
      xmlLang?: Lumo.MaybeIon<string | undefined>;
      xmlns?: Lumo.MaybeIon<string | undefined>;
      xmlnsXlink?: Lumo.MaybeIon<string | undefined>;
      xmlSpace?: Lumo.MaybeIon<string | undefined>;
      y1?: Lumo.MaybeIon<number | string | undefined>;
      y2?: Lumo.MaybeIon<number | string | undefined>;
      y?: Lumo.MaybeIon<number | string | undefined>;
      yChannelSelector?: Lumo.MaybeIon<string | undefined>;
      z?: Lumo.MaybeIon<number | string | undefined>;
      zoomAndPan?: Lumo.MaybeIon<string | undefined>;
   }

   interface WebViewHTMLAttributes<T> extends HTMLAttributes<T> {
      allowFullScreen?: Lumo.MaybeIon<boolean | undefined>;
      allowpopups?: Lumo.MaybeIon<boolean | undefined>;
      autosize?: Lumo.MaybeIon<boolean | undefined>;
      blinkfeatures?: Lumo.MaybeIon<string | undefined>;
      disableblinkfeatures?: Lumo.MaybeIon<string | undefined>;
      disableguestresize?: Lumo.MaybeIon<boolean | undefined>;
      disablewebsecurity?: Lumo.MaybeIon<boolean | undefined>;
      guestinstance?: Lumo.MaybeIon<string | undefined>;
      httpreferrer?: Lumo.MaybeIon<string | undefined>;
      nodeintegration?: Lumo.MaybeIon<boolean | undefined>;
      partition?: Lumo.MaybeIon<string | undefined>;
      plugins?: Lumo.MaybeIon<boolean | undefined>;
      preload?: Lumo.MaybeIon<string | undefined>;
      src?: Lumo.MaybeIon<string | undefined>;
      useragent?: Lumo.MaybeIon<string | undefined>;
      webpreferences?: Lumo.MaybeIon<string | undefined>;
   }


   interface ReactSVG {
      animate: SVGFactory;
      circle: SVGFactory;
      clipPath: SVGFactory;
      defs: SVGFactory;
      desc: SVGFactory;
      ellipse: SVGFactory;
      feBlend: SVGFactory;
      feColorMatrix: SVGFactory;
      feComponentTransfer: SVGFactory;
      feComposite: SVGFactory;
      feConvolveMatrix: SVGFactory;
      feDiffuseLighting: SVGFactory;
      feDisplacementMap: SVGFactory;
      feDistantLight: SVGFactory;
      feDropShadow: SVGFactory;
      feFlood: SVGFactory;
      feFuncA: SVGFactory;
      feFuncB: SVGFactory;
      feFuncG: SVGFactory;
      feFuncR: SVGFactory;
      feGaussianBlur: SVGFactory;
      feImage: SVGFactory;
      feMerge: SVGFactory;
      feMergeNode: SVGFactory;
      feMorphology: SVGFactory;
      feOffset: SVGFactory;
      fePointLight: SVGFactory;
      feSpecularLighting: SVGFactory;
      feSpotLight: SVGFactory;
      feTile: SVGFactory;
      feTurbulence: SVGFactory;
      filter: SVGFactory;
      foreignObject: SVGFactory;
      g: SVGFactory;
      image: SVGFactory;
      line: SVGFactory;
      linearGradient: SVGFactory;
      marker: SVGFactory;
      mask: SVGFactory;
      metadata: SVGFactory;
      path: SVGFactory;
      pattern: SVGFactory;
      polygon: SVGFactory;
      polyline: SVGFactory;
      radialGradient: SVGFactory;
      rect: SVGFactory;
      stop: SVGFactory;
      svg: SVGFactory;
      switch: SVGFactory;
      symbol: SVGFactory;
      text: SVGFactory;
      textPath: SVGFactory;
      tspan: SVGFactory;
      use: SVGFactory;
      view: SVGFactory;
   }


   //
   // Browser Interfaces
   // https://github.com/nikeee/2048-typescript/blob/master/2048/js/touch.d.ts
   // ----------------------------------------------------------------------

   interface AbstractView {
      styleMedia: StyleMedia;
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

   //$$$
   type DetailedHTMLProps<E extends HTMLAttributes<T>, T> = RefAttributes<T> & E & Lumo.LumoHooks<P>& LumoCommonAttributes

   interface SVGProps<T> extends SVGAttributes<T>, RefAttributes<T> {
   }

   interface SVGLineElementAttributes<T> extends SVGProps<T> { }
   interface SVGTextElementAttributes<T> extends SVGProps<T> { }


   //$$$
   type DOMAttributes<T> = {
      children?: Lumo.JSXNode | undefined | null;
   } & DOMEvents<T>
}



// IMPORTANT Components and elements
// N = (props: P) => JSX.Element
type LumoAttributes<F, P> =
   P extends { '~attributes'?: infer A }
   ? A & Lumo.LumoHooks<Lumo.ComponentRef<F>> & LumoComponentAttributes<F> & LumoCommonAttributes & Luent.DOMEvents<Lumo.ComponentRef<F>>// Component Attributes
   : P // Element attributes must be added to DetailedHTMLProps

type LumoComponentAttributes<C> = {
   ref?: NodeRef<Lumo.ComponentRef<C>>
   class?: ClassInput | Lumo.MaybeIon<string | Falsey> | (Lumo.MaybeIon<string | Falsey> | ClassInput)[];
   style?: StyleInput | StyleInput[];
}

type LumoCommonAttributes = {
   'on:event'?: {[key: string]: Function };
}



declare global {

   type DOMEvents<T> = Luent.DOMEvents<T>

   namespace JSX {
      //$$$ important for converting component input types to attribute types
      type LibraryManagedAttributes<C, P> = LumoAttributes<C, P>;

      type CSSProperties = Luent.CSSProperties

      type Falsey = undefined | null | false;

      type StyleInput = Lumo.MaybeIon<string | Falsey> | Lumo.MaybeIon<{ [K in keyof Partial<CSSProperties>]: Lumo.MaybeIon<CSSProperties[K]> }>

      type ClassInput = Lumo.MaybeIon<string> | Lumo.MaybeIon<{ [key: string]: Lumo.MaybeIon<Booleanny> }>

      type IntrinsicElements = JSX._IntrinsicElements & LumoElements


      interface LumoElements {
         '!--': {}; //comments
         'o--portal': PortalNodeInput & { children: Lumo.Slot }

         'o--link': Luent.DetailedHTMLProps<Luent.LinkHTMLAttributes<HTMLLinkElement>, HTMLLinkElement> & {'portal-to'?: 'body'|'head'}
         'o--head': Luent.DetailedHTMLProps<Luent.LinkHTMLAttributes<HTMLHeadElement>, HTMLHeadElement>
         'o--body': Luent.DetailedHTMLProps<Luent.LinkHTMLAttributes<HTMLBodyElement>, HTMLBodyElement>
         'show-view': { children: ConditionalRenderKit[] | ConditionalRenderKit }
         'create-view': { children: ConditionalRenderKit[] }
         'remount-view': { children: ConditionalRenderKit[]; discard?: Ion<boolean> }
         'render-view': { children: Lumo.RawJSXNode }
         // 'o--preserve': { children: ConditionalRenderKit[]; discard?: Ion<boolean> };
         // 'preserve-conditionals': { children: ConditionalRenderKit[]; 'can:discard'?: () => void };
         // 'Slot': {Slot: unknown}

         // 'o--suspense': SuspenseNodeInput & { children: Lumo.Slot };
         // 'o--try': TryNodeInput & { children: Lumo.Slot };

         // 'ooo-transit': Luent.DetailedHTMLProps<Luent.HTMLAttributes<HTMLDivElement> & TransitionNodeInput, HTMLDivElement>
         // 'ooo-transition': Luent.DetailedHTMLProps<Luent.HTMLAttributes<HTMLDivElement> & TransitionNodeInput & { morph?: true }, HTMLDivElement>
         'o--dock': Luent.DetailedHTMLProps<Luent.HTMLAttributes<HTMLDivElement> & TransitionNodeInput, HTMLDivElement>
      }



      interface _IntrinsicElements {
         // HTML
         a: Luent.DetailedHTMLProps<Luent.AnchorHTMLAttributes<HTMLAnchorElement>, HTMLAnchorElement>;
         abbr: Luent.DetailedHTMLProps<Luent.HTMLAttributes<HTMLElement>, HTMLElement>;
         address: Luent.DetailedHTMLProps<Luent.HTMLAttributes<HTMLElement>, HTMLElement>;
         area: Luent.DetailedHTMLProps<Luent.AreaHTMLAttributes<HTMLAreaElement>, HTMLAreaElement>;
         article: Luent.DetailedHTMLProps<Luent.HTMLAttributes<HTMLElement>, HTMLElement>;
         aside: Luent.DetailedHTMLProps<Luent.HTMLAttributes<HTMLElement>, HTMLElement>;
         audio: Luent.DetailedHTMLProps<Luent.AudioHTMLAttributes<HTMLAudioElement>, HTMLAudioElement>;
         b: Luent.DetailedHTMLProps<Luent.HTMLAttributes<HTMLElement>, HTMLElement>;
         base: Luent.DetailedHTMLProps<Luent.BaseHTMLAttributes<HTMLBaseElement>, HTMLBaseElement>;
         bdi: Luent.DetailedHTMLProps<Luent.HTMLAttributes<HTMLElement>, HTMLElement>;
         bdo: Luent.DetailedHTMLProps<Luent.HTMLAttributes<HTMLElement>, HTMLElement>;
         big: Luent.DetailedHTMLProps<Luent.HTMLAttributes<HTMLElement>, HTMLElement>;
         blockquote: Luent.DetailedHTMLProps<Luent.BlockquoteHTMLAttributes<HTMLQuoteElement>, HTMLQuoteElement>;
         body: Luent.DetailedHTMLProps<Luent.HTMLAttributes<HTMLBodyElement>, HTMLBodyElement>;
         br: Luent.DetailedHTMLProps<Luent.HTMLAttributes<HTMLBRElement>, HTMLBRElement>;
         button: Luent.DetailedHTMLProps<Luent.ButtonHTMLAttributes<HTMLButtonElement>, HTMLButtonElement>;
         canvas: Luent.DetailedHTMLProps<Luent.CanvasHTMLAttributes<HTMLCanvasElement>, HTMLCanvasElement>;
         caption: Luent.DetailedHTMLProps<Luent.HTMLAttributes<HTMLElement>, HTMLElement>;
         center: Luent.DetailedHTMLProps<Luent.HTMLAttributes<HTMLElement>, HTMLElement>;
         cite: Luent.DetailedHTMLProps<Luent.HTMLAttributes<HTMLElement>, HTMLElement>;
         code: Luent.DetailedHTMLProps<Luent.HTMLAttributes<HTMLElement>, HTMLElement>;
         col: Luent.DetailedHTMLProps<Luent.ColHTMLAttributes<HTMLTableColElement>, HTMLTableColElement>;
         colgroup: Luent.DetailedHTMLProps<Luent.ColgroupHTMLAttributes<HTMLTableColElement>, HTMLTableColElement>;
         data: Luent.DetailedHTMLProps<Luent.DataHTMLAttributes<HTMLDataElement>, HTMLDataElement>;
         datalist: Luent.DetailedHTMLProps<Luent.HTMLAttributes<HTMLDataListElement>, HTMLDataListElement>;
         dd: Luent.DetailedHTMLProps<Luent.HTMLAttributes<HTMLElement>, HTMLElement>;
         del: Luent.DetailedHTMLProps<Luent.DelHTMLAttributes<HTMLModElement>, HTMLModElement>;
         details: Luent.DetailedHTMLProps<Luent.DetailsHTMLAttributes<HTMLDetailsElement>, HTMLDetailsElement>;
         dfn: Luent.DetailedHTMLProps<Luent.HTMLAttributes<HTMLElement>, HTMLElement>;
         dialog: Luent.DetailedHTMLProps<Luent.DialogHTMLAttributes<HTMLDialogElement>, HTMLDialogElement>;
         div: Luent.DetailedHTMLProps<Luent.HTMLAttributes<HTMLDivElement>, HTMLDivElement>;
         dl: Luent.DetailedHTMLProps<Luent.HTMLAttributes<HTMLDListElement>, HTMLDListElement>;
         dt: Luent.DetailedHTMLProps<Luent.HTMLAttributes<HTMLElement>, HTMLElement>;
         em: Luent.DetailedHTMLProps<Luent.HTMLAttributes<HTMLElement>, HTMLElement>;
         embed: Luent.DetailedHTMLProps<Luent.EmbedHTMLAttributes<HTMLEmbedElement>, HTMLEmbedElement>;
         fieldset: Luent.DetailedHTMLProps<Luent.FieldsetHTMLAttributes<HTMLFieldSetElement>, HTMLFieldSetElement>;
         figcaption: Luent.DetailedHTMLProps<Luent.HTMLAttributes<HTMLElement>, HTMLElement>;
         figure: Luent.DetailedHTMLProps<Luent.HTMLAttributes<HTMLElement>, HTMLElement>;
         footer: Luent.DetailedHTMLProps<Luent.HTMLAttributes<HTMLElement>, HTMLElement>;
         form: Luent.DetailedHTMLProps<Luent.FormHTMLAttributes<HTMLFormElement>, HTMLFormElement>;
         h1: Luent.DetailedHTMLProps<Luent.HTMLAttributes<HTMLHeadingElement>, HTMLHeadingElement>;
         h2: Luent.DetailedHTMLProps<Luent.HTMLAttributes<HTMLHeadingElement>, HTMLHeadingElement>;
         h3: Luent.DetailedHTMLProps<Luent.HTMLAttributes<HTMLHeadingElement>, HTMLHeadingElement>;
         h4: Luent.DetailedHTMLProps<Luent.HTMLAttributes<HTMLHeadingElement>, HTMLHeadingElement>;
         h5: Luent.DetailedHTMLProps<Luent.HTMLAttributes<HTMLHeadingElement>, HTMLHeadingElement>;
         h6: Luent.DetailedHTMLProps<Luent.HTMLAttributes<HTMLHeadingElement>, HTMLHeadingElement>;
         head: Luent.DetailedHTMLProps<Luent.HTMLAttributes<HTMLHeadElement>, HTMLHeadElement>;
         header: Luent.DetailedHTMLProps<Luent.HTMLAttributes<HTMLElement>, HTMLElement>;
         hgroup: Luent.DetailedHTMLProps<Luent.HTMLAttributes<HTMLElement>, HTMLElement>;
         hr: Luent.DetailedHTMLProps<Luent.HTMLAttributes<HTMLHRElement>, HTMLHRElement>;
         html: Luent.DetailedHTMLProps<Luent.HtmlHTMLAttributes<HTMLHtmlElement>, HTMLHtmlElement>;
         i: Luent.DetailedHTMLProps<Luent.HTMLAttributes<HTMLElement>, HTMLElement>;
         iframe: Luent.DetailedHTMLProps<Luent.IframeHTMLAttributes<HTMLIFrameElement>, HTMLIFrameElement>;
         img: Luent.DetailedHTMLProps<Luent.ImgHTMLAttributes<HTMLImageElement>, HTMLImageElement>;
         input: Luent.DetailedHTMLProps<Luent.InputHTMLAttributes<HTMLInputElement>, HTMLInputElement>;
         ins: Luent.DetailedHTMLProps<Luent.InsHTMLAttributes<HTMLModElement>, HTMLModElement>;
         kbd: Luent.DetailedHTMLProps<Luent.HTMLAttributes<HTMLElement>, HTMLElement>;
         keygen: Luent.DetailedHTMLProps<Luent.KeygenHTMLAttributes<HTMLElement>, HTMLElement>;
         label: Luent.DetailedHTMLProps<Luent.LabelHTMLAttributes<HTMLLabelElement>, HTMLLabelElement>;
         legend: Luent.DetailedHTMLProps<Luent.HTMLAttributes<HTMLLegendElement>, HTMLLegendElement>;
         li: Luent.DetailedHTMLProps<Luent.LiHTMLAttributes<HTMLLIElement>, HTMLLIElement>;
         link: Luent.DetailedHTMLProps<Luent.LinkHTMLAttributes<HTMLLinkElement>, HTMLLinkElement>;
         main: Luent.DetailedHTMLProps<Luent.HTMLAttributes<HTMLElement>, HTMLElement>;
         map: Luent.DetailedHTMLProps<Luent.MapHTMLAttributes<HTMLMapElement>, HTMLMapElement>;
         mark: Luent.DetailedHTMLProps<Luent.HTMLAttributes<HTMLElement>, HTMLElement>;
         menu: Luent.DetailedHTMLProps<Luent.MenuHTMLAttributes<HTMLElement>, HTMLElement>;
         menuitem: Luent.DetailedHTMLProps<Luent.HTMLAttributes<HTMLElement>, HTMLElement>;
         meta: Luent.DetailedHTMLProps<Luent.MetaHTMLAttributes<HTMLMetaElement>, HTMLMetaElement>;
         meter: Luent.DetailedHTMLProps<Luent.MeterHTMLAttributes<HTMLMeterElement>, HTMLMeterElement>;
         nav: Luent.DetailedHTMLProps<Luent.HTMLAttributes<HTMLElement>, HTMLElement>;
         noindex: Luent.DetailedHTMLProps<Luent.HTMLAttributes<HTMLElement>, HTMLElement>;
         noscript: Luent.DetailedHTMLProps<Luent.HTMLAttributes<HTMLElement>, HTMLElement>;
         object: Luent.DetailedHTMLProps<Luent.ObjectHTMLAttributes<HTMLObjectElement>, HTMLObjectElement>;
         ol: Luent.DetailedHTMLProps<Luent.OlHTMLAttributes<HTMLOListElement>, HTMLOListElement>;
         optgroup: Luent.DetailedHTMLProps<Luent.OptgroupHTMLAttributes<HTMLOptGroupElement>, HTMLOptGroupElement>;
         option: Luent.DetailedHTMLProps<Luent.OptionHTMLAttributes<HTMLOptionElement>, HTMLOptionElement>;
         output: Luent.DetailedHTMLProps<Luent.OutputHTMLAttributes<HTMLOutputElement>, HTMLOutputElement>;
         p: Luent.DetailedHTMLProps<Luent.HTMLAttributes<HTMLParagraphElement>, HTMLParagraphElement>;
         param: Luent.DetailedHTMLProps<Luent.ParamHTMLAttributes<HTMLParamElement>, HTMLParamElement>;
         picture: Luent.DetailedHTMLProps<Luent.HTMLAttributes<HTMLElement>, HTMLElement>;
         pre: Luent.DetailedHTMLProps<Luent.HTMLAttributes<HTMLPreElement>, HTMLPreElement>;
         progress: Luent.DetailedHTMLProps<Luent.ProgressHTMLAttributes<HTMLProgressElement>, HTMLProgressElement>;
         q: Luent.DetailedHTMLProps<Luent.QuoteHTMLAttributes<HTMLQuoteElement>, HTMLQuoteElement>;
         rp: Luent.DetailedHTMLProps<Luent.HTMLAttributes<HTMLElement>, HTMLElement>;
         rt: Luent.DetailedHTMLProps<Luent.HTMLAttributes<HTMLElement>, HTMLElement>;
         ruby: Luent.DetailedHTMLProps<Luent.HTMLAttributes<HTMLElement>, HTMLElement>;
         s: Luent.DetailedHTMLProps<Luent.HTMLAttributes<HTMLElement>, HTMLElement>;
         samp: Luent.DetailedHTMLProps<Luent.HTMLAttributes<HTMLElement>, HTMLElement>;
         search: Luent.DetailedHTMLProps<Luent.HTMLAttributes<HTMLElement>, HTMLElement>;
         slot: Luent.DetailedHTMLProps<Luent.SlotHTMLAttributes<HTMLSlotElement>, HTMLSlotElement>;
         script: Luent.DetailedHTMLProps<Luent.ScriptHTMLAttributes<HTMLScriptElement>, HTMLScriptElement>;
         section: Luent.DetailedHTMLProps<Luent.HTMLAttributes<HTMLElement>, HTMLElement>;
         select: Luent.DetailedHTMLProps<Luent.SelectHTMLAttributes<HTMLSelectElement>, HTMLSelectElement>;
         small: Luent.DetailedHTMLProps<Luent.HTMLAttributes<HTMLElement>, HTMLElement>;
         source: Luent.DetailedHTMLProps<Luent.SourceHTMLAttributes<HTMLSourceElement>, HTMLSourceElement>;
         span: Luent.DetailedHTMLProps<Luent.HTMLAttributes<HTMLSpanElement>, HTMLSpanElement>;
         strong: Luent.DetailedHTMLProps<Luent.HTMLAttributes<HTMLElement>, HTMLElement>;
         style: Luent.DetailedHTMLProps<Luent.StyleHTMLAttributes<HTMLStyleElement>, HTMLStyleElement>;
         sub: Luent.DetailedHTMLProps<Luent.HTMLAttributes<HTMLElement>, HTMLElement>;
         summary: Luent.DetailedHTMLProps<Luent.HTMLAttributes<HTMLElement>, HTMLElement>;
         sup: Luent.DetailedHTMLProps<Luent.HTMLAttributes<HTMLElement>, HTMLElement>;
         table: Luent.DetailedHTMLProps<Luent.TableHTMLAttributes<HTMLTableElement>, HTMLTableElement>;
         template: Luent.DetailedHTMLProps<Luent.HTMLAttributes<HTMLTemplateElement>, HTMLTemplateElement>;
         tbody: Luent.DetailedHTMLProps<Luent.HTMLAttributes<HTMLTableSectionElement>, HTMLTableSectionElement>;
         td: Luent.DetailedHTMLProps<Luent.TdHTMLAttributes<HTMLTableDataCellElement>, HTMLTableDataCellElement>;
         textarea: Luent.DetailedHTMLProps<Luent.TextareaHTMLAttributes<HTMLTextAreaElement>, HTMLTextAreaElement>;
         tfoot: Luent.DetailedHTMLProps<Luent.HTMLAttributes<HTMLTableSectionElement>, HTMLTableSectionElement>;
         th: Luent.DetailedHTMLProps<Luent.ThHTMLAttributes<HTMLTableHeaderCellElement>, HTMLTableHeaderCellElement>;
         thead: Luent.DetailedHTMLProps<Luent.HTMLAttributes<HTMLTableSectionElement>, HTMLTableSectionElement>;
         time: Luent.DetailedHTMLProps<Luent.TimeHTMLAttributes<HTMLTimeElement>, HTMLTimeElement>;
         title: Luent.DetailedHTMLProps<Luent.HTMLAttributes<HTMLTitleElement>, HTMLTitleElement>;
         tr: Luent.DetailedHTMLProps<Luent.HTMLAttributes<HTMLTableRowElement>, HTMLTableRowElement>;
         track: Luent.DetailedHTMLProps<Luent.TrackHTMLAttributes<HTMLTrackElement>, HTMLTrackElement>;
         u: Luent.DetailedHTMLProps<Luent.HTMLAttributes<HTMLElement>, HTMLElement>;
         ul: Luent.DetailedHTMLProps<Luent.HTMLAttributes<HTMLUListElement>, HTMLUListElement>;
         "var": Luent.DetailedHTMLProps<Luent.HTMLAttributes<HTMLElement>, HTMLElement>;
         video: Luent.DetailedHTMLProps<Luent.VideoHTMLAttributes<HTMLVideoElement>, HTMLVideoElement>;
         wbr: Luent.DetailedHTMLProps<Luent.HTMLAttributes<HTMLElement>, HTMLElement>;
         webview: Luent.DetailedHTMLProps<Luent.WebViewHTMLAttributes<HTMLWebViewElement>, HTMLWebViewElement>;

         // SVG
         svg: Luent.SVGProps<SVGSVGElement>;

         animate: Luent.SVGProps<SVGElement>; // TODO: It is SVGAnimateElement but is not in TypeScript's lib.dom.d.ts for now.
         animateMotion: Luent.SVGProps<SVGElement>;
         animateTransform: Luent.SVGProps<SVGElement>; // TODO: It is SVGAnimateTransformElement but is not in TypeScript's lib.dom.d.ts for now.
         circle: Luent.SVGProps<SVGCircleElement>;
         clipPath: Luent.SVGProps<SVGClipPathElement>;
         defs: Luent.SVGProps<SVGDefsElement>;
         desc: Luent.SVGProps<SVGDescElement>;
         ellipse: Luent.SVGProps<SVGEllipseElement>;
         feBlend: Luent.SVGProps<SVGFEBlendElement>;
         feColorMatrix: Luent.SVGProps<SVGFEColorMatrixElement>;
         feComponentTransfer: Luent.SVGProps<SVGFEComponentTransferElement>;
         feComposite: Luent.SVGProps<SVGFECompositeElement>;
         feConvolveMatrix: Luent.SVGProps<SVGFEConvolveMatrixElement>;
         feDiffuseLighting: Luent.SVGProps<SVGFEDiffuseLightingElement>;
         feDisplacementMap: Luent.SVGProps<SVGFEDisplacementMapElement>;
         feDistantLight: Luent.SVGProps<SVGFEDistantLightElement>;
         feDropShadow: Luent.SVGProps<SVGFEDropShadowElement>;
         feFlood: Luent.SVGProps<SVGFEFloodElement>;
         feFuncA: Luent.SVGProps<SVGFEFuncAElement>;
         feFuncB: Luent.SVGProps<SVGFEFuncBElement>;
         feFuncG: Luent.SVGProps<SVGFEFuncGElement>;
         feFuncR: Luent.SVGProps<SVGFEFuncRElement>;
         feGaussianBlur: Luent.SVGProps<SVGFEGaussianBlurElement>;
         feImage: Luent.SVGProps<SVGFEImageElement>;
         feMerge: Luent.SVGProps<SVGFEMergeElement>;
         feMergeNode: Luent.SVGProps<SVGFEMergeNodeElement>;
         feMorphology: Luent.SVGProps<SVGFEMorphologyElement>;
         feOffset: Luent.SVGProps<SVGFEOffsetElement>;
         fePointLight: Luent.SVGProps<SVGFEPointLightElement>;
         feSpecularLighting: Luent.SVGProps<SVGFESpecularLightingElement>;
         feSpotLight: Luent.SVGProps<SVGFESpotLightElement>;
         feTile: Luent.SVGProps<SVGFETileElement>;
         feTurbulence: Luent.SVGProps<SVGFETurbulenceElement>;
         filter: Luent.SVGProps<SVGFilterElement>;
         foreignObject: Luent.SVGProps<SVGForeignObjectElement>;
         g: Luent.SVGProps<SVGGElement>;
         image: Luent.SVGProps<SVGImageElement>;
         line: Luent.SVGLineElementAttributes<SVGLineElement>;
         linearGradient: Luent.SVGProps<SVGLinearGradientElement>;
         marker: Luent.SVGProps<SVGMarkerElement>;
         mask: Luent.SVGProps<SVGMaskElement>;
         metadata: Luent.SVGProps<SVGMetadataElement>;
         mpath: Luent.SVGProps<SVGElement>;
         path: Luent.SVGProps<SVGPathElement>;
         pattern: Luent.SVGProps<SVGPatternElement>;
         polygon: Luent.SVGProps<SVGPolygonElement>;
         polyline: Luent.SVGProps<SVGPolylineElement>;
         radialGradient: Luent.SVGProps<SVGRadialGradientElement>;
         rect: Luent.SVGProps<SVGRectElement>;
         set: Luent.SVGProps<SVGSetElement>;
         stop: Luent.SVGProps<SVGStopElement>;
         switch: Luent.SVGProps<SVGSwitchElement>;
         symbol: Luent.SVGProps<SVGSymbolElement>;
         text: Luent.SVGTextElementAttributes<SVGTextElement>;
         textPath: Luent.SVGProps<SVGTextPathElement>;
         tspan: Luent.SVGProps<SVGTSpanElement>;
         use: Luent.SVGProps<SVGUseElement>;
         view: Luent.SVGProps<SVGViewElement>;
      }
   }
}

