// NOTE: Users of the `experimental` builds of React should add a reference
// to 'react/experimental' in their project. See experimental.d.ts's top comment
// for reference and documentation on how exactly to do it.

/// <reference path="global.d.ts" />

import * as CSS from "csstype";
// import * as PropTypes from "prop-types";
import * as Lumo from "@rue/lumo";
import * as Quarky from "@rue/quarky";
import { $Node } from "../../src/node/NodeRef";
import { COMPONENT_ATTRIBUTES, CommonsKeyMap, _ContextInputType, Component, SuspenseNodeInput, TryNodeInput, TransitionNodeInput } from "@rue/lumo";
import { AnyObject, Booleanny } from "@rue/types";
import { PortalNodeInput } from "../../src/boundaries/Portal";

// export function jsxDEV(): "frog"
// export function jsx(): "frog"

// #LUMO-EDIT
// Replaced all ReactNode --> JSXNode
// Dunno if replacement will cause problems for:
// - Iterable<JSXNode>
// - ReadonlyArray<JSXNode>
// - NodeEntityArray

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

// eslint-disable-next-line @definitelytyped/export-just-namespace
// export = React;
// export as namespace React;

declare namespace React {
   //
   // React Elements
   // ----------------------------------------------------------------------

   // /**
   //  * Represents any user-defined component, either as a function or a class.
   //  *
   //  * Similar to {@link JSXElementConstructor}, but with extra properties like
   //  * {@link FunctionComponent.defaultProps defaultProps } and
   //  * {@link ComponentClass.contextTypes contextTypes}.
   //  *
   //  * @template P The props the component accepts.
   //  *
   //  * @see {@link ComponentClass}
   //  * @see {@link FunctionComponent}
   //  */
   //important???
   type ComponentType<P = {}> = FunctionComponent<P>;


   /**
    * Represents the type of a function component. Can optionally
    * receive a type argument that represents the props the component
    * accepts.
    *
    * @template P The props the component accepts.
    * @see {@link https://react-typescript-cheatsheet.netlify.app/docs/basic/getting-started/function_components React TypeScript Cheatsheet}
    *
    * @example
    *
    * ```tsx
    * // With props:
    * type Props = { name: string }
    *
    * const MyComponent: FunctionComponent<Props> = (props) => {
    *  return <div>{props.name}</div>
    * }
    * ```
    *
    * @example
    *
    * ```tsx
    * // Without props:
    * const MyComponentWithoutProps: FunctionComponent = () => {
    *   return <div>MyComponentWithoutProps</div>
    * }
    * ```
    */
   interface FunctionComponent<P> {
      (
         props: P
      ): Component;
   }

   /**
    * Represents any user-defined component, either as a function or a class.
    *
    * Similar to {@link ComponentType}, but without extra properties like
    * {@link FunctionComponent.defaultProps defaultProps } and
    * {@link ComponentClass.contextTypes contextTypes}.
    *
    * @template P The props the component accepts.
    */
   //$$$ important for component
   type JSXElementConstructor<P, O> = (
      input: P,
      optionals: O
   ) => Component



   /**
    * A value which uniquely identifies a node among items in an array.
    *
    * @see {@link https://react.dev/learn/rendering-lists#keeping-list-items-in-order-with-key React Docs}
    */
   type Key = string | number | bigint;

   /**
    * @internal The props any component can receive.
    * You don't have to add this type. All components automatically accept these props.
    * ```tsx
    * const Component = () => <div />;
    * <Component key="one" />
    * ```
    *
    * WARNING: The implementation of a component will never have access to these attributes.
    * The following example would be incorrect usage because {@link Component} would never have access to `key`:
    * ```tsx
    * const Component = (props: React.Attributes) => props.key;
    * ```
    */
   interface Attributes { //NOTE: Important for components and elements
      key?: Key | null | undefined;
   }
   /**
    * The props any component accepting refs can receive.
    * Class components, built-in browser components (e.g. `div`) and forwardRef components can receive refs and automatically accept these props.
    * ```tsx
    * const Component = forwardRef(() => <div />);
    * <Component ref={(current) => console.log(current)} />
    * ```
    *
    * You only need this type if you manually author the types of props that need to be compatible with legacy refs.
    * ```tsx
    * interface Props extends React.RefAttributes<HTMLDivElement> {}
    * declare const Component: React.FunctionComponent<Props>;
    * ```
    *
    * Otherwise it's simpler to directly use {@link Ref} since you can safely use the
    * props type to describe to props that a consumer can pass to the component
    * as well as describing the props the implementation of a component "sees".
    * {@link RefAttributes} is generally not safe to describe both consumer and seen props.
    *
    * ```tsx
    * interface Props extends {
    *   ref?: React.Ref<HTMLDivElement> | undefined;
    * }
    * declare const Component: React.FunctionComponent<Props>;
    * ```
    *
    * WARNING: The implementation of a component will not have access to the same type in versions of React supporting string refs.
    * The following example would be incorrect usage because {@link Component} would never have access to a `ref` with type `string`
    * ```tsx
    * const Component = (props: React.RefAttributes) => props.ref;
    * ```
    */
   //$$$ Important
   interface RefAttributes<T> extends Attributes { //NOTE: Important
      /**
       * Allows getting a ref to the component instance.
       * Once the component unmounts, React will set `ref.current` to `null`
       * (or call the ref with `null` if you passed a callback ref).
       *
       * @see {@link https://react.dev/learn/referencing-values-with-refs#refs-and-the-dom React Docs}
       */
      ref?: Lumo.$Node | Lumo.$Nodes | undefined;
   }

   /**
    * Represents the built-in attributes available to class components.
   */
   //$$$
   interface ClassAttributes<T> extends RefAttributes<T> { //NOTE: Important for elements
   }





   // interface FunctionComponentElement<P> extends ReactElement<P, FunctionComponent<P>> {
   //    ref?: ("ref" extends keyof P ? P extends { ref?: infer R | undefined } ? R : never : never) | undefined;
   // }


   // ReactHTML for ReactHTMLElement
   interface ReactHTMLElement<T extends HTMLElement> extends DetailedReactHTMLElement<AllHTMLAttributes<T>, T> { }

   interface DetailedReactHTMLElement<P extends HTMLAttributes<T>, T extends HTMLElement> extends DOMElement<P, T> {
      type: keyof ReactHTML;
   }

   // ReactSVG for ReactSVGElement
   interface ReactSVGElement extends DOMElement<SVGAttributes<SVGElement>, SVGElement> {
      type: keyof ReactSVG;
   }



   /**
    * @deprecated - This type is not relevant when using React. Inline the type instead to make the intent clear.
    */
   type ReactText = string | number;
   /**
    * @deprecated - This type is not relevant when using React. Inline the type instead to make the intent clear.
    */
   type ReactChild = ReactElement | string | number;

   /**
    * @deprecated Use either `Lumo.JSXNode[]` if you need an array or `Iterable<Lumo.JSXNode>` if its passed to a host component.
    */
   interface NodeEntityArray extends ReadonlyArray<Lumo.JSXNode> { }
   /**
    * WARNING: Not related to `React.Fragment`.
    * @deprecated This type is not relevant when using React. Inline the type instead to make the intent clear.
    */
   type ReactFragment = Iterable<Lumo.JSXNode>;

   /**
    * Different release channels declare additional types of JSXNode this particular release channel accepts.
    * App or library types should never augment this interface.
    */
   // interface DO_NOT_USE_OR_YOU_WILL_BE_FIRED_EXPERIMENTAL_REACT_NODES { }

   /**
    * Represents all of the things React can render.
    *
    * Where {@link ReactElement} only represents JSX, `Lumo.JSXNode` represents everything that can be rendered.
    *
    * @see {@link https://react-typescript-cheatsheet.netlify.app/docs/react-types/reactnode/ React TypeScript Cheatsheet}
    *
    * @example
    *
    * ```tsx
    * // Typing Slot
    * type Props = { Slot: Lumo.JSXNode }
    *
    * const Component = ({ Slot }: Props) => <div>{Slot}</div>
    *
    * <Component>hello</Component>
    * ```
    *
    * @example
    *
    * ```tsx
    * // Typing a custom element
    * type Props = { customElement: Lumo.JSXNode }
    *
    * const Component = ({ customElement }: Props) => <div>{customElement}</div>
    *
    * <Component customElement={<div>hello</div>} />
    * ```
    */
   // non-thenables need to be kept in sync with AwaitedNodeEntity

   // EDITED BY LUMO: ReactNode --> JSXNode
   // type ReactNode =
   //     | ReactElement
   //     | string
   //     | number
   //     | Iterable<Lumo.JSXNode>
   //     | ReactPortal
   //     | boolean
   //     | null
   //     | undefined
   //     | DO_NOT_USE_OR_YOU_WILL_BE_FIRED_EXPERIMENTAL_REACT_NODES[
   //         keyof DO_NOT_USE_OR_YOU_WILL_BE_FIRED_EXPERIMENTAL_REACT_NODES
   //     ];

   //
   // Top Level API
   // ----------------------------------------------------------------------

   // DOM Elements
   // /** @deprecated */
   // function createFactory<T extends HTMLElement>(
   //     type: keyof ReactHTML,
   // ): HTMLFactory<T>;
   // /** @deprecated */
   // function createFactory(
   //     type: keyof ReactSVG,
   // ): SVGFactory;
   // /** @deprecated */
   // function createFactory<P extends DOMAttributes<T>, T extends Element>(
   //     type: string,
   // ): DOMFactory<P, T>;

