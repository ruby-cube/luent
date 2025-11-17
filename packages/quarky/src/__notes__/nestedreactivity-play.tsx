//@ts-nocheck

import ""
import { watchEffect, ionize, onEffectCycleComplete, afterRender } from ".."

const $frog = ionize({
    name: "sir robin",
    location: {
        type: "water",
        name: "well",
        position: inert({
            x: 1,
            y: 2
        })
    }
})



const $tripleCount = () => $count() * 3 // derived without memoization

const $count = Ion(0)
const $doubleCount = Ion(() =>$count() * 2) // memoized derived with option to retrack and method to untrack .. should retrack just be the default behavior?

const counter = ionize({
    $count,
    $doubleCount,
    increment
})



const $frogName = asPion($frog, 'name')

watch(PropsIon($frog, ['name', 'store']))

watch(Ion(() =>$count() * 2), (doubleCount, prev) => {   // if retrack is the default, why not just pass functions? it looks cleaner

})

watch($(() => $count() * 2), (doubleCount, prev) => { // this seems extraneous

})


function App() {
    return (
        <>
            <div>the count is {$count * 2}</div>

            <div>the count is {() => $count() * 2}</div>
        </>
    )
}

// lazy nested B--location and position are made reactive on access
frog$.location.position.x

const position = frog$.location.position // .location is tracked, .position is not if we want to track .position

// (A) manual reactivizing

$(frog).location.position // impromptu ionize
// $(() => $count() + 1) // impromptu memoized derived
// $(frog, 'name') // impromptu prop


$($(frog.location).position).x

// (B) inert proxy

frog$.location.$.position // $ returns a reactive location

const location = frog$.location // returns an inert proxy with a $ property

const location$ = location.$

const position$ = ionize(frog$.location.position)
// TODO: Keep a WeakMap of reactives so if an object is already made into a reactive, return that reactive instead of creating a new one




function ListBlock(attributes: {
    list: string[], // initial value
    color: string
}) {
    const $div = GetNode()
    const $divs = NodesRef()

    onCreated(() => {
        const div = $div()
        const divs = toRaw($divs)
    })

    afterRender(() => {

    })

    onEffectCycleComplete(() => {

    })

    function initDrag() {
        describeScene((dragging) => {

            listen(document, 'mousemove', () => {

            })

            listen(document, 'mouseup', dragging.end)
        })
    }


    const $count = Ion(0) // $SettableGet<number>

    const $list = ionize([1, 2, 3]);

    const $doubleCount = Ion(() =>$count() * 2) // Get<number>

    const $div = ViewIon('div')

    const $frog = IonizedModel(frog)

    const $frog = Ion(IonizedModel({
        a: "djjf",
        bouat: 0,
        cucumber
    }))

    const $frog = Ion(ionicModel({
        a: "djjf",
        bouat: 0,
        cucumber
    }))


    const $frog = IonizedModel(new Frog())

    const $name = asPion(frog$, 'name') //$GetProp<string>

    const $div = GetNode('div')

    watch(PropsIon(frog$, [
        'name',
        'qualities'
    ]), ([
        name,
        qualities
    ]) => {

    })

    watchEffect(() => {

    })

    //-----

    const $count = Ion(0) // $SettableGet<number>

    quarky.registerIonizableClass(Frog)

    // plain objects, arrays, sets, maps are default ionizable. Must be marked inert to prevent ionization
    // classes must be registered as ionizable to be reactive

    function Foo(num: number) {
        return inert({
            foo: num
        })
    }

    const list$ = ionize([
        Foo(3),
        Foo(4),
        Foo(5)
    ]);

    const list$ = ionize([1, 2, 3]);

    const $doubleCount = Ion(() =>$count * 2) // Get<number>

    const $frog = ionize(frog)

    const $frog = Ion(ionize(frog))

    const $frog = Ion(ionize(frog))

    const $frog = ionize(new Frog())

    const $name = asPion(frog$, 'name') //$GetProp<string>

    const $div = GetNode('div')

    watch(propsIon(frog$, [
        'name',
        'qualities'
    ]), ([
        name,
        qualities
    ]) => {

    })

    watchEffect(() => {

    })

    return component(
        <div node={$div}>hello</div>
        ,
        {
            list$,
        }
    )
}



watch(ionize(frog$.location.position), () => {

})

watch(frog$$.location.position, () => {

})

// reactive property access vs reactive creation...

frog$$ // deep reactive proxy that will make any downstream objects reactive


frog$$._o // raw

const frog$ = frog$$.ionize



const todos$ = ionize([{
    content: "hi"
}])

const item$ = todo$[0] // reactive

const item = todos$.o[0] // inert

todos$$.push({
    content: "hi"
})  // deep reactive

todos$.push({
    content: "hi"
}) // shallow reactive

const todos$ = O$([], [type$({
    position$: type$(Object)
})])


// Reactive Schema

const frog$ = O$({
    name: "sir robin",
    location: new Location(),
    qualities$ // already a reactive model
},
    t$({
        location: {
            position$: t$(Object, '?'),
        }
    })
)

// when making something reactive, check sample value first, then reactive schema



todos$.push(itemB)

// itemA and B are not reactive yet

for (const item$ of todos$) { // items are made reactive on access
    watch(item$, (item, oldItem) => {

    })
}
