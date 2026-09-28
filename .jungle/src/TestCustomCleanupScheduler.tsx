//@ts-nocheck
import { component, template, NodeRef } from "luent"
import { AnyIon, DerivedIon, AtomicIon, ion, ionize, watchEffect, observe} from "@luent/quarky"
import { or, $setup, is, isDefined, isAny, not } from "../../../packagesluent/src/component/X_$setup"
import { AnyObject } from "@luent/types"
import { toIonicProps } from "../../../packagesluent/src/component/X_normalizeProps"

// optional and default
// normalize
// validate



function type<T>(value: any): value is T {
   return true
}

const eh = type<{
   hi: 'hi'
}>

type IonOr<T> = T | AtomicIon<T>

type Huh = number | never

const ALL = Symbol('normalize-all')

const oh = toIon('hi' as IonOr<string>)


export function Article({ content } = input({
   content: Type('?', String).default('hi')
})) {

   return (

      <article>
         <p>{content}</p>
      </article>
   )
}
// is
// Is
// I
// Inert
// Val

// Ion
// IonOr
// Ionized
// MaybeIonized

export function Bog(setup: {
   name?: IonOr<string>,
   date: v<Date>,
   msg: v<string>,
   address: MaybeIonized<{ // must not have methods, will be auto-protected by Luent
      street: string,
      zip: number
   }>,
   $frog: Ionized<{
      name: string,
      setName: (name: string) => void
   }>
}) {
   // normalize and set defaults
   setup.name = setup.name ?? 'sir robin'

   const {
      $name,
      $date,
      $address,
      $frog
   } = toIonicProps(setup, {
      name: toIon,
      date: toIonized,
      address: false,
      $frog: assertIonized
   })

   const $name = toIon(setup.name)

   const {
      $name,
      $date,
      $frog
   } = toIons(setup, { address: false })

   const $address = toIonized(setup.address);

   const $street = ion.of($address, 'street')







   // const {
   //     name,
   //     date,
   //     address,
   //     frog
   // } = normalizeProps(setup, {
   //     name: n => n ?? 'sir robin'
   // }).all(toIon)

   // const {
   //     name,
   //     date,
   //     address,
   //     frog
   // } = normalizeProps(setup, { all: toIon })

   // const { name } = setup;

   // const _name = name ?? 'sir robin'

   return (

      <div>hi</div>
   )
}

type LastFnReturnType<F extends Array<(...arg: any) => any>> = F extends [
   ...any[],
   (...arg: any) => infer R
] ? R : never;

function Tup<T extends unknown[]>(...args: T): T {
   return args;
}

type Ch = LastFnReturnType<[(v: unknown) => string, (v: unknown) => number]>

type IonOr<T> = T | AtomicIon<T>;

function IonOr<T>(...args: T): IonOr<T> {

}

function declareType(constructor: Function) {
   return (...args: any[]) => {

   }
}

const MapOf = declareType(Map)

const Void: void;


export function Play({ cat, dog = 9 } = $input<{
   cat: string,
   dog?: number
}>()) {

}

function Ionized<T>() {

}

function input<T>(value: T): T {
   return null as T
}

export function Ho({ dog = 9, cat } = input({
   dog: undefined,
   cat: 'meow'
})) {

}

function IonOr<T>() { }

const cleanupPropTypes = {
   name: IonOr<string>('?'),
   name: $Ionized<string>,
   idea: Val<string | number>,
   $count: $Ion<string | number | undefined, {
      isEven: () => boolean,
      increment: () => void
   }>, // {nameB: AtomicIon<string | number | undefined>} 
   nameC: IonOr<string | number>, // {nameB: AtomicIon<string | number> | undefined}
   date: Date,
   chug: Ionized<{
      name: string
   }>,
   $frog: Ionized<{
      // name: string | number;
      // qualities?: (string | number)[];
      // qualitiesMap?: Map<string | number, any>;
      // well: ['hi', 9];
      // setNameB: (name: string, ...args: boolean[]) => string,
   }>
}


export function TestCleanupSchedulerJS({ $count, $frog, date, idea, name, nameC } = input(cleanupPropTypes)) {

   const obj: { cat?: string } = {}

   const _setup = {
      ...obj,

   }

   obj.cat = obj.cat ?? 'meo'

   obj

   setup.name = setup.name ?? 'hi'

   const { $name, $nameB, $nameC, date } = toIonicProps({

   })

   const priceNum = ion(0);

   const price = ion(() =>'$' + priceNum)

   const priceCurrency = asCurrency(priceNum, 'USD')

   return (

      <p>{asCurrency(price)}</p>
   )
}

// IonOr
// MaybeIonized
// AtomicIon
// Ionized
// Val
// Fn


export function TestCleanupSchedulerTS(setup = $setup({
   name: ['?', IonOr<string>, defaultTo('hola'), recast(toString)],
   nameB: AtomicIon<string | number | undefined>, // {nameB: AtomicIon<string | number | undefined>} 
   nameC: ['?', IonOr<string | number>], // {nameB: AtomicIon<string | number> | undefined}
   date: Date,
   msg: Val<string>,
   message: Val<string | number>,
   $frog: Ionized<{
      name: string,
      setName: (name: string) => string
   }>,
   emitIncrementClicked: ['?', Fn<() => void>, defaultTo(noop)]
})) {

   setup.name = setup.name ?? 'hi'

   const { $name, $nameB, $nameC, date } = normalizeProps(setup, {
      name: toIon,
      nameC: toIon,
      $frog: toIonized
   })

}