   // Custom components
   // /** @deprecated */
   // function createFactory<P>(type: FunctionComponent<P>): FunctionComponentFactory<P>;
   // /** @deprecated */
   // function createFactory<P, T extends Component<P, ComponentState>, C extends ComponentClass<P>>(
   //     type: ClassType<P, T, C>,
   // ): CFactory<P, T>;
   // /** @deprecated */
   // function createFactory<P>(type: ComponentClass<P>): Factory<P>;

   // DOM Elements
   // TODO: generalize this to everything in `keyof ReactHTML`, not just "input"
   // function createElement(
   //     type: "input",
   //     props?: InputHTMLAttributes<HTMLInputElement> & ClassAttributes<HTMLInputElement> | null,
   //     ...Slot: Lumo.JSXNode[]
   // ): DetailedReactHTMLElement<InputHTMLAttributes<HTMLInputElement>, HTMLInputElement>;
   // function createElement<P extends HTMLAttributes<T>, T extends HTMLElement>(
   //     type: keyof ReactHTML,
   //     props?: { frog: true } & ClassAttributes<T> & P | null,
   //     ...Slot: Lumo.JSXNode[]
   // ): DetailedReactHTMLElement<P, T>;
   // function createElement<P extends SVGAttributes<T>, T extends SVGElement>(
   //     type: keyof ReactSVG,
   //     props?: { frog: true } & ClassAttributes<T> & P | null,
   //     ...Slot: Lumo.JSXNode[]
   // ): ReactSVGElement;
   // function createElement<P extends DOMAttributes<T>, T extends Element>(
   //     type: string,
   //     props?: { frog: true } & ClassAttributes<T> & P | null,
   //     ...Slot: Lumo.JSXNode[]
   // ): DOMElement<P, T>;

   // Custom components



   /**
    * An object masquerading as a component. These are created by functions
    * like {@link forwardRef}, {@link memo}, and {@link createContext}.
    *
    * In order to make TypeScript work, we pretend that they are normal
    * components.
    *
    * But they are, in fact, not callable - instead, they are objects which
    * are treated specially by the renderer.
    *
    * @template P The props the component accepts.
    */
   //$$$
   interface ExoticComponent<P = {}> {
      (props: P & { frog: 'blog' }): Lumo.JSXNode;
      readonly $$typeof: symbol;
   }

   //$$$
   /**
    * An {@link ExoticComponent} with a `displayName` property applied to it.
    *
    * @template P The props the component accepts.
    */
   interface NamedExoticComponent<P = {}> extends ExoticComponent<P> { }



   /**
    * Used to retrieve the props a custom component accepts with its ref.
    *
    * Unlike {@link ComponentPropsWithRef}, this only works with custom
    * components, i.e. components you define yourself. This is to improve
    * type-checking performance.
    *
    * @example
    *
    * ```tsx
    * const MyComponent = (props: { foo: number, bar: string }) => <div />;
    *
    * // Retrieves the props 'MyComponent' accepts
    * type MyComponentPropsWithRef = React.CustomComponentPropsWithRef<typeof MyComponent>;
    * ```
    */
   //$$$
   type CustomComponentPropsWithRef<T extends ComponentType> = T extends (new (props: infer P) => Component<any, any>)
      ? (PropsWithoutRef<P> & RefAttributes<InstanceType<T>>)
      : T extends ((props: infer P, legacyContext?: any) => Lumo.JSXNode) ? PropsWithRef<P>
      : never;

   /**
    * Used to retrieve the props a component accepts without its ref. Can either be
    * passed a string, indicating a DOM element (e.g. 'div', 'span', etc.) or the
    * type of a React component.
    *
    * @see {@link https://react-typescript-cheatsheet.netlify.app/docs/react-types/componentprops/ React TypeScript Cheatsheet}
    *
    * @example
    *
    * ```tsx
    * // Retrieves the props an 'input' element accepts
    * type InputProps = React.ComponentPropsWithoutRef<'input'>;
    * ```
    *
    * @example
    *
    * ```tsx
    * const MyComponent = (props: { foo: number, bar: string }) => <div />;
    *
    * // Retrieves the props 'MyComponent' accepts
    * type MyComponentPropsWithoutRef = React.ComponentPropsWithoutRef<typeof MyComponent>;
    * ```
    */
   // type ComponentPropsWithoutRef<T extends ElementType> = PropsWithoutRef<ComponentProps<T>>;

   // type ComponentRef<T extends ElementType> = T extends NamedExoticComponent<
   //     ComponentPropsWithoutRef<T> & RefAttributes<infer Method>
   // > ? Method
   //     : ComponentPropsWithRef<T> extends RefAttributes<infer Method> ? Method
   //     : never;

   // will show `Memo(${Component.displayName || Component.name})` in devtools by default,
   // but can be given its own specific name

   //$$$
   type MemoExoticComponent<T extends ComponentType<any>> = NamedExoticComponent<CustomComponentPropsWithRef<T>> & {
      readonly type: T;
   };

   //$$$
   interface LazyExoticComponent<T extends ComponentType<any>>
      extends ExoticComponent<CustomComponentPropsWithRef<T>> {
      readonly _result: T;
   }




   //
   // Event System
   // ----------------------------------------------------------------------
   // TODO: change any to unknown when moving to TS v3
   interface BaseSyntheticEvent<E = object, C = any, T = any> {
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
      targets(...args: (string | $Node)[]): boolean // Lumo edit
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

   type EventHandler<E extends SyntheticEvent<any>> = { bivarianceHack(event: E): void }["bivarianceHack"];

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

   //
   // Props / DOM Attributes
   // ----------------------------------------------------------------------

   interface HTMLProps<T> extends AllHTMLAttributes<T>, ClassAttributes<T> {
   }

   //$$$
   type DetailedHTMLProps<E extends HTMLAttributes<T>, T> = ClassAttributes<T> & E;

   interface SVGProps<T> extends SVGAttributes<T>, ClassAttributes<T> {
   }

   interface SVGLineElementAttributes<T> extends SVGProps<T> { }
   interface SVGTextElementAttributes<T> extends SVGProps<T> { }


   //$$$
   type DOMAttributes<T> = _DOMAttributes<T> & DOMEvents<T> & LumoHooks<T>

   //$$$
   interface _DOMAttributes<T> {
      children?: Lumo.JSXNode | undefined | null;
   }

   type LifecycleTask<T> = (element: T) => void

   interface LumoHooks<T> {
      'at:mounted'?: LifecycleTask<T>
      'at:unmount'?: LifecycleTask<T>
   }

   //$$$
   interface DOMEvents<T> {// Clipboard Events
      'on'?: any;
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
      // React-specific Attributes
      defaultChecked?: boolean | undefined;
      defaultValue?: string | number | readonly string[] | undefined;
      // suppressContentEditableWarning?: boolean | undefined;
      // suppressHydrationWarning?: boolean | undefined;

      // Standard HTML Attributes
      // class?: string | undefined | ((o: DOMTokenList) => void) | (((o: DOMTokenList) => void) | string)[]; // #LUMO-EDIT
      // style?: CSSProperties | undefined | ((o: CSSStyleDeclaration) => void) | (((o: CSSStyleDeclaration) => void) | string)[]; // #LUMO-EDIT
      contenteditable?: Booleanish | "inherit" | "plaintext-only" | undefined;
      contextmenu?: string | undefined;
      draggable?: Booleanish | undefined;
      id?: string | undefined;
      is?: string | undefined;
      slot?: string | undefined;
      spellcheck?: Booleanish | undefined;
      translate?: "yes" | "no" | undefined;
      lang?: string | undefined; // Specifies the language of the element's content
      nonce?: string | undefined; // A cryptographic nonce for inline scripts
      part?: string | undefined; // Specifies parts of the element for styling
      tabindex?: number | undefined; // Defines the tab order of the element
      title?: string | undefined; // Additional information displayed as a tooltip
      inert?: boolean | undefined; // Prevents user interaction with the element
      itemid?: string | undefined; // Defines the item's ID in microdata
      itemprop?: string | undefined; // Specifies the item's property in microdata
      itemref?: string | undefined; // References additional microdata items
      itemscope?: boolean | undefined; // Declares the scope of an item
      itemtype?: string | undefined; // Specifies the type of an item in microdata

      accesskey?: string | undefined; // Defines a keyboard shortcut to activate/focus an element
      autocapitalize?: "off" | "none" | "on" | "sentences" | "words" | "characters" | undefined; // Controls capitalization behavior
      autofocus?: boolean | undefined; // Automatically focuses the element
      dir?: "ltr" | "rtl" | "auto" | undefined; // Specifies the text direction
      enterkeyhint?:
      "enter"
      | "done"
      | "go"
      | "next"
      | "previous"
      | "search"
      | "send"
      | undefined; // Hint for virtual keyboards
      hidden?: boolean | "until-found" | undefined; // Hides the element

      // Unknown
      // radiogroup?: string | undefined; // <command>, <menuitem>

      // WAI-ARIA
      role?: AriaRole | undefined;

      // RDFa Attributes
      about?: string | undefined;
      content?: string | undefined;
      datatype?: string | undefined;
      inlist?: any;
      prefix?: string | undefined;
      property?: string | undefined;
      rel?: string | undefined;
      resource?: string | undefined;
      rev?: string | undefined;
      typeof?: string | undefined;
      vocab?: string | undefined;

      // Non-standard Attributes
      autocorrect?: string | undefined;
      autosave?: string | undefined;
      color?: string | undefined;
      results?: number | undefined;
      security?: string | undefined;
      unselectable?: "on" | "off" | undefined;

