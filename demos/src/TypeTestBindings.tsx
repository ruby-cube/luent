import { FromTag, ion, Ion, MutableIon } from "luent";

/*
[] attributes/callbacks
   [X] static
       [X] optional
   [X] ion
       [X] optional
   [X] mutable
       [] optional
   [] maybe mutable
       [] optional

[] Slot
[] Slot:

[X] component events
   [X] auto-optional

[] fallthrough
   [] DOM events
   [] DOM attributes (class, style)
   [] display-if
   [] microclass
   [] transitions
   [] hooks
   [] ref

[] ref
[] auto-bind
[] namespaced/xray
*/

function NoBindings() {
  return <></>
}

//@ts-expect-error
<NoBindings a={9}></NoBindings>




function StaticAttribute(setup: FromTag<{
  a: number
}>) {
  return <></>
}

<StaticAttribute a={9}></StaticAttribute>;


//@ts-expect-error
<StaticAttribute></StaticAttribute>;

//@ts-expect-error
<StaticAttribute a={'hi'}></StaticAttribute>;

//@ts-expect-error
<StaticAttribute a={() => 9}></StaticAttribute>;

//@ts-expect-error
<StaticAttribute a={9} b={9}></StaticAttribute>



function OptionalStaticAttribute(setup: FromTag<{
  a?: number
}>) {
  return <></>
}

<OptionalStaticAttribute a={9}></OptionalStaticAttribute>;
<OptionalStaticAttribute></OptionalStaticAttribute>;

//@ts-expect-error
<OptionalStaticAttribute a={'hi'}></OptionalStaticAttribute>;


function IonBinding(setup: FromTag<{
  a: Ion<number>
}>) {
  return <></>
}

<IonBinding a={9}></IonBinding>;
<IonBinding a={() => 9}></IonBinding>;

//@ts-expect-error
<IonBinding a={(n: number) => 9}></IonBinding>;

//@ts-expect-error
<IonBinding a={'hi'}></IonBinding>;

//@ts-expect-error
<IonBinding></IonBinding>;

//@ts-expect-error
<IonBinding a={() => 'hi'}></IonBinding>;



function OptionalIonBinding(setup: FromTag<{
  a?: Ion<number>
}>) {
  return <></>
}

<OptionalIonBinding a={9}></OptionalIonBinding>;
<OptionalIonBinding a={() => 9}></OptionalIonBinding>;
<OptionalIonBinding></OptionalIonBinding>;

//@ts-expect-error
<OptionalIonBinding a={'hi'}></OptionalIonBinding>;

//@ts-expect-error
<OptionalIonBinding a={() => undefined}></OptionalIonBinding>;



function MutableBinding(setup: FromTag<{
  'mu:a': MutableIon<number>
}>) {
  return <></>
}

function testMutable() {
  const $a = ion(9);

  <MutableBinding mu:a={$a}></MutableBinding>;

  //@ts-expect-error: Property ''mu:a'' is missing in type '{}' but required in type 'MutableAttribute<{ 'mu:a': MutableIon<number>; }>'.
  <MutableBinding></MutableBinding>;

  //@ts-expect-error: Property 'value' is missing in type '() => number' but required in type 'MutableIon<number>'.
  <MutableBinding mu:a={() => 9}></MutableBinding>;

  //@ts-expect-error
  <MutableBinding a={() => 9}></MutableBinding>;
}




function OptionalMutableBinding(setup: FromTag<{
  'mu:a'?: MutableIon<number>
}>) {
  return <></>
}

function testOptionalMutaable() {
  const $a = ion(9);

  <OptionalMutableBinding mu:a={$a}></OptionalMutableBinding>;
  <OptionalMutableBinding></OptionalMutableBinding>;

  //@ts-expect-error
  <OptionalMutableBinding a={$a}></OptionalMutableBinding>;
}




function EventBinding(setup: FromTag<{
  onClick: (e: { clientX: number, clientY: number }) => void
}>) {
  return <></>
}

<EventBinding onClick={e => { }}></EventBinding>;
<EventBinding></EventBinding>;

//@ts-expect-error
<EventBinding onClick={() => e => { }}></EventBinding>;
