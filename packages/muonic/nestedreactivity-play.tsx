//@ts-nocheck

import ""
import { $initializeEffect } from "./src"
const frog$ = o$({
    name: "sir robin",
    location: {
        type: "water",
        name: "well",
        position$: O$({
            x: 1,
            y: 2
        })
    }
})



// lazy nested B--location and position are made reactive on access
frog$.location.position.x

const position = frog$.location.position // .location is tracked, .position is not if we want to track .position

// (A) manual reactivizing

o$(frog$$).location.position // .location is tracked and .position

o$(o$(frog$.location).position).x

// (B) inert proxy

frog$.location.$.position // $ returns a reactive location

const location = frog$.location // returns an inert proxy with a $ property

const location$ = location.$

const position$ = o$(frog$.location.position)
//TODO: Keep a WeakMap of reactives so if an object is already made into a reactive, return that reactive instead of creating a new one


function ListBlock(attributes: {
    list: string[], // initial value
    color: string
}) {

    const $div = $Node()

    const $count = $(0) // $SettableGet<number>

    const list$ = o$(list);

    const $doubleCount = $(() => $count * 2) // Get<number>

    const frog$ = o$(frog)

    const $frog$ = $(o$(frog))

    const $frog$$ = $(o$$(frog))

    const frog$$ = o$$(new Frog())

    const $name = $prop(frog$, 'name') //$GetProp<string>

    watch($Props(frog$, ['name', 'qualities'], () => {

    }))

    $initializeEffect(() => {

    })

    return Component({
        list$,

    },
        <div>hello</div>
    )
}



watch(o$(frog$.location.position), () => {

})

watch(frog$$.location.position, () => {

})

// reactive property access vs reactive creation...
frog$$._$.location // what if I want to track when location prop changeds but I don't want the location to be made reactive?? it's different.

frog$$ // deep reactive proxy that will make any downstream objects reactive

frog$$._$ // shallow reactive proxy that will not make any down stream objects reactive

frog$$._o // raw

const frog$ = frog$$.o$



const todos$ = o$([{
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