      // Living Standard
      /**
       * Hints at the type of data that might be entered by the user while editing the element or its contents
       * @see {@link https://html.spec.whatwg.org/multipage/interaction.html#input-modalities:-the-inputmode-attribute}
       */
      inputmode?: "none" | "text" | "tel" | "url" | "email" | "numeric" | "decimal" | "search" | undefined;
      /**
       * Specify that a standard HTML element should behave like a defined custom built-in element
       * @see {@link https://html.spec.whatwg.org/multipage/custom-elements.html#attr-is}
       */

      // added
      scrolltop?: number | undefined;
      scrollleft?: number | undefined;

      innerHTML?: Lumo.MaybeIon<string>
   }

   /**
    * For internal usage only.
    * Different release channels declare additional types of JSXNode this particular release channel accepts.
    * App or library types should never augment this interface.
    */

   interface AllHTMLAttributes<T> extends HTMLAttributes<T> {
      // Standard HTML Attributes
      accept?: string | undefined;
      acceptCharset?: string | undefined;
      action?:
      | string
      | undefined
      ;
      allowFullScreen?: boolean | undefined;
      allowTransparency?: boolean | undefined;
      alt?: string | undefined;
      as?: string | undefined;
      async?: boolean | undefined;
      autoComplete?: string | undefined;
      autoPlay?: boolean | undefined;
      capture?: boolean | "user" | "environment" | undefined;
      cellPadding?: number | string | undefined;
      cellSpacing?: number | string | undefined;
      charSet?: string | undefined;
      challenge?: string | undefined;
      checked?: boolean | undefined;
      cite?: string | undefined;
      classID?: string | undefined;
      cols?: number | undefined;
      colSpan?: number | undefined;
      controls?: boolean | undefined;
      coords?: string | undefined;
      crossOrigin?: CrossOrigin;
      data?: string | undefined;
      dateTime?: string | undefined;
      default?: boolean | undefined;
      defer?: boolean | undefined;
      disabled?: boolean | undefined;
      download?: any;
      encType?: string | undefined;
      form?: string | undefined;
      formAction?:
      | string
      | undefined;
      formEncType?: string | undefined;
      formMethod?: string | undefined;
      formNoValidate?: boolean | undefined;
      formTarget?: string | undefined;
      frameBorder?: number | string | undefined;
      headers?: string | undefined;
      height?: number | string | undefined;
      high?: number | undefined;
      href?: string | undefined;
      hrefLang?: string | undefined;
      htmlFor?: string | undefined;
      httpEquiv?: string | undefined;
      integrity?: string | undefined;
      keyParams?: string | undefined;
      keyType?: string | undefined;
      kind?: string | undefined;
      label?: string | undefined;
      list?: string | undefined;
      loop?: boolean | undefined;
      low?: number | undefined;
      manifest?: string | undefined;
      marginHeight?: number | undefined;
      marginWidth?: number | undefined;
      max?: number | string | undefined;
      maxLength?: number | undefined;
      media?: string | undefined;
      mediaGroup?: string | undefined;
      method?: string | undefined;
      min?: number | string | undefined;
      minLength?: number | undefined;
      multiple?: boolean | undefined;
      muted?: boolean | undefined;
      name?: string | undefined;
      noValidate?: boolean | undefined;
      open?: boolean | undefined;
      optimum?: number | undefined;
      pattern?: string | undefined;
      placeholder?: string | undefined;
      playsInline?: boolean | undefined;
      poster?: string | undefined;
      preload?: string | undefined;
      readOnly?: boolean | undefined;
      required?: boolean | undefined;
      reversed?: boolean | undefined;
      rows?: number | undefined;
      rowSpan?: number | undefined;
      sandbox?: string | undefined;
      scope?: string | undefined;
      scoped?: boolean | undefined;
      scrolling?: string | undefined;
      seamless?: boolean | undefined;
      selected?: boolean | undefined;
      shape?: string | undefined;
      size?: number | undefined;
      sizes?: string | undefined;
      span?: number | undefined;
      src?: string | undefined;
      srcDoc?: string | undefined;
      srcLang?: string | undefined;
      srcSet?: string | undefined;
      start?: number | undefined;
      step?: number | string | undefined;
      summary?: string | undefined;
      target?: string | undefined;
      type?: string | undefined;
      useMap?: string | undefined;
      value?: string | readonly string[] | number | undefined;
      width?: number | string | undefined;
      wmode?: string | undefined;
      wrap?: string | undefined;
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
      download?: any;
      href?: string | undefined;
      hrefLang?: string | undefined;
      media?: string | undefined;
      ping?: string | undefined;
      target?: HTMLAttributeAnchorTarget | undefined;
      type?: string | undefined;
      referrerPolicy?: HTMLAttributeReferrerPolicy | undefined;
   }

   interface AudioHTMLAttributes<T> extends MediaHTMLAttributes<T> { }

   interface AreaHTMLAttributes<T> extends HTMLAttributes<T> {
      alt?: string | undefined;
      coords?: string | undefined;
      download?: any;
      href?: string | undefined;
      hrefLang?: string | undefined;
      media?: string | undefined;
      referrerPolicy?: HTMLAttributeReferrerPolicy | undefined;
      shape?: string | undefined;
      target?: string | undefined;
   }

   interface BaseHTMLAttributes<T> extends HTMLAttributes<T> {
      href?: string | undefined;
      target?: string | undefined;
   }

   interface BlockquoteHTMLAttributes<T> extends HTMLAttributes<T> {
      cite?: string | undefined;
   }

   interface ButtonHTMLAttributes<T> extends HTMLAttributes<T> {
      disabled?: boolean | undefined;
      form?: string | undefined;
      formAction?:
      | string
      | DO_NOT_USE_OR_YOU_WILL_BE_FIRED_EXPERIMENTAL_FORM_ACTIONS[
      keyof DO_NOT_USE_OR_YOU_WILL_BE_FIRED_EXPERIMENTAL_FORM_ACTIONS
      ]
      | undefined;
      formEncType?: string | undefined;
      formMethod?: string | undefined;
      formNoValidate?: boolean | undefined;
      formTarget?: string | undefined;
      name?: string | undefined;
      type?: "submit" | "reset" | "button" | undefined;
      value?: string | readonly string[] | number | undefined;
   }

   interface CanvasHTMLAttributes<T> extends HTMLAttributes<T> {
      height?: number | string | undefined;
      width?: number | string | undefined;
   }

   interface ColHTMLAttributes<T> extends HTMLAttributes<T> {
      span?: number | undefined;
      width?: number | string | undefined;
   }

   interface ColgroupHTMLAttributes<T> extends HTMLAttributes<T> {
      span?: number | undefined;
   }

   interface DataHTMLAttributes<T> extends HTMLAttributes<T> {
      value?: string | readonly string[] | number | undefined;
   }

   interface DetailsHTMLAttributes<T> extends HTMLAttributes<T> {
      open?: boolean | undefined;
      onToggle?: ReactEventHandler<T> | undefined;
      name?: string | undefined;
   }

   interface DelHTMLAttributes<T> extends HTMLAttributes<T> {
      cite?: string | undefined;
      dateTime?: string | undefined;
   }

   interface DialogHTMLAttributes<T> extends HTMLAttributes<T> {
      onCancel?: ReactEventHandler<T> | undefined;
      onClose?: ReactEventHandler<T> | undefined;
      open?: boolean | undefined;
   }

   interface EmbedHTMLAttributes<T> extends HTMLAttributes<T> {
      height?: number | string | undefined;
      src?: string | undefined;
      type?: string | undefined;
      width?: number | string | undefined;
   }

   interface FieldsetHTMLAttributes<T> extends HTMLAttributes<T> {
      disabled?: boolean | undefined;
      form?: string | undefined;
      name?: string | undefined;
   }

   interface FormHTMLAttributes<T> extends HTMLAttributes<T> {
      acceptCharset?: string | undefined;
      action?:
      | string
      | undefined
      | DO_NOT_USE_OR_YOU_WILL_BE_FIRED_EXPERIMENTAL_FORM_ACTIONS[
      keyof DO_NOT_USE_OR_YOU_WILL_BE_FIRED_EXPERIMENTAL_FORM_ACTIONS
      ];
      autoComplete?: string | undefined;
      encType?: string | undefined;
      method?: string | undefined;
      name?: string | undefined;
      noValidate?: boolean | undefined;
      target?: string | undefined;
   }

   interface HtmlHTMLAttributes<T> extends HTMLAttributes<T> {
      manifest?: string | undefined;
   }

   interface IframeHTMLAttributes<T> extends HTMLAttributes<T> {
      allow?: string | undefined;
      allowFullScreen?: boolean | undefined;
      allowTransparency?: boolean | undefined;
      /** @deprecated */
      frameBorder?: number | string | undefined;
      height?: number | string | undefined;
      loading?: "eager" | "lazy" | undefined;
      /** @deprecated */
      marginHeight?: number | undefined;
      /** @deprecated */
      marginWidth?: number | undefined;
      name?: string | undefined;
      referrerPolicy?: HTMLAttributeReferrerPolicy | undefined;
      sandbox?: string | undefined;
      /** @deprecated */
      scrolling?: string | undefined;
      seamless?: boolean | undefined;
      src?: string | undefined;
      srcDoc?: string | undefined;
      width?: number | string | undefined;
   }

   interface ImgHTMLAttributes<T> extends HTMLAttributes<T> {
      alt?: string | undefined;
      crossOrigin?: CrossOrigin;
      decoding?: "async" | "auto" | "sync" | undefined;
      fetchPriority?: "high" | "low" | "auto";
      height?: number | string | undefined;
      loading?: "eager" | "lazy" | undefined;
      referrerPolicy?: HTMLAttributeReferrerPolicy | undefined;
      sizes?: string | undefined;
      src?: string | undefined;
      srcSet?: string | undefined;
      useMap?: string | undefined;
      width?: number | string | undefined;
   }

