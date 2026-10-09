import { RenderTag } from "./Component";
import { Else, ElseIf, If } from "../conditional/If";
import { noop } from "@luently/utils";
import { createAtomicIon, ion } from "@luently/quarky";
import { AnyObject } from "@luently/types";

const lazyComponents: Map<() => Promise<RenderTag>, RenderTag> = new Map()

export function lazyLoadComponent<P extends AnyObject>(config: {
  load: () => Promise<RenderTag<P>>,
  onIdle?: boolean
  Placeholder?: RenderTag,
  timeout?: number,
  Error?: RenderTag<{ error: any }>,
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
  let Component: RenderTag
  function loadComponent() {
    let timeoutID: any;
    if (idleID !== undefined) {
      cancelIdleCallback(idleID);
      idleID = undefined;
    }
    Component = lazyComponents.get(load) || noop as RenderTag // if already loaded on idle, get from lazyComponents map
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
            <Component {...props}></Component>
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
            <Component {...props}></Component>
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
            <Component {...props}></Component>
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
          return <Component {...props}></Component>
        }
        )}
      </>
    )
  }
}

