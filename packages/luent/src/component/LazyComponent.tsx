import { ComponentTag } from "./Component";
import { Else, ElseIf, If } from "../conditional/If";
import { noop } from "@luent/utils";
import { createAtomicIon, ion } from "../../../quarky/src";
import { AnyObject } from "@luent/types";

const lazyComponents: Map<() => Promise<ComponentTag>, ComponentTag> = new Map()

export function lazyLoadComponent<P extends AnyObject>(config: {
  load: () => Promise<ComponentTag<P>>,
  onIdle?: boolean
  Placeholder?: ComponentTag,
  timeout?: number,
  Error?: ComponentTag<{ error: any }>,
}) { // TODO: Idle load priorities
  const { load, Error, Placeholder, timeout, onIdle } = config;
  const $loading = createAtomicIon(true);
  const $error = createAtomicIon("");
  const $loaded = createAtomicIon(false);
  let idleID: number | undefined;
  if (onIdle) {
    idleID = requestIdleCallback(() => {
      idleID = undefined;
      loadComponent()
    })
  }
  let Component: ComponentTag
  function loadComponent() {
    let timeoutID: any;
    if (idleID !== undefined) {
      cancelIdleCallback(idleID);
      idleID = undefined;
    }
    Component = lazyComponents.get(load) || noop as ComponentTag // if already loaded on idle, get from lazyComponents map
    if (Component === noop) {
      const pendingComponent = load();
      if (timeout) {
        timeoutID = setTimeout(() => {
          $error.value = "Timed out";
          $loading.value = false
        }, timeout)
      }
      pendingComponent
        .then((_Component) => {
          clearTimeout(timeoutID)
          lazyComponents.set(load, _Component)
          Component = _Component;
          $loading.value = false
          $loaded.value = true
        })
        .catch(err => {
          $error.value = err; // TODO: Normalize error type
          $loading.value = false
        })
    }
    else {
      $loaded.value = true
      $loading.value = false
    }
  }

  if (Placeholder && Error) {
    return (props: P) => {
      loadComponent();
      return (
        <>
          {If($loading, () =>
            <Placeholder {...props}></Placeholder>
          )}
          {ElseIf($error, () =>
            <Error {...props} error={$error()}></Error>
          )}
          {Else(() =>
            <Component {...props}></::>
          )}
        </>
      )
    }
  }
  if (Placeholder) {
    return (props: P) => {
      loadComponent();

      return (
        <>
          {If($loading, () =>
            <Placeholder {...props}></Placeholder>
          )}
          {ElseIf($loaded, () =>
            <Component {...props}></::>
          )}
        </>
      )
    }
  }
  if (Error) {
    return (props: P) => {
      loadComponent();

      return (
        <>
          {If($error, () =>
            <Error {...props} error={$error()}></Error>
          )}
          {ElseIf($loaded, () =>
            <Component {...props}></::>
          )}
        </>
      )
    }
  }
  return (props: P) => {
    loadComponent();

    return (
      <>
        {If($loaded, () => {
          return <Component {...props}></::>
        }
        )}
      </>
    )
  }
}