   interface InsHTMLAttributes<T> extends HTMLAttributes<T> {
      cite?: string | undefined;
      dateTime?: string | undefined;
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
      accept?: string | undefined;
      alt?: string | undefined;
      autoComplete?: HTMLInputAutoCompleteAttribute | undefined;
      capture?: boolean | "user" | "environment" | undefined; // https://www.w3.org/TR/html-media-capture/#the-capture-attribute
      checked?: boolean | undefined;
      disabled?: boolean | undefined;
      enterKeyHint?: "enter" | "done" | "go" | "next" | "previous" | "search" | "send" | undefined;
      form?: string | undefined;
      formAction?: string | undefined;
      formEncType?: string | undefined;
      formMethod?: string | undefined;
      formNoValidate?: boolean | undefined;
      formTarget?: string | undefined;
      height?: number | string | undefined;
      list?: string | undefined;
      max?: number | string | undefined;
      maxLength?: number | undefined;
      min?: number | string | undefined;
      minLength?: number | undefined;
      multiple?: boolean | undefined;
      name?: string | undefined;
      pattern?: string | undefined;
      placeholder?: string | undefined;
      readOnly?: boolean | undefined;
      required?: boolean | undefined;
      size?: number | undefined;
      src?: string | undefined;
      step?: number | string | undefined;
      type?: HTMLInputTypeAttribute | undefined;
      value?: string | readonly string[] | number | undefined;
      width?: number | string | undefined;

      'mu:value'?: Quarky.AtomicIon<any, { value: any; }> | Quarky.Ion<any, { set: (value: any) => unknown }>
      'mu:checked'?: Quarky.AtomicIon<Booleanny, { value: Booleanny; }> | Quarky.Ion<Booleanny, { set: (value: Booleanny) => unknown }>
   }


   interface KeygenHTMLAttributes<T> extends HTMLAttributes<T> {
      challenge?: string | undefined;
      disabled?: boolean | undefined;
      form?: string | undefined;
      keyType?: string | undefined;
      keyParams?: string | undefined;
      name?: string | undefined;
   }

   interface LabelHTMLAttributes<T> extends HTMLAttributes<T> {
      form?: string | undefined;
      for?: string | undefined;
   }

   interface LiHTMLAttributes<T> extends HTMLAttributes<T> {
      value?: string | readonly string[] | number | undefined;
   }

   interface LinkHTMLAttributes<T> extends HTMLAttributes<T> {
      as?: string | undefined;
      crossOrigin?: CrossOrigin;
      fetchPriority?: "high" | "low" | "auto";
      href?: string | undefined;
      hrefLang?: string | undefined;
      integrity?: string | undefined;
      media?: string | undefined;
      imageSrcSet?: string | undefined;
      imageSizes?: string | undefined;
      referrerPolicy?: HTMLAttributeReferrerPolicy | undefined;
      sizes?: string | undefined;
      type?: string | undefined;
      charSet?: string | undefined;
   }

   interface MapHTMLAttributes<T> extends HTMLAttributes<T> {
      name?: string | undefined;
   }

   interface MenuHTMLAttributes<T> extends HTMLAttributes<T> {
      type?: string | undefined;
   }

   interface MediaHTMLAttributes<T> extends HTMLAttributes<T> {
      autoPlay?: boolean | undefined;
      controls?: boolean | undefined;
      controlsList?: string | undefined;
      crossOrigin?: CrossOrigin;
      loop?: boolean | undefined;
      mediaGroup?: string | undefined;
      muted?: boolean | undefined;
      playsInline?: boolean | undefined;
      preload?: string | undefined;
      src?: string | undefined;
   }

   interface MetaHTMLAttributes<T> extends HTMLAttributes<T> {
      charSet?: string | undefined;
      content?: string | undefined;
      httpEquiv?: string | undefined;
      media?: string | undefined;
      name?: string | undefined;
   }

   interface MeterHTMLAttributes<T> extends HTMLAttributes<T> {
      form?: string | undefined;
      high?: number | undefined;
      low?: number | undefined;
      max?: number | string | undefined;
      min?: number | string | undefined;
      optimum?: number | undefined;
      value?: string | readonly string[] | number | undefined;
   }

   interface QuoteHTMLAttributes<T> extends HTMLAttributes<T> {
      cite?: string | undefined;
   }

   interface ObjectHTMLAttributes<T> extends HTMLAttributes<T> {
      classID?: string | undefined;
      data?: string | undefined;
      form?: string | undefined;
      height?: number | string | undefined;
      name?: string | undefined;
      type?: string | undefined;
      useMap?: string | undefined;
      width?: number | string | undefined;
      wmode?: string | undefined;
   }

   interface OlHTMLAttributes<T> extends HTMLAttributes<T> {
      reversed?: boolean | undefined;
      start?: number | undefined;
      type?: "1" | "a" | "A" | "i" | "I" | undefined;
   }

   interface OptgroupHTMLAttributes<T> extends HTMLAttributes<T> {
      disabled?: boolean | undefined;
      label?: string | undefined;
   }

   interface OptionHTMLAttributes<T> extends HTMLAttributes<T> {
      disabled?: boolean | undefined;
      label?: string | undefined;
      selected?: boolean | undefined;
      value?: string | readonly string[] | number | undefined;
   }

   interface OutputHTMLAttributes<T> extends HTMLAttributes<T> {
      form?: string | undefined;
      htmlFor?: string | undefined;
      name?: string | undefined;
   }

   interface ParamHTMLAttributes<T> extends HTMLAttributes<T> {
      name?: string | undefined;
      value?: string | readonly string[] | number | undefined;
   }

   interface ProgressHTMLAttributes<T> extends HTMLAttributes<T> {
      max?: number | string | undefined;
      value?: string | readonly string[] | number | undefined;
   }

   interface SlotHTMLAttributes<T> extends HTMLAttributes<T> {
      name?: string | undefined;
   }

   interface ScriptHTMLAttributes<T> extends HTMLAttributes<T> {
      async?: boolean | undefined;
      /** @deprecated */
      charSet?: string | undefined;
      crossOrigin?: CrossOrigin;
      defer?: boolean | undefined;
      integrity?: string | undefined;
      noModule?: boolean | undefined;
      referrerPolicy?: HTMLAttributeReferrerPolicy | undefined;
      src?: string | undefined;
      type?: string | undefined;
   }

   interface SelectHTMLAttributes<T> extends HTMLAttributes<T> {
      autoComplete?: string | undefined;
      disabled?: boolean | undefined;
      form?: string | undefined;
      multiple?: boolean | undefined;
      name?: string | undefined;
      required?: boolean | undefined;
      size?: number | undefined;
      value?: string | readonly string[] | number | undefined;
      'on:change'?: ChangeEventHandler<T> | undefined;
      'mu:value'?: Quarky.AtomicIon<string, { state: string; }> | Quarky.Ion<string, { set: (value: string) => unknown }>
   }

   interface SourceHTMLAttributes<T> extends HTMLAttributes<T> {
      height?: number | string | undefined;
      media?: string | undefined;
      sizes?: string | undefined;
      src?: string | undefined;
      srcSet?: string | undefined;
      type?: string | undefined;
      width?: number | string | undefined;
   }

   interface StyleHTMLAttributes<T> extends HTMLAttributes<T> {
      media?: string | undefined;
      scoped?: boolean | undefined;
      type?: string | undefined;
   }

   interface TableHTMLAttributes<T> extends HTMLAttributes<T> {
      align?: "left" | "center" | "right" | undefined;
      bgcolor?: string | undefined;
      border?: number | undefined;
      cellPadding?: number | string | undefined;
      cellSpacing?: number | string | undefined;
      frame?: boolean | undefined;
      rules?: "none" | "groups" | "rows" | "columns" | "all" | undefined;
      summary?: string | undefined;
      width?: number | string | undefined;
   }

   interface TextareaHTMLAttributes<T> extends HTMLAttributes<T> {
      autoComplete?: string | undefined;
      cols?: number | undefined;
      dirName?: string | undefined;
      disabled?: boolean | undefined;
      form?: string | undefined;
      maxLength?: number | undefined;
      minLength?: number | undefined;
      name?: string | undefined;
      placeholder?: string | undefined;
      readOnly?: boolean | undefined;
      required?: boolean | undefined;
      rows?: number | undefined;
      value?: string | readonly string[] | number | undefined;
      wrap?: string | undefined;

      'mu:value'?: Quarky.AtomicIon<string, { state: string; }> | Quarky.Ion<string, { set: (value: string) => unknown }>
      'on:change'?: ChangeEventHandler<T> | undefined;
   }

   interface TdHTMLAttributes<T> extends HTMLAttributes<T> {
      align?: "left" | "center" | "right" | "justify" | "char" | undefined;
      colSpan?: number | undefined;
      headers?: string | undefined;
      rowSpan?: number | undefined;
      scope?: string | undefined;
      abbr?: string | undefined;
      height?: number | string | undefined;
      width?: number | string | undefined;
      valign?: "top" | "middle" | "bottom" | "baseline" | undefined;
   }

   interface ThHTMLAttributes<T> extends HTMLAttributes<T> {
      align?: "left" | "center" | "right" | "justify" | "char" | undefined;
      colSpan?: number | undefined;
      headers?: string | undefined;
      rowSpan?: number | undefined;
      scope?: string | undefined;
      abbr?: string | undefined;
   }

