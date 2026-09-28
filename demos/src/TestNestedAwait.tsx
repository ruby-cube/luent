import { Await, Awaits, Ion, ion, Meanwhile } from "luent";
import './TestNestedAwait.css'
import { FromTag } from "packages/luent/dist";


const count = { A: 0, B: 0, C: 0 };

export function TestNestedAwait() {
  return <>
    {Await(
      <A />
    )}
    {Meanwhile(() => 'loading...')}
  </>
}

export function A() {
  count.A++;
  const a = ion(undefined, { '-fetch': fetchTimeIn3Seconds });

  return (
    <div class="box">
      A (rendered: {count.A}x) - complete in: {a}s
      {/* {Await( */}
      <B />
      {/* )}
      {Meanwhile(() => 'loading...')} */}
    </div>
  );
}

function B() {
  count.B++;
  const b = ion(undefined, { '-fetch': fetchTimeIn4Seconds });
  const c = ion(undefined, { '-fetch': fetchTimeIn5Seconds });
  return (
    <div class="box">
      B (rendered: {count.B}x) - complete in: {b}s
      {Awaits(c,
        <C c={c}/>
      )}
      {/* {Meanwhile(() => 'loading...')} FIX:*/}
    </div>
  );
}

function C(setup: FromTag<{
  c: Ion<number>
}>) {
  const { $c} = setup
  count.C++;

  return (
    <div class="box">
      C (rendered: {count.C}x) - complete in: {$c}s
    </div>
  );
}




const offset = Date.now();

export function fetchTimeIn3Seconds() {
  return new Promise<string>((res) =>
    setTimeout(() => res(((Date.now() - offset) / 1000).toFixed(2)), 3000)
  );
}
export function fetchTimeIn4Seconds() {
  return new Promise<string>((res) =>
    setTimeout(() => res(((Date.now() - offset) / 1000).toFixed(2)), 4000)
  );
}
export function fetchTimeIn5Seconds() {
  return new Promise<string>((res) =>
    setTimeout(() => res(((Date.now() - offset) / 1000).toFixed(2)), 5000)
  );
}
