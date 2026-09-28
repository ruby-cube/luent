import {  SuspenseIon } from "@luent/quarky";
import { Await, Awaits, ion, Meanwhile, Promised } from "luent";

function multiply(
  a: number,
  b: number,
  ms = Math.random() * 500
): Promise<number> {
  return new Promise((f) => {
    setTimeout(() => f(a * b), ms);
  });
}


export function TestAsyncMultiply() {
  const $n = ion(1);

  const $a = ion(0, { '-fetch': oo => multiply(oo($n), 1) });
  const $b = ion(0, { '-fetch': oo => multiply(oo($n), 2) });
  const $c = ion(0, { '-fetch': oo => multiply(oo($n), 3) });
  const $d = ion(0, { '-fetch': oo => multiply(oo($n), 4) });
  const $e = ion(0, { '-fetch': oo => multiply(oo($n), 5) });

  // const { ifPending } = Promised($a, $b, $c, $d, $e)

  return <>
    {Await(view =>
      <>
        <button type="button" on:click={() => $n.value++}>
          {$n}
          {() => view.ifPending('...')}
        </button>
        <p>
          {$n} * 1 = {() => view.ifPending('...', $a())}
        </p>
        <p>
          {$n} * 2 = {() => view.ifPending('...', $b())}
        </p>
        <p>
          {$n} * 3 = {() => view.ifPending('...', $c())}
        </p>
        <p>
          {$n} * 4 = {() => view.ifPending('...', $d())}
        </p>
        <p>
          {$n} * 5 = {() => view.ifPending('...', $e())}
        </p>
      </>
    )}
    {Meanwhile(() => 'loading...')}
  </>
}


export function TestAsyncMultiplyB() {
  const $n = ion(1);

  const $a = ion(0, { '-fetch': oo => multiply(oo($n), 1) });
  const $b = ion(0, { '-fetch': oo => multiply(oo($n), 2) });
  const $c = ion(0, { '-fetch': oo => multiply(oo($n), 3) });
  const $d = ion(0, { '-fetch': oo => multiply(oo($n), 4) });
  const $e = ion(0, { '-fetch': oo => multiply(oo($n), 5) });
SuspenseIon
  return <>
    {Await(view => {
      console.log('view.$promised', view.$promised())
      return <>
        <button type="button" on:click={() => $n.value++}>
          {$n}
          {() => view.ifPending('...')}
        </button>
        <p>
          {Awaits(view.$promised, $n)} * 1 = {Awaits(view.$promised, $a)}
        </p>
        <p>
          {Awaits(view.$promised, $n)} * 2 = {Awaits(view.$promised, $b)}
        </p>
        <p>
          {Awaits(view.$promised, $n)} * 3 = {Awaits(view.$promised, $c)}
        </p>
        <p>
          {Awaits(view.$promised, $n)} * 4 = {Awaits(view.$promised, $d)}
        </p>
        <p>
          {Awaits(view.$promised, $n)} * 5 = {Awaits(view.$promised, $e)}
        </p>
      </>
    })}
    {Meanwhile(() => 'loading...')}
  </>
}