   interface TimeHTMLAttributes<T> extends HTMLAttributes<T> {
      dateTime?: string | undefined;
   }

   interface TrackHTMLAttributes<T> extends HTMLAttributes<T> {
      default?: boolean | undefined;
      kind?: string | undefined;
      label?: string | undefined;
      src?: string | undefined;
      srcLang?: string | undefined;
   }

   interface VideoHTMLAttributes<T> extends MediaHTMLAttributes<T> {
      height?: number | string | undefined;
      playsInline?: boolean | undefined;
      poster?: string | undefined;
      width?: number | string | undefined;
      disablePictureInPicture?: boolean | undefined;
      disableRemotePlayback?: boolean | undefined;
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
      suppressHydrationWarning?: boolean | undefined;

      // Attributes which also defined in HTMLAttributes
      // See comment in SVGDOMPropertyConfig.js
      className?: string | undefined;
      color?: string | undefined;
      height?: number | string | undefined;
      id?: string | undefined;
      lang?: string | undefined;
      max?: number | string | undefined;
      media?: string | undefined;
      method?: string | undefined;
      min?: number | string | undefined;
      name?: string | undefined;
      style?: CSSProperties | undefined;
      target?: string | undefined;
      type?: string | undefined;
      width?: number | string | undefined;

      // Other HTML properties supported by SVG elements in browsers
      role?: AriaRole | undefined;
      tabIndex?: number | undefined;
      crossOrigin?: CrossOrigin;

      // SVG Specific attributes
      accentHeight?: number | string | undefined;
      accumulate?: "none" | "sum" | undefined;
      additive?: "replace" | "sum" | undefined;
      alignmentBaseline?:
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
      | undefined;
      allowReorder?: "no" | "yes" | undefined;
      alphabetic?: number | string | undefined;
      amplitude?: number | string | undefined;
      arabicForm?: "initial" | "medial" | "terminal" | "isolated" | undefined;
      ascent?: number | string | undefined;
      attributeName?: string | undefined;
      attributeType?: string | undefined;
      autoReverse?: Booleanish | undefined;
      azimuth?: number | string | undefined;
      baseFrequency?: number | string | undefined;
      baselineShift?: number | string | undefined;
      baseProfile?: number | string | undefined;
      bbox?: number | string | undefined;
      begin?: number | string | undefined;
      bias?: number | string | undefined;
      by?: number | string | undefined;
      calcMode?: number | string | undefined;
      capHeight?: number | string | undefined;
      clip?: number | string | undefined;
      clipPath?: string | undefined;
      clipPathUnits?: number | string | undefined;
      clipRule?: number | string | undefined;
      colorInterpolation?: number | string | undefined;
      colorInterpolationFilters?: "auto" | "sRGB" | "linearRGB" | "inherit" | undefined;
      colorProfile?: number | string | undefined;
      colorRendering?: number | string | undefined;
      contentScriptType?: number | string | undefined;
      contentStyleType?: number | string | undefined;
      cursor?: number | string | undefined;
      cx?: number | string | undefined;
      cy?: number | string | undefined;
      d?: string | undefined;
      decelerate?: number | string | undefined;
      descent?: number | string | undefined;
      diffuseConstant?: number | string | undefined;
      direction?: number | string | undefined;
      display?: number | string | undefined;
      divisor?: number | string | undefined;
      dominantBaseline?: number | string | undefined;
      dur?: number | string | undefined;
      dx?: number | string | undefined;
      dy?: number | string | undefined;
      edgeMode?: number | string | undefined;
      elevation?: number | string | undefined;
      enableBackground?: number | string | undefined;
      end?: number | string | undefined;
      exponent?: number | string | undefined;
      externalResourcesRequired?: Booleanish | undefined;
      fill?: string | undefined;
      fillOpacity?: number | string | undefined;
      fillRule?: "nonzero" | "evenodd" | "inherit" | undefined;
      filter?: string | undefined;
      filterRes?: number | string | undefined;
      filterUnits?: number | string | undefined;
      floodColor?: number | string | undefined;
      floodOpacity?: number | string | undefined;
      focusable?: Booleanish | "auto" | undefined;
      fontFamily?: string | undefined;
      fontSize?: number | string | undefined;
      fontSizeAdjust?: number | string | undefined;
      fontStretch?: number | string | undefined;
      fontStyle?: number | string | undefined;
      fontVariant?: number | string | undefined;
      fontWeight?: number | string | undefined;
      format?: number | string | undefined;
      fr?: number | string | undefined;
      from?: number | string | undefined;
      fx?: number | string | undefined;
      fy?: number | string | undefined;
      g1?: number | string | undefined;
      g2?: number | string | undefined;
      glyphName?: number | string | undefined;
      glyphOrientationHorizontal?: number | string | undefined;
      glyphOrientationVertical?: number | string | undefined;
      glyphRef?: number | string | undefined;
      gradientTransform?: string | undefined;
      gradientUnits?: string | undefined;
      hanging?: number | string | undefined;
      horizAdvX?: number | string | undefined;
      horizOriginX?: number | string | undefined;
      href?: string | undefined;
      ideographic?: number | string | undefined;
      imageRendering?: number | string | undefined;
      in2?: number | string | undefined;
      in?: string | undefined;
      intercept?: number | string | undefined;
      k1?: number | string | undefined;
      k2?: number | string | undefined;
      k3?: number | string | undefined;
      k4?: number | string | undefined;
      k?: number | string | undefined;
      kernelMatrix?: number | string | undefined;
      kernelUnitLength?: number | string | undefined;
      kerning?: number | string | undefined;
      keyPoints?: number | string | undefined;
      keySplines?: number | string | undefined;
      keyTimes?: number | string | undefined;
      lengthAdjust?: number | string | undefined;
      letterSpacing?: number | string | undefined;
      lightingColor?: number | string | undefined;
      limitingConeAngle?: number | string | undefined;
      local?: number | string | undefined;
      markerEnd?: string | undefined;
      markerHeight?: number | string | undefined;
      markerMid?: string | undefined;
      markerStart?: string | undefined;
      markerUnits?: number | string | undefined;
      markerWidth?: number | string | undefined;
      mask?: string | undefined;
      maskContentUnits?: number | string | undefined;
      maskUnits?: number | string | undefined;
      mathematical?: number | string | undefined;
      mode?: number | string | undefined;
      numOctaves?: number | string | undefined;
      offset?: number | string | undefined;
      opacity?: number | string | undefined;
      operator?: number | string | undefined;
      order?: number | string | undefined;
      orient?: number | string | undefined;
      orientation?: number | string | undefined;
      origin?: number | string | undefined;
      overflow?: number | string | undefined;
      overlinePosition?: number | string | undefined;
      overlineThickness?: number | string | undefined;
      paintOrder?: number | string | undefined;
      panose1?: number | string | undefined;
      path?: string | undefined;
      pathLength?: number | string | undefined;
      patternContentUnits?: string | undefined;
      patternTransform?: number | string | undefined;
      patternUnits?: string | undefined;
      pointerEvents?: number | string | undefined;
      points?: string | undefined;
      pointsAtX?: number | string | undefined;
      pointsAtY?: number | string | undefined;
      pointsAtZ?: number | string | undefined;
      preserveAlpha?: Booleanish | undefined;
      preserveAspectRatio?: string | undefined;
      primitiveUnits?: number | string | undefined;
      r?: number | string | undefined;
      radius?: number | string | undefined;
      refX?: number | string | undefined;
      refY?: number | string | undefined;
      renderingIntent?: number | string | undefined;
      repeatCount?: number | string | undefined;
      repeatDur?: number | string | undefined;
      requiredExtensions?: number | string | undefined;
      requiredFeatures?: number | string | undefined;
      restart?: number | string | undefined;
      result?: string | undefined;
      rotate?: number | string | undefined;
      rx?: number | string | undefined;
      ry?: number | string | undefined;
      scale?: number | string | undefined;
      seed?: number | string | undefined;
      shapeRendering?: number | string | undefined;
      slope?: number | string | undefined;
      spacing?: number | string | undefined;
      specularConstant?: number | string | undefined;
      specularExponent?: number | string | undefined;
      speed?: number | string | undefined;
      spreadMethod?: string | undefined;
      startOffset?: number | string | undefined;
      stdDeviation?: number | string | undefined;
      stemh?: number | string | undefined;
      stemv?: number | string | undefined;
      stitchTiles?: number | string | undefined;
      stopColor?: string | undefined;
      stopOpacity?: number | string | undefined;
      strikethroughPosition?: number | string | undefined;
      strikethroughThickness?: number | string | undefined;
      string?: number | string | undefined;
      stroke?: string | undefined;
      strokeDasharray?: string | number | undefined;
      strokeDashoffset?: string | number | undefined;
      strokeLinecap?: "butt" | "round" | "square" | "inherit" | undefined;
      strokeLinejoin?: "miter" | "round" | "bevel" | "inherit" | undefined;
      strokeMiterlimit?: number | string | undefined;
      strokeOpacity?: number | string | undefined;
      strokeWidth?: number | string | undefined;
      surfaceScale?: number | string | undefined;
      systemLanguage?: number | string | undefined;
      tableValues?: number | string | undefined;
      targetX?: number | string | undefined;
      targetY?: number | string | undefined;
      textAnchor?: string | undefined;
      textDecoration?: number | string | undefined;
      textLength?: number | string | undefined;
      textRendering?: number | string | undefined;
      to?: number | string | undefined;
      transform?: string | undefined;
      u1?: number | string | undefined;
      u2?: number | string | undefined;
      underlinePosition?: number | string | undefined;
      underlineThickness?: number | string | undefined;
      unicode?: number | string | undefined;
      unicodeBidi?: number | string | undefined;
      unicodeRange?: number | string | undefined;
      unitsPerEm?: number | string | undefined;
      vAlphabetic?: number | string | undefined;
      values?: string | undefined;
      vectorEffect?: number | string | undefined;
      version?: string | undefined;
      vertAdvY?: number | string | undefined;
      vertOriginX?: number | string | undefined;
      vertOriginY?: number | string | undefined;
      vHanging?: number | string | undefined;
      vIdeographic?: number | string | undefined;
      viewBox?: string | undefined;
      viewTarget?: number | string | undefined;
      visibility?: number | string | undefined;
      vMathematical?: number | string | undefined;
      widths?: number | string | undefined;
      wordSpacing?: number | string | undefined;
      writingMode?: number | string | undefined;
      x1?: number | string | undefined;
      x2?: number | string | undefined;
      x?: number | string | undefined;
      xChannelSelector?: string | undefined;
      xHeight?: number | string | undefined;
      xlinkActuate?: string | undefined;
      xlinkArcrole?: string | undefined;
      xlinkHref?: string | undefined;
      xlinkRole?: string | undefined;
      xlinkShow?: string | undefined;
      xlinkTitle?: string | undefined;
      xlinkType?: string | undefined;
      xmlBase?: string | undefined;
      xmlLang?: string | undefined;
      xmlns?: string | undefined;
      xmlnsXlink?: string | undefined;
      xmlSpace?: string | undefined;
      y1?: number | string | undefined;
      y2?: number | string | undefined;
      y?: number | string | undefined;
      yChannelSelector?: string | undefined;
      z?: number | string | undefined;
      zoomAndPan?: string | undefined;
   }

