import { Await, Awaits, getAwaiting, ion, Meanwhile, Promised } from "luent";

function multiply(
  a: number,
  b: number,
  ms = Math.random() * 500
): Promise<number> {
  return new Promise((f) => {
    setTimeout(() => f(a * b), ms);
  });
}


export function TestAsyncMultiplyA() {
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

  const { ifPending, $promised } = Promised($a, $b, $c, $d, $e)

  return <>
    {Await(() =>
      <>
        <button type="button" on:click={() => $n.value++}>
          {$n}
          {() => ifPending('...')}
        </button>
        <p>
          {Awaits($promised, $n)} * 1 = {Awaits($promised, $a)}
        </p>
        <p>
          {Awaits($promised, $n)} * 2 = {Awaits($promised, $b)}
        </p>
        <p>
          {Awaits($promised, $n)} * 3 = {Awaits($promised, $c)}
        </p>
        <p>
          {Awaits($promised, $n)} * 4 = {Awaits($promised, $d)}
        </p>
        <p>
          {Awaits($promised, $n)} * 5 = {Awaits($promised, $e)}
        </p>
      </>
    )}
    {Meanwhile(() => (console.log('RENDERING LOADING....'), 'loading...'))}
  </>
}


export function TestAsyncMultiply() {
  const $n = ion(1);

  const $a = ion(0, { '-fetch': oo => multiply(oo($n), 1) });
  const $b = ion(0, { '-fetch': oo => multiply(oo($n), 2) });
  const $c = ion(0, { '-fetch': oo => multiply(oo($n), 3) });
  const $d = ion(0, { '-fetch': oo => multiply(oo($n), 4) });
  const $e = ion(0, { '-fetch': oo => multiply(oo($n), 5) });

  return <>
    {Await(({ $promised, ifPending }) => {
      return <>
        <button type="button" on:click={() => $n.value++}>
          {$n}
          {() => ifPending('...')}
        </button>
        <p>
          {Awaits($promised, $n)} * 1 = {Awaits($promised, $a)}
        </p>
        <p>
          {Awaits($promised, $n)} * 2 = {Awaits($promised, $b)}
        </p>
        <p>
          {Awaits($promised, $n)} * 3 = {Awaits($promised, $c)}
        </p>
        <p>
          {Awaits($promised, $n)} * 4 = {Awaits($promised, $d)}
        </p>
        <p>
          {Awaits($promised, $n)} * 5 = {Awaits($promised, $e)}
        </p>
      </>
    })}
    {Meanwhile(() => 'loading...')}
  </>
}
