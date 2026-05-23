import { component, $fromContext, Context, ContextEntryKey, ContextKey, createRoot, fromContext, fromRoot, FromTag, mergeContextKeys, template } from "@rue/luent"
import { Ion, ion } from "@rue/quarky"
import './TestContext.css'

// Context Keys
// [] as Fn
// [] as string

// Context Normalization
// [] to ions
// [] to values
// [] to mu

// [] Context Default

// [] Context Required/Optional Validation

// [] Closest Node Context
// [] Root Context
// [] Ground Context

// [] mapContextKeys

// [] with slots

// [] fromContext, fromRoot, fromGround with kits

// [] allow both static and ionic props to be accessed from input object, types

// [] default with ContextKey??

// const ROOT_MESSAGE = 'rootMessage'


// const provideRootMessage = asProvider(GreatGrandparent['rootMsg'])


// const GREAT_MESSAGE = Grandparent['greatMsg']

function TestRootContext() {
   const rootMsg = fromRoot(ROOT_MESSAGE)
   const $adamsMsg = ion('I come from Adam')
   const $evesMsg = ion('I come from Eve')

   return component(
      <div class='container bg-cyan-200'>
         <h1>Root</h1>
         <h6>Static</h6>
         <p>from root: {rootMsg}</p>
         <hr></hr>
         {/* <h6>Reactive</h6>
         <p>from root: {$rootMsg}</p>
         <hr></hr> */}
         <Context provide={[GREAT_MESSAGE($adamsMsg)]}>
            <GreatGrandparent name='Adam'></GreatGrandparent>
            <input mu:value={$adamsMsg}></input>
         </Context>
         <Context provide={[GREAT_MESSAGE($evesMsg)]}>
            <GreatGrandparent name='Eve'></GreatGrandparent>
            <input mu:value={$evesMsg}></input>
         </Context>
         {/* 
         <GreatGrandparent name='Adam' provide={[ROOT_MESSAGE(adamsMsg)]}></GreatGrandparent>
         <GreatGrandparent name='Eve' provide={[ROOT_MESSAGE(evesMsg)]}></GreatGrandparent> */}
      </div>
   )
}

type GreatGrandparentInput = {
   name: string
}



function GreatGrandparent({
   name
}: FromTag<GreatGrandparentInput>) {


   return component(
      <div class='container bg-cyan-400'>
         <h2>Great Grandparent: {name}</h2>
         <h6>Static</h6>
         {/* <p>from root: {rootMsg}</p> */}
         {/* <hr></hr>
         <h6>Reactive</h6>
         <p>from root: {$rootMsg}</p> */}
         <Grandparent name="Cain"></Grandparent>
         <Grandparent name="Abel"></Grandparent>
      </div>
   )
}


type GrandparentInput = {
   name: string
}

const ROOT_MESSAGE_GREAT
   = Grandparent.ROOT_MESSAGE
   = ContextKey<string>('root')

function Grandparent({ name }: FromTag<GrandparentInput>) {
   const msg = fromContext(GREAT_MESSAGE)
   const rootMsg = fromRoot(ROOT_MESSAGE_GREAT)

   return component(
      <div class='container bg-cyan-600'>
         <h3>Grandparent: {name}</h3>
         <h6>Static</h6>
         <p>from root: {rootMsg}</p>
         <p>from great: {msg}</p>
         {/* <hr></hr>
         <h6>Reactive</h6>
         <p>from root: {$rootMsg}</p>
         <p>from great grandparent: {$greatMsg}</p> */}
         <Context provide={[GRAND_MESSAGE('my name is' + name)]}>
            <Parent></Parent>
         </Context>
      </div>
   )
}



function Parent() {
   return component(
      <div class='container bg-amber-900'>
         {/* <h4>Parent</h4>
         <h6>Static</h6>
         <p>from root: {rootMsg}</p>
         <p>from great grandparent: {greatMsg}</p>
         <p>from grandparent: {grandMsg}</p>
         <hr></hr>
         <h6>Reactive</h6>
         <p>from root: {$rootMsg}</p>
         <p>from great grandparent: {$greatMsg}</p>
         <p>from grandparent: {$grandMsg}</p> */}
         <Child></Child>
      </div>
   )
}

const GREAT_MESSAGE = Child.GREAT_MESSAGE = ContextKey<Ion<string>>('great')
const ROOT_MESSAGE = Child.ROOT_MESSAGE = ContextKey<string>('root')
const GRAND_MESSAGE = Child.GRAND_MESSAGE = ContextKey<string>('grand')

function Child() {
   const rootMsg = fromRoot(ROOT_MESSAGE)
   const $greatMsg = $fromContext(GREAT_MESSAGE)
   const grandMsg = fromContext(GRAND_MESSAGE)
   console.log('$greatMsg', $greatMsg)

   return component(
      <div class='container bg-amber-500'>
         <h5>Child</h5>
         <h6>Static</h6>
         <p>from root: {rootMsg}</p>
         <p>from great grandparent: {$greatMsg}</p>
         <p>from grandparent: {grandMsg}</p>
         {/* <hr></hr>
         <h6>Reactive</h6>
         <p>from root: {$rootMsg}</p>
         <p>from great grandparent: {$greatMsg}</p>
         <p>from grandparent: {$grandMsg}</p> */}
      </div>
   )
}


export {
   TestRootContext
}

const ROOT = mergeContextKeys(Child.ROOT_MESSAGE, Grandparent.ROOT_MESSAGE)

if (__STYLE__) {
   createRoot(TestRootContext, {
      provide: [
         // TestRootContext['rootMessage']('"Hello World" -root')
         // TestRootContext['rootMessage'](null)
         ROOT('heya')
      ]
   }).mount('#root')
}