   interface WebViewHTMLAttributes<T> extends HTMLAttributes<T> {
      allowFullScreen?: boolean | undefined;
      allowpopups?: boolean | undefined;
      autosize?: boolean | undefined;
      blinkfeatures?: string | undefined;
      disableblinkfeatures?: string | undefined;
      disableguestresize?: boolean | undefined;
      disablewebsecurity?: boolean | undefined;
      guestinstance?: string | undefined;
      httpreferrer?: string | undefined;
      nodeintegration?: boolean | undefined;
      partition?: string | undefined;
      plugins?: boolean | undefined;
      preload?: string | undefined;
      src?: string | undefined;
      useragent?: string | undefined;
      webpreferences?: string | undefined;
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

   interface ReactDOM extends ReactHTML, ReactSVG { }

   //
   // React.PropTypes
   // ----------------------------------------------------------------------

   /**
    * @deprecated Use `Validator` from the ´prop-types` instead.
    */
   type Validator<T> = PropTypes.Validator<T>;

   /**
    * @deprecated Use `Requireable` from the ´prop-types` instead.
    */
   type Requireable<T> = PropTypes.Requireable<T>;

   /**
    * @deprecated Use `ValidationMap` from the ´prop-types` instead.
    */
   type ValidationMap<T> = PropTypes.ValidationMap<T>;

   /**
    * @deprecated Use `WeakValidationMap` from the ´prop-types` instead.
    */
   type WeakValidationMap<T> = {
      [K in keyof T]?: null extends T[K] ? Validator<T[K] | null | undefined>
      : undefined extends T[K] ? Validator<T[K] | null | undefined>
      : Validator<T[K]>;
   };

   /**
    * @deprecated Use `PropTypes.*` where `PropTypes` comes from `import * as PropTypes from 'prop-types'` instead.
    */
   interface ReactPropTypes {
      any: typeof PropTypes.any;
      array: typeof PropTypes.array;
      bool: typeof PropTypes.bool;
      func: typeof PropTypes.func;
      number: typeof PropTypes.number;
      object: typeof PropTypes.object;
      string: typeof PropTypes.string;
      node: typeof PropTypes.node;
      element: typeof PropTypes.element;
      instanceOf: typeof PropTypes.instanceOf;
      oneOf: typeof PropTypes.oneOf;
      oneOfType: typeof PropTypes.oneOfType;
      arrayOf: typeof PropTypes.arrayOf;
      objectOf: typeof PropTypes.objectOf;
      shape: typeof PropTypes.shape;
      exact: typeof PropTypes.exact;
   }

   //
   // React.Children
   // ----------------------------------------------------------------------

   /**
    * @deprecated - Use `typeof React.Children` instead.
    */
   // Sync with type of `const Children`.
   // interface ReactChildren {
   //    map<T, C>(
   //       Slot: C | readonly C[],
   //       fn: (child: C, index: number) => T,
   //    ): C extends null | undefined ? C : Array<Exclude<T, boolean | null | undefined>>;
   //    forEach<C>(Slot: C | readonly C[], fn: (child: C, index: number) => void): void;
   //    count(Slot: any): number;
   //    only<C>(Slot: C): C extends any[] ? never : C;
   //    toArray(Slot: Lumo.JSXNode | Lumo.JSXNode[]): Array<Exclude<Lumo.JSXNode, boolean | null | undefined>>;
   // }

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

   //$$$
   // Keep in sync with JSX namespace in ./jsx-runtime.d.ts and ./jsx-dev-runtime.d.ts
   namespace JSX {
      type ElementType = GlobalJSXElementType;
      // interface Element extends GlobalJSXElement { }
      interface ElementClass extends GlobalJSXElementClass { }
      interface ElementAttributesProperty extends GlobalJSXElementAttributesProperty { }
      interface ElementChildrenAttribute extends GlobalJSXElementChildrenAttribute { }

      type LibraryManagedAttributes<C, P> = GlobalJSXLibraryManagedAttributes<C, P>;