export function TestCleanupScheduler({
   name,
   $nameB,
   date,
   dateB,
   address,
} = $setup({
   name: [type<string>, n => n ?? 'hi', toIon],
   nameB: [type<string | number | undefined>, toIon], // {nameB: AtomicIon<string | number | undefined>} 
   nameC: [type<'?' | string | number>, toIon], // {nameB: AtomicIon<string | number> | undefined}
   date: [type<Date>],
   $frog: [type<{
      name: string,
      setName: (name: string) => string
   }>, isIonized]
}, { all: toIon })) {

   const $stopButton = NodeRef('button')

   const $frog = ionize({
      name: 'kermit'
   }, {
      setName(name: string) {
         $frog.name = name
      }
   })

   //@ts-expect-error
   const $frogName = ion(()=>$frog.name, {
      $$set: $frog.setName
   })

   const $count = ion(0, {
      setTo(value: number) {
         if (value > 100) return value;
         $count.value = value;
      },
      set(value: number) {
         $count.value = value
      }
   })

   // function reInputChange(event: InputEvent) {
   //     $frog.setName((event.target as HTMLInputElement).value)
   // }

   function initObserver() {
      observe($frog, () => {
         console.log('frog changed name', $frog.name)
      }, { until: [$stopButton()!, 'click'] })
   }


   // simple one-to-one class to state binding
   classify($div, div =>
      [
         'active latent',
         ['dragging', $isDragging() && $falling()],
         ['highlight', $isHighlight()],
         [$dragging(), {
            add: 'dragging',
            remove: ['highlight', 'grow']
         }]
      ]
   )

   // compiles to
   classify($div, [
      'active latent',
      ['dragging', () => $isDragging() && $falling()],
      ['highlight', $isHighlight],
      [$isDragging, {
         add: 'dragging',
         remove: ['highlight', 'grow']
      }]
   ])

   // binding state to class list manipulation


   // simple style bindings
   style($div, div =>
      [{
         backgroundColor: $mainColor(),
         width: `${$listItem.width + 1} px`,
         height: `${$height()} px`
      },
      $dragging() ? (
         div.backgroundColor = 'gray',
         div.width = `${listItem$.width} px`,
         div.height = `${$height()} px`
      ) : (
         div.backgroundColor = 'red',
         div.width = `0 px`
      )]
   )




   //compiles to:
   style($div,
      [{
         backgroundColor: $mainColor,
         width: () => `${$listItem.width + 1} px`,
         height: () => `${$height()} px`
      },
      div => $dragging() ? (
         div.backgroundColor = 'gray',
         div.width = `${listItem$.width} px`,
         div.height = `${$height()} px`
      ) : (
         div.backgroundColor = 'red',
         div.width = `0 px`
      )]
   )

   // styles that depend on state



   style($item, (o, item, index) =>
      $dragging() ? (
         o.backgroundColor = 'gray',
         o.width = `${listItem$.width} px`,
         o.height = `${$height()} px`
      ) : (
         o.backgroundColor = 'red',
         o.width = `0 px`
      )
   )

   return (

      <>
         <div class={['storm active', $ = $editable() && 'editable']}
            style={[
               {
                  backgroundColor: $ = $mainColor() + 'px',
               },
               dragging ? {
                  backgroundColor: 'gray',
                  width: $ = `${listItem.width}px !important`,
                  height: $ = `${$height()}px`
               } : {
                  backgroundColor: $color,
                  width: `0px`
               },
               $ = $dragging() ? {
                  backgroundColor: 'gray',
                  width: $ = `${listItem.width}px !important`,
                  height: $ = `${$height()}px`
               } : {
                  $color,
                  width: `0px`
               },
            ]}>
            hi
         </div>

         <textarea content={exo($text, { setText: 'setContent' })}></textarea>

         <input m:value={$frogName} />

         <div>{$editable() ? frog.name : frog.song}</div>

         <div>{`${$frogName()}!`} </div>

         <div>{$frogName}</div>

         <div>{i0, $frogName()} </div>
         <div>{i0, $frogName() + '!'} </div>

         <input value={$frogName} />

         <input value={$ = $frogName() + '!'} />

         <input value={$frogName} />

         <button ref={$stopButton}>stop</button>
         <button on:click={initObserver}>start</button>
         <div
            width={2}
            style={['width: 2px', {
               lineHeight: 1.5, // only declare layout css in the template that depends on hierarchy
               background: $divBgColor,
               border: '2px solid #e66465',
               [text_color]: 'red',
               [background_image]: $image
            }]}  // use ions for dynamic styles restricted to an element
         >
            <p style={{
               margin: '15px',
               lineHeight: '1.5',
               textAlign: 'center',
               color: var(text_color)
            }}>
               Well, I am the slime from your video<br />
               Oozin' along on your livin' room floor.
            </p>
            <ChildBlock></ChildBlock>
         </div>
      </>
   )
}

function ChildBlock() {



   return (

      <div style color={text_color}></div>
   )
}

// shared variables
const text_color = '--text-color'
const background_image = '--background-color'