      interface IntrinsicAttributes extends GlobalJSXIntrinsicAttributes { }
      interface IntrinsicClassAttributes<T> extends GlobalJSXIntrinsicClassAttributes<T> { }
      interface IntrinsicElements extends GlobalJSXIntrinsicElements { }
   }
}

// naked 'any' type in a conditional type will short circuit and union both the then/else branches
// so boolean is only resolved for T = any
type IsExactlyAny<T> = boolean extends (T extends never ? true : false) ? true : false;

type ExactlyAnyPropertyKeys<T> = { [K in keyof T]: IsExactlyAny<T[K]> extends true ? K : never }[keyof T];
type NotExactlyAnyPropertyKeys<T> = Exclude<keyof T, ExactlyAnyPropertyKeys<T>>;

// Try to resolve ill-defined props like for JS users: props can be any, or sometimes objects with properties of type any
type MergePropTypes<P, T> =
   // Distribute over P in case it is a union type
   P extends any
   // If props is type any, use propTypes definitions
   ? IsExactlyAny<P> extends true ? T
   // If declared props have indexed properties, ignore inferred props entirely as keyof gets widened
   : string extends keyof P ? P
   // Prefer declared types which are not exactly any
   :
   & Pick<P, NotExactlyAnyPropertyKeys<P>>
   // For props which are exactly any, use the type inferred from propTypes if present
   & Pick<T, Exclude<keyof T, NotExactlyAnyPropertyKeys<P>>>
   // Keep leftover props not specified in propTypes
   & Pick<P, Exclude<keyof P, keyof T>>
   : never;

type InexactPartial<T> = { [K in keyof T]?: T[K] | undefined };

// Any prop that has a default prop becomes optional, but its type is unchanged
// Undeclared default props are augmented into the resulting allowable attributes
// If declared props have indexed properties, ignore default props entirely as keyof gets widened
// Wrap in an outer-level conditional type to allow distribution over props that are unions
type Defaultize<P, D> = P extends any ? string extends keyof P ? P
   :
   & Pick<P, Exclude<keyof P, keyof D>>
   & InexactPartial<Pick<P, Extract<keyof P, keyof D>>>
   & InexactPartial<Pick<D, Exclude<keyof D, keyof P>>>
   : never;


type LumoAttributes<C, P> = P extends { '~attributes'?: infer A } ? A : P
// C extends { propTypes: infer T; defaultProps: infer D } ? Defaultize<MergePropTypes<P, PropTypes.InferProps<T>>, D> 
// : C extends { propTypes: infer T } ? MergePropTypes<P, PropTypes.InferProps<T>>
// : C extends { defaultProps: infer D } ? Defaultize<P, D>
// : P;


declare global {
   let $s;
   let $;
   /**
    * @deprecated Use `React.JSX` instead of the global `JSX` namespace.
    */
   namespace JSX {
      // We don't just alias React.ElementType because React.ElementType
      // historically does more than we need it to.
      // E.g. it also contains .propTypes and so TS also verifies the declared
      // props type does match the declared .propTypes.
      // But if libraries declared their .propTypes but not props type,
      // or they mismatch, you won't be able to use the class component
      // as a JSX.ElementType.
      // We could fix this everywhere but we're ultimately not interested in
      // .propTypes assignability so we might as well drop it entirely here to
      //  reduce the work of the type-checker.

      //$$$ Important
      type ElementType = string | React.JSXElementConstructor<any>;
      interface Element { }
      interface ElementAttributesProperty {
         props: {};
      }
      interface ElementChildrenAttribute {
         children: {};
      }

      //$$$ important for converting component input types to attribute types
      // We can't recurse forever because `type` can't be self-referential;
      // let's assume it's reasonable to do a single React.lazy() around a single React.memo() / vice-versa
      type LibraryManagedAttributes<C, P> =
         C extends React.MemoExoticComponent<infer T> | React.LazyExoticComponent<infer T> ?
         T extends React.MemoExoticComponent<infer U> | React.LazyExoticComponent<infer U> ?
         LumoAttributes<U, P>
         : LumoAttributes<T, P>
         : LumoAttributes<C, P>;

      //$$$
      interface IntrinsicAttributes extends React.Attributes {
         ref?: $Node | $Nodes //#LUMO-EDIT
         // children?: Lumo.InferSlot
      }
      interface IntrinsicClassAttributes<T> extends React.ClassAttributes<T> { }

      type CSSProperties = React.CSSProperties

      type Falsey = undefined | null | false;

      type StyleInput = Lumo.MaybeIon<string | Falsey> | Lumo.MaybeIon<{ [K in keyof Partial<CSSProperties>]: Lumo.MaybeIon<CSSProperties[K]> }>

      type ClassInput = Lumo.MaybeIon<{ [key: string]: Lumo.MaybeIon<Booleanny> }>

      type MaybeIonAttributes<T> = { [K in keyof T]: T[K] extends Object ? { [P in keyof T[K]]: T[K][P] extends Function | undefined ? T[K][P] : Lumo.MaybeIon<T[K][P]> } : T[K] }

      type IntrinsicElements = {
         [K in keyof JSX._IntrinsicElements]: MaybeIonAttributes<JSX._IntrinsicElements>[K] & {
            class?: ClassInput | Lumo.MaybeIon<string | Falsey> | (Lumo.MaybeIon<string | Falsey> | ClassInput)[];
            style?: StyleInput | StyleInput[];
            attributes?: ((o: HTMLElementTagNameMap[K]) => void) | ((o: HTMLElementTagNameMap[K]) => void)[];
         }
      } & LumoElements



      // type CommonsEntries<T> = {
      //     [K in keyof T]: K extends keyof CommonsKeyMap ? _ContextInputType<CommonsKeyMap[K]> : any;
      // }

      // type ContextNodeInput<T> = {
      //     with: T & CommonsEntries<T>,
      //     Slot: (() => JSXNode) | JSXNode
      // }

      interface LumoElements {
         'i--i': {}; //comments
         // 'o--portal': PortalNodeInput & { children: Lumo.Slot }

         'o--link': React.DetailedHTMLProps<React.LinkHTMLAttributes<HTMLLinkElement>, HTMLLinkElement>
         'show-hide': { children: ConditionalRenderKit[] | ConditionalRenderKit };
         'mount-remount': { children: ConditionalRenderKit[]; 'use:discard'?: () => void };
         'o--preserve': { children: ConditionalRenderKit[]; 'use:discard'?: () => void };
         'preserve-conditionals': { children: ConditionalRenderKit[]; 'use:discard'?: () => void };
         // 'Slot': {Slot: any}

         // 'o--suspense': SuspenseNodeInput & { children: Lumo.Slot };
         // 'o--try': TryNodeInput & { children: Lumo.Slot };

         // 'ooo-transit': React.DetailedHTMLProps<React.HTMLAttributes<HTMLDivElement> & TransitionNodeInput, HTMLDivElement>
         // 'ooo-transition': React.DetailedHTMLProps<React.HTMLAttributes<HTMLDivElement> & TransitionNodeInput & { morph?: true }, HTMLDivElement>
         'o--dock': React.DetailedHTMLProps<React.HTMLAttributes<HTMLDivElement> & TransitionNodeInput, HTMLDivElement>
      }



      interface _IntrinsicElements {
         // HTML
         a: React.DetailedHTMLProps<React.AnchorHTMLAttributes<HTMLAnchorElement>, HTMLAnchorElement>;
         abbr: React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
         address: React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
         area: React.DetailedHTMLProps<React.AreaHTMLAttributes<HTMLAreaElement>, HTMLAreaElement>;
         article: React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
         aside: React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
         audio: React.DetailedHTMLProps<React.AudioHTMLAttributes<HTMLAudioElement>, HTMLAudioElement>;
         b: React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
         base: React.DetailedHTMLProps<React.BaseHTMLAttributes<HTMLBaseElement>, HTMLBaseElement>;
         bdi: React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
         bdo: React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
         big: React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
         blockquote: React.DetailedHTMLProps<React.BlockquoteHTMLAttributes<HTMLQuoteElement>, HTMLQuoteElement>;
         body: React.DetailedHTMLProps<React.HTMLAttributes<HTMLBodyElement>, HTMLBodyElement>;
         br: React.DetailedHTMLProps<React.HTMLAttributes<HTMLBRElement>, HTMLBRElement>;
         button: React.DetailedHTMLProps<React.ButtonHTMLAttributes<HTMLButtonElement>, HTMLButtonElement>;
         canvas: React.DetailedHTMLProps<React.CanvasHTMLAttributes<HTMLCanvasElement>, HTMLCanvasElement>;
         caption: React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
         center: React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
         cite: React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
         code: React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
         col: React.DetailedHTMLProps<React.ColHTMLAttributes<HTMLTableColElement>, HTMLTableColElement>;
         colgroup: React.DetailedHTMLProps<React.ColgroupHTMLAttributes<HTMLTableColElement>, HTMLTableColElement>;
         data: React.DetailedHTMLProps<React.DataHTMLAttributes<HTMLDataElement>, HTMLDataElement>;
         datalist: React.DetailedHTMLProps<React.HTMLAttributes<HTMLDataListElement>, HTMLDataListElement>;
         dd: React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
         del: React.DetailedHTMLProps<React.DelHTMLAttributes<HTMLModElement>, HTMLModElement>;
         details: React.DetailedHTMLProps<React.DetailsHTMLAttributes<HTMLDetailsElement>, HTMLDetailsElement>;
         dfn: React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
         dialog: React.DetailedHTMLProps<React.DialogHTMLAttributes<HTMLDialogElement>, HTMLDialogElement>;
         div: React.DetailedHTMLProps<React.HTMLAttributes<HTMLDivElement>, HTMLDivElement>;
         dl: React.DetailedHTMLProps<React.HTMLAttributes<HTMLDListElement>, HTMLDListElement>;
         dt: React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
         em: React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
         embed: React.DetailedHTMLProps<React.EmbedHTMLAttributes<HTMLEmbedElement>, HTMLEmbedElement>;
         fieldset: React.DetailedHTMLProps<React.FieldsetHTMLAttributes<HTMLFieldSetElement>, HTMLFieldSetElement>;
         figcaption: React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
         figure: React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
         footer: React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
         form: React.DetailedHTMLProps<React.FormHTMLAttributes<HTMLFormElement>, HTMLFormElement>;
         h1: React.DetailedHTMLProps<React.HTMLAttributes<HTMLHeadingElement>, HTMLHeadingElement>;
         h2: React.DetailedHTMLProps<React.HTMLAttributes<HTMLHeadingElement>, HTMLHeadingElement>;
         h3: React.DetailedHTMLProps<React.HTMLAttributes<HTMLHeadingElement>, HTMLHeadingElement>;
         h4: React.DetailedHTMLProps<React.HTMLAttributes<HTMLHeadingElement>, HTMLHeadingElement>;
         h5: React.DetailedHTMLProps<React.HTMLAttributes<HTMLHeadingElement>, HTMLHeadingElement>;
         h6: React.DetailedHTMLProps<React.HTMLAttributes<HTMLHeadingElement>, HTMLHeadingElement>;
         head: React.DetailedHTMLProps<React.HTMLAttributes<HTMLHeadElement>, HTMLHeadElement>;
         header: React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
         hgroup: React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
         hr: React.DetailedHTMLProps<React.HTMLAttributes<HTMLHRElement>, HTMLHRElement>;
         html: React.DetailedHTMLProps<React.HtmlHTMLAttributes<HTMLHtmlElement>, HTMLHtmlElement>;
         i: React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
         iframe: React.DetailedHTMLProps<React.IframeHTMLAttributes<HTMLIFrameElement>, HTMLIFrameElement>;
         img: React.DetailedHTMLProps<React.ImgHTMLAttributes<HTMLImageElement>, HTMLImageElement>;
         input: React.DetailedHTMLProps<React.InputHTMLAttributes<HTMLInputElement>, HTMLInputElement>;
         ins: React.DetailedHTMLProps<React.InsHTMLAttributes<HTMLModElement>, HTMLModElement>;
         kbd: React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
         keygen: React.DetailedHTMLProps<React.KeygenHTMLAttributes<HTMLElement>, HTMLElement>;
         label: React.DetailedHTMLProps<React.LabelHTMLAttributes<HTMLLabelElement>, HTMLLabelElement>;
         legend: React.DetailedHTMLProps<React.HTMLAttributes<HTMLLegendElement>, HTMLLegendElement>;
         li: React.DetailedHTMLProps<React.LiHTMLAttributes<HTMLLIElement>, HTMLLIElement>;
         link: React.DetailedHTMLProps<React.LinkHTMLAttributes<HTMLLinkElement>, HTMLLinkElement>;
         main: React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
         map: React.DetailedHTMLProps<React.MapHTMLAttributes<HTMLMapElement>, HTMLMapElement>;
         mark: React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
         menu: React.DetailedHTMLProps<React.MenuHTMLAttributes<HTMLElement>, HTMLElement>;
         menuitem: React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
         meta: React.DetailedHTMLProps<React.MetaHTMLAttributes<HTMLMetaElement>, HTMLMetaElement>;
         meter: React.DetailedHTMLProps<React.MeterHTMLAttributes<HTMLMeterElement>, HTMLMeterElement>;
         nav: React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
         noindex: React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
         noscript: React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
         object: React.DetailedHTMLProps<React.ObjectHTMLAttributes<HTMLObjectElement>, HTMLObjectElement>;
         ol: React.DetailedHTMLProps<React.OlHTMLAttributes<HTMLOListElement>, HTMLOListElement>;
         optgroup: React.DetailedHTMLProps<React.OptgroupHTMLAttributes<HTMLOptGroupElement>, HTMLOptGroupElement>;
         option: React.DetailedHTMLProps<React.OptionHTMLAttributes<HTMLOptionElement>, HTMLOptionElement>;
         output: React.DetailedHTMLProps<React.OutputHTMLAttributes<HTMLOutputElement>, HTMLOutputElement>;
         p: React.DetailedHTMLProps<React.HTMLAttributes<HTMLParagraphElement>, HTMLParagraphElement>;
         param: React.DetailedHTMLProps<React.ParamHTMLAttributes<HTMLParamElement>, HTMLParamElement>;
         picture: React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
         pre: React.DetailedHTMLProps<React.HTMLAttributes<HTMLPreElement>, HTMLPreElement>;
         progress: React.DetailedHTMLProps<React.ProgressHTMLAttributes<HTMLProgressElement>, HTMLProgressElement>;
         q: React.DetailedHTMLProps<React.QuoteHTMLAttributes<HTMLQuoteElement>, HTMLQuoteElement>;
         rp: React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
         rt: React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
         ruby: React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
         s: React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
         samp: React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
         search: React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
         slot: React.DetailedHTMLProps<React.SlotHTMLAttributes<HTMLSlotElement>, HTMLSlotElement>;
         script: React.DetailedHTMLProps<React.ScriptHTMLAttributes<HTMLScriptElement>, HTMLScriptElement>;
         section: React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
         select: React.DetailedHTMLProps<React.SelectHTMLAttributes<HTMLSelectElement>, HTMLSelectElement>;
         small: React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
         source: React.DetailedHTMLProps<React.SourceHTMLAttributes<HTMLSourceElement>, HTMLSourceElement>;
         span: React.DetailedHTMLProps<React.HTMLAttributes<HTMLSpanElement>, HTMLSpanElement>;
         strong: React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
         style: React.DetailedHTMLProps<React.StyleHTMLAttributes<HTMLStyleElement>, HTMLStyleElement>;
         sub: React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
         summary: React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
         sup: React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
         table: React.DetailedHTMLProps<React.TableHTMLAttributes<HTMLTableElement>, HTMLTableElement>;
         template: React.DetailedHTMLProps<React.HTMLAttributes<HTMLTemplateElement>, HTMLTemplateElement>;
         tbody: React.DetailedHTMLProps<React.HTMLAttributes<HTMLTableSectionElement>, HTMLTableSectionElement>;
         td: React.DetailedHTMLProps<React.TdHTMLAttributes<HTMLTableDataCellElement>, HTMLTableDataCellElement>;
         textarea: React.DetailedHTMLProps<React.TextareaHTMLAttributes<HTMLTextAreaElement>, HTMLTextAreaElement>;
         tfoot: React.DetailedHTMLProps<React.HTMLAttributes<HTMLTableSectionElement>, HTMLTableSectionElement>;
         th: React.DetailedHTMLProps<React.ThHTMLAttributes<HTMLTableHeaderCellElement>, HTMLTableHeaderCellElement>;
         thead: React.DetailedHTMLProps<React.HTMLAttributes<HTMLTableSectionElement>, HTMLTableSectionElement>;
         time: React.DetailedHTMLProps<React.TimeHTMLAttributes<HTMLTimeElement>, HTMLTimeElement>;
         title: React.DetailedHTMLProps<React.HTMLAttributes<HTMLTitleElement>, HTMLTitleElement>;
         tr: React.DetailedHTMLProps<React.HTMLAttributes<HTMLTableRowElement>, HTMLTableRowElement>;
         track: React.DetailedHTMLProps<React.TrackHTMLAttributes<HTMLTrackElement>, HTMLTrackElement>;
         u: React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
         ul: React.DetailedHTMLProps<React.HTMLAttributes<HTMLUListElement>, HTMLUListElement>;
         "var": React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
         video: React.DetailedHTMLProps<React.VideoHTMLAttributes<HTMLVideoElement>, HTMLVideoElement>;
         wbr: React.DetailedHTMLProps<React.HTMLAttributes<HTMLElement>, HTMLElement>;
         webview: React.DetailedHTMLProps<React.WebViewHTMLAttributes<HTMLWebViewElement>, HTMLWebViewElement>;

         // SVG
         svg: React.SVGProps<SVGSVGElement>;

         animate: React.SVGProps<SVGElement>; // TODO: It is SVGAnimateElement but is not in TypeScript's lib.dom.d.ts for now.
         animateMotion: React.SVGProps<SVGElement>;
         animateTransform: React.SVGProps<SVGElement>; // TODO: It is SVGAnimateTransformElement but is not in TypeScript's lib.dom.d.ts for now.
         circle: React.SVGProps<SVGCircleElement>;
         clipPath: React.SVGProps<SVGClipPathElement>;
         defs: React.SVGProps<SVGDefsElement>;
         desc: React.SVGProps<SVGDescElement>;
         ellipse: React.SVGProps<SVGEllipseElement>;
         feBlend: React.SVGProps<SVGFEBlendElement>;
         feColorMatrix: React.SVGProps<SVGFEColorMatrixElement>;
         feComponentTransfer: React.SVGProps<SVGFEComponentTransferElement>;
         feComposite: React.SVGProps<SVGFECompositeElement>;
         feConvolveMatrix: React.SVGProps<SVGFEConvolveMatrixElement>;
         feDiffuseLighting: React.SVGProps<SVGFEDiffuseLightingElement>;
         feDisplacementMap: React.SVGProps<SVGFEDisplacementMapElement>;
         feDistantLight: React.SVGProps<SVGFEDistantLightElement>;
         feDropShadow: React.SVGProps<SVGFEDropShadowElement>;
         feFlood: React.SVGProps<SVGFEFloodElement>;
         feFuncA: React.SVGProps<SVGFEFuncAElement>;
         feFuncB: React.SVGProps<SVGFEFuncBElement>;
         feFuncG: React.SVGProps<SVGFEFuncGElement>;
         feFuncR: React.SVGProps<SVGFEFuncRElement>;
         feGaussianBlur: React.SVGProps<SVGFEGaussianBlurElement>;
         feImage: React.SVGProps<SVGFEImageElement>;
         feMerge: React.SVGProps<SVGFEMergeElement>;
         feMergeNode: React.SVGProps<SVGFEMergeNodeElement>;
         feMorphology: React.SVGProps<SVGFEMorphologyElement>;
         feOffset: React.SVGProps<SVGFEOffsetElement>;
         fePointLight: React.SVGProps<SVGFEPointLightElement>;
         feSpecularLighting: React.SVGProps<SVGFESpecularLightingElement>;
         feSpotLight: React.SVGProps<SVGFESpotLightElement>;
         feTile: React.SVGProps<SVGFETileElement>;
         feTurbulence: React.SVGProps<SVGFETurbulenceElement>;
         filter: React.SVGProps<SVGFilterElement>;
         foreignObject: React.SVGProps<SVGForeignObjectElement>;
         g: React.SVGProps<SVGGElement>;
         image: React.SVGProps<SVGImageElement>;
         line: React.SVGLineElementAttributes<SVGLineElement>;
         linearGradient: React.SVGProps<SVGLinearGradientElement>;
         marker: React.SVGProps<SVGMarkerElement>;
         mask: React.SVGProps<SVGMaskElement>;
         metadata: React.SVGProps<SVGMetadataElement>;
         mpath: React.SVGProps<SVGElement>;
         path: React.SVGProps<SVGPathElement>;
         pattern: React.SVGProps<SVGPatternElement>;
         polygon: React.SVGProps<SVGPolygonElement>;
         polyline: React.SVGProps<SVGPolylineElement>;
         radialGradient: React.SVGProps<SVGRadialGradientElement>;
         rect: React.SVGProps<SVGRectElement>;
         set: React.SVGProps<SVGSetElement>;
         stop: React.SVGProps<SVGStopElement>;
         switch: React.SVGProps<SVGSwitchElement>;
         symbol: React.SVGProps<SVGSymbolElement>;
         text: React.SVGTextElementAttributes<SVGTextElement>;
         textPath: React.SVGProps<SVGTextPathElement>;
         tspan: React.SVGProps<SVGTSpanElement>;
         use: React.SVGProps<SVGUseElement>;
         view: React.SVGProps<SVGViewElement>;

      }
   }
}

//$$$
// React.JSX needs to point to global.JSX to keep global module augmentations intact.
// But we can't access global.JSX so we need to create these aliases instead.
// Once the global JSX namespace will be removed we replace React.JSX with the contents of global.JSX
type GlobalJSXElementType = JSX.ElementType;
interface GlobalJSXElement extends JSX.Element { }
interface GlobalJSXElementClass extends JSX.ElementClass { }
interface GlobalJSXElementAttributesProperty extends JSX.ElementAttributesProperty { }
interface GlobalJSXElementChildrenAttribute extends JSX.ElementChildrenAttribute { }

type GlobalJSXLibraryManagedAttributes<C, P> = JSX.LibraryManagedAttributes<C, P>;

interface GlobalJSXIntrinsicAttributes extends JSX.IntrinsicAttributes { }
interface GlobalJSXIntrinsicClassAttributes<T> extends JSX.IntrinsicClassAttributes<T> { }

interface GlobalJSXIntrinsicElements extends JSX.IntrinsicElements { }